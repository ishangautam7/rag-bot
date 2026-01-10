'use client';

import Link from 'next/link';
import { Layers, ArrowLeft, Beaker, Brain, Radio } from 'lucide-react';

export default function LabPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-[#EDEDED] font-sans">
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
                <div className="max-w-[1000px] mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-[#888] hover:text-white transition-colors">
                        <ArrowLeft size={16} />
                        <span className="text-xs uppercase tracking-widest">Back</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-[1000px] mx-auto text-center">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
                    <Beaker size={32} className="text-white" />
                </div>

                <h1 className="text-5xl font-bold tracking-tight mb-2">Nexus Lab</h1>
                <p className="text-[#888] mb-16">Experimental features available for early access testing.</p>

                <div className="grid md:grid-cols-2 gap-6 text-left">
                    <div className="bg-[#111] border border-white/10 p-8 rounded-2xl group hover:border-white/20 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <Brain className="text-purple-400" />
                            <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-[10px] uppercase font-bold tracking-wider">Alpha</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Autonomous Agents</h3>
                        <p className="text-[#888] text-sm mb-4">Agents that can browse the web, execute code, and perform multi-step reasoning tasks independently.</p>
                        <button className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/20 pb-1">Request Access</button>
                    </div>

                    <div className="bg-[#111] border border-white/10 p-8 rounded-2xl group hover:border-white/20 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <Radio className="text-green-400" />
                            <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] uppercase font-bold tracking-wider">Beta</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Voice Interface</h3>
                        <p className="text-[#888] text-sm mb-4">Real-time bi-directional voice communication with &lt;300ms latency for fluid conversations.</p>
                        <button className="text-xs font-bold uppercase tracking-widest text-white border-b border-white/20 pb-1">Request Access</button>
                    </div>
                </div>
            </main>
        </div>
    );
}
