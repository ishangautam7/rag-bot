'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSharedChat, SharedChat } from '@/app/lib/api';
import ReactMarkdown from 'react-markdown';

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
            } catch (err: any) {
                setError(err.response?.data?.error || 'Chat not found');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchChat();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error || !chat) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] text-white">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-2xl font-bold mb-2">Chat Not Found</h1>
                <p className="text-neutral-400">{error || 'This shared chat is no longer available.'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white">
            {/* Header */}
            <header className="border-b border-[#222] bg-[#141414]">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                            {chat.user?.avatar ? (
                                <img src={chat.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                chat.user?.username?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div>
                            <h1 className="font-medium text-white">{chat.title || 'Shared Chat'}</h1>
                            <p className="text-xs text-neutral-500">
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
                                        ? 'bg-emerald-600 text-white rounded-br-md'
                                        : 'bg-[#1a1a1a] border border-[#2a2a2a] text-neutral-200 rounded-bl-md'
                                    }`}
                            >
                                {message.role === 'USER' ? (
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                ) : (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#222] bg-[#141414] py-6 mt-auto">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-neutral-500 text-sm">
                        This is a read-only shared conversation
                    </p>
                    <a
                        href="/"
                        className="inline-block mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Start Your Own Chat
                    </a>
                </div>
            </footer>
        </div>
    );
}
