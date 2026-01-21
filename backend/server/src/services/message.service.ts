import { prisma } from '../db';
import { emitNewMessage, emitError } from './socket.service';
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

    if (model) {
        if (!apiKey) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { allowedModels: true, isAdmin: true }
            });

            if (!user) throw new Error('User not found');

            const hasPermission = user.allowedModels.includes(model);

            if (!hasPermission) {
                throw new Error(`You do not have permission to use the model '${model}'. Please add your own API key in Settings or contact an admin.`);
            }
        }
    }

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

    // Update user's last selected model preference
    if (model) {
        await prisma.user.update({
            where: { id: userId },
            data: { lastSelectedModel: model }
        }).catch(err => console.error('Failed to update last selected model:', err));
    }

    // Call Python RAG server
    let aiResponseText = 'Sorry, I could not process your request.';
    let isError = false;
    let aiAttachments: any[] = []; // Store attachments from AI response

    try {
        const ragPayload: Record<string, any> = { // Changed to any to allow complex types if needed
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
            isError = ragData.is_error === true;

            // Capture attachments
            if (ragData.attachments && Array.isArray(ragData.attachments)) {
                aiAttachments = ragData.attachments;
            }
        } else {
            console.error('RAG server error:', ragResponse.status);
            isError = true;
            aiResponseText = 'Failed to connect to AI service. Please try again.';
        }
    } catch (error) {
        console.error('Failed to call RAG server:', error);
        isError = true;
        aiResponseText = 'Failed to connect to AI service. Please try again.';
    }

    // Only save to DB if NOT an error
    let botMessage = null;

    if (!isError) {
        // Here we would extract attachments if we parsed them from aiResponseText or ragData
        // For now, we will simulate or prepare for it. 
        // If aiResponseText is used as content, we assume it is the parsed text.

        botMessage = await prisma.message.create({
            data: {
                sessionId,
                content: aiResponseText,
                role: 'ASSISTANT',
                metadata: aiAttachments.length > 0 ? { attachments: aiAttachments } : undefined
            },
        });

        // Emit bot message via WebSocket
        emitNewMessage(sessionId, { ...botMessage, attachments: aiAttachments });
    }

    // Emit user message via WebSocket
    const userMessageMapped = {
        ...userMessage,
        attachments: (userMessage.metadata as any)?.attachments || []
    };
    emitNewMessage(sessionId, userMessageMapped);

    // If error, emit error separately
    if (isError) {
        emitError(sessionId, aiResponseText);
    }

    await prisma.session.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
    });

    return {
        userMessage,
        botMessage,
        isError,
        errorMessage: isError ? aiResponseText : undefined
    };
};

export const getSessionMessages = async (sessionId: string, userId: string) => {
    const session = await canAccessSession(sessionId, userId);

    if (!session) return null;

    const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
    });

    const messagesMapped = messages.map(msg => ({
        ...msg,
        attachments: (msg.metadata as any)?.attachments || []
    }));

    return {
        messages: messagesMapped,
        isGroupChat: session.isGroupChat,
        isPublic: session.isPublic
    };
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
