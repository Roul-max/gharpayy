import { z } from 'zod';

export const matchLeadSchema = z.object({
  params: z.object({
    leadId: z.string().uuid()
  })
});
