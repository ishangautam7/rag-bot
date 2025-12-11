// app/signup/page.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react'; // Changed icon to Sparkles for "New" feel
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
    // Changed theme to 'filled_black' to match dark mode better, or keep filled_blue if preferred
    g.accounts.id.renderButton(googleBtnRef.current, { theme: 'filled_black', size: 'large', shape: 'pill' });
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
    <div className="min-h-screen bg-[#0B1121] flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200 font-sans">
      
      {/* Minimalist Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Main Container */}
      <div className="w-full max-w-[400px] relative z-10">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 mb-6 shadow-sm">
            <Sparkles className="text-indigo-500" size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Create account</h1>
          <p className="text-slate-500 text-sm">Start building with your AI companion</p>
        </div>

        <div className="bg-[#151B2B] border border-slate-800/60 rounded-xl p-8 shadow-2xl shadow-black/40">
          
          {error && (
             <div className="mb-6 p-3 bg-red-950/20 border border-red-900/50 rounded-lg flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
             <span className="text-red-400 text-sm">{error}</span>
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
              label="Email" 
              type="email" 
              placeholder="name@company.com"
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-900/20 mt-2"
            >
              {loading ? 'Creating...' : 'Get Started'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Or</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <div className="w-full flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300">
            <div ref={googleBtnRef} />
          </div>
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm">
          Already a member?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}