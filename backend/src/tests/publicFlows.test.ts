import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createTestApp } from './testApp.js';
import { getTestPool } from './dbTestHarness.js';

const app = createTestApp();

async function seedRoutingData() {
  const pool = getTestPool();
  const zoneRes = await pool.query(
    `INSERT INTO zones (name, areas)
     VALUES ($1, $2::jsonb)
     RETURNING id`,
    ['Central', JSON.stringify(['Indiranagar'])]
  );
  const agentRes = await pool.query(
    `INSERT INTO agents (name, email, role, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ['Agent One', 'agent1@gharpayy.test', 'agent', true]
  );
  await pool.query(
    `INSERT INTO team_queues (zone_id, agent_id)
     VALUES ($1, $2)`,
    [zoneRes.rows[0].id, agentRes.rows[0].id]
  );
  return { zoneId: zoneRes.rows[0].id, agentId: agentRes.rows[0].id };
}

async function seedInventory() {
  const pool = getTestPool();
  const ownerRes = await pool.query(
    `INSERT INTO owners (name, email, phone)
     VALUES ($1, $2, $3)
     RETURNING id`,
    ['Owner One', 'owner1@gharpayy.test', '9000000000']
  );
  const propertyRes = await pool.query(
    `INSERT INTO properties (name, owner_id, city, area, address, gender_allowed)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    ['Sunrise PG', ownerRes.rows[0].id, 'Bengaluru', 'Indiranagar', '12 MG Road', 'any']
  );
  const roomRes = await pool.query(
    `INSERT INTO rooms (property_id, room_type, bed_count, status, price)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [propertyRes.rows[0].id, 'Double', 2, 'available', 12000]
  );
  const bedRes = await pool.query(
    `INSERT INTO beds (room_id, status)
     VALUES ($1, $2)
     RETURNING id`,
    [roomRes.rows[0].id, 'available']
  );
  return { propertyId: propertyRes.rows[0].id, bedId: bedRes.rows[0].id };
}

describe('Public flows', () => {
  it('captures a lead and routes it to an agent', async () => {
    await seedRoutingData();

    const response = await request(app)
      .post('/api/public/capture')
      .send({
        name: 'Rohit',
        phone: '9876543210',
        email: 'rohit@example.com',
        source: 'website',
        city: 'Bengaluru',
        area: 'Indiranagar',
        budget: 12000,
        gender: 'male',
        sharing_type: 'double'
      })
      .expect(201);

    expect(response.body.lead?.id).toBeTruthy();
    expect(response.body.lead?.assigned_agent_id).toBeTruthy();

    const pool = getTestPool();
    const { rows } = await pool.query('SELECT * FROM leads');
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe('Rohit');
  });

  it('creates a reservation and soft lock for a selected bed', async () => {
    await seedRoutingData();
    const { bedId } = await seedInventory();

    const response = await request(app)
      .post('/api/public/reservations')
      .send({
        name: 'Anita',
        phone: '9998887777',
        email: 'anita@example.com',
        bed_id: bedId
      })
      .expect(201);

    expect(response.body.reservation?.id).toBeTruthy();

    const pool = getTestPool();
    const reservationRows = await pool.query('SELECT * FROM reservations');
    const lockRows = await pool.query('SELECT * FROM soft_locks');
    const bedRows = await pool.query('SELECT status FROM beds WHERE id = $1', [bedId]);

    expect(reservationRows.rows.length).toBe(1);
    expect(lockRows.rows.length).toBe(1);
    expect(bedRows.rows[0].status).toBe('reserved');
  });
});
