import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Email/Password Register
export const registerUser = async (email: string, password: string, username: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, username },
  });

  return { user, token: generateToken(user.id) };
};

// 2. Email/Password Login
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  return { user, token: generateToken(user.id) };
};

// 3. Google Login (Verify Token & Find/Create User)
export const googleLogin = async (idToken: string) => {
  // Verify the token sent from frontend
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new Error('Invalid Google Token');

  const { email, name, sub: googleId, picture } = payload;

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Create new user if not found
    user = await prisma.user.create({
      data: { email, username: name, googleId, avatar: picture },
    });
  } else if (!user.googleId) {
    // If user exists but googleId is missing, link it
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId, avatar: picture },
    });
  }

  return { user, token: generateToken(user.id) };
};