import { z } from 'zod';

export const createVisitSchema = z.object({
  body: z.object({
    lead_id: z.string().uuid(),
    property_id: z.string().uuid(),
    scheduled_at: z.string().datetime(),
    visit_status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional()
  })
});

export const updateVisitOutcomeSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    outcome: z.enum(['booked', 'considering', 'not_interested']),
    visit_status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional()
  })
});
