import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as groupService from '../services/group.service';

// POST /api/chat/group - Create group chat
export const createGroup = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { title } = req.body;

        const session = await groupService.createGroupChat(userId, title);
        return res.status(201).json(session);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// POST /api/chat/sessions/:id/convert-to-group - Convert to group
export const convertToGroup = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessionId = req.params.id;

        const result = await groupService.convertToGroupChat(sessionId, userId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// POST /api/chat/sessions/:id/invite - Generate invite link
export const generateInvite = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessionId = req.params.id;

        const result = await groupService.generateInviteLink(sessionId, userId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// POST /api/chat/join/:token - Join group via invite
export const joinGroup = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const { token } = req.params;

        const result = await groupService.joinGroupChat(token, userId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// POST /api/chat/sessions/:id/leave - Leave group
export const leaveGroup = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessionId = req.params.id;

        const result = await groupService.leaveGroupChat(sessionId, userId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// GET /api/chat/sessions/:id/members - Get members
export const getMembers = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessionId = req.params.id;

        const members = await groupService.getGroupMembers(sessionId, userId);
        return res.json(members);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// DELETE /api/chat/sessions/:id/members/:userId - Remove member
export const removeMember = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const ownerId = req.user!;
        const sessionId = req.params.id;
        const memberUserId = req.params.userId;

        const result = await groupService.removeMember(sessionId, ownerId, memberUserId);
        return res.json(result);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

// GET /api/chat/sessions/:id/is-owner - Check if user is owner
export const checkOwner = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const userId = req.user!;
        const sessionId = req.params.id;

        const isOwner = await groupService.isOwner(sessionId, userId);
        return res.json({ isOwner });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};
