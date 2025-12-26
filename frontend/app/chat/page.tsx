'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSession } from '@/app/lib/api';
import ModelSelector from '@/app/components/Chat/ModelSelector';
import { RobotIcon, CodeIcon, DocumentIcon, BugIcon, LightbulbIcon, PaperclipIcon, SparkleIcon } from '@/app/components/Icons';
import { useFreeMessageLimit } from '@/app/hooks/useFreeMessageLimit';

const FREE_MODEL_ID = 'openrouter/auto';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState(FREE_MODEL_ID);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { remaining, isFreeModel, refreshUsage, canSendFreeMessage } = useFreeMessageLimit();

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
      // Check custom models first
      const customModels = localStorage.getItem('customModels');
      if (customModels) {
        const customs = JSON.parse(customModels);
        const custom = customs.find((c: any) => c.id === selectedModel);
        if (custom?.apiKey) return custom.apiKey;
      }
      // Fall back to global keys
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

  // Get API endpoint for custom models
  const getApiEndpoint = (): string | undefined => {
    try {
      const customModels = localStorage.getItem('customModels');
      if (customModels) {
        const customs = JSON.parse(customModels);
        const custom = customs.find((c: any) => c.id === selectedModel);
        if (custom?.apiEndpoint) return custom.apiEndpoint;
      }
      return undefined;
    } catch {
      return undefined;
    }
  };

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    // Check free model limit
    if (isFreeModel(selectedModel) && !canSendFreeMessage()) {
      alert('You have reached your daily limit of 15 free messages. Please try again tomorrow or switch to a paid model.');
      return;
    }

    setLoading(true);
    try {
      const apiKey = getApiKey();
      const apiEndpoint = getApiEndpoint();
      const res = await createSession(message, selectedModel, apiKey, apiEndpoint);
      const data = res.data as any;
      const sessionId = data?.session?.id || data?.id;
      if (sessionId) {
        // Refresh usage if free model
        if (isFreeModel(selectedModel)) {
          refreshUsage();
        }
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
    <div className="h-full flex flex-col bg-[var(--color-background-secondary)]">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-lg w-full text-center">
          {/* Icon */}
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-secondary)] border border-[var(--color-border)]">
            <svg className="w-6 h-6 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)] mb-1">
            How can I help?
          </h1>
          <p className="text-[var(--color-foreground-muted)] text-sm mb-6">
            Ask a question or choose a suggestion
          </p>

          {/* Suggestions */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setMessage(s.title + ': ')}
                className="text-left p-3 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] hover:bg-[var(--color-secondary)] transition-all"
              >
                <div className="flex items-start gap-2">
                  <span className="text-base text-[var(--color-foreground-muted)]">{s.icon}</span>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)] text-sm">{s.title}</p>
                    <p className="text-xs text-[var(--color-foreground-muted)]">{s.desc}</p>
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
            className={`p-4 rounded-xl border border-dashed transition-colors mb-4 ${dragActive
              ? 'border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
              }`}
          >
            <p className="text-[var(--color-foreground-muted)] text-xs">
              <span className="flex items-center gap-1"><PaperclipIcon size={14} className="text-[var(--color-foreground-muted)]" /> <span>Drag files here</span></span>
            </p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)] to-transparent">
        <div className="max-w-lg mx-auto">
          {/* Free model limit indicator */}
          {isFreeModel(selectedModel) && (
            <div className={`text-center mb-2 text-xs ${remaining <= 3 ? 'text-amber-600' : 'text-[var(--color-foreground-muted)]'}`}>
              {remaining > 0 ? (
                <span>{remaining} message{remaining !== 1 ? 's' : ''} remaining today</span>
              ) : (
                <span className="text-red-600">Daily limit reached • Switch to a paid model</span>
              )}
            </div>
          )}
          {/* Input Box */}
          <div className="bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl p-2 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10 transition-colors">
            {/* Label */}
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-[var(--color-primary)] text-xs flex items-center gap-1"><SparkleIcon size={10} /> THE MESSAGE</span>
            </div>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Design a robust system architecture..."
              rows={2}
              className="w-full bg-transparent text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] resize-none focus:outline-none text-sm px-2"
            />

            {/* Bottom Row */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)]">
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
                className="px-4 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>

          <p className="text-[10px] text-[var(--color-foreground-muted)] text-center mt-2">
            Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
