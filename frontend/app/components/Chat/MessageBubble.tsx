'use client';

import ReactMarkdown from 'react-markdown';
import { Message } from '@/app/types';
import { RobotIcon } from '@/app/components/Icons';
import CodeBlock from '@/app/components/CodeBlock';

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
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? 'text-right' : ''}`}>
        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${isUser
          ? 'bg-neutral-100 text-neutral-900 rounded-tr-sm'
          : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm'
          }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const code = String(children).replace(/\n$/, '');

                    // If it's inline code (no language), render simple inline
                    if (!match && !code.includes('\n')) {
                      return (
                        <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-emerald-400 text-xs" {...props}>
                          {children}
                        </code>
                      );
                    }

                    // Block code with syntax highlighting
                    return <CodeBlock code={code} language={match?.[1] || 'text'} />;
                  },
                  // Style other markdown elements
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-emerald-500 pl-3 italic text-neutral-400">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <p className={`text-xs text-neutral-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
