import { Router } from 'express';
import { operationsController } from '../controllers/operationsController.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validation.js';
import { enforceIdempotency } from '../middleware/idempotency.js';
import { requireCaptcha } from '../middleware/captcha.js';
import { publicAssistantSchema, publicCaptureSchema, publicChatSchema, publicVisitRequestSchema, publicReservationSchema } from '../modules/public/validators.js';

const router = Router();
const DISABLE_RATE_LIMIT = process.env.DISABLE_RATE_LIMIT === 'true';

router.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      console.warn(
        `[public] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${Date.now() - startedAt}ms`
      );
    }
  });
  next();
});

if (!DISABLE_RATE_LIMIT) {
  router.use(rateLimit({ windowMs: 60_000, max: 2000, keyPrefix: 'public' }));
}

router.get('/properties', operationsController.listPublicProperties);
router.get('/properties/:id', operationsController.getPublicPropertyById);
router.get('/stats', operationsController.getPublicStats);
router.post('/capture', enforceIdempotency(), requireCaptcha, validate(publicCaptureSchema), operationsController.publicCaptureLead);
router.post('/visit-request', enforceIdempotency(), requireCaptcha, validate(publicVisitRequestSchema), operationsController.publicVisitRequest);
router.post('/chat', enforceIdempotency(), requireCaptcha, validate(publicChatSchema), operationsController.publicChatMessage);
router.post('/reservations', enforceIdempotency(), requireCaptcha, validate(publicReservationSchema), operationsController.publicCreateReservation);
router.post('/assistant', validate(publicAssistantSchema), operationsController.publicAiAssistant);

export default router;
