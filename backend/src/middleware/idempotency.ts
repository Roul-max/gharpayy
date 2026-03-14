import { NextFunction, Request, Response } from 'express';
import { createHash } from 'crypto';
import { redis } from '../cache/redis.js';

const memoryStore = new Map<string, number>();

function getKey(req: Request) {
  const header = req.header('Idempotency-Key');
  if (!header) return null;
  const normalized = header.trim();
  if (!normalized) return null;
  const bodyHash = createHash('sha1').update(JSON.stringify(req.body ?? {})).digest('hex');
  return `${req.method}:${req.path}:${normalized}:${bodyHash}`;
}

export function enforceIdempotency(ttlSeconds = 15 * 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = getKey(req);
    if (!key) return next();

    if (redis) {
      const ok = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
      if (!ok) {
        return res.status(409).json({ error: 'Duplicate request detected. Retry with a new Idempotency-Key.' });
      }
      return next();
    }

    const now = Date.now();
    const expiresAt = memoryStore.get(key);
    if (expiresAt && expiresAt > now) {
      return res.status(409).json({ error: 'Duplicate request detected. Retry with a new Idempotency-Key.' });
    }
    memoryStore.set(key, now + ttlSeconds * 1000);
    next();
  };
}
