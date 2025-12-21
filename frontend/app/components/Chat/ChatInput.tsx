'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadFile } from '@/app/lib/api';
import ModelSelector from './ModelSelector';
import { PaperclipIcon } from '@/app/components/Icons';
import { useFreeMessageLimit } from '@/app/hooks/useFreeMessageLimit';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[], model?: string, apiKey?: string) => void;
  disabled?: boolean;
  sessionId?: string;
}

export default function ChatInput({ onSendMessage, disabled = false, sessionId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { remaining, isFreeModel, refreshUsage, canSendFreeMessage } = useFreeMessageLimit();

  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) setSelectedModel(savedModel);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const getApiKeyForModel = (model: string): string | undefined => {
    const savedKeys = localStorage.getItem('modelApiKeys');
    if (!savedKeys) return undefined;
    const keys = JSON.parse(savedKeys);
    if (model.startsWith('gpt')) return keys.openai;
    return keys.google;
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...newFiles]);

    if (sessionId) {
      setUploading(true);
      try {
        for (const file of newFiles) {
          await uploadFile(file, sessionId);
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
      // Check free model limit
      if (isFreeModel(selectedModel) && !canSendFreeMessage()) {
        alert('You have reached your daily limit of 15 free messages. Please try again tomorrow or switch to a paid model.');
        return;
      }

      const apiKey = getApiKeyForModel(selectedModel);
      onSendMessage(message, files, selectedModel, apiKey);

      // Refresh usage after sending
      if (isFreeModel(selectedModel)) {
        refreshUsage();
      }

      setMessage('');
      setFiles([]);
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
      className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="max-w-2xl mx-auto w-full">
        {/* File Previews */}
        {files.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1 bg-[#1a1a1a] rounded border border-[#2a2a2a] text-xs">
                <span className="text-neutral-400 truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-neutral-500 hover:text-white">×</button>
              </div>
            ))}
            {uploading && <span className="text-neutral-500 text-xs">Uploading...</span>}
          </div>
        )}

        {/* Free model limit indicator */}
        {isFreeModel(selectedModel) && (
          <div className={`text-center mb-2 text-xs ${remaining <= 3 ? 'text-orange-400' : 'text-neutral-500'}`}>
            {remaining > 0 ? (
              <span>{remaining} message{remaining !== 1 ? 's' : ''} remaining today</span>
            ) : (
              <span className="text-red-400">Daily limit reached • Switch to a paid model</span>
            )}
          </div>
        )}

        {/* Input Container */}
        <div className={`bg-[#1a1a1a] border rounded-lg p-2 transition-colors ${dragActive ? 'border-emerald-500/50' : 'border-[#2a2a2a] focus-within:border-emerald-500/30'}`}>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-white placeholder-neutral-600 resize-none focus:outline-none text-sm px-2"
            style={{ minHeight: '24px', maxHeight: '120px' }}
          />

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              {/* File Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <PaperclipIcon size={16} />
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
              disabled={!message.trim() || disabled}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
            >
              {disabled ? '...' : 'Send'}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-neutral-600 text-center mt-2">
          Enter to send • Shift+Enter for new line • Drag files to attach
        </p>
      </div>
    </div>
  );
}
