import { prisma } from '../db';

/**
 * Export chat as JSON
 */
export const exportAsJson = async (sessionId: string, userId: string) => {
    const session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
        include: {
            messages: {
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: { select: { username: true, email: true } },
                },
            },
        },
    });

    if (!session) throw new Error('Session not found');

    return {
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.messages.map(m => ({
            role: m.role,
            content: m.content,
            sender: m.sender?.username || m.sender?.email || null,
            timestamp: m.createdAt,
        })),
    };
};

/**
 * Export chat as Markdown
 */
export const exportAsMarkdown = async (sessionId: string, userId: string) => {
    const data = await exportAsJson(sessionId, userId);

    let md = `# ${data.title || 'Chat Export'}\n\n`;
    md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    for (const msg of data.messages) {
        const role = msg.role === 'USER' ? '**You**' : '**Assistant**';
        const sender = msg.sender ? ` (${msg.sender})` : '';
        md += `### ${role}${sender}\n`;
        md += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`;
        md += `${msg.content}\n\n---\n\n`;
    }

    return md;
};

/**
 * Export chat as plain text
 */
export const exportAsText = async (sessionId: string, userId: string) => {
    const data = await exportAsJson(sessionId, userId);

    let text = `${data.title || 'Chat Export'}\n`;
    text += `${'='.repeat(50)}\n\n`;

    for (const msg of data.messages) {
        const role = msg.role === 'USER' ? 'You' : 'Assistant';
        text += `[${role}] ${new Date(msg.timestamp).toLocaleString()}\n`;
        text += `${msg.content}\n\n`;
    }

    return text;
};
