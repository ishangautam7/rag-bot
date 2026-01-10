import express from 'express';
import { submitContactForm } from '../controller/contact.controller.ts';

const router = express.Router();

router.post('/', submitContactForm);

export default router;
