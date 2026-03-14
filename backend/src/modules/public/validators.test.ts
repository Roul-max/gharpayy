import { describe, expect, it } from 'vitest';
import { publicCaptureSchema, publicVisitRequestSchema, publicReservationSchema } from './validators.js';

describe('public validators', () => {
  it('validates lead capture payload', () => {
    const result = publicCaptureSchema.safeParse({
      body: { name: 'Test', phone: '9999999999', email: 'test@example.com' }
    });
    expect(result.success).toBe(true);
  });

  it('validates visit request payload', () => {
    const result = publicVisitRequestSchema.safeParse({
      body: {
        name: 'Test',
        phone: '9999999999',
        property_id: '11111111-1111-1111-1111-111111111111',
        scheduled_at: new Date().toISOString()
      }
    });
    expect(result.success).toBe(true);
  });

  it('validates reservation payload', () => {
    const result = publicReservationSchema.safeParse({
      body: {
        name: 'Test',
        phone: '9999999999',
        bed_id: '22222222-2222-2222-2222-222222222222'
      }
    });
    expect(result.success).toBe(true);
  });
});
