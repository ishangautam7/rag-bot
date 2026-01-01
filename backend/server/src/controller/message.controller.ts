import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as messageService from '../services/message.service';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { prisma } from '../db';

// POST /api/chat/message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { sessionId, content, model, apiKey, apiEndpoint, attachments } = req.body;

        if (!sessionId || !content) {
            return res.status(400).json({ error: 'Session ID and Content are required' });
        }

        const messages = await messageService.addMessage(sessionId, userId, content, model, apiKey, apiEndpoint, attachments);
        return res.json(messages);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// GET /api/chat/sessions/:id
export const getMessages = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;

        const messages = await messageService.getSessionMessages(id, userId);

        if (!messages) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        return res.json(messages);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// GET /api/chat/sessions/:id/documents
export const getDocuments = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { id } = req.params;

        const documents = await messageService.getSessionDocuments(id, userId);
        return res.json(documents);
    } catch (error) {
        console.error('Failed to fetch documents:', error);
        return res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

// POST /api/chat/upload
export const uploadFile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const file = (req as any).file;
        const { sessionId } = (req as any).body || {};
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Forward file to Python RAG server for vectorization
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(file.path), {
                filename: file.filename,
                contentType: file.mimetype,
                knownLength: file.size,
            });
            if (userId) formData.append('user_id', userId);
            if (sessionId) formData.append('session_id', sessionId);

            // Use axios for proper multipart handling (fetch has boundary issues with form-data)
            const axios = (await import('axios')).default;
            const ragResponse = await axios.post('http://localhost:8000/upload', formData, {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });
        } catch (error: any) {
            if (error.response) {
                console.error('RAG upload error:', error.response.status, error.response.data);
            } else {
                console.error('Failed to forward file to RAG server:', error.message);
            }
        }

        const fileInfo = {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
        };

        return res.status(201).json({ userId, sessionId: sessionId || null, file: fileInfo });
    } catch (error) {
        return res.status(500).json({ error: 'File upload failed' });
    }
};

// GET /api/chat/files/:filename
export const getFile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { filename } = req.params;

        // 1. Find which session this file belongs to
        // We check the Documents table first as it links filename -> sessionId
        const doc = await prisma.document.findFirst({
            where: { filename }
        });
        console.log(doc)
        if (!doc || !doc.sessionId) {
            return res.status(404).json({ error: 'File not found or invalid session' });
        }

        // 2. Check if user has access to this session
        // Reuse the service logic or re-implement simple check
        // Check if owner
        const isOwner = await prisma.session.findFirst({
            where: { id: doc.sessionId as any, userId }
        });
        console.log(isOwner)
        // Check if member
        const isMember = !isOwner && await prisma.sessionMember.findUnique({
            where: {
                sessionId_userId: { sessionId: doc.sessionId as any, userId }
            }
        });
        console.log(isMember)
        if (!isOwner && !isMember) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // 3. Serve the file
        let filePath = doc.filePath;

        // If filePath is not stored or relative, try to resolve it from uploads
        if (!filePath) {
            // Check newly moved python_server directory first
            const pythonUploadDir = path.resolve(process.cwd(), '../python_server/uploaded_docs');
            const nodeUploadDir = path.resolve(process.cwd(), 'uploads');

            const pythonPath = path.join(pythonUploadDir, filename);
            const nodePath = path.join(nodeUploadDir, filename);

            if (fs.existsSync(pythonPath)) {
                filePath = pythonPath;
            } else {
                filePath = nodePath;
            }
        } else if (!path.isAbsolute(filePath)) {
            // If it ois a relative path in DB (./uploaded_docs/file.pdf), 
            // check if it refers to the legacy location or new location

            // Try resolving relative to CWD (legacy behavior)
            let possiblePath = path.resolve(process.cwd(), filePath);

            if (!fs.existsSync(possiblePath)) {
                // If path is "./uploaded_docs/foo.pdf", changed to "../python_server/uploaded_docs/foo.pdf"
                const baseName = path.basename(filePath);
                possiblePath = path.resolve(process.cwd(), '../python_server/uploaded_docs', baseName);
            }

            filePath = possiblePath;
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File on disk not found' });
        }

        return res.sendFile(filePath);
    } catch (error) {
        console.error('File access error:', error);
        return res.status(500).json({ error: 'Failed to access file' });
    }
};
