'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadFile } from '@/app/lib/api';
import ModelSelector from './ModelSelector';
import { useFreeMessageLimit } from '@/app/hooks/useFreeMessageLimit';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[], model?: string, apiKey?: string, apiEndpoint?: string, uploadedFiles?: { name: string; url: string; type: string }[]) => void;
  disabled?: boolean;
  sessionId?: string;
  onUploadComplete?: (filename: string) => void;
}

export default function ChatInput({ onSendMessage, disabled = false, sessionId, onUploadComplete }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showModelPrompt, setShowModelPrompt] = useState(false);

  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel') || '';
    }
    return '';
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { remaining, isFreeModel, refreshUsage, canSendFreeMessage } = useFreeMessageLimit();

  useEffect(() => {
    if (!selectedModel) {
      setShowModelPrompt(true);
    } else {
      setShowModelPrompt(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const getApiKeyForModel = (model: string): string | undefined => {
    const customModels = localStorage.getItem('customModels');
    if (customModels) {
      const customs = JSON.parse(customModels);
      const custom = customs.find((c: any) => c.id === model);
      if (custom?.apiKey) return custom.apiKey;
    }
    const savedKeys = localStorage.getItem('modelApiKeys');
    if (!savedKeys) return undefined;
    const keys = JSON.parse(savedKeys);
    if (model.startsWith('gpt')) return keys.openai;
    return keys.google;
  };

  const getApiEndpointForModel = (model: string): string | undefined => {
    const customModels = localStorage.getItem('customModels');
    if (customModels) {
      const customs = JSON.parse(customModels);
      const custom = customs.find((c: any) => c.id === model);
      if (custom?.apiEndpoint) return custom.apiEndpoint;
    }
    return undefined;
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...newFiles]);

    if (sessionId) {
      setUploading(true);
      try {
        for (const file of newFiles) {
          const res = await uploadFile(file, sessionId);
          if (res.data && res.data.file) {
            setUploadedFiles(prev => [...prev, {
              name: file.name,
              type: file.type,
              url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/chat/files/${res.data.file.filename}`
            }]);
          }
          if (onUploadComplete) onUploadComplete(file.name);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
      }
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
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (message.trim()) {
      if (!selectedModel) {
        setShowModelPrompt(true);
        return;
      }

      if (isFreeModel(selectedModel) && !canSendFreeMessage()) {
        alert('You have reached your daily limit of 15 free messages. Please try again tomorrow or switch to a model with your API key.');
        return;
      }

      const apiKey = getApiKeyForModel(selectedModel);
      const apiEndpoint = getApiEndpointForModel(selectedModel);
      onSendMessage(message, files, selectedModel, apiKey, apiEndpoint, uploadedFiles);

      if (isFreeModel(selectedModel)) {
        refreshUsage();
      }


      setMessage('');
      setFiles([]);
      setUploadedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('selectedModel', model);
  };

  return (
    <div
      className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)] to-transparent mobile-safe-bottom"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="max-w-2xl mx-auto w-full">
        {/* Model Selection Prompt Toast */}
        {showModelPrompt && (
          <div className="mb-3 flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="flex-1 text-sm">Please select a model from the dropdown below to start chatting.</p>
            <button
              onClick={() => setShowModelPrompt(false)}
              className="p-1 hover:bg-amber-500/20 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--color-secondary)] rounded-lg border border-[var(--color-border)] text-xs">
                <span className="text-[var(--color-foreground)] truncate max-w-[100px]">{file.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {uploading && (
              <span className="text-[var(--color-foreground-muted)] text-xs py-1.5">Uploading...</span>
            )}
          </div>
        )}

        {/* Free model limit indicator */}
        {isFreeModel(selectedModel) && (
          <div className={`text-center mb-2 text-xs ${remaining <= 3 ? 'text-amber-600' : 'text-[var(--color-foreground-muted)]'}`}>
            {remaining > 0 ? (
              <span>{remaining} message{remaining !== 1 ? 's' : ''} remaining today</span>
            ) : (
              <span className="text-red-600">Daily limit reached</span>
            )}
          </div>
        )}

        {/* Input Container */}
        <div className={`bg-[var(--color-card-solid)] border rounded-xl p-2.5 transition-all shadow-sm ${dragActive ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10'}`}>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] resize-none focus:outline-none text-sm px-1"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-1.5">
              {/* File Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-[var(--color-foreground-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {/* Model Selector */}
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                compact={true}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!message.trim() || disabled || uploading}
              className="px-3 py-1.5 bg-[var(--color-primary)] text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium rounded-lg transition-colors hover:bg-[var(--color-primary-dark)] flex items-center gap-1.5"
            >
              {disabled ? (
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>

        <p className="text-[10px] text-[var(--color-foreground-muted)] text-center mt-2 opacity-50">
          Enter to send | Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
