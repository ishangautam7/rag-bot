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
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    (req as AuthRequest).user = decoded.id;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};