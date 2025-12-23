import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as templateService from '../services/template.service';
import * as exportService from '../services/export.service';

// GET /api/templates
export const getTemplates = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user;
        const templates = await templateService.getTemplates(userId);
        return res.json(templates);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// POST /api/templates
export const createTemplate = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { name, prompt, category, description } = req.body;

        if (!name || !prompt) {
            return res.status(400).json({ error: 'Name and prompt are required' });
        }

        const template = await templateService.createTemplate(userId, { name, prompt, category, description });
        return res.status(201).json(template);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// DELETE /api/templates/:id
export const deleteTemplate = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;

        await templateService.deleteTemplate(id, userId);
        return res.json({ success: true });
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
};

// GET /api/chat/sessions/:id/export
export const exportChat = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;
        const { format } = req.query;

        let data: any;
        let contentType = 'application/json';
        let filename = `chat-${id}`;

        switch (format) {
            case 'markdown':
            case 'md':
                data = await exportService.exportAsMarkdown(id, userId);
                contentType = 'text/markdown';
                filename += '.md';
                break;
            case 'text':
            case 'txt':
                data = await exportService.exportAsText(id, userId);
                contentType = 'text/plain';
                filename += '.txt';
                break;
            default:
                data = await exportService.exportAsJson(id, userId);
                filename += '.json';
                data = JSON.stringify(data, null, 2);
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(data);
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
};
