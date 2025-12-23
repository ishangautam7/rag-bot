'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchChats, type SearchResult } from '@/app/lib/api';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setResults(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (!query.trim()) {
            setResults(null);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await searchChats(query);
                setResults(res.data);
            } catch (e) {
                console.error('Search failed:', e);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (sessionId: string) => {
        router.push(`/chat/${sessionId}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-xl bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-[#333]">
                    <SearchIcon />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search chats and messages..."
                        className="flex-1 bg-transparent text-white placeholder-neutral-500 outline-none text-sm"
                    />
                    <kbd className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-xs rounded">Esc</kbd>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && results && (
                        <>
                            {/* Session Results */}
                            {results.sessions.length > 0 && (
                                <div className="p-2">
                                    <p className="text-xs text-neutral-500 px-2 mb-1">Chats</p>
                                    {results.sessions.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleSelect(s.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left"
                                        >
                                            <ChatIcon />
                                            <span className="text-sm text-white truncate">{s.title || 'Untitled'}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Message Results */}
                            {results.messages.length > 0 && (
                                <div className="p-2 border-t border-[#333]">
                                    <p className="text-xs text-neutral-500 px-2 mb-1">Messages</p>
                                    {results.messages.slice(0, 5).map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => handleSelect(m.session.id)}
                                            className="w-full px-3 py-2 rounded-lg hover:bg-white/5 text-left"
                                        >
                                            <p className="text-xs text-neutral-500">{m.session.title || 'Untitled'}</p>
                                            <p className="text-sm text-neutral-300 truncate">{m.content}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.sessions.length === 0 && results.messages.length === 0 && (
                                <div className="py-8 text-center text-neutral-500 text-sm">
                                    No results found
                                </div>
                            )}
                        </>
                    )}

                    {!loading && !results && query.trim() === '' && (
                        <div className="py-8 text-center text-neutral-500 text-sm">
                            Type to search chats and messages
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const SearchIcon = () => (
    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ChatIcon = () => (
    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);
