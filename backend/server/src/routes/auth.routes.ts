import { Router } from 'express';
import * as authController from '../controller/auth.controller';
import { protect } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', protect, authController.getProfile);

// Admin routes
router.post('/admin/broadcast', protect, authController.broadcastEmail);

export default router;