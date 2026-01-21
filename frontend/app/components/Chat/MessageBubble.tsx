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
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${isUser
        ? 'bg-[var(--color-secondary)] text-[var(--color-foreground)] border border-[var(--color-border)]'
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
          ? 'bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-tr-md border border-[var(--color-border)]'
          : 'bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-tl-md shadow-sm'
          }`}>
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((file, i) => (
                <a
                  key={i}
                  href={`${file.url}${(file.url?.includes(process.env.NEXT_PUBLIC_API_URL || 'localhost:4000') || file.url?.includes('/api/')) ? `?token=${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border max-w-full transition-colors hover:opacity-80 ${isUser
                    ? 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-foreground)]'
                    : 'bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-foreground)]'
                    }`}
                  onClick={(e) => !file.url && e.preventDefault()}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser ? 'bg-[var(--color-secondary)] text-[var(--color-primary)]' : 'bg-[var(--color-secondary)] text-[var(--color-primary)]'
                    }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="truncate text-xs font-semibold">{file.name}</span>
                    <span className={`text-[10px] uppercase tracking-wide ${isUser ? 'text-[var(--color-foreground-muted)]' : 'text-[var(--color-foreground-muted)]'
                      }`}>
                      {file.type ? file.type.split('/')[1] : 'FILE'}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}

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
