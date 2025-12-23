import { prisma } from '../db';

// Default system templates
const DEFAULT_TEMPLATES = [
    { name: 'Summarize', prompt: 'Please summarize the following:\n\n', category: 'general', description: 'Summarize content' },
    { name: 'Explain', prompt: 'Please explain this in simple terms:\n\n', category: 'general', description: 'Explain concepts' },
    { name: 'Debug Code', prompt: 'Please help me debug this code and find any issues:\n\n```\n\n```', category: 'coding', description: 'Debug code issues' },
    { name: 'Write Code', prompt: 'Please write code to:\n\n', category: 'coding', description: 'Generate code' },
    { name: 'Translate', prompt: 'Please translate the following to English:\n\n', category: 'general', description: 'Translate text' },
    { name: 'Improve Writing', prompt: 'Please improve this text for clarity and grammar:\n\n', category: 'writing', description: 'Improve writing' },
    { name: 'Brainstorm', prompt: 'Help me brainstorm ideas for:\n\n', category: 'creative', description: 'Generate ideas' },
    { name: 'Compare', prompt: 'Please compare and contrast:\n\n', category: 'general', description: 'Compare items' },
];

/**
 * Get all templates (system + user's custom)
 */
export const getTemplates = async (userId?: string) => {
    const templates = await prisma.promptTemplate.findMany({
        where: {
            OR: [
                { userId: null }, // System templates
                ...(userId ? [{ userId }] : []),
            ],
        },
        orderBy: [{ userId: 'asc' }, { category: 'asc' }, { name: 'asc' }],
    });

    return templates;
};

/**
 * Create a custom template
 */
export const createTemplate = async (
    userId: string,
    data: { name: string; prompt: string; category?: string; description?: string }
) => {
    return prisma.promptTemplate.create({
        data: {
            name: data.name,
            prompt: data.prompt,
            category: data.category || 'custom',
            description: data.description,
            userId,
        },
    });
};

/**
 * Delete a user's custom template
 */
export const deleteTemplate = async (templateId: string, userId: string) => {
    const template = await prisma.promptTemplate.findFirst({
        where: { id: templateId, userId },
    });

    if (!template) throw new Error('Template not found or not owned by user');

    return prisma.promptTemplate.delete({
        where: { id: templateId },
    });
};

/**
 * Seed default templates (run once on startup or manually)
 */
export const seedDefaultTemplates = async () => {
    const existing = await prisma.promptTemplate.count({
        where: { userId: null },
    });

    if (existing === 0) {
        await prisma.promptTemplate.createMany({
            data: DEFAULT_TEMPLATES.map(t => ({ ...t, userId: null })),
        });
        console.log('Seeded default prompt templates');
    }
};
