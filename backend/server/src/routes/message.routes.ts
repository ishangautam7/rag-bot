import { Router } from 'express';
import * as messageController from '../controller/message.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.post('/message', messageController.sendMessage);
router.get('/sessions/:id', messageController.getMessages);
router.get('/sessions/:id/documents', messageController.getDocuments);

export default router;
