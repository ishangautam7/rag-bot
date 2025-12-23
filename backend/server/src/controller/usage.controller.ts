import { Request, Response } from 'express';
import { getUsageInfo } from '../services/usage.service';

// Get current user's usage info
export const getUserUsage = async (req: Request, res: Response) => {
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
};
