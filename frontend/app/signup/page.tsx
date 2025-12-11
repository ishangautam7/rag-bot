"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import AuthInput from '../components/UI/AuthInput';
import type { AxiosError } from 'axios';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    type GoogleAccountsId = {
      initialize: (opts: { client_id: string; callback: (resp: { credential?: string }) => void }) => void;
      renderButton: (el: HTMLElement, opts: { theme?: string; size?: string; shape?: string }) => void;
    };
    type Google = { accounts: { id: GoogleAccountsId } };

    const g = (typeof window !== 'undefined') ? (window as unknown as { google?: Google }).google : undefined;
    if (!cid || !g || !googleBtnRef.current) return;

    g.accounts.id.initialize({
      client_id: cid,
      callback: async ({ credential }) => {
        try {
          if (!credential) return;
          const res = await api.post('/auth/google', { token: credential });
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          router.push('/chat');
        } catch {}
      },
    });
    g.accounts.id.renderButton(googleBtnRef.current, { theme: 'filled_blue', size: 'large', shape: 'pill' });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);
      
      // Automatically log them in after signup
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      router.push('/chat');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      const msg = axiosErr.response?.data?.error || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0f14] via-[#0f1117] to-[#0c0f14] flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-[#12161d]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-10 shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20">
            <UserPlus className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm">Get started with your AI companion today</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput 
            label="Full Name" 
            type="text" 
            placeholder="John Doe"
            value={formData.username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, username: e.target.value})}
            required
          />

          <AuthInput 
            label="Email Address" 
            type="email" 
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <AuthInput 
            label="Password" 
            type="password" 
            placeholder="••••••••"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
            required
          />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {loading ? 'Creating Account...' : 'Sign Up Free'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-gray-800 flex-1" />
          <span className="text-gray-500 text-xs uppercase">Or continue with</span>
          <div className="h-px bg-gray-800 flex-1" />
        </div>

        <div className="w-full flex items-center justify-center">
          <div ref={googleBtnRef} />
        </div>

        <p className="text-center mt-8 text-gray-400 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
