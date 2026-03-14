import { z } from 'zod';

export const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    source: z.string().min(1, 'Source is required'),
    status: z.string().optional(),
    lead_score: z.number().optional(),
    property_id: z.string().uuid('Invalid property ID').optional(),
    city: z.string().optional(),
    area: z.string().optional(),
    budget: z.string().optional(),
    gender: z.string().optional(),
    sharing_type: z.string().optional(),
    force: z.boolean().optional(),
  }),
});

export const updateLeadSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    source: z.string().optional(),
    status: z.string().optional(),
    lead_score: z.number().optional(),
    assigned_agent_id: z.string().uuid('Invalid agent ID').optional().nullable(),
    property_id: z.string().uuid('Invalid property ID').optional().nullable(),
  }),
});

export const mergeLeadSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    source: z.string().optional(),
    city: z.string().optional(),
    area: z.string().optional(),
    budget: z.string().optional(),
    gender: z.string().optional(),
    sharing_type: z.string().optional(),
  }),
});
