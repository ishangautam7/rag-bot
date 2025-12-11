import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: string; 
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    (req as AuthRequest).user = decoded.id;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};