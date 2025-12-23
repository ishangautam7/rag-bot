import { Router } from 'express';
import { protect } from '../middlewares/auth';
import * as templateController from '../controller/template.controller';

const router = Router();

// Public (with optional auth for user templates)
router.get('/', templateController.getTemplates);

// Protected
router.use(protect);
router.post('/', templateController.createTemplate);
router.delete('/:id', templateController.deleteTemplate);

export default router;
