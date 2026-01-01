import { Router } from 'express';
import sessionRoutes from './session.routes';
import messageRoutes from './message.routes';
import fileRoutes from './file.routes';
import shareRoutes from './share.routes';
import groupRoutes from './group.routes';

const router = Router();

router.use(sessionRoutes);
router.use(messageRoutes);
router.use(fileRoutes);
router.use(shareRoutes);
router.use(groupRoutes);

export default router;
