'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/app/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [resetUrl, setResetUrl] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setResetUrl('');

        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }

        setLoading(true);
        try {
            const res = await forgotPassword(email);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = res.data as any;
            setMessage(data.message);
            if (data.resetUrl) {
                setResetUrl(data.resetUrl);
            }
        } catch {
            setError('Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-neutral-800 border border-neutral-700 mb-4">
                        <svg className="w-7 h-7 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-neutral-100 mb-1">Forgot Password?</h1>
                    <p className="text-neutral-500">Enter your email and we&apos;ll send you a reset link</p>
                </div>

                {/* Form */}
                <div className="card-modern">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="input-modern"
                                required
                            />
                        </div>

                        {/* Success Message */}
                        {message && (
                            <div className="p-3 rounded-lg bg-green-900/20 border border-green-800/50">
                                <p className="text-green-400 text-sm">{message}</p>
                                {resetUrl && (
                                    <a
                                        href={resetUrl}
                                        className="text-green-300 text-sm underline mt-2 block break-all"
                                    >
                                        Click here to reset (dev mode)
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/50">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-neutral-500 text-sm mt-6">
                    Remember your password?{' '}
                    <Link href="/login" className="text-neutral-300 hover:text-white font-medium transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
