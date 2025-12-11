import { useState, FormEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Message your AI..."
          className="w-full bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-white rounded-2xl py-4 md:py-5 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xl transition-all disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!input.trim() || disabled}
          className="absolute right-3 p-2 md:p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-700 disabled:opacity-0 disabled:pointer-events-none transition-all"
        >
          <Send size={18} />
        </button>
      </form>
      <p className="text-center text-xs text-gray-600 mt-3">
        AI can make mistakes. Check important info.
      </p>
    </div>
  );
}
