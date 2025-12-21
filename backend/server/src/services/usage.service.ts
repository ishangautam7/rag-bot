import { prisma } from '../db';

const FREE_MODEL_DAILY_LIMIT = 15;
const FREE_MODEL_ID = 'openrouter/auto';

// Get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split('T')[0];

// Get or create usage log for user today
export const getUsageForToday = async (userId: string) => {
    const today = getToday();

    let usage = await prisma.usageLog.findUnique({
        where: {
            userId_date: { userId, date: today }
        }
    });

    if (!usage) {
        usage = await prisma.usageLog.create({
            data: {
                userId,
                date: today,
                freeMessageCount: 0
            }
        });
    }

    return usage;
};

// Get remaining free messages for user today
export const getRemainingFreeMessages = async (userId: string) => {
    const usage = await getUsageForToday(userId);
    return Math.max(0, FREE_MODEL_DAILY_LIMIT - usage.freeMessageCount);
};

// Check if user can send a free message
export const canSendFreeMessage = async (userId: string) => {
    const remaining = await getRemainingFreeMessages(userId);
    return remaining > 0;
};

// Increment free message count (call after sending a free model message)
export const incrementFreeMessageCount = async (userId: string) => {
    const today = getToday();

    const usage = await prisma.usageLog.upsert({
        where: {
            userId_date: { userId, date: today }
        },
        update: {
            freeMessageCount: { increment: 1 }
        },
        create: {
            userId,
            date: today,
            freeMessageCount: 1
        }
    });

    return usage.freeMessageCount;
};

// Check if model is the free model
export const isFreeModel = (modelId: string) => {
    return modelId === FREE_MODEL_ID;
};

// Get usage info for user
export const getUsageInfo = async (userId: string) => {
    const remaining = await getRemainingFreeMessages(userId);
    return {
        remaining,
        limit: FREE_MODEL_DAILY_LIMIT,
        used: FREE_MODEL_DAILY_LIMIT - remaining
    };
};
