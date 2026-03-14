import { cacheGet, cacheSet } from './cache.js';

type CacheOptions = {
  ttlSeconds: number;
  namespace?: string;
};

export async function queryCache<T>(key: string, options: CacheOptions, loader: () => Promise<T>) {
  const namespace = options.namespace ? `${options.namespace}:` : '';
  const cacheKey = `${namespace}${key}`;
  const cached = await cacheGet<T>(cacheKey);
  if (cached) {
    return { data: cached, cache: 'HIT' as const };
  }
  const data = await loader();
  await cacheSet(cacheKey, data, options.ttlSeconds);
  return { data, cache: 'MISS' as const };
}

