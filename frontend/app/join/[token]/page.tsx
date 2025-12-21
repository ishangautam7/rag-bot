'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { joinGroup } from '@/app/lib/api';

export default function JoinGroupPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const join = async () => {
            try {
                // Check if logged in
                const authToken = localStorage.getItem('token');
                if (!authToken) {
                    // Redirect to login with return URL
                    router.push(`/login?redirect=/join/${token}`);
                    return;
                }

                const res = await joinGroup(token);
                setSessionId(res.data.sessionId);

                if (res.data.alreadyMember) {
                    setStatus('already');
                } else {
                    setStatus('success');
                }

                // Redirect to chat after a short delay
                setTimeout(() => {
                    router.push(`/chat/${res.data.sessionId}`);
                }, 2000);
            } catch (err: any) {
                setStatus('error');
                setErrorMessage(err.response?.data?.error || 'Failed to join group');
            }
        };

        if (token) join();
    }, [token, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
            <div className="text-center p-8 bg-[#141414] border border-[#222] rounded-2xl max-w-md mx-4">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Joining Group Chat...</h1>
                        <p className="text-neutral-400">Please wait while we add you to the conversation</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Welcome to the Group!</h1>
                        <p className="text-neutral-400 mb-4">You've successfully joined the conversation</p>
                        <p className="text-sm text-neutral-500">Redirecting to chat...</p>
                    </>
                )}

                {status === 'already' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Already a Member</h1>
                        <p className="text-neutral-400 mb-4">You're already part of this group chat</p>
                        <p className="text-sm text-neutral-500">Redirecting to chat...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Failed to Join</h1>
                        <p className="text-neutral-400 mb-4">{errorMessage}</p>
                        <button
                            onClick={() => router.push('/chat')}
                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                        >
                            Go to Chat
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
