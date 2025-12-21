import { Router } from 'express';
import * as chatController from '../controller/chat.controller';
import * as shareController from '../controller/share.controller';
import * as groupController from '../controller/group.controller';
import { protect } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Directory for uploading file...
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

//to store the incomming files
const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  }
});

//to use RAM for accessing files
// const storage = multer.memoryStorage();

const upload = multer({ storage });

// Public upload endpoint
router.post('/upload', upload.single('file'), chatController.uploadFile);

// Protected chat endpoints
router.use(protect);
router.post('/sessions', chatController.createChat);      // Start new chat
router.get('/sessions', chatController.getHistory);       // List old chats
router.get('/sessions/:id', chatController.getMessages);  // Load specific chat
router.post('/message', chatController.sendMessage);      // Send message

// Share endpoints (protected)
router.post('/sessions/:id/share', shareController.enableShare);    // Enable sharing
router.delete('/sessions/:id/share', shareController.disableShare); // Disable sharing
router.get('/sessions/:id/share', shareController.getShareStatus);  // Get share status

// Group chat endpoints (protected)
router.post('/group', groupController.createGroup);                      // Create group chat
router.post('/sessions/:id/convert-to-group', groupController.convertToGroup);  // Convert to group
router.post('/sessions/:id/invite', groupController.generateInvite);     // Generate invite
router.post('/join/:token', groupController.joinGroup);                  // Join via invite
router.post('/sessions/:id/leave', groupController.leaveGroup);          // Leave group
router.get('/sessions/:id/members', groupController.getMembers);         // Get members
router.delete('/sessions/:id/members/:userId', groupController.removeMember);  // Remove member
router.get('/sessions/:id/is-owner', groupController.checkOwner);        // Check if owner

export default router;


