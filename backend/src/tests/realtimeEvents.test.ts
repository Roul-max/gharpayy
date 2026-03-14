import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createTestToken } from './authTestUtils.js';

const emitRealtime = vi.fn();
vi.mock('../realtime/socket.js', () => ({
  emitRealtime
}));

import { createTestApp } from './testApp.js';

const app = createTestApp();
const agentToken = createTestToken('agent');

describe('Realtime events', () => {
  it('emits realtime events on lead updates and messages', async () => {
    const createRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        name: 'Realtime Lead',
        phone: '9000033333',
        email: 'realtime@example.com',
        source: 'website'
      })
      .expect(201);

    const leadId = createRes.body.id;

    await request(app)
      .put(`/api/leads/${leadId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ status: 'contacted' })
      .expect(200);

    await request(app)
      .post(`/api/messages/lead/${leadId}`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ message: 'Hello', channel: 'internal' })
      .expect(201);

    const events = emitRealtime.mock.calls.map((call) => call[0]);
    expect(events).toContain('lead.created');
    expect(events).toContain('lead.updated');
    expect(events).toContain('message.sent');
  });
});
