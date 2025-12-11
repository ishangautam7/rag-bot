import { Router } from 'express';
import * as authController from '../controller/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);

export default router;