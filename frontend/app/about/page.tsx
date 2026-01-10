'use client';

import Link from 'next/link';
import { Layers, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
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

            <main className="pt-32 pb-20 px-6 max-w-[800px] mx-auto">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                    We build tools for the <span className="text-[#444]">mind</span>.
                </h1>

                <div className="space-y-12 text-lg md:text-xl text-[#888] leading-relaxed font-light">
                    <p>
                        <strong className="text-white font-normal">NexusAI</strong> started with a simple observation:
                        Information is abundant, but verifiable answers are scarce.
                        In the age of generative AI, the challenge isn't creating content—it's trusting it.
                    </p>
                    <p>
                        Our mission is to create the world's most reliable <strong>Retrieval Augmented Generation (RAG)</strong> engine.
                        We don't just want to build a chatbot; we want to build a reasoning partner that can digest complexity
                        and output clarity.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 my-16 py-12 border-y border-white/10">
                        <div>
                            <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-4">The Problem</h3>
                            <p className="text-base">Models hallucinate. Data is siloed. Verified context is hard to retrieve at scale.</p>
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-4">The Solution</h3>
                            <p className="text-base">A vector-native architecture that treats your documents as the ground truth API for the LLM.</p>
                        </div>
                    </div>

                    <p>
                        Today, we serve thousands of users who rely on NexusAI to parse legal contracts, medical journals, and technical specs.
                        We are a small, focused team of engineers and designers obsessed with the intersection of improved UX and advanced AI.
                    </p>
                </div>
            </main>
        </div>
    );
}
