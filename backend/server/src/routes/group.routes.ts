import { Router } from 'express';
import * as groupController from '../controller/group.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.post('/group', groupController.createGroup);
router.post('/sessions/:id/convert-to-group', groupController.convertToGroup);
router.post('/sessions/:id/invite', groupController.generateInvite);
router.post('/join/:token', groupController.joinGroup);
router.post('/sessions/:id/leave', groupController.leaveGroup);
router.get('/sessions/:id/members', groupController.getMembers);
router.delete('/sessions/:id/members/:userId', groupController.removeMember);
router.get('/sessions/:id/is-owner', groupController.checkOwner);

export default router;
