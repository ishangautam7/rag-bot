"use client";

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Bot, Upload } from 'lucide-react';
import ChatInput from '../components/Chat/ChatInput';
import api from '../lib/api';

export default function NewChatPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleStartChat = async (message: string) => {
    try {
      // Create session with first message
      const res = await api.post('/chat/sessions', { message });
      const newSessionId = res.data.id;
      
      // Send the actual message content to trigger AI response
      await api.post('/chat/message', {
        sessionId: newSessionId,
        content: message
      });

      // Redirect to the dynamic URL
      router.refresh(); // Refresh to update sidebar in layout
      router.push(`/chat/${newSessionId}`);
      
    } catch (error) {
      console.error("Failed to start chat", error);
    }
  };

  const handleUploadClick = () => fileInputRef?.current?.click();
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post('/chat/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef?.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full px-4 md:px-8 py-4">
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center shadow-2xl mb-4">
          <Bot size={40} className="text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">How can I help you today?</h1>
        <p className="text-gray-400 max-w-md">
          I can help you write code, plan projects, or answer questions about your documents.
        </p>
      </div>

      <div className="pb-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <input ref={fileInputRef!} type="file" className="hidden" onChange={handleFileSelected} />
            <button onClick={handleUploadClick} disabled={uploading} className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-700 transition-all disabled:opacity-50 flex items-center gap-2">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
          <ChatInput onSend={handleStartChat} />
        </div>
      </div>
    </div>
  );
}
