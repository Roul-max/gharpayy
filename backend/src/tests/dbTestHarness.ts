import { Client, Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let pool: Pool | null = null;
let schemaName: string | null = null;
let baseConnectionString: string | null = null;

function getDatabaseRoot() {
  return path.resolve(process.cwd(), '..', '..', 'database');
}

function appendSearchPath(connectionString: string, schema: string) {
  const url = new URL(connectionString);
  const existing = url.searchParams.get('options');
  const searchPath = `-c search_path=${schema},public`;
  if (existing) {
    url.searchParams.set('options', `${existing} ${searchPath}`.trim());
  } else {
    url.searchParams.set('options', searchPath);
  }
  return url.toString();
}

function sanitizeSchemaName(name: string) {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

async function applySqlFile(client: Client, fileName: string) {
  const filePath = path.join(getDatabaseRoot(), fileName);
  let sql = fs.readFileSync(filePath, 'utf8');

  // Avoid failing on missing uuid-ossp extension in CI environments.
  sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";?/i, '');

  if (sql.trim().length === 0) return;
  await client.query(sql);
}

async function bootstrapExtensions(client: Client) {
  await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
  await client.query(`
    CREATE OR REPLACE FUNCTION uuid_generate_v4()
    RETURNS uuid
    LANGUAGE sql
    AS $$ SELECT gen_random_uuid(); $$;
  `);
}

export function getTestPool() {
  if (!pool) throw new Error('Test database not initialized');
  return pool;
}

export function getTestSchema() {
  if (!schemaName) throw new Error('Test schema not initialized');
  return schemaName;
}

export async function initTestDb() {
  if (pool) return;

  const baseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('TEST_DATABASE_URL must be set for integration tests');
  }

  baseConnectionString = baseUrl;
  schemaName = sanitizeSchemaName(`test_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`);
  const connectionString = appendSearchPath(baseUrl, schemaName);
  process.env.DATABASE_URL = connectionString;
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL = baseUrl;
  }

  const adminClient = new Client({ connectionString: baseUrl });
  await adminClient.connect();

  await adminClient.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName};`);
  await adminClient.query('CREATE SCHEMA IF NOT EXISTS auth;');
  await adminClient.query('CREATE TABLE IF NOT EXISTS auth.users (id UUID PRIMARY KEY);');
  await bootstrapExtensions(adminClient);
  await adminClient.query(`SET search_path TO ${schemaName}, public;`);

  await applySqlFile(adminClient, 'schema.sql');
  await applySqlFile(adminClient, 'triggers.sql');
  await applySqlFile(adminClient, 'seed.sql');

  await adminClient.end();

  pool = new Pool({ connectionString });
}

export async function resetDb() {
  const activePool = getTestPool();
  const activeSchema = getTestSchema();
  const { rows } = await activePool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1`,
    [activeSchema]
  );

  if (rows.length === 0) return;
  const tableList = rows.map((row) => `"${activeSchema}"."${row.tablename}"`).join(', ');
  await activePool.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
}

export async function closeDb() {
  if (!pool || !schemaName || !baseConnectionString) return;
  const activePool = pool;
  const activeSchema = schemaName;

  await activePool.end();

  const adminClient = new Client({ connectionString: baseConnectionString });
  await adminClient.connect();
  await adminClient.query(`DROP SCHEMA IF EXISTS ${activeSchema} CASCADE;`);
  await adminClient.end();

  pool = null;
  schemaName = null;
  baseConnectionString = null;
}
