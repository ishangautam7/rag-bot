import * as authService from '../services/auth.service';
import { Request, Response } from 'express';

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
    const { token } = req.body; // Frontend sends the Google ID Token
    const result = await authService.googleLogin(token);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: 'Google authentication failed' });
  }
};