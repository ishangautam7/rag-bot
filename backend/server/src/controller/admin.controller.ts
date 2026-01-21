import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as adminService from '../services/admin.service';
import * as settingsService from '../services/settings.service';

/**
 * GET /api/admin/users
 * Get all users with usage stats
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const users = await adminService.getAllUsers();
        return res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        return res.status(500).json({ error: 'Failed to get users' });
    }
};

/**
 * GET /api/admin/users/:id
 * Get user details by ID
 */
export const getUserById = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const user = await adminService.getUserById(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json(user);
    } catch (error) {
        console.error('Error getting user:', error);
        return res.status(500).json({ error: 'Failed to get user' });
    }
};

/**
 * POST /api/admin/users/:id/reset-usage
 * Reset user's daily usage
 */
export const resetUserUsage = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const usage = await adminService.resetUserUsage(id);
        return res.json({ message: 'Usage reset successfully', usage });
    } catch (error) {
        console.error('Error resetting usage:', error);
        return res.status(500).json({ error: 'Failed to reset usage' });
    }
};

/**
 * POST /api/admin/users/:id/allowed-models
 * Update user's allowed models
 */
export const updateAllowedModels = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { models } = req.body;

        if (!Array.isArray(models)) {
            return res.status(400).json({ error: 'Models must be an array' });
        }

        const user = await adminService.updateAllowedModels(id, models);
        return res.json({ message: 'Allowed models updated', user });
    } catch (error) {
        console.error('Error updating allowed models:', error);
        return res.status(500).json({ error: 'Failed to update allowed models' });
    }
};

/**
 * POST /api/admin/broadcast
 * Send broadcast email to users
 */
export const broadcastEmail = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { subject, content, userIds } = req.body;

        if (!subject || !content) {
            return res.status(400).json({ error: 'Subject and content are required' });
        }

        // userIds can be 'all' or an array of user IDs
        const target = userIds || 'all';
        const result = await adminService.broadcastToUsers(target, subject, content);

        return res.json(result);
    } catch (error) {
        console.error('Error sending broadcast:', error);
        return res.status(500).json({ error: 'Failed to send broadcast' });
    }
};

/**
 * GET /api/admin/models
 * Get list of grantable models
 */
export const getGrantableModels = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const models = await adminService.getGrantableModels();
        return res.json(models);
    } catch (error) {
        console.error('Error getting models:', error);
        return res.status(500).json({ error: 'Failed to get models' });
    }
};

import * as activityService from '../services/activity.service';

/**
 * GET /api/admin/activity
 * Get activity logs
 */
export const getActivityLogs = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { userId, action, limit, offset, startDate, endDate } = req.query;

        const result = await activityService.getActivityLogs({
            userId: userId as string,
            action: action as string,
            limit: Number(limit) || 50,
            offset: Number(offset) || 0,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });

        return res.json(result);
    } catch (error) {
        console.error('Error getting activity logs:', error);
        return res.status(500).json({ error: 'Failed to get activity logs' });
    }
};

/**
 * GET /api/admin/metrics
 * Get response time metrics
 */
export const getResponseMetrics = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { days } = req.query;
        const metrics = await activityService.getResponseMetrics(Number(days) || 7);
        return res.json(metrics);
    } catch (error) {
        console.error('Error getting metrics:', error);
        return res.status(500).json({ error: 'Failed to get metrics' });
    }
};

/**
 * GET /api/admin/settings
 * Get system settings
 */
export const getSystemSettings = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const settings = await settingsService.getSystemSettings();
        return res.json(settings);
    } catch (error) {
        console.error('Error getting system settings:', error);
        return res.status(500).json({ error: 'Failed to get system settings' });
    }
};

/**
 * GET /api/admin/settings/public
 * Get public system settings (for Python server)
 */
export const getPublicSystemSettings = async (req: Request, res: Response): Promise<any> => {
    try {
        // TODO: Add IP restriction or basic auth if needed
        const settings = await settingsService.getSystemSettings();

        // Only return what's needed for the Python server
        return res.json({
            openrouterApiKey: settings.openrouterApiKey,
            defaultModel: settings.defaultModel
        });
    } catch (error) {
        console.error('Error getting public settings:', error);
        return res.status(500).json({ error: 'Failed to get public settings' });
    }
};

/**
 * PUT /api/admin/settings
 * Update system settings
 */
export const updateSystemSettings = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { openrouterApiKey, defaultModel, maxFreeMessagesPerDay, systemStatus, grantableModels } = req.body;

        const settings = await settingsService.updateSystemSettings({
            openrouterApiKey,
            defaultModel,
            maxFreeMessagesPerDay,
            systemStatus,
            grantableModels
        });

        return res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating system settings:', error);
        return res.status(500).json({ error: 'Failed to update system settings' });
    }
};

/**
 * POST /api/admin/users/:id/suspend
 * Suspend a user account
 */
export const suspendUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const user = await adminService.suspendUser(id, reason);
        return res.json({ message: 'User suspended', user });
    } catch (error) {
        console.error('Error suspending user:', error);
        return res.status(500).json({ error: 'Failed to suspend user' });
    }
};

/**
 * POST /api/admin/users/:id/activate
 * Activate (unsuspend) a user account
 */
export const activateUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const user = await adminService.activateUser(id);
        return res.json({ message: 'User activated', user });
    } catch (error) {
        console.error('Error activating user:', error);
        return res.status(500).json({ error: 'Failed to activate user' });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user (soft or hard)
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const hard = req.query.hard === 'true';
        const result = await adminService.deleteUser(id, hard);
        return res.json({ message: `User ${hard ? 'permanently' : 'soft'} deleted`, ...result });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Failed to delete user' });
    }
};

/**
 * PUT /api/admin/users/:id/limits
 * Update user's custom message limit
 */
export const updateUserLimits = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { customMessageLimit } = req.body;

        // Allow null to reset to default, or number for custom limit
        const limit = customMessageLimit === null || customMessageLimit === undefined
            ? null
            : parseInt(customMessageLimit, 10);

        const user = await adminService.updateUserLimits(id, limit);
        return res.json({ message: 'User limits updated', user });
    } catch (error) {
        console.error('Error updating user limits:', error);
        return res.status(500).json({ error: 'Failed to update user limits' });
    }
};
