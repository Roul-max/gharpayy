import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createTestApp } from './testApp.js';
import { createTestToken } from './authTestUtils.js';

const app = createTestApp();

const agentToken = createTestToken('agent');

describe('Pipeline workflow', () => {
  it('creates and updates a lead through the pipeline', async () => {
    const createRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        name: 'Pipeline Lead',
        phone: '9000011111',
        email: 'pipeline@example.com',
        source: 'whatsapp'
      })
      .expect(201);

    const leadId = createRes.body.id;
    expect(leadId).toBeTruthy();

    const updateRes = await request(app)
      .put(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        status: 'visit_scheduled'
      })
      .expect(200);

    expect(updateRes.body.status).toBe('visit_scheduled');
  });

  it('rejects invalid lead updates', async () => {
    const createRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        name: 'Invalid Lead',
        phone: '9000022222',
        email: 'invalid@example.com',
        source: 'website'
      })
      .expect(201);

    const leadId = createRes.body.id;

    await request(app)
      .put(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        assigned_agent_id: 'not-a-uuid'
      })
      .expect(400);
  });
});
