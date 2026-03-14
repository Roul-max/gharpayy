import jwt from 'jsonwebtoken';

const SEEDED_USER_IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  manager: '00000000-0000-0000-0000-000000000002',
  agent: '00000000-0000-0000-0000-000000000003',
  owner: '00000000-0000-0000-0000-000000000004'
} as const;

export type SeededRole = keyof typeof SEEDED_USER_IDS;

export function getSeededUserId(role: SeededRole) {
  return SEEDED_USER_IDS[role];
}

function getJwtSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET must be set for auth tests');
  }
  return secret;
}

export function createTestToken(roleOrUserId: SeededRole | string) {
  const userId =
    roleOrUserId in SEEDED_USER_IDS
      ? SEEDED_USER_IDS[roleOrUserId as SeededRole]
      : roleOrUserId;
  return jwt.sign({ sub: userId }, getJwtSecret());
}
