'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/app/lib/api';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    useEffect(() => {
        if (!token || !email) {
            setError('Invalid reset link. Please request a new one.');
        }
    }, [token, email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await resetPassword(email, token, password);
            setMessage(res.data.message);
            setTimeout(() => router.push('/login'), 2000);
        } catch {
            setError('Failed to reset password. The link may be expired.');
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-neutral-100 mb-1">Reset Password</h1>
                    <p className="text-neutral-500">Enter your new password</p>
                </div>

                {/* Form */}
                <div className="card-modern">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input-modern"
                                minLength={8}
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-400 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input-modern"
                                required
                            />
                        </div>

                        {/* Success Message */}
                        {message && (
                            <div className="p-3 rounded-lg bg-green-900/20 border border-green-800/50">
                                <p className="text-green-400 text-sm">{message}</p>
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
                            disabled={loading || !token || !email}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-neutral-500 text-sm mt-6">
                    <Link href="/login" className="text-neutral-300 hover:text-white font-medium transition-colors">
                        Back to Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-neutral-400">Loading...</p></div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
