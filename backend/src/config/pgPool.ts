import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

export const pgPool = connectionString
  ? new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_MAX ?? 20),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    })
  : null;
