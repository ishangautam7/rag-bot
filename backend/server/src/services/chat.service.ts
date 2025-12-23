import { prisma } from '../db';
import { emitNewMessage } from './socket.service';
import { isFreeModel, canSendFreeMessage, incrementFreeMessageCount } from './usage.service';

export const createSession = async (userId: string, firstMessage?: string, model?: string, apiKey?: string, apiEndpoint?: string) => {
  const session = await prisma.session.create({
    data: {
      userId,
      title: firstMessage
        ? (firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage)
        : 'New Chat',
    },
  });

  let botMessage = null;

  if (firstMessage) {
    await prisma.message.create({
      data: {
        sessionId: session.id,
        content: firstMessage,
        role: 'USER',
      },
    });

    // Call RAG server to get AI response
    let aiResponseText = 'Sorry, I could not process your request.';

    try {
      const ragPayload: Record<string, string> = {
        session_id: session.id,
        message: firstMessage,
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

    // Save AI response
    botMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        content: aiResponseText,
        role: 'ASSISTANT',
      },
    });
  }

  return { session, botMessage };
};

//history
export const getUserSessions = async (userId: string) => {
  // Get sessions user owns
  const ownedSessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Get sessions user is a member of (but doesn't own)
  const memberSessions = await prisma.session.findMany({
    where: {
      members: {
        some: { userId }
      },
      NOT: { userId } // Exclude already owned sessions
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Add isOwner flag and combine
  const ownedWithFlag = ownedSessions.map(s => ({ ...s, isOwner: true }));
  const memberWithFlag = memberSessions.map(s => ({ ...s, isOwner: false }));

  const allSessions = [...ownedWithFlag, ...memberWithFlag];

  return allSessions.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

// Helper to check if user can access session (owner or member)
const canAccessSession = async (sessionId: string, userId: string) => {
  // Check if owner
  const owned = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });
  if (owned) return owned;

  // Check if member
  const membership = await prisma.sessionMember.findUnique({
    where: {
      sessionId_userId: { sessionId, userId }
    }
  });
  if (membership) {
    return await prisma.session.findUnique({ where: { id: sessionId } });
  }

  return null;
};

export const addMessage = async (
  sessionId: string,
  userId: string,
  content: string,
  model?: string,
  apiKey?: string,
  apiEndpoint?: string
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

  return await prisma.message.findMany({
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
};

/**
 * Rename a session (only owner can rename)
 */
export const renameSession = async (sessionId: string, userId: string, title: string) => {
  // Only owner can rename
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId }
  });

  if (!session) {
    throw new Error('Session not found or access denied');
  }

  return prisma.session.update({
    where: { id: sessionId },
    data: { title: title.trim() || 'Untitled' }
  });
};

/**
 * Delete a session (only owner can delete)
 */
export const deleteSession = async (sessionId: string, userId: string) => {
  // Only owner can delete
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId }
  });

  if (!session) {
    throw new Error('Session not found or access denied');
  }

  // Delete all messages first
  await prisma.message.deleteMany({
    where: { sessionId }
  });

  // Delete session members
  await prisma.sessionMember.deleteMany({
    where: { sessionId }
  });

  // Delete the session
  return prisma.session.delete({
    where: { id: sessionId }
  });
};