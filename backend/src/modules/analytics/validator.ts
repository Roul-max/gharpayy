import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  query: z.object({}).optional()
});
