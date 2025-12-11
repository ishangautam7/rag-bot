// app/login/page.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowRight, Command } from 'lucide-react'; // Added Command icon for logo
import api from '../lib/api';
import AuthInput from '../components/UI/AuthInput';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', formData);
      
      // 1. Save Token
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // 2. Redirect to Chat
      router.push('/chat');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      const msg = axiosErr.response?.data?.error || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1121] flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Minimalist Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-950/20 to-transparent pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[400px] relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 mb-6 shadow-sm">
            <Command className="text-indigo-500" size={20} />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Welcome back</h1>
          <p className="text-slate-500 text-sm">Enter your credentials to access the workspace</p>
        </div>

        {/* Card */}
        <div className="bg-[#151B2B] border border-slate-800/60 rounded-xl p-8 shadow-2xl shadow-black/40">
          
          {error && (
            <div className="mb-6 p-3 bg-red-950/20 border border-red-900/50 rounded-lg flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthInput 
              label="Email" 
              type="email" 
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
              required
            />
            
            <div className="space-y-1">
              <AuthInput 
                label="Password" 
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                required
              />
              <div className="flex justify-end pt-1">
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Or</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Google Button - Professional Minimalist */}
          <button className="w-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
             <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={18} height={18} alt="Google" className="opacity-90" />
             Continue with Google
          </button>
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm">
          No account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}