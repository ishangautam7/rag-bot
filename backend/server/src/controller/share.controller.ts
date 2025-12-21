import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as shareService from '../services/share.service';
import { Request } from 'express';

// POST /api/chat/sessions/:id/share - Enable sharing
export const enableShare = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessionId = req.params.id;

        const result = await shareService.enableSharing(sessionId, userId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// DELETE /api/chat/sessions/:id/share - Disable sharing
export const disableShare = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessionId = req.params.id;

        const result = await shareService.disableSharing(sessionId, userId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// GET /api/chat/sessions/:id/share - Get share status
export const getShareStatus = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessionId = req.params.id;

        const result = await shareService.getShareStatus(sessionId, userId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// GET /api/shared/:token - Get shared chat (PUBLIC, no auth required)
export const getSharedChat = async (req: Request, res: Response): Promise<any> => {
    try {
        const { token } = req.params;

        const session = await shareService.getSharedSession(token);

        if (!session) {
            return res.status(404).json({ error: 'Shared chat not found or no longer available' });
        }

        return res.json({
            id: session.id,
            title: session.title,
            sharedAt: session.sharedAt,
            user: session.user,
            messages: session.messages,
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
