"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import api from '../../lib/api';
import ChatInput from '../../components/Chat/ChatInput';
import MessageBubble from '../../components/Chat/MessageBubble';
import { Loader2 } from 'lucide-react';
import { Upload } from 'lucide-react';

type ChatMessage = { role: 'USER' | 'ASSISTANT' | 'SYSTEM'; content: string };

export default function ChatSessionPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Messages when URL changes
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chat/sessions/${chatId}`);
        setMessages(res.data);
      } catch (error) {
        console.error("Failed to load chat", error);
      } finally {
        setLoading(false);
      }
    };

    if (chatId) fetchMessages();
  }, [chatId]);

  // 2. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // 3. Handle Send
  const handleSendMessage = async (content: string) => {
    // Optimistic Update (Show user message immediately)
    const tempUserMsg = { role: 'USER' as const, content };
    setMessages(prev => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await api.post('/chat/message', {
        sessionId: chatId,
        content
      });

      // Update with real response (User + Bot)
      // Since our backend returns both, we append the Bot one
      setMessages(prev => [...prev, res.data.botMessage]);
    } catch (error) {
      console.error("Failed to send", error);
      // Optional: Add error toast here
    } finally {
      setSending(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('sessionId', String(chatId));
      await api.post('/chat/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages(prev => [...prev, { role: 'SYSTEM', content: `Uploaded file: ${file.name}` }]);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-4 md:px-8 py-4">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-6 pb-4 max-w-5xl mx-auto w-full p-4 md:p-6 rounded-2xl bg-[#0f1117]/60 border border-gray-800">
          {messages.map((msg, i) => (
            <MessageBubble key={i} role={msg.role} content={msg.content} />
          ))}
          
          {/* Loading Indicator for Bot Response */}
          {sending && (
            <div className="flex w-full mt-4 space-x-3 max-w-3xl mx-auto justify-start animate-pulse">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
              </div>
              <div className="px-4 py-2 bg-gray-800 rounded-2xl rounded-bl-none border border-gray-700">
                <span className="text-gray-400 text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="pb-6 bg-gradient-to-t from-[#0f1117] via-[#0f1117] to-transparent pt-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
            <button onClick={handleUploadClick} disabled={uploading} className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center gap-2">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
          <ChatInput onSend={handleSendMessage} disabled={sending} />
        </div>
      </div>
    </div>
  );
}
