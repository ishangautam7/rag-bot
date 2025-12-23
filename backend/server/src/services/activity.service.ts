import { prisma } from '../db';

type ActivityAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE_CHAT'
    | 'DELETE_CHAT'
    | 'SEND_MESSAGE'
    | 'SHARE_CHAT'
    | 'JOIN_GROUP'
    | 'EXPORT_CHAT'
    | 'UPLOAD_FILE';

/**
 * Log a user activity
 */
export const logActivity = async (
    userId: string,
    action: ActivityAction,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
) => {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                details: details || undefined,
                ipAddress,
                userAgent,
            },
        });
    } catch (e) {
        // Don't fail the main operation if logging fails
        console.error('Failed to log activity:', e);
    }
};

/**
 * Get activity logs (admin only)
 */
export const getActivityLogs = async (options: {
    userId?: string;
    action?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
}) => {
    const { userId, action, limit = 50, offset = 0, startDate, endDate } = options;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            include: {
                user: { select: { id: true, email: true, username: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        }),
        prisma.activityLog.count({ where }),
    ]);

    return { logs, total };
};

/**
 * Get response time metrics (admin only)
 */
export const getResponseMetrics = async (days = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messages = await prisma.message.findMany({
        where: {
            role: 'ASSISTANT',
            responseMs: { not: null },
            createdAt: { gte: startDate },
        },
        select: {
            responseMs: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) {
        return { avg: 0, p50: 0, p95: 0, p99: 0, count: 0, history: [] };
    }

    const times = messages.map(m => m.responseMs!).sort((a, b) => a - b);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    // Group by day for chart
    const history: Record<string, number[]> = {};
    messages.forEach(m => {
        const day = m.createdAt.toISOString().split('T')[0];
        if (!history[day]) history[day] = [];
        history[day].push(m.responseMs!);
    });

    const dailyAvg = Object.entries(history).map(([date, times]) => ({
        date,
        avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        count: times.length,
    }));

    return { avg, p50, p95, p99, count: messages.length, history: dailyAvg };
};
