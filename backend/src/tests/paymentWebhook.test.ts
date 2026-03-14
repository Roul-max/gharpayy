import request from 'supertest';
import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { createTestApp } from './testApp.js';
import { getTestPool } from './dbTestHarness.js';

const app = createTestApp();

async function seedReservation() {
  const pool = getTestPool();
  const ownerRes = await pool.query(
    `INSERT INTO owners (name, email)
     VALUES ($1, $2)
     RETURNING id`,
    ['Payment Owner', 'pay-owner@gharpayy.test']
  );
  const propertyRes = await pool.query(
    `INSERT INTO properties (name, owner_id, city, area, address, gender_allowed)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    ['Payment Property', ownerRes.rows[0].id, 'Delhi', 'Saket', 'Saket Road', 'any']
  );
  const roomRes = await pool.query(
    `INSERT INTO rooms (property_id, room_type, bed_count, status, price)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [propertyRes.rows[0].id, 'Single', 1, 'available', 15000]
  );
  const bedRes = await pool.query(
    `INSERT INTO beds (room_id, status)
     VALUES ($1, $2)
     RETURNING id`,
    [roomRes.rows[0].id, 'reserved']
  );
  const leadRes = await pool.query(
    `INSERT INTO leads (name, phone, source, status, lead_score)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    ['Payment Lead', '9990001111', 'website', 'new', 30]
  );
  const reservationRes = await pool.query(
    `INSERT INTO reservations (lead_id, bed_id, status, payment_status)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [leadRes.rows[0].id, bedRes.rows[0].id, 'pending', 'pending']
  );
  return { reservationId: reservationRes.rows[0].id, bedId: bedRes.rows[0].id };
}

describe('Payment webhook', () => {
  it('verifies webhook signature and finalizes booking idempotently', async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'razorpay-secret';

    const { reservationId, bedId } = await seedReservation();
    const pool = getTestPool();

    const orderId = `order_${reservationId.slice(0, 8)}`;
    await pool.query(
      `INSERT INTO payment_intents (reservation_id, provider, provider_intent_id, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [reservationId, 'razorpay', orderId, 15000, 'INR', 'created']
    );

    const payload = {
      provider: 'razorpay',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_001',
            order_id: orderId
          }
        }
      }
    };
    const rawBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', signature)
      .send(payload)
      .expect(200);

    expect(response.body.payment_status).toBe('succeeded');

    const bookingRows = await pool.query('SELECT * FROM bookings');
    const bedRows = await pool.query('SELECT status FROM beds WHERE id = $1', [bedId]);

    expect(bookingRows.rows.length).toBe(1);
    expect(bedRows.rows[0].status).toBe('booked');

    const duplicateResponse = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', signature)
      .send(payload)
      .expect(200);

    expect(duplicateResponse.body.duplicate).toBe(true);
    const bookingRowsAfter = await pool.query('SELECT * FROM bookings');
    expect(bookingRowsAfter.rows.length).toBe(1);
  });
});
