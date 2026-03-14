import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createTestApp } from './testApp.js';
import { getTestPool } from './dbTestHarness.js';
import { createTestToken } from './authTestUtils.js';

const app = createTestApp();
const agentToken = createTestToken('agent');

async function seedProperty() {
  const pool = getTestPool();
  const ownerRes = await pool.query(
    `INSERT INTO owners (name, email)
     VALUES ($1, $2)
     RETURNING id`,
    ['Visit Owner', 'visit-owner@gharpayy.test']
  );
  const propertyRes = await pool.query(
    `INSERT INTO properties (name, owner_id, city, area, address, gender_allowed)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    ['Visit Property', ownerRes.rows[0].id, 'Pune', 'Baner', 'Baner Road', 'any']
  );
  return propertyRes.rows[0].id as string;
}

describe('Visit scheduling', () => {
  it('creates a visit and updates outcome', async () => {
    const propertyId = await seedProperty();

    const leadRes = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        name: 'Visit Lead',
        phone: '9888877777',
        email: 'visit@example.com',
        source: 'website'
      })
      .expect(201);

    const visitRes = await request(app)
      .post('/api/visits')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        lead_id: leadRes.body.id,
        property_id: propertyId,
        scheduled_at: new Date().toISOString()
      })
      .expect(201);

    expect(visitRes.body.id).toBeTruthy();

    const outcomeRes = await request(app)
      .patch(`/api/visits/${visitRes.body.id}/outcome`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        outcome: 'booked',
        visit_status: 'completed'
      })
      .expect(200);

    expect(outcomeRes.body.outcome).toBe('booked');
    expect(outcomeRes.body.visit_status).toBe('completed');
  });
});
