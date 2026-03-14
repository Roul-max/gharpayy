import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { operationsController } from '../controllers/operationsController.js';
import { validate } from '../middleware/validation.js';
import { createVisitSchema, updateVisitOutcomeSchema } from '../modules/bookings/validators.js';
import { createPropertySchema, createRoomSchema, addBedsSchema, confirmRoomStatusSchema, updatePropertyPhotosSchema } from '../modules/inventory/validators.js';
import { createOwnerSchema } from '../modules/owners/validators.js';
import { enforceIdempotency } from '../middleware/idempotency.js';

const router = Router();
const CRM_ROLES = ['admin', 'manager', 'agent'];
const OWNER_ROLES = ['admin', 'manager', 'owner'];
const OPERATIONS_VIEW_ROLES = ['admin', 'manager', 'agent', 'owner'];

router.use(authenticateToken);

router.get('/visits', requireRole(CRM_ROLES), operationsController.listVisits);
router.post('/visits', requireRole(CRM_ROLES), enforceIdempotency(), validate(createVisitSchema), operationsController.createVisit);
router.patch('/visits/:id/outcome', requireRole(CRM_ROLES), validate(updateVisitOutcomeSchema), operationsController.updateVisitOutcome);

router.get('/bookings', requireRole(OPERATIONS_VIEW_ROLES), operationsController.listBookings);

router.get('/properties', requireRole(OPERATIONS_VIEW_ROLES), operationsController.listProperties);
router.post('/properties', requireRole(OWNER_ROLES), enforceIdempotency(), validate(createPropertySchema), operationsController.createProperty);
router.patch('/properties/:id/photos', requireRole(OWNER_ROLES), validate(updatePropertyPhotosSchema), operationsController.updatePropertyPhotos);
router.post('/rooms', requireRole(OWNER_ROLES), enforceIdempotency(), validate(createRoomSchema), operationsController.createRoom);
router.post('/rooms/:id/beds', requireRole(OWNER_ROLES), enforceIdempotency(), validate(addBedsSchema), operationsController.addBedsToRoom);
router.post('/room-status', requireRole(OWNER_ROLES), validate(confirmRoomStatusSchema), operationsController.confirmRoomStatus);

router.get('/inventory', requireRole(OPERATIONS_VIEW_ROLES), operationsController.listInventory);

router.get('/owners', requireRole(['admin', 'manager']), operationsController.listOwners);
router.post('/owners', requireRole(['admin', 'manager']), enforceIdempotency(), validate(createOwnerSchema), operationsController.createOwner);

router.get('/effort', requireRole(OPERATIONS_VIEW_ROLES), operationsController.getEffortDashboard);
router.get('/zones', requireRole(CRM_ROLES), operationsController.listZones);
router.post('/zones', requireRole(['admin', 'manager']), operationsController.createZone);
router.patch('/zones/:id', requireRole(['admin', 'manager']), operationsController.updateZone);
router.get('/follow-ups', requireRole(CRM_ROLES), operationsController.listFollowUps);
router.post('/follow-ups', requireRole(CRM_ROLES), operationsController.createFollowUp);
router.patch('/follow-ups/:id', requireRole(CRM_ROLES), operationsController.updateFollowUp);
router.get('/notifications', requireRole(['admin', 'manager', 'agent', 'owner']), operationsController.listNotifications);
router.patch('/notifications/:id/read', requireRole(['admin', 'manager', 'agent', 'owner']), operationsController.markNotificationRead);
router.post('/automation/run', requireRole(['admin', 'manager']), operationsController.runAutomation);
router.get('/owner-alerts', requireRole(OWNER_ROLES), operationsController.getOwnerAlerts);

export default router;
