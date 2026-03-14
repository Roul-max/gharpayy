import { Pool, type PoolClient, type QueryResult } from 'pg';
import { withSpan } from '../observability/tracing.js';
import { observeSlowQuery } from '../observability/metrics.js';
import { logger } from '../observability/logger.js';

const databaseUrl = process.env.DATABASE_URL?.trim();

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.DB_POOL_MAX ?? 20),
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? 30_000),
      connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECT_TIMEOUT_MS ?? 5_000),
      statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 8_000),
      query_timeout: Number(process.env.DB_QUERY_TIMEOUT_MS ?? 8_000),
      application_name: 'gharpayy-backend'
    })
  : null;

export function hasDatabasePool() {
  return pool !== null;
}

export async function queryWithTrace<T = any>(
  text: string,
  values: unknown[] = [],
  queryName = 'db.query',
  client?: PoolClient
): Promise<QueryResult<T>> {
  if (!pool && !client) {
    throw new Error('DATABASE_URL is required for pooled DB queries.');
  }

  const runner = client ?? pool!;
  const startedAt = Date.now();
  const result = await withSpan(queryName, async () => runner.query<T>(text, values), {
    'db.system': 'postgresql',
    'db.operation': queryName
  });
  const durationMs = Date.now() - startedAt;

  if (durationMs >= Number(process.env.SLOW_QUERY_MS ?? 300)) {
    observeSlowQuery();
    logger.warn('Slow query detected', { query_name: queryName, duration_ms: durationMs });
  }

  return result;
}

export async function withDbClient<T>(fn: (client: PoolClient) => Promise<T>) {
  if (!pool) throw new Error('DATABASE_URL is required for transactional DB work.');
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
