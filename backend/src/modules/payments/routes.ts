import { Router } from 'express';
import { paymentsController } from './controller.js';
import { validate } from '../../middleware/validation.js';
import { createPaymentIntentSchema, paymentConfirmSchema, paymentRefundSchema, paymentWebhookSchema } from './validator.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { enforceIdempotency } from '../../middleware/idempotency.js';

const router = Router();

router.post(
  '/webhook',
  validate(paymentWebhookSchema),
  paymentsController.webhook
);

router.post(
  '/public-intent',
  validate(createPaymentIntentSchema),
  paymentsController.createIntent
);

router.post(
  '/confirm',
  validate(paymentConfirmSchema),
  paymentsController.confirm
);

router.use(authenticateToken);
router.post(
  '/refund',
  requireRole(['admin', 'manager']),
  validate(paymentRefundSchema),
  paymentsController.refund
);
router.post(
  '/intent',
  requireRole(['admin', 'manager', 'agent', 'owner']),
  enforceIdempotency(),
  validate(createPaymentIntentSchema),
  paymentsController.createIntent
);

export default router;
