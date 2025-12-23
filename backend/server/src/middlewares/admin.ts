import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from './auth';

export const requireAdmin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<any> => {
    try {
        const userId = req.user;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true }
        });

        if (!user?.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};
