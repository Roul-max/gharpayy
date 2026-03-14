import { z } from 'zod';

const LOOSE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const looseUuid = () => z.string().regex(LOOSE_UUID, 'Invalid UUID');

export const publicCaptureSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8).max(20),
    email: z.string().email().optional().or(z.literal('')),
    source: z.string().optional(),
    city: z.string().optional(),
    area: z.string().optional(),
    budget: z.number().int().positive().optional(),
    gender: z.enum(['male', 'female', 'any']).optional(),
    sharing_type: z.string().optional(),
    captchaToken: z.string().optional()
  })
});

export const publicVisitRequestSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8).max(20),
    property_id: looseUuid(),
    scheduled_at: z.string().datetime(),
    notes: z.string().optional(),
    captchaToken: z.string().optional()
  })
});

export const publicChatSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8).max(20),
    message: z.string().min(1).max(2000),
    property_id: looseUuid().optional(),
    captchaToken: z.string().optional()
  })
});

export const publicAssistantSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    property_id: looseUuid().optional(),
    page: z.string().optional()
  })
});

export const publicReservationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(8).max(20),
    email: z.string().email().optional().or(z.literal('')),
    bed_id: looseUuid(),
    property_id: looseUuid().optional(),
    captchaToken: z.string().optional()
  })
});
