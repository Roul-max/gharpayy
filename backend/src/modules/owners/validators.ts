import { z } from 'zod';

export const createOwnerSchema = z.object({
  body: z.object({
    user_id: z.string().uuid().optional(),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8).max(20).optional()
  })
});
