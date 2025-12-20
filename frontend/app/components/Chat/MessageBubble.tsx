'use client';

import { Message } from '@/app/types';
import { RobotIcon } from '@/app/components/Icons';

interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
}

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isUser
        ? 'bg-neutral-700 text-neutral-300'
        : 'bg-neutral-800 text-neutral-400'
        }`}>
        {isUser ? 'U' : <RobotIcon size={16} />}
      </div>

      {/* Message Content */}
      <div className={`max-w-[75%] ${isUser ? 'text-right' : ''}`}>
        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${isUser
          ? 'bg-neutral-100 text-neutral-900 rounded-tr-sm'
          : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm'
          }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className={`text-xs text-neutral-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
