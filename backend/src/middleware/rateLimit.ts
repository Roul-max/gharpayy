import { Request, Response, NextFunction } from 'express';
import { redis } from '../cache/redis.js';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(options: { windowMs: number; max: number; keyPrefix: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const forwardedFor = String(req.headers['x-forwarded-for'] ?? '');
    const ip = forwardedFor.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();

    if (redis) {
      const ttlSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, ttlSeconds);
      }
      if (current > options.max) {
        return res.status(429).json({
          error: 'Too many requests. Please try again shortly.'
        });
      }
      return next();
    }

    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (existing.count >= options.max) {
      return res.status(429).json({
        error: 'Too many requests. Please try again shortly.'
      });
    }

    existing.count += 1;
    next();
  };
}
