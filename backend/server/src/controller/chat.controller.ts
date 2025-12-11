import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth'; 
import * as chatService from '../services/chat.service';

// POST /api/chat/sessions
export const createChat = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!; 
    const { message } = req.body; 

    const session = await chatService.createSession(userId, message);
    return res.status(201).json(session);
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
    const { sessionId, content } = req.body;

    if (!sessionId || !content) {
      return res.status(400).json({ error: 'Session ID and Content are required' });
    }

    const messages = await chatService.addMessage(sessionId, userId, content);
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
