import { automationQueue } from './index.js';
import { hasRedis } from '../cache/redis.js';

let started = false;

export async function startQueueSchedulers() {
  if (started) return;
  started = true;

  if (!hasRedis()) {
    return;
  }

  await automationQueue.add(
    'soft-lock-cleanup',
    {},
    {
      repeat: { pattern: '*/5 * * * *' },
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
      jobId: 'soft-lock-cleanup-repeat'
    }
  );

  await automationQueue.add(
    'lead-score-recalculation',
    {},
    {
      repeat: { pattern: '0 * * * *' },
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
      jobId: 'lead-score-recalculation-repeat'
    }
  );

  await automationQueue.add(
    'follow-up-reminders',
    {},
    {
      repeat: { pattern: '0 1 * * *' },
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
      jobId: 'follow-up-reminders-repeat'
    }
  );

  await automationQueue.add(
    'inventory-health',
    {},
    {
      repeat: { pattern: '0 2 * * 1' },
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
      jobId: 'inventory-health-repeat'
    }
  );

  await automationQueue.add(
    'notification-fanout',
    {},
    {
      repeat: { pattern: '*/2 * * * *' },
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
      jobId: 'notification-fanout-repeat'
    }
  );

  await automationQueue.add(
    'analytics-rollups',
    {},
    {
      repeat: { pattern: '15 * * * *' },
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
      jobId: 'analytics-rollups-repeat'
    }
  );
}
