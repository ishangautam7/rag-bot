import { prisma } from '../db';
import { emitNewMessage } from './socket.service';
import { isFreeModel, canSendFreeMessage, incrementFreeMessageCount } from './usage.service';
import { canAccessSession } from './session.service'; // Import shared helper

export const addMessage = async (
    sessionId: string,
    userId: string,
    content: string,
    model?: string,
    apiKey?: string,
    apiEndpoint?: string,
    attachments?: any[]
) => {
    const session = await canAccessSession(sessionId, userId);

    if (!session) throw new Error('Session not found or access denied');

    // Check free model limit
    if (model && isFreeModel(model)) {
        const canSend = await canSendFreeMessage(userId);
        if (!canSend) {
            throw new Error('Daily free message limit reached. Please try again tomorrow or use a paid model.');
        }
        // Increment usage
        await incrementFreeMessageCount(userId);
    }

    const userMessage = await prisma.message.create({
        data: {
            sessionId,
            content,
            role: 'USER',
            senderId: userId, // Track who sent the message
            metadata: attachments ? { attachments } : undefined,
        },
    });

    // Call Python RAG server
    let aiResponseText = 'Sorry, I could not process your request.';

    try {
        const ragPayload: Record<string, string> = {
            session_id: sessionId,
            message: content,
        };

        if (model) ragPayload.model = model;
        if (apiKey) ragPayload.api_key = apiKey;
        if (apiEndpoint) ragPayload.api_endpoint = apiEndpoint;

        const ragResponse = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ragPayload),
        });

        if (ragResponse.ok) {
            const ragData = await ragResponse.json();
            aiResponseText = ragData.response || 'No response from AI';
        } else {
            console.error('RAG server error:', ragResponse.status);
        }
    } catch (error) {
        console.error('Failed to call RAG server:', error);
    }

    const botMessage = await prisma.message.create({
        data: {
            sessionId,
            content: aiResponseText,
            role: 'ASSISTANT',
        },
    });

    // Emit messages via WebSocket for real-time sync
    emitNewMessage(sessionId, userMessage);
    emitNewMessage(sessionId, botMessage);

    await prisma.session.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
    });

    return { userMessage, botMessage };
};

export const getSessionMessages = async (sessionId: string, userId: string) => {
    const session = await canAccessSession(sessionId, userId);

    if (!session) return null;

    const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                }
            }
        }
    });

    return messages.map(msg => ({
        ...msg,
        attachments: (msg.metadata as any)?.attachments || []
    }));
};

export const getSessionDocuments = async (sessionId: string, userId: string) => {
    const session = await canAccessSession(sessionId, userId);
    if (!session) return [];

    // Call RAG server to get documents
    try {
        const response = await fetch(`http://localhost:8000/documents/${sessionId}`);
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch documents from RAG server:', error);
        return [];
    }
};
