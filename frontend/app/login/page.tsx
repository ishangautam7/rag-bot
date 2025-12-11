"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { LogIn, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-[#0c0f14] via-[#0f1117] to-[#0c0f14] flex items-center justify-center p-4 relative">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Card */}
      <div className="w-full max-w-md bg-[#12161d]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-10 shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20">
            <LogIn className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to your RAG workspace</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-gray-800 flex-1" />
          <span className="text-gray-500 text-xs uppercase">Or continue with</span>
          <div className="h-px bg-gray-800 flex-1" />
        </div>

        {/* Google Button Placeholder */}
        <button className="w-full bg-white text-black font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-gray-100">
           <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} height={20} alt="Google" />
           Sign in with Google
        </button>

        <p className="text-center mt-8 text-gray-400 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-blue-500 hover:text-blue-400 font-medium transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
