import { QueueEvents, Worker } from 'bullmq';
import { hasRedis, redis } from '../cache/redis.js';
import { runFollowUpReminderJob } from '../jobs/followUpReminderJob.js';
import { runInventoryHealthJob } from '../jobs/inventoryHealthJob.js';
import { runLeadScoreRecalculationJob } from '../jobs/leadScoreRecalculationJob.js';
import { runSoftLockCleanupJob } from '../jobs/softLockCleanupJob.js';
import { runNotificationFanoutJob } from '../jobs/notificationFanoutJob.js';
import { runAnalyticsRollupJob } from '../jobs/analyticsRollupJob.js';
import { supabase } from '../config/supabase.js';
import { deadLetterQueue } from '../queue/index.js';
import { withSpan } from '../observability/tracing.js';
import { logger } from '../observability/logger.js';
import { observeQueueFailure } from '../observability/metrics.js';

const connection = redis ?? undefined;
let booted = false;

export function startWorkers() {
  if (booted) return;
  booted = true;

  if (!hasRedis()) {
    logger.warn('Redis not configured; workers will not start.');
    return;
  }

  const automationWorker = new Worker(
    'automation',
    async (job) => {
      await withSpan('queue.job.automation', async () => {
        switch (job.name) {
          case 'soft-lock-cleanup':
            await runSoftLockCleanupJob();
            break;
          case 'lead-score-recalculation':
            await runLeadScoreRecalculationJob();
            break;
          case 'follow-up-reminders':
            await runFollowUpReminderJob();
            break;
          case 'inventory-health':
            await runInventoryHealthJob();
            break;
          case 'notification-fanout':
            await runNotificationFanoutJob();
            break;
          case 'analytics-rollups':
            await runAnalyticsRollupJob();
            break;
          default:
            logger.warn('Unknown automation job skipped', { job_name: job.name, job_id: job.id });
            break;
        }
      }, { job_name: job.name, queue: 'automation' });
    },
    {
      connection,
      concurrency: Number(process.env.AUTOMATION_WORKER_CONCURRENCY ?? 4),
      lockDuration: Number(process.env.QUEUE_LOCK_MS ?? 30000)
    }
  );

  const notificationWorker = new Worker(
    'notifications',
    async (job) => {
      if (job.name !== 'deliver') return;
      await withSpan('queue.job.notifications', async () => {
        const payload = job.data as {
          user_id: string;
          title: string;
          body?: string;
          type?: string;
          entity_type?: string;
          entity_id?: string;
        };

        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', payload.user_id)
          .eq('title', payload.title)
          .eq('body', payload.body ?? null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing?.id) return;

        await supabase.from('notifications').insert([
          {
            user_id: payload.user_id,
            title: payload.title,
            body: payload.body ?? null,
            type: payload.type ?? 'info',
            entity_type: payload.entity_type ?? null,
            entity_id: payload.entity_id ?? null
          }
        ]);
      }, { job_name: job.name, queue: 'notifications' });
    },
    {
      connection,
      concurrency: Number(process.env.NOTIFICATION_WORKER_CONCURRENCY ?? 8),
      lockDuration: Number(process.env.QUEUE_LOCK_MS ?? 30000)
    }
  );

  const automationEvents = new QueueEvents('automation', { connection });
  const notificationEvents = new QueueEvents('notifications', { connection });

  const handleFailure = async (queue: string, payload: { jobId: string; failedReason: string; prev?: string }) => {
    observeQueueFailure();
    logger.error('Queue job failed', {
      queue,
      job_id: payload.jobId,
      reason: payload.failedReason
    });
    await deadLetterQueue.add('job-failure', {
      queue,
      job_id: payload.jobId,
      reason: payload.failedReason,
      previous_status: payload.prev ?? null
    });
  };

  automationEvents.on('failed', (payload) => void handleFailure('automation', payload));
  notificationEvents.on('failed', (payload) => void handleFailure('notifications', payload));

  automationWorker.on('error', (error) => {
    observeQueueFailure();
    logger.error('Automation worker error', { message: error.message });
  });
  notificationWorker.on('error', (error) => {
    observeQueueFailure();
    logger.error('Notification worker error', { message: error.message });
  });
}
