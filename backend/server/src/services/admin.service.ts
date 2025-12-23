import { prisma } from '../db';
import nodemailer from 'nodemailer';

// Email config
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

// List of additional free models from OpenRouter that admin can grant
export const GRANTABLE_FREE_MODELS = [
    { id: 'openrouter/auto', name: 'Auto (Free)', description: 'Best available free model' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', description: 'Meta Llama 3.2' },
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', description: 'Google Gemma 2' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', description: 'Mistral AI' },
    { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B', description: 'Alibaba Qwen' },
    { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini', description: 'Microsoft Phi-3' },
];

/**
 * Get all users with their usage stats
 */
export const getAllUsers = async () => {
    const today = new Date().toISOString().split('T')[0];

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            avatar: true,
            isAdmin: true,
            allowedModels: true,
            createdAt: true,
            _count: {
                select: {
                    sessions: true,
                    sentMessages: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Get today's usage for each user
    const usagePromises = users.map(async (user) => {
        const usage = await prisma.usageLog.findUnique({
            where: {
                userId_date: { userId: user.id, date: today }
            }
        });
        return {
            ...user,
            todayUsage: usage?.freeMessageCount || 0
        };
    });

    return Promise.all(usagePromises);
};

/**
 * Get a single user by ID with full details
 */
export const getUserById = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            username: true,
            avatar: true,
            isAdmin: true,
            allowedModels: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    sessions: true,
                    sentMessages: true,
                }
            }
        }
    });

    if (!user) return null;

    // Get usage history (last 7 days)
    const usageHistory = await prisma.usageLog.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 7
    });

    // Get today's usage
    const todayUsage = await prisma.usageLog.findUnique({
        where: {
            userId_date: { userId, date: today }
        }
    });

    return {
        ...user,
        todayUsage: todayUsage?.freeMessageCount || 0,
        usageHistory
    };
};

/**
 * Reset user's daily usage to 0
 */
export const resetUserUsage = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const usage = await prisma.usageLog.upsert({
        where: {
            userId_date: { userId, date: today }
        },
        update: {
            freeMessageCount: 0
        },
        create: {
            userId,
            date: today,
            freeMessageCount: 0
        }
    });

    return usage;
};

/**
 * Update user's allowed models
 */
export const updateAllowedModels = async (userId: string, models: string[]) => {
    // Ensure openrouter/auto is always included (base free model)
    const modelsSet = new Set(models);
    modelsSet.add('openrouter/auto');

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            allowedModels: Array.from(modelsSet)
        },
        select: {
            id: true,
            email: true,
            allowedModels: true
        }
    });

    return user;
};

/**
 * Send broadcast email to specific users or all users
 */
export const broadcastToUsers = async (
    userIds: string[] | 'all',
    subject: string,
    htmlContent: string
) => {
    // Get target users
    let users;
    if (userIds === 'all') {
        users = await prisma.user.findMany({
            select: { email: true, username: true }
        });
    } else {
        users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { email: true, username: true }
        });
    }

    if (!users.length) {
        return { message: 'No users to send to', sent: 0 };
    }

    // Check if email is configured
    if (!EMAIL_USER || !EMAIL_PASS) {
        console.log('[DEV] Would send broadcast to:', users.map(u => u.email));
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
        failed: failed.length > 0 ? failed : undefined
    };
};

/**
 * Get list of grantable models
 */
export const getGrantableModels = () => {
    return GRANTABLE_FREE_MODELS;
};
