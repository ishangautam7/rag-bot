import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as chatService from '../services/chat.service';
import fs from 'fs';
import FormData from 'form-data';

// POST /api/chat/sessions
export const createChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!;
    const { message, model, apiKey } = req.body;

    const result = await chatService.createSession(userId, message, model, apiKey);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create session' });
  }
};

// GET /api/chat/sessions
export const getHistory = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!;
    const sessions = await chatService.getUserSessions(userId);
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
};

// POST /api/chat/message
export const sendMessage = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!;
    const { sessionId, content, model, apiKey } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({ error: 'Session ID and Content are required' });
    }

    const messages = await chatService.addMessage(sessionId, userId, content, model, apiKey);
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

    const messages = await chatService.getSessionMessages(id, userId);

    if (!messages) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
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
        filename: file.originalname,
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
      console.log('RAG upload success:', ragResponse.data);
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
