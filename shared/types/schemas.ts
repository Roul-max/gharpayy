import { z } from 'zod';

export const PublicCaptureSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  source: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  budget: z.number().optional(),
  gender: z.string().optional(),
  sharing_type: z.string().optional()
});

export const PublicVisitRequestSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  property_id: z.string().uuid(),
  scheduled_at: z.string().min(1),
  notes: z.string().optional()
});

export const PublicChatSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  message: z.string().min(1),
  property_id: z.string().uuid().optional()
});

export type PublicCaptureInput = z.infer<typeof PublicCaptureSchema>;
export type PublicVisitRequestInput = z.infer<typeof PublicVisitRequestSchema>;
export type PublicChatInput = z.infer<typeof PublicChatSchema>;

