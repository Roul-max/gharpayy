import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getProfile, getSettings, updateProfile, updateSettings } from '../controllers/settingsController.js';

const router = Router();

router.use(authenticateToken);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/', getSettings);
router.put('/', updateSettings);

export default router;
