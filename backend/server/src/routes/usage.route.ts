import { Router } from 'express';
import { getUsageInfo } from '../services/usage.service';
import { protect } from '../middlewares/auth';

const router = Router();

// All usage routes require authentication
router.use(protect);

// Get current user's usage info
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).user;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const usage = await getUsageInfo(userId);
        res.json(usage);
    } catch (error) {
        console.error('Error getting usage:', error);
        res.status(500).json({ error: 'Failed to get usage info' });
    }
});

export default router;
