import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as sessionService from '../services/session.service';

// POST /api/chat/sessions
export const createSession = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { message, model, apiKey, apiEndpoint } = req.body;

        const result = await sessionService.createSession(userId, message, model, apiKey, apiEndpoint);
        return res.status(201).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create session' });
    }
};

// GET /api/chat/sessions
export const getHistory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessions = await sessionService.getUserSessions(userId);
        return res.json(sessions);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch history' });
    }
};

// PATCH /api/chat/sessions/:id
export const renameSession = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;
        const { title } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({ error: 'Title is required' });
        }

        const session = await sessionService.renameSession(id, userId, title);
        return res.json(session);
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Failed to rename session' });
    }
};

// DELETE /api/chat/sessions/:id
export const deleteSession = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;

        await sessionService.deleteSession(id, userId);
        return res.json({ success: true, message: 'Session deleted' });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Failed to delete session' });
    }
};
