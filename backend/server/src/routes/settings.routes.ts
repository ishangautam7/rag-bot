import { Router } from 'express';
import * as settingsService from '../services/settings.service';
import { protect } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/admin';

const router = Router();

router.get('/public', async (req, res) => {
    try {
        const settings = await settingsService.getSystemSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error getting public settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Protected admin endpoints (require authentication + admin role)
router.use(protect);
router.use(requireAdmin);

router.get('/', async (req, res) => {
    try {
        const settings = await settingsService.getSystemSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

router.put('/', async (req, res) => {
    try {
        const { openrouterApiKey, defaultModel, maxFreeMessagesPerDay, systemStatus, grantableModels } = req.body;

        const settings = await settingsService.updateSystemSettings({
            openrouterApiKey,
            defaultModel,
            maxFreeMessagesPerDay,
            systemStatus,
            grantableModels
        });

        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
