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

// List of models that admin can grant to users
// Includes both free OpenRouter models and admin-provided models (Gemini, GPT, etc.)
export const GRANTABLE_MODELS = [
    // OpenRouter Free Models
    { id: 'openrouter/auto', name: 'Auto (Free)', description: 'Best available free model', provider: 'OpenRouter', isFree: true },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', description: 'Meta Llama 3.2', provider: 'OpenRouter', isFree: true },
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', description: 'Google Gemma 2', provider: 'OpenRouter', isFree: true },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', description: 'Mistral AI', provider: 'OpenRouter', isFree: true },
    { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B', description: 'Alibaba Qwen', provider: 'OpenRouter', isFree: true },

    // Gemini Models (Admin Key Required)
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Latest Gemini Flash', provider: 'Google' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast Gemini model', provider: 'Google' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced Gemini model', provider: 'Google' },

    // GPT Models (If admin provides OpenAI key in future)
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Affordable GPT-4 class', provider: 'OpenAI' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Latest GPT-4', provider: 'OpenAI' },
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
            isActive: true,
            isSuspended: true,
            suspendedAt: true,
            suspendedReason: true,
            customMessageLimit: true,
            lastLoginAt: true,
            loginCount: true,
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
    const today = new Date().toISOString().split('T')[0];

    // First update the allowedModels
    await prisma.user.update({
        where: { id: userId },
        data: {
            allowedModels: models
        }
    });

    // Then fetch the full user object with all required fields
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
            _count: {
                select: {
                    sessions: true,
                    sentMessages: true
                }
            }
        }
    });

    // Get today's usage
    const usage = await prisma.usageLog.findFirst({
        where: {
            userId: userId,
            date: today
        }
    });

    return {
        ...user,
        todayUsage: usage?.freeMessageCount || 0
    };
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
/**
 * Get list of grantable models
 */
export const getGrantableModels = async () => {
    // Fetch dynamic models from DB settings
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'system' }
    });

    const dynamicModels = (settings?.grantableModels as any[]) || [];

    // Merge hardcoded models with dynamic ones
    // Dynamic models take precedence if IDs match (or just append)
    const allModels = [...GRANTABLE_MODELS];

    // Add dynamic models if they don't exist in hardcoded list
    dynamicModels.forEach(dm => {
        if (!allModels.find(m => m.id === dm.id)) {
            allModels.push(dm);
        }
    });

    return allModels;
};

/**
 * Suspend a user account
 */
export const suspendUser = async (userId: string, reason?: string) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            isSuspended: true,
            suspendedAt: new Date(),
            suspendedReason: reason || 'Suspended by admin'
        },
        select: {
            id: true,
            email: true,
            username: true,
            isSuspended: true,
            suspendedAt: true,
            suspendedReason: true
        }
    });
    return user;
};

/**
 * Activate (unsuspend) a user account
 */
export const activateUser = async (userId: string) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            isSuspended: false,
            isActive: true,
            suspendedAt: null,
            suspendedReason: null
        },
        select: {
            id: true,
            email: true,
            username: true,
            isSuspended: true,
            isActive: true
        }
    });
    return user;
};

/**
 * Delete a user (soft or hard delete)
 */
export const deleteUser = async (userId: string, hard: boolean = false) => {
    if (hard) {
        // Hard delete - remove all user data
        await prisma.$transaction([
            prisma.message.deleteMany({ where: { senderId: userId } }),
            prisma.usageLog.deleteMany({ where: { userId } }),
            prisma.activityLog.deleteMany({ where: { userId } }),
            prisma.promptTemplate.deleteMany({ where: { userId } }),
            prisma.refreshToken.deleteMany({ where: { userId } }),
            prisma.sessionMember.deleteMany({ where: { userId } }),
            prisma.folder.deleteMany({ where: { userId } }),
            prisma.session.deleteMany({ where: { userId } }),
            prisma.user.delete({ where: { id: userId } })
        ]);
        return { deleted: true, hard: true };
    } else {
        // Soft delete - mark as inactive
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                isSuspended: true,
                suspendedReason: 'Account deleted'
            }
        });
        return { deleted: true, hard: false };
    }
};

/**
 * Update user's custom message limit
 */
export const updateUserLimits = async (userId: string, customMessageLimit: number | null) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            customMessageLimit: customMessageLimit
        },
        select: {
            id: true,
            email: true,
            username: true,
            customMessageLimit: true
        }
    });
    return user;
};

/**
 * Track user login
 */
export const trackLogin = async (userId: string) => {
    await prisma.user.update({
        where: { id: userId },
        data: {
            lastLoginAt: new Date(),
            loginCount: { increment: 1 }
        }
    });
};
