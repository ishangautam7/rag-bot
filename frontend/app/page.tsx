'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Layers, ArrowRight, Zap, Shield, Search, Upload, BarChart3, Clock, Globe, Code } from 'lucide-react';

export default function Home() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { getProfile } = await import('@/app/lib/api');
          await getProfile();
          router.push('/dashboard');
        } catch (error) {
          console.error("Token verification failed", error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-xs font-bold tracking-widest text-[#666] uppercase animate-pulse">Verifying Identity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#EDEDED] overflow-x-hidden selection:bg-white/20">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6" />
            <span className="text-sm font-semibold tracking-wide">NEXUS</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-widest uppercase text-[#888]">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/lab" className="hover:text-white transition-colors">Lab</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>

          <Link href="/login" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white hover:bg-white hover:text-black transition-all rounded-full">
            Access Beta
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none"></div>

        {/* Abstract Background Elements */}
        <motion.div style={{ y: y1 }} className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-gradient-to-r from-blue-900/10 to-purple-900/10 rounded-full blur-[100px] -z-10" />
        <motion.div style={{ y: y2 }} className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-gradient-to-l from-emerald-900/5 to-blue-900/10 rounded-full blur-[80px] -z-10" />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-7xl md:text-9xl font-bold tracking-tighter text-white mb-8"
          >
            NEXUS<span className="opacity-30">AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-[#888] font-light max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The enterprise-grade intelligence engine. <br />
            Turn your documents into <span className="text-white">verifiable answers</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/dashboard" className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Get Started <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link href="/contact" className="px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/5 transition-colors">
              Book Demo
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-[#444]">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/20 to-transparent"></div>
        </motion.div>
      </section>

      {/* Features Grid (Bento Box) */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for scale</h2>
            <p className="text-[#888] text-xl max-w-xl">Everything you need to deploy enterprise RAG systems without the complexity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Large Card */}
            <div className="md:col-span-2 row-span-2 rounded-3xl bg-[#0A0A0A] border border-white/10 p-10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-blue-400">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-3xl font-semibold mb-3">Multi-Model Intelligence</h3>
                  <p className="text-[#888] text-lg max-w-sm">Switch seamlessly between GPT-4, Claude 3, and Gemini. Optimize for cost, speed, or reasoning capabilities per query.</p>
                </div>
                {/* Visual Abstract UI */}
                <div className="w-full h-48 bg-[#111] border border-white/10 rounded-t-xl p-4 translate-y-4 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-3/4 bg-white/10 rounded-full"></div>
                    <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tall Card */}
            <div className="md:col-span-1 row-span-2 rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-purple-400">
                  <Shield size={24} />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Enterprise Security</h3>
                <p className="text-[#888]">SOC2 Type II ready. Your data acts as the context, but never leaves your control.</p>

                <div className="mt-auto pt-10 flex justify-center">
                  <div className="w-40 h-40 rounded-full border border-purple-500/20 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full border border-purple-500/40 flex items-center justify-center animate-pulse">
                      <Shield size={40} className="text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Card */}
            <div className="md:col-span-1 rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 relative group hover:border-white/20 transition-colors">
              <Upload size={32} className="mb-6 text-[#666] group-hover:text-white transition-colors" />
              <h3 className="text-xl font-semibold mb-2">Universal Ingestion</h3>
              <p className="text-[#888] text-sm">PDF, DOCX, TXT. We parse and vectorise it all instantly.</p>
            </div>

            {/* Standard Card */}
            <div className="md:col-span-1 rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 relative group hover:border-white/20 transition-colors">
              <Search size={32} className="mb-6 text-[#666] group-hover:text-white transition-colors" />
              <h3 className="text-xl font-semibold mb-2">Semantic Search</h3>
              <p className="text-[#888] text-sm">Beyond keywords. Find concepts buried deep in your archives.</p>
            </div>

            {/* Standard Card */}
            <div className="md:col-span-1 rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 relative group hover:border-white/20 transition-colors">
              <Globe size={32} className="mb-6 text-[#666] group-hover:text-white transition-colors" />
              <h3 className="text-xl font-semibold mb-2">Global CDN</h3>
              <p className="text-[#888] text-sm">Low latency access from anywhere in the world.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (Workflow) */}
      <section className="py-32 bg-[#080808] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">How Nexus Works</h2>
            <p className="text-[#888]">Simple on the surface, complex underneath.</p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -translate-y-1/2 hidden md:block"></div>

            <div className="grid md:grid-cols-4 gap-8">
              <Step number="01" title="Upload" desc="Drag & drop your knowledge base files." />
              <Step number="02" title="Vectorise" desc="AI converts text into semantic embeddings." />
              <Step number="03" title="Retrieve" desc="Relevant context is fetched in <200ms." />
              <Step number="04" title="Generate" desc="LLM synthesizes the perfect answer." />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/5 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white tracking-tight">Ready to verify?</h2>
          <p className="text-xl text-[#888] mb-12">
            Join hundreds of forward-thinking teams using NexusAI to unlock their data's potential.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link href="/signup" className="w-full md:w-auto px-10 py-5 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
              Start Free Trial
            </Link>
            <Link href="/contact" className="w-full md:w-auto px-10 py-5 border border-white/20 rounded-full hover:bg-white/5 transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#020202] py-20 text-sm">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="w-6 h-6" />
              <span className="font-bold tracking-wide">NEXUS</span>
            </div>
            <p className="text-[#666] max-w-xs">
              Designing the future of intelligent information retrieval systems.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white">Product</h4>
            <ul className="space-y-4 text-[#888]">
              <li><Link href="#" className="hover:text-white">Features</Link></li>
              <li><Link href="#" className="hover:text-white">Security</Link></li>
              <li><Link href="#" className="hover:text-white">Enterprise</Link></li>
              <li><Link href="#" className="hover:text-white">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white">Company</h4>
            <ul className="space-y-4 text-[#888]">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="#" className="hover:text-white">Careers</Link></li>
              <li><Link href="#" className="hover:text-white">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white">Legal</h4>
            <ul className="space-y-4 text-[#888]">
              <li><Link href="#" className="hover:text-white">Privacy</Link></li>
              <li><Link href="#" className="hover:text-white">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white">Social</h4>
            <div className="flex gap-4 text-[#888]">
              <Globe size={20} className="hover:text-white cursor-pointer" />
              <Code size={20} className="hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[#444] text-xs">
          <p>© 2024 NexusAI Inc. All rights reserved.</p>
          <p>Designed by Nexus Studio.</p>
        </div>
      </footer>

    </div>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">{value}</div>
      <div className="text-sm font-medium uppercase tracking-widest text-[#666]">{label}</div>
    </div>
  )
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="relative bg-[#111] border border-white/10 p-8 rounded-2xl group hover:border-white/30 transition-colors">
      <div className="text-4xl font-bold text-[#222] group-hover:text-white/10 transition-colors mb-6">{number}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-[#888] text-sm leading-relaxed">{desc}</p>
    </div>
  )
}
