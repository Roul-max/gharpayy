import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { matchingController } from '../controllers/matchingController.js';
import { validate } from '../middleware/validation.js';
import { matchLeadSchema } from '../modules/matching/validator.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'manager', 'agent']));

router.get('/lead/:leadId', validate(matchLeadSchema), matchingController.getMatchesForLead);

export default router;
