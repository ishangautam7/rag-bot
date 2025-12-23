import { Router } from 'express';
import { protect } from '../middlewares/auth';
import * as folderController from '../controller/folder.controller';

const router = Router();

router.use(protect);

router.get('/', folderController.getFolders);
router.post('/', folderController.createFolder);
router.patch('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);

export default router;
