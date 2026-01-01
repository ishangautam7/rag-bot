import { prisma } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Email config (Gmail example - user should set these in .env)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '15m' }); // Short-lived access token
};

const generateRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
};

// Revoke a specific refresh token
export const revokeToken = async (token: string) => {
  await prisma.refreshToken.update({
    where: { token },
    data: { revoked: true },
  });
};

// Rotate Refresh Token
export const refreshToken = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken || storedToken.revoked) {
    if (storedToken) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true }
      });
    }
    throw new Error('Invalid or revoked refresh token');
  }

  if (new Date() > storedToken.expiresAt) {
    throw new Error('Refresh token expired');
  }

  const newAccessToken = generateToken(storedToken.userId);
  const newRefreshToken = await generateRefreshToken(storedToken.userId);

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  return {
    user: storedToken.user,
    token: newAccessToken,
    refreshToken: newRefreshToken
  };
};

// Email/Password Register
export const registerUser = async (email: string, password: string, username: string) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, username },
  });

  const accessToken = generateToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, token: accessToken, refreshToken };
};

// 2. Email/Password Login
export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) throw new Error('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const accessToken = generateToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, token: accessToken, refreshToken };
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

  const accessToken = generateToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, token: accessToken, refreshToken };
};

// 4. Get User Profile
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatar: true,
      createdAt: true,
      isAdmin: true,
    },
  });

  if (!user) throw new Error('User not found');
  return user;
};

// 5. Forgot Password - Send Reset Email
export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: 'If an account exists, a reset email has been sent' };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour

  // Store reset token in user (we need to add these fields to schema)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: resetTokenHash,
      resetTokenExpires: resetExpires,
    },
  });

  // Send email
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  // Try to send email if configured
  if (EMAIL_USER && EMAIL_PASS) {
    try {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="padding: 12px 24px; background: #333; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
      });
      return { message: 'Password reset email sent' };
    } catch (err) {
      console.error('Email failed:', err);
    }
  }

  // Dev mode: return URL directly
  return { message: 'Email not configured. Check console for reset URL.', resetUrl };
};

// 6. Reset Password
export const resetPassword = async (email: string, token: string, newPassword: string) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      email,
      resetToken: tokenHash,
      resetTokenExpires: { gt: new Date() },
    },
  });

  if (!user) throw new Error('Invalid or expired reset token');

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpires: null,
    },
  });

  return { message: 'Password reset successful' };
};

// 7. Check if user is admin
export const isAdmin = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  });
  return user?.isAdmin ?? false;
};

// 8. Broadcast email to all users (Admin only)
export const broadcastEmail = async (adminId: string, subject: string, htmlContent: string) => {
  // Verify admin
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin?.isAdmin) {
    throw new Error('Unauthorized: Admin access required');
  }

  // Get all users
  const users = await prisma.user.findMany({
    select: { email: true, username: true }
  });

  if (!users.length) {
    return { message: 'No users to send to', sent: 0 };
  }

  // Check if email is configured
  if (!EMAIL_USER || !EMAIL_PASS) {
    return {
      message: 'Email not configured (dev mode)',
      sent: 0,
      recipients: users.map(u => u.email)
    };
  }

  // Send emails
  let sent = 0;
  const failed: string[] = [];

  for (const user of users) {
    try {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: user.email,
        subject,
        html: htmlContent,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${user.email}:`, err);
      failed.push(user.email);
    }
  }

  return {
    message: `Sent to ${sent}/${users.length} users`,
    sent,
    failed
  };
};