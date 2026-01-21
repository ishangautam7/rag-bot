import { prisma } from '../db';

export const getSystemSettings = async () => {
    let settings = await prisma.systemSettings.findUnique({
        where: { id: 'system' }
    });

    if (!settings) {
        settings = await prisma.systemSettings.create({
            data: {
                id: 'system',
                openrouterApiKey: null,
                defaultModel: 'gemini-2.5-flash-lite',
                maxFreeMessagesPerDay: 50,
                systemStatus: 'active',
                grantableModels: []
            }
        });
    }

    return settings;
};

export const updateSystemSettings = async (data: {
    openrouterApiKey?: string | null;
    defaultModel?: string;
    maxFreeMessagesPerDay?: number;
    systemStatus?: string;
    grantableModels?: any[];
}) => {
    await getSystemSettings();

    const settings = await prisma.systemSettings.update({
        where: { id: 'system' },
        data
    });

    return settings;
};


export const getOpenRouterKey = async (): Promise<string | null> => {
    const settings = await getSystemSettings();
    return settings.openrouterApiKey;
};


export const userCanUseModel = async (userId: string, modelName: string): Promise<boolean> => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { allowedModels: true }
    });

    if (!user) return false;

    return user.allowedModels.includes(modelName);
};


export const isSystemActive = async (): Promise<boolean> => {
    const settings = await getSystemSettings();
    return settings.systemStatus === 'active';
};
