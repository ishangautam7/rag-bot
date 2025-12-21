import { prisma } from '../db';
import crypto from 'crypto';

// Create a group chat
export const createGroupChat = async (userId: string, title: string) => {
    const session = await prisma.session.create({
        data: {
            userId,
            title: title || 'Group Chat',
            isGroupChat: true,
        },
    });

    // Add creator as owner
    await prisma.sessionMember.create({
        data: {
            sessionId: session.id,
            userId,
            role: 'OWNER',
        },
    });

    return session;
};

// Convert existing chat to group chat
export const convertToGroupChat = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });

    if (!session) {
        throw new Error('Session not found or access denied');
    }

    if (session.isGroupChat) {
        throw new Error('Already a group chat');
    }

    // Update to group chat
    await prisma.session.update({
        where: { id: sessionId },
        data: { isGroupChat: true },
    });

    // Add owner as first member
    await prisma.sessionMember.create({
        data: {
            sessionId,
            userId,
            role: 'OWNER',
        },
    });

    return { success: true };
};

// Generate invite link (using share token)
export const generateInviteLink = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });

    if (!session) {
        throw new Error('Session not found or access denied');
    }

    if (!session.isGroupChat) {
        throw new Error('Not a group chat');
    }

    // Generate or return existing token
    if (session.shareToken) {
        return { inviteToken: session.shareToken };
    }

    const inviteToken = crypto.randomBytes(16).toString('hex');
    await prisma.session.update({
        where: { id: sessionId },
        data: { shareToken: inviteToken },
    });

    return { inviteToken };
};

// Join group chat via invite token
export const joinGroupChat = async (inviteToken: string, userId: string) => {
    const session = await prisma.session.findUnique({
        where: { shareToken: inviteToken },
    });

    if (!session || !session.isGroupChat) {
        throw new Error('Invalid invite link');
    }

    // Check if already a member
    const existingMember = await prisma.sessionMember.findUnique({
        where: {
            sessionId_userId: {
                sessionId: session.id,
                userId,
            },
        },
    });

    if (existingMember) {
        return { sessionId: session.id, alreadyMember: true };
    }

    // Add as member
    await prisma.sessionMember.create({
        data: {
            sessionId: session.id,
            userId,
            role: 'MEMBER',
        },
    });

    return { sessionId: session.id, alreadyMember: false };
};

// Leave group chat
export const leaveGroupChat = async (sessionId: string, userId: string) => {
    const membership = await prisma.sessionMember.findUnique({
        where: {
            sessionId_userId: {
                sessionId,
                userId,
            },
        },
    });

    if (!membership) {
        throw new Error('Not a member of this chat');
    }

    if (membership.role === 'OWNER') {
        throw new Error('Owner cannot leave. Transfer ownership or delete the chat.');
    }

    await prisma.sessionMember.delete({
        where: { id: membership.id },
    });

    return { success: true };
};

// Get group members
export const getGroupMembers = async (sessionId: string, userId: string) => {
    // Verify user is a member
    const membership = await prisma.sessionMember.findUnique({
        where: {
            sessionId_userId: {
                sessionId,
                userId,
            },
        },
    });

    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });

    if (!membership && !session) {
        throw new Error('Access denied');
    }

    const members = await prisma.sessionMember.findMany({
        where: { sessionId },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatar: true,
                },
            },
        },
        orderBy: { joinedAt: 'asc' },
    });

    return members;
};

// Check if user can access session (owner or member)
export const canAccessSession = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
    });

    if (!session) return false;

    // Owner always has access
    if (session.userId === userId) return true;

    // Check if group chat member
    if (session.isGroupChat) {
        const membership = await prisma.sessionMember.findUnique({
            where: {
                sessionId_userId: {
                    sessionId,
                    userId,
                },
            },
        });
        return !!membership;
    }

    return false;
};

// Check if user is owner
export const isOwner = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });
    return !!session;
};

// Remove member (owner only)
export const removeMember = async (sessionId: string, ownerId: string, memberUserId: string) => {
    // Verify requester is owner
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: ownerId },
    });

    if (!session) {
        throw new Error('Only the owner can remove members');
    }

    if (ownerId === memberUserId) {
        throw new Error('Cannot remove yourself');
    }

    const membership = await prisma.sessionMember.findUnique({
        where: {
            sessionId_userId: {
                sessionId,
                userId: memberUserId,
            },
        },
    });

    if (!membership) {
        throw new Error('User is not a member');
    }

    await prisma.sessionMember.delete({
        where: { id: membership.id },
    });

    return { success: true };
};
