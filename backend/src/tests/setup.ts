import { beforeEach, afterAll, vi } from 'vitest';
import { initTestDb, resetDb, closeDb } from './dbTestHarness.js';
import { createSupabaseMock } from './supabaseMock.js';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET ?? 'test-jwt-secret';

vi.mock('../config/supabase.js', () => ({ supabase: createSupabaseMock() }));

await initTestDb();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});
