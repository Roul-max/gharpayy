import { Redis } from 'ioredis';

const redisUrl = process.env.REDIS_URL;

export const redis =
  redisUrl && redisUrl.trim().length > 0
    ? new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        enableReadyCheck: true
      })
    : null;

export const redisConnectionOptions =
  redisUrl && redisUrl.trim().length > 0
    ? {
        url: redisUrl,
        maxRetriesPerRequest: 2,
        enableReadyCheck: true
      }
    : null;

export function hasRedis() {
  return !!redis;
}
