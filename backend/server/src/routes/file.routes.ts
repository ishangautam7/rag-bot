import { Router } from 'express';
import * as messageController from '../controller/message.controller';
import { protect } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Directory for uploading files
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
    filename: (_req: any, file: any, cb: any) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${base}-${unique}${ext}`);
    }
});

const upload = multer({ storage });

router.get('/files/:filename', protect, messageController.getFile);


router.post('/upload', upload.single('file'), protect, messageController.uploadFile);


export default router;
