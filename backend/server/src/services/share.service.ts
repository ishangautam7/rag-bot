import { prisma } from '../db';
import crypto from 'crypto';

// Generate a unique share token
const generateShareToken = (): string => {
    return crypto.randomBytes(16).toString('hex');
};

// Enable sharing for a session
export const enableSharing = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });

    if (!session) {
        throw new Error('Session not found or access denied');
    }

    // If already shared, return existing token
    if (session.isPublic && session.shareToken) {
        return { shareToken: session.shareToken, isPublic: true };
    }

    // Generate new share token
    const shareToken = generateShareToken();

    const updated = await prisma.session.update({
        where: { id: sessionId },
        data: {
            isPublic: true,
            shareToken,
            sharedAt: new Date(),
        },
    });

    return { shareToken: updated.shareToken, isPublic: true };
};

// Disable sharing for a session
export const disableSharing = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });

    if (!session) {
        throw new Error('Session not found or access denied');
    }

    await prisma.session.update({
        where: { id: sessionId },
        data: {
            isPublic: false,
            shareToken: null,
            sharedAt: null,
        },
    });

    return { isPublic: false };
};

// Get shared session by token (public, no auth required)
export const getSharedSession = async (shareToken: string) => {
    const session = await prisma.session.findUnique({
        where: { shareToken },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
            },
            user: {
                select: {
                    username: true,
                    avatar: true,
                },
            },
        },
    });

    if (!session || !session.isPublic) {
        return null;
    }

    return session;
};

// Get share status for a session
export const getShareStatus = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
        select: {
            isPublic: true,
            shareToken: true,
            sharedAt: true,
        },
    });

    if (!session) {
        throw new Error('Session not found or access denied');
    }

    return session;
};
