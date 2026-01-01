'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ChatInput from '@/app/components/Chat/ChatInput';
import MessageBubble from '@/app/components/Chat/MessageBubble';
import ShareButton from '@/app/components/Chat/ShareButton';
import ExportButton from '@/app/components/Chat/ExportButton';
import { Message } from '@/app/types';
import { getMessages, sendMessage, getDocuments } from '@/app/lib/api';
import type { Message as BackendMessage, SendMessageResponse } from '@/app/lib/types';
// Removed RobotIcon for a cleaner typing indicator
import { useSocket } from '@/app/hooks/useSocket';

export default function ChatPage() {
  const { chatId } = useParams() as { chatId: string };
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<{ id: number; filename: string }[]>([]); // Documents state
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

        // Load documents
        try {
          const docsRes = await getDocuments(chatId);
          setDocuments(docsRes.data);
        } catch { }
      } catch { }
    };
    load();
  }, [chatId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    setIsScrolled(element.scrollTop > 100);
  };

  const handleUploadComplete = (filename: string) => {
    // Refresh documents list
    if (chatId) {
      getDocuments(chatId).then(res => setDocuments(res.data)).catch(() => { });
    }
  };

  const handleSendMessage = async (content: string, _files?: File[], model?: string, apiKey?: string, apiEndpoint?: string, uploadedFiles?: { name: string; url: string; type: string }[]) => {
    if (!chatId) return;

    // Don't send if no content (files are uploaded separately)
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date().toISOString(),
      role: 'user',
      attachments: uploadedFiles?.map(f => ({ name: f.name, type: f.type, url: f.url })) || [],
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    try {
      const res = await sendMessage(chatId, content, model, apiKey, apiEndpoint, uploadedFiles);
      const { userMessage: u, botMessage: b } = res.data as SendMessageResponse;

      // Track IDs to prevent duplicates from WebSocket
      if (u.id) processedMessageIds.current.add(u.id);
      if (b.id) processedMessageIds.current.add(b.id);

      if (b.id) processedMessageIds.current.add(b.id);

      const mappedU: Message = {
        id: u.id!,
        content: u.content,
        timestamp: u.createdAt!,
        role: u.role.toLowerCase() as Message['role'],
        attachments: userMessage.attachments
      };
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
    <div className="h-full flex flex-col relative bg-[var(--color-background-secondary)]">
      {/* Share Button & Live Indicator - Fixed in top right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Live indicator for collaborative sessions */}
        {connected && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Live</span>
          </div>
        )}
        <ExportButton sessionId={chatId} />
      </div>

      {/* Context Files - Pinned to top */}
      {documents.length > 0 && (
        <div className="w-full bg-[var(--color-background)] border-b border-[var(--color-border)] px-4 py-2 z-10 shrink-0">
          <div className="max-w-3xl mx-auto">
            <h4 className="text-[10px] font-medium text-[var(--color-foreground-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              Context Files ({documents.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={`http://localhost:4000/api/chat/files/${doc.filename}?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)] transition-all group no-underline"
                >
                  <div className="w-5 h-5 rounded bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <span className="text-xs font-medium text-[var(--color-foreground)] truncate max-w-[150px]" title={doc.filename}>{doc.filename}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

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
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-secondary)] border border-[var(--color-border)] mb-4">
                  <svg className="w-7 h-7 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-foreground)]">Start a conversation</h2>
                <p className="text-[var(--color-foreground-muted)] text-sm">Type a message below to begin</p>
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
                <div className="w-fit flex items-center gap-2 px-4 py-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-foreground-muted)] animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-[var(--color-foreground-muted)] animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-[var(--color-foreground-muted)] animate-bounce" style={{ animationDelay: '0.3s' }}></div>
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
          className="fixed bottom-28 right-6 w-10 h-10 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-secondary)] transition-colors z-20 shadow-sm"
        >
          <svg className="w-5 h-5 text-[var(--color-foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} sessionId={chatId} onUploadComplete={handleUploadComplete} />
    </div>
  );
}
