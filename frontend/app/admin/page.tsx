'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { getProfile } from '@/app/lib/api';
import { ArrowLeftIcon } from '@/app/components/Icons';

interface UserProfile {
    id: string;
    email: string;
    username: string | null;
    avatar: string | null;
    isAdmin?: boolean;
}

export default function AdminPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ message: string; recipients?: string[] } | null>(null);
    const [error, setError] = useState('');
    const [unauthorized, setUnauthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getProfile();
                const userData = res.data as UserProfile;
                setUser(userData);

                // Check admin access
                if (!userData.isAdmin) {
                    setUnauthorized(true);
                }
            } catch {
                router.push('/login');
            }
        };
        fetchUser();
    }, [router]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResult(null);

        if (!subject.trim() || !content.trim()) {
            setError('Subject and content are required');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/admin/broadcast', { subject, content });
            setResult(res.data);
            setSubject('');
            setContent('');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            setError(error.response?.data?.error || 'Failed to send broadcast');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-neutral-400">Loading...</p>
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">Access Denied</h2>
                    <p className="text-[var(--color-accent)] mb-6">You don&apos;t have permission to access the admin panel.</p>
                    <button
                        onClick={() => router.push('/chat')}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all"
                    >
                        Back to Chat
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Admin Panel</h1>
                    <p className="text-[var(--color-accent)]">Send broadcast emails to all users</p>
                </div>

                {/* Form */}
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject"
                                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-foreground)] placeholder-[var(--color-accent)] focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
                                Content (HTML supported)
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="<h1>Hello!</h1><p>Your message here...</p>"
                                rows={6}
                                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-foreground)] placeholder-[var(--color-accent)] focus:outline-none focus:border-blue-500 resize-none"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/50">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {result && (
                            <div className="p-3 rounded-lg bg-green-900/20 border border-green-800/50">
                                <p className="text-green-400 text-sm">{result.message}</p>
                                {result.recipients && result.recipients.length > 0 && (
                                    <p className="text-green-400/70 text-xs mt-1">
                                        Recipients: {result.recipients.join(', ')}
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Broadcast Email'}
                        </button>
                    </form>
                </div>

                {/* Back Link */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/chat')}
                        className="text-[var(--color-accent)] hover:text-[var(--color-foreground)] transition-colors text-sm"
                    >
                        <span className="inline-flex items-center gap-1"><ArrowLeftIcon size={14} /> Back to Chat</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
