import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  body: z.object({
    reservation_id: z.string().uuid(),
    provider: z.enum(['stripe', 'razorpay']),
    amount: z.number().positive(),
    currency: z.string().default('INR')
  })
});

export const paymentWebhookSchema = z.object({
  body: z.object({
    provider_event_id: z.string().min(1).optional(),
    event_type: z.string().min(1).optional(),
    provider: z.enum(['stripe', 'razorpay']).optional(),
    payload: z.record(z.string(), z.any()).or(z.array(z.any())).optional()
  }).passthrough()
});

export const paymentConfirmSchema = z.object({
  body: z.object({
    provider: z.enum(['razorpay']),
    reservation_id: z.string().uuid(),
    order_id: z.string().min(1),
    payment_id: z.string().min(1),
    signature: z.string().min(1)
  })
});

export const paymentRefundSchema = z.object({
  body: z.object({
    provider: z.enum(['razorpay']).default('razorpay'),
    payment_intent_id: z.string().uuid().optional(),
    reservation_id: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    reason: z.string().max(500).optional()
  }).refine((value) => value.payment_intent_id || value.reservation_id, {
    message: 'payment_intent_id or reservation_id is required'
  })
});
