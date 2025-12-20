import { prisma } from '../db';

export const createSession = async (userId: string, firstMessage?: string) => {
  const session = await prisma.session.create({
    data: {
      userId,
      title: firstMessage ? firstMessage.substring(0, 30) + '...' : 'New Chat',
    },
  });

  if (firstMessage) {
    await prisma.message.create({
      data: {
        sessionId: session.id,
        content: firstMessage,
        role: 'USER',
      },
    });
  }

  return session;
};

//history
export const getUserSessions = async (userId: string) => {
  return await prisma.session.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        take: 1, // Preview last message
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

export const addMessage = async (
  sessionId: string,
  userId: string,
  content: string,
  model?: string,
  apiKey?: string
) => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) throw new Error('Session not found or access denied');

  const userMessage = await prisma.message.create({
    data: {
      sessionId,
      content,
      role: 'USER',
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

  await prisma.session.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return { userMessage, botMessage };
};

export const getSessionMessages = async (sessionId: string, userId: string) => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) return null;

  return await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' }, // Oldest first 
  });
};