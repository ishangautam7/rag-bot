import * as authService from '../services/auth.service';
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password, username } = req.body;
    const result = await authService.registerUser(email, password, username);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    const result = await authService.googleLogin(token);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: 'Google authentication failed' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!;
    const user = await authService.getUserProfile(userId);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process request' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ error: 'Email, token, and password are required' });
    }
    const result = await authService.resetPassword(email, token, password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const broadcastEmail = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    console.log(req.user);
    const userId = req.user!;
    const { subject, content } = req.body;
    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    const result = await authService.broadcastEmail(userId, subject, content);
    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};