import request from 'supertest';
import { describe, it } from 'vitest';
import { createTestApp } from './testApp.js';
import { createTestToken } from './authTestUtils.js';

const app = createTestApp();

const tokens = {
  admin: createTestToken('admin'),
  manager: createTestToken('manager'),
  agent: createTestToken('agent'),
  owner: createTestToken('owner')
};

describe('RBAC enforcement', () => {
  it('allows admin and manager to access owners list', async () => {
    await request(app)
      .get('/api/owners')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .expect(200);

    await request(app)
      .get('/api/owners')
      .set('Authorization', `Bearer ${tokens.manager}`)
      .expect(200);
  });

  it('blocks agents and owners from accessing owners list', async () => {
    await request(app)
      .get('/api/owners')
      .set('Authorization', `Bearer ${tokens.agent}`)
      .expect(403);

    await request(app)
      .get('/api/owners')
      .set('Authorization', `Bearer ${tokens.owner}`)
      .expect(403);
  });
});
