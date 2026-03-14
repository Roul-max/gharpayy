import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { analyticsController } from '../controllers/analyticsController.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'manager', 'agent']));

router.get('/agent-performance', analyticsController.getAgentPerformance);

export default router;
