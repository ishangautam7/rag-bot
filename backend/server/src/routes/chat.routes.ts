import { Router } from 'express';
import * as chatController from '../controller/chat.controller';
import { protect } from '../middlewares/auth'; 

const router = Router();

router.use(protect);

router.post('/sessions', chatController.createChat);      // Start new chat
router.get('/sessions', chatController.getHistory);       // List old chats
router.get('/sessions/:id', chatController.getMessages);  // Load specific chat
router.post('/message', chatController.sendMessage);      // Send message

export default router;