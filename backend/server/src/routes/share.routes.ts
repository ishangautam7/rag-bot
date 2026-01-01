import { Router } from 'express';
import * as shareController from '../controller/share.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.post('/sessions/:id/share', shareController.enableShare);
router.delete('/sessions/:id/share', shareController.disableShare);
router.get('/sessions/:id/share', shareController.getShareStatus);

export default router;
