'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSharedChat, SharedChat } from '@/app/lib/api';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export default function SharedChatPage() {
    const params = useParams();
    const token = params.token as string;

    const [chat, setChat] = useState<SharedChat | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const res = await getSharedChat(token);
                setChat(res.data);
            } catch (err: unknown) {
                const e = err as { response?: { data?: { error?: string } } };
                setError(e.response?.data?.error || 'Chat not found');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchChat();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
                <div className="animate-spin w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error || !chat) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] text-[var(--color-foreground)]">
                <h1 className="text-2xl font-semibold mb-2">Chat Not Found</h1>
                <p className="text-[var(--color-foreground-muted)]">{error || 'This shared chat is no longer available.'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
            {/* Header */}
            <header className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] border border-[var(--color-border)] flex items-center justify-center text-xs font-medium text-[var(--color-foreground)]">
                            {chat.user?.avatar ? (
                                <img src={chat.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                chat.user?.username?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div>
                            <h1 className="font-medium text-[var(--color-foreground)]">{chat.title || 'Shared Chat'}</h1>
                            <p className="text-xs text-[var(--color-foreground-muted)]">
                                Shared by {chat.user?.username || 'Anonymous'} • {new Date(chat.sharedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    {chat.messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] px-4 py-3 rounded-2xl ${message.role === 'USER'
                                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-br-md'
                                        : 'bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-bl-md'
                                    }`}
                            >
                                {message.role === 'USER' ? (
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                ) : (
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)] py-6 mt-auto">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-[var(--color-foreground-muted)] text-sm">
                        This is a read-only shared conversation
                    </p>
                    <Link
                        href="/"
                        className="inline-block mt-3 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-[var(--color-primary-foreground)] text-sm font-medium rounded-lg transition-colors"
                    >
                        Start Your Own Chat
                    </Link>
                </div>
            </footer>
        </div>
    );
}
