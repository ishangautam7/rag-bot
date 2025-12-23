import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as folderService from '../services/folder.service';

// GET /api/folders
export const getFolders = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const folders = await folderService.getUserFolders(userId);
        return res.json(folders);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/folders
export const createFolder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { name, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const folder = await folderService.createFolder(userId, name, color);
        return res.status(201).json(folder);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// PATCH /api/folders/:id
export const updateFolder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;
        const { name, color } = req.body;

        const folder = await folderService.updateFolder(id, userId, { name, color });
        return res.json(folder);
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
};

// DELETE /api/folders/:id
export const deleteFolder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;

        await folderService.deleteFolder(id, userId);
        return res.json({ success: true });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/chat/sessions/:id/folder
export const moveToFolder = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;
        const { folderId } = req.body;

        const session = await folderService.moveSessionToFolder(id, userId, folderId);
        return res.json(session);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/chat/sessions/:id/pin
export const togglePin = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;

        const session = await folderService.togglePinSession(id, userId);
        return res.json({ isPinned: session.isPinned });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// GET /api/chat/search
export const searchChats = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { q, limit } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = await folderService.searchChats(userId, q, Number(limit) || 20);
        return res.json(results);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
