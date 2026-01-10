'use client';

import Link from 'next/link';
import { Layers, ArrowLeft, Mail, MapPin } from 'lucide-react';

export default function ContactPage() {
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

            <main className="pt-32 pb-20 px-6 max-w-[1000px] mx-auto">
                <div className="grid md:grid-cols-2 gap-20">
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight mb-6">Get in touch</h1>
                        <p className="text-[#888] mb-12 text-lg">
                            Interested in enterprise plans or have a technical question?
                            Fill out the form and our team will get back to you within 24 hours.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-white border border-[#222]">
                                    <Mail size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Email</h3>
                                    <p className="text-[#888]">isangautam@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center text-white border border-[#222]">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest mb-1">Studio</h3>
                                    <p className="text-[#888]">Balkhu, Kathmandu</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="First Name" className="w-full bg-[#111] border border-[#222] rounded-lg p-4 focus:border-white focus:outline-none transition-colors" />
                            <input type="text" placeholder="Last Name" className="w-full bg-[#111] border border-[#222] rounded-lg p-4 focus:border-white focus:outline-none transition-colors" />
                        </div>
                        <input type="email" placeholder="Email" className="w-full bg-[#111] border border-[#222] rounded-lg p-4 focus:border-white focus:outline-none transition-colors" />
                        <textarea placeholder="Message" rows={5} className="w-full bg-[#111] border border-[#222] rounded-lg p-4 focus:border-white focus:outline-none transition-colors resize-none"></textarea>

                        <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-[#DDD] transition-colors">
                            Send Message
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
