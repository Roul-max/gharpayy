import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../cache/redis.js';

const connection = redisConnectionOptions ?? undefined;

const defaultJobOptions = {
  attempts: Number(process.env.QUEUE_DEFAULT_ATTEMPTS ?? 5),
  backoff: { type: 'exponential' as const, delay: Number(process.env.QUEUE_BACKOFF_DELAY_MS ?? 1000) },
  removeOnComplete: 1000,
  removeOnFail: 1000
};

export const automationQueue = new Queue('automation', {
  connection,
  defaultJobOptions
});
export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions
});
export const deadLetterQueue = new Queue('dead-letter', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 5000,
    removeOnFail: false
  }
});

export async function enqueueNotification(payload: {
  user_id: string;
  title: string;
  body?: string;
  type?: string;
  entity_type?: string;
  entity_id?: string;
}) {
  await notificationQueue.add('deliver', payload, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1500 },
    removeOnComplete: 1000,
    removeOnFail: 1000
  });
}
