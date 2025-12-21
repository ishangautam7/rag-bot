'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ChatInput from '@/app/components/Chat/ChatInput';
import MessageBubble from '@/app/components/Chat/MessageBubble';
import ShareButton from '@/app/components/Chat/ShareButton';
import { Message } from '@/app/types';
import { getMessages, sendMessage } from '@/app/lib/api';
import type { Message as BackendMessage, SendMessageResponse } from '@/app/lib/types';
import { RobotIcon } from '@/app/components/Icons';
import { useSocket } from '@/app/hooks/useSocket';

export default function ChatPage() {
  const { chatId } = useParams() as { chatId: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Handle incoming real-time messages
  const handleNewMessage = useCallback((msg: any) => {
    // Avoid duplicates
    if (msg.id && processedMessageIds.current.has(msg.id)) return;
    if (msg.id) processedMessageIds.current.add(msg.id);

    const mapped: Message = {
      id: msg.id,
      content: msg.content,
      timestamp: msg.createdAt,
      role: msg.role?.toLowerCase() as Message['role'],
    };

    setMessages(prev => {
      // Check if message already exists
      if (prev.some(m => m.id === mapped.id)) return prev;
      return [...prev, mapped];
    });
  }, []);

  // Check if session is collaborative
  const [isCollaborative, setIsCollaborative] = useState(false);

  useEffect(() => {
    // Check if this session has collaborators
    const checkCollaborative = async () => {
      try {
        const { getMembers } = await import('@/app/lib/api');
        const res = await getMembers(chatId);
        setIsCollaborative(res.data.length > 0);
      } catch {
        setIsCollaborative(false);
      }
    };
    if (chatId) checkCollaborative();
  }, [chatId]);

  // Connect to WebSocket only for collaborative sessions
  const { connected } = useSocket({
    sessionId: chatId,
    isCollaborative,
    onNewMessage: handleNewMessage,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    const load = async () => {
      try {
        const res = await getMessages(chatId);
        const data: BackendMessage[] = res.data as unknown as BackendMessage[];
        const mapped: Message[] = data.map((m) => ({
          id: m.id!,
          content: m.content,
          timestamp: m.createdAt!,
          role: m.role.toLowerCase() as Message['role'],
        }));
        // Track processed message IDs
        mapped.forEach(m => processedMessageIds.current.add(m.id));
        setMessages(mapped);
      } catch { }
    };
    load();
  }, [chatId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    setIsScrolled(element.scrollTop > 100);
  };

  const handleSendMessage = async (content: string, _files?: File[], model?: string, apiKey?: string) => {
    if (!chatId) return;

    // Don't send if no content (files are uploaded separately)
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      role: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    try {
      const res = await sendMessage(chatId, content, model, apiKey);
      const { userMessage: u, botMessage: b } = res.data as SendMessageResponse;

      // Track IDs to prevent duplicates from WebSocket
      if (u.id) processedMessageIds.current.add(u.id);
      if (b.id) processedMessageIds.current.add(b.id);

      const mappedU: Message = { id: u.id!, content: u.content, timestamp: u.createdAt!, role: u.role.toLowerCase() as Message['role'] };
      const mappedB: Message = { id: b.id!, content: b.content, timestamp: b.createdAt!, role: b.role.toLowerCase() as Message['role'] };

      setMessages((prev) => {
        // Filter out temp message and any existing duplicates
        const filtered = prev.filter(m => m.id !== userMessage.id && m.id !== u.id && m.id !== b.id);
        return [...filtered, mappedU, mappedB];
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const scrollToLatest = () => {
    scrollToBottom();
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Share Button & Live Indicator - Fixed in top right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Live indicator for collaborative sessions */}
        {connected && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        )}
        <ShareButton sessionId={chatId} />
      </div>

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto w-full px-4 py-8 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-neutral-800 border border-neutral-700 mb-4">
                  <svg className="w-7 h-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium mb-1 text-neutral-100">Start a conversation</h2>
                <p className="text-neutral-500 text-sm">Type a message below to begin</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isUser={message.role === 'user'}
                />
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <RobotIcon size={16} />
                  </div>
                  <div className="flex items-center gap-1 px-4 py-3 bg-neutral-900 rounded-lg border border-neutral-800">
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      {isScrolled && (
        <button
          onClick={scrollToLatest}
          className="fixed bottom-28 right-6 w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center hover:bg-neutral-700 transition-colors z-20"
        >
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} sessionId={chatId} />
    </div>
  );
}
