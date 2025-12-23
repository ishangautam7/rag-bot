import { prisma } from '../db';

/**
 * Create a new folder
 */
export const createFolder = async (userId: string, name: string, color?: string) => {
    return prisma.folder.create({
        data: {
            name,
            color: color || '#6b7280',
            userId,
        },
    });
};

/**
 * Get all folders for a user
 */
export const getUserFolders = async (userId: string) => {
    return prisma.folder.findMany({
        where: { userId },
        include: {
            _count: { select: { sessions: true } },
        },
        orderBy: { createdAt: 'asc' },
    });
};

/**
 * Update a folder
 */
export const updateFolder = async (folderId: string, userId: string, data: { name?: string; color?: string }) => {
    // Verify ownership
    const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId },
    });

    if (!folder) throw new Error('Folder not found');

    return prisma.folder.update({
        where: { id: folderId },
        data,
    });
};

/**
 * Delete a folder (moves sessions to no folder)
 */
export const deleteFolder = async (folderId: string, userId: string) => {
    const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId },
    });

    if (!folder) throw new Error('Folder not found');

    // Unassign sessions from this folder
    await prisma.session.updateMany({
        where: { folderId },
        data: { folderId: null },
    });

    return prisma.folder.delete({
        where: { id: folderId },
    });
};

/**
 * Move session to folder
 */
export const moveSessionToFolder = async (sessionId: string, userId: string, folderId: string | null) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });

    if (!session) throw new Error('Session not found');

    // Verify folder ownership if folderId provided
    if (folderId) {
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
        });
        if (!folder) throw new Error('Folder not found');
    }

    return prisma.session.update({
        where: { id: sessionId },
        data: { folderId },
    });
};

/**
 * Pin/unpin a session
 */
export const togglePinSession = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
    });

    if (!session) throw new Error('Session not found');

    return prisma.session.update({
        where: { id: sessionId },
        data: { isPinned: !session.isPinned },
    });
};

/**
 * Search messages and sessions
 */
export const searchChats = async (userId: string, query: string, limit = 20) => {
    const [sessions, messages] = await Promise.all([
        // Search session titles
        prisma.session.findMany({
            where: {
                userId,
                title: { contains: query, mode: 'insensitive' },
            },
            take: limit,
            orderBy: { updatedAt: 'desc' },
        }),
        // Search message content
        prisma.message.findMany({
            where: {
                session: { userId },
                content: { contains: query, mode: 'insensitive' },
            },
            take: limit,
            include: {
                session: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    return { sessions, messages };
};
