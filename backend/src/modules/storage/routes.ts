import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validation.js';
import { signedUploadSchema } from './validator.js';
import { storageController } from './controller.js';

const router = Router();

router.use(authenticateToken);
router.post(
  '/signed-upload',
  requireRole(['admin', 'manager', 'owner']),
  validate(signedUploadSchema),
  storageController.signedUpload
);

export default router;
