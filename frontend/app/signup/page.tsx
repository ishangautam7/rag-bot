'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup, googleAuth } from '@/app/lib/api';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Layers } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await signup({ username: formData.name, email: formData.email, password: formData.password });
      const data = res.data;
      if (data?.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        router.push('/chat');
      } else {
        setError('Signup failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true);
      setError('');
      const res = await googleAuth(credentialResponse.credential || '');
      const data = res.data;
      if (data?.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        router.push('/chat');
      } else {
        setError('Google sign-up failed.');
      }
    } catch {
      setError('Google sign-up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050505] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.1] pointer-events-none"></div>

      <div className="w-full max-w-sm z-10">

        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Layers className="w-6 h-6 text-white" />
            <span className="text-xl font-bold tracking-tight text-white">NexusAI</span>
          </Link>
          <h1 className="text-2xl font-light text-white mb-2">Create Account</h1>
          <p className="text-sm text-[#888]">Join the intelligent automation platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>
          <div className="space-y-1">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@company.com"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>
          <div className="space-y-1">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password (min 8 chars)"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>
          <div className="space-y-1">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm Password"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#444] focus:outline-none focus:border-white transition-colors"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/40 text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold rounded-lg py-3 text-sm hover:bg-[#DDD] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[#1F1F1F]">
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-up failed')}
              theme="filled_black"
              shape="pill"
              size="large"
              width="100%"
              text="continue_with"
            />
          </div>

          <p className="text-center text-xs text-[#666]">
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
