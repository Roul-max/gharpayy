import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { leadsController } from '../controllers/leadsController.js';
import { validate } from '../middleware/validation.js';
import { createLeadSchema, mergeLeadSchema, updateLeadSchema } from '../validations/leadValidation.js';
import { enforceIdempotency } from '../middleware/idempotency.js';

const router = Router();
const CRM_ROLES = ['admin', 'manager', 'agent'];

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(CRM_ROLES));

// Get agents for filtering
router.get('/meta/agents', leadsController.getAgents);

// Get activities for a lead
router.get('/:id/activities', leadsController.getActivities);

// Get all leads
router.get('/', leadsController.getAllLeads);

// Get a single lead
router.get('/:id', leadsController.getLeadById);

// Create a new lead
router.post('/', enforceIdempotency(), validate(createLeadSchema), leadsController.createLead);

// Merge a lead attempt into an existing lead
router.post('/:id/merge', enforceIdempotency(), validate(mergeLeadSchema), leadsController.mergeLead);

// Update a lead
router.put('/:id', validate(updateLeadSchema), leadsController.updateLead);

// Delete a lead (Admin/Manager only)
router.delete('/:id', requireRole(['admin', 'manager']), leadsController.deleteLead);

// Bulk import leads
router.post('/bulk', leadsController.bulkImportLeads);

export default router;
