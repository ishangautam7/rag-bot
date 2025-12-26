'use client';

import ReactMarkdown from 'react-markdown';
import { Message } from '@/app/types';
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
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-slide-up`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${isUser
        ? 'bg-[var(--color-primary)] text-white'
        : 'bg-[var(--color-secondary)] text-[var(--color-foreground)]'
        }`}>
        {isUser ? 'U' : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? 'text-right' : ''}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
          ? 'bg-[var(--color-primary)] text-white rounded-tr-md'
          : 'bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-tl-md shadow-sm'
          }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const code = String(children).replace(/\n$/, '');

                    if (!match && !code.includes('\n')) {
                      return (
                        <code className="bg-[var(--color-background)] px-1.5 py-0.5 rounded-md text-[var(--color-primary)] text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }

                    return <CodeBlock code={code} language={match?.[1] || 'text'} />;
                  },
                  p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2.5 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2.5 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold mb-2.5">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2.5">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1.5">{children}</h3>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-[var(--color-border)] pl-3 italic text-[var(--color-foreground-muted)] my-2.5">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <p className={`text-[10px] text-[var(--color-foreground-muted)] mt-1.5 opacity-60 ${isUser ? 'text-right' : ''}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
