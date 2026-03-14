import { performance } from 'node:perf_hooks';
import { automationQueue, notificationQueue, deadLetterQueue } from '../queue/index.js';
import { redis } from '../cache/redis.js';

const counters = {
  api_requests_total: 0,
  api_errors_total: 0,
  queue_failures_total: 0,
  slow_queries_total: 0,
  slow_requests_total: 0
};

const histograms = {
  api_latency_ms: [] as number[]
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

export function observeApiLatency(durationMs: number, isError: boolean) {
  counters.api_requests_total += 1;
  if (isError) counters.api_errors_total += 1;
  if (durationMs >= 1000) counters.slow_requests_total += 1;
  histograms.api_latency_ms.push(durationMs);
  if (histograms.api_latency_ms.length > 2000) {
    histograms.api_latency_ms.splice(0, histograms.api_latency_ms.length - 2000);
  }
}

export function observeQueueFailure() {
  counters.queue_failures_total += 1;
}

export function observeSlowQuery() {
  counters.slow_queries_total += 1;
}

export function snapshotMetrics() {
  const total = counters.api_requests_total;
  const errors = counters.api_errors_total;
  return {
    ...counters,
    error_rate: total > 0 ? Number((errors / total).toFixed(4)) : 0,
    api_latency_p50_ms: Number(percentile(histograms.api_latency_ms, 50).toFixed(2)),
    api_latency_p95_ms: Number(percentile(histograms.api_latency_ms, 95).toFixed(2)),
    observed_at: new Date().toISOString()
  };
}

async function getQueueStats() {
  const [automation, notifications, deadLetter] = await Promise.all([
    automationQueue.getJobCounts(),
    notificationQueue.getJobCounts(),
    deadLetterQueue.getJobCounts()
  ]);
  return {
    automation,
    notifications,
    dead_letter: deadLetter
  };
}

async function getRedisHealth() {
  if (!redis) return { available: false };
  try {
    const start = performance.now();
    const pong = await redis.ping();
    return {
      available: true,
      ping: pong,
      latency_ms: Number((performance.now() - start).toFixed(2))
    };
  } catch (error: any) {
    return { available: false, error: error?.message ?? 'Redis ping failed' };
  }
}

export async function collectRuntimeMetrics() {
  const snapshot = snapshotMetrics();
  const [queues, redisHealth] = await Promise.all([
    getQueueStats(),
    getRedisHealth()
  ]);
  return {
    ...snapshot,
    queues,
    redis: redisHealth
  };
}

export async function measureAsync<T>(fn: () => Promise<T>) {
  const start = performance.now();
  try {
    const result = await fn();
    return { result, durationMs: performance.now() - start, error: null as Error | null };
  } catch (error: any) {
    return { result: null as T | null, durationMs: performance.now() - start, error };
  }
}
