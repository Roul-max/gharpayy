import { redis } from './redis.js';

type MemoryValue = {
  value: string;
  expiresAt: number;
};

const memoryCache = new Map<string, MemoryValue>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis) {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return JSON.parse(item.value) as T;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number) {
  const encoded = JSON.stringify(value);
  if (redis) {
    await redis.set(key, encoded, 'EX', ttlSeconds);
    return;
  }
  memoryCache.set(key, {
    value: encoded,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

export async function cacheDelete(key: string) {
  if (redis) {
    await redis.del(key);
    return;
  }
  memoryCache.delete(key);
}

export async function cacheDeleteByPrefix(prefix: string) {
  if (redis) {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
