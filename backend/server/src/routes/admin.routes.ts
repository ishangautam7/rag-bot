import { Router } from 'express';
import * as adminController from '../controller/admin.controller';
import { protect } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/admin';

const router = Router();

// All admin routes require authentication AND admin privileges
router.use(protect);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users/:id/reset-usage', adminController.resetUserUsage);
router.post('/users/:id/allowed-models', adminController.updateAllowedModels);

// Broadcast email
router.post('/broadcast', adminController.broadcastEmail);

// Models
router.get('/models', adminController.getGrantableModels);

// Activity logs & metrics
router.get('/activity', adminController.getActivityLogs);
router.get('/metrics', adminController.getResponseMetrics);

export default router;
