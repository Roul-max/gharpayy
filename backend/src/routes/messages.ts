import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { messagesController } from '../controllers/messagesController.js';
import { validate } from '../middleware/validation.js';
import { sendMessageSchema } from '../modules/messaging/validator.js';
import { enforceIdempotency } from '../middleware/idempotency.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'manager', 'agent']));

// Send a message to a lead
router.get('/lead/:leadId', messagesController.getMessagesForLead);
router.post('/lead/:leadId', enforceIdempotency(), validate(sendMessageSchema), messagesController.sendMessageToLead);

export default router;
