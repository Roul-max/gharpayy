import { z } from 'zod';

export const sendMessageSchema = z.object({
  params: z.object({
    leadId: z.string().uuid()
  }),
  body: z.object({
    message: z.string().min(1).max(2000),
    channel: z.string().min(1).max(50).optional()
  })
});
