import { Router } from 'express';
import { getUserUsage } from '../controller/usage.controller';
import { protect } from '../middlewares/auth';

const router = Router();

// All usage routes require authentication
router.use(protect);

// Get current user's usage info
router.get('/', getUserUsage);

export default router;
