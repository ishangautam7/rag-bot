'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/app/lib/api';
import ModelSelector from '@/app/components/Chat/ModelSelector';
import { RobotIcon, CodeIcon, DocumentIcon, BugIcon, LightbulbIcon, PaperclipIcon, SparkleIcon } from '@/app/components/Icons';

const FREE_MODEL_ID = 'openrouter/auto';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState(FREE_MODEL_ID);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('selectedModel', model);
  };

  // Get API key from localStorage based on model provider
  const getApiKey = () => {
    try {
      const savedKeys = localStorage.getItem('modelApiKeys');
      if (!savedKeys) return undefined;
      const keys = JSON.parse(savedKeys);
      if (selectedModel.startsWith('gpt')) return keys.openai;
      if (selectedModel.startsWith('gemini')) return keys.google;
      return undefined; // Free models don't need API key
    } catch {
      return undefined;
    }
  };

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    try {
      const apiKey = getApiKey();
      const res = await createSession(message, selectedModel, apiKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = res.data as any;
      const sessionId = data?.session?.id || data?.id;
      if (sessionId) {
        router.push(`/chat/${sessionId}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const suggestions = [
    { icon: <CodeIcon size={18} />, title: 'Write Code', desc: 'Help me write a function' },
    { icon: <DocumentIcon size={18} />, title: 'Explain', desc: 'Break down a concept' },
    { icon: <BugIcon size={18} />, title: 'Debug', desc: 'Fix an error' },
    { icon: <LightbulbIcon size={18} />, title: 'Ideas', desc: 'Brainstorm solutions' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d]">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-lg w-full text-center">
          {/* Icon */}
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <RobotIcon size={24} className="text-white" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-white mb-1">
            How can I help?
          </h1>
          <p className="text-neutral-500 text-sm mb-6">
            Ask a question or choose a suggestion
          </p>

          {/* Suggestions */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setMessage(s.title + ': ')}
                className="text-left p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-emerald-500/30 hover:bg-[#1f1f1f] transition-all"
              >
                <div className="flex items-start gap-2">
                  <span className="text-base text-neutral-400">{s.icon}</span>
                  <div>
                    <p className="font-medium text-white text-sm">{s.title}</p>
                    <p className="text-xs text-neutral-500">{s.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* File Upload */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-4 rounded-lg border border-dashed transition-colors mb-4 ${dragActive
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
              }`}
          >
            <p className="text-neutral-500 text-xs">
              <span className="flex items-center gap-1"><PaperclipIcon size={14} className="text-neutral-500" /> <span>Drag files here</span></span>
            </p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent">
        <div className="max-w-lg mx-auto">
          {/* Input Box */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 focus-within:border-emerald-500/30 transition-colors">
            {/* Label */}
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-emerald-400 text-xs flex items-center gap-1"><SparkleIcon size={10} /> THE MESSAGE</span>
            </div>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Design a robust system architecture..."
              rows={2}
              className="w-full bg-transparent text-white placeholder-neutral-600 resize-none focus:outline-none text-sm px-2"
            />

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  compact={true}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!message.trim() || loading}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-neutral-600 text-center mt-2">
            Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
