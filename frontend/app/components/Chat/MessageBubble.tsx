import { User, Bot } from 'lucide-react';
import { clsx } from 'clsx';

interface MessageProps {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
}

export default function MessageBubble({ role, content }: MessageProps) {
  const isUser = role === 'USER';

  return (
    <div className={clsx(
      "flex w-full mt-4 space-x-3 max-w-3xl mx-auto",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot size={18} className="text-white" />
        </div>
      )}
      
      <div className={clsx(
        "px-5 py-3 rounded-2xl max-w-[80%] leading-relaxed shadow-lg",
        isUser 
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none"
          : "bg-gray-900 text-gray-100 rounded-bl-none border border-gray-700"
      )}>
        <p className="whitespace-pre-wrap text-sm md:text-base">{content}</p>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          <User size={18} className="text-gray-300" />
        </div>
      )}
    </div>
  );
}
