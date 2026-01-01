import { Router } from 'express';
import * as sessionController from '../controller/session.controller';
import { protect } from '../middlewares/auth';

import * as folderController from '../controller/folder.controller';
import * as templateController from '../controller/template.controller';

const router = Router();

router.use(protect);

// Session CRUD
router.post('/sessions', sessionController.createSession);
router.get('/sessions', sessionController.getHistory);
router.patch('/sessions/:id', sessionController.renameSession);
router.delete('/sessions/:id', sessionController.deleteSession);

// Search
router.get('/search', folderController.searchChats);

// Pin & Folder
router.post('/sessions/:id/pin', folderController.togglePin);
router.post('/sessions/:id/folder', folderController.moveToFolder);

// Export
router.get('/sessions/:id/export', templateController.exportChat);

export default router;
