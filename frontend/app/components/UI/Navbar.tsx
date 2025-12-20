'use client';

import Link from 'next/link';
import { Button } from './Button';
import { Bot, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="p-2 bg-neutral-800 rounded-lg group-hover:bg-neutral-700 transition-colors">
                            <Bot className="w-5 h-5 text-neutral-300" />
                        </div>
                        <span className="text-lg font-semibold text-neutral-100">
                            Nexus<span className="text-neutral-400">AI</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
                            Features
                        </Link>
                        <Link href="/chat" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
                            Chat
                        </Link>
                        <Link href="#" className="text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
                            Pricing
                        </Link>
                    </div>

                    {/* CTA Buttons */}
                    <div className="hidden md:flex items-center space-x-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Sign In</Button>
                        </Link>
                        <Link href="/chat">
                            <Button size="sm" variant="primary">Get Started</Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors"
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-neutral-900 border-t border-neutral-800">
                    <div className="px-4 py-4 space-y-2">
                        <Link href="/" className="block px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors">
                            Features
                        </Link>
                        <Link href="/chat" className="block px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors">
                            Chat
                        </Link>
                        <Link href="#" className="block px-3 py-2 rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors">
                            Pricing
                        </Link>
                        <div className="pt-3 space-y-2 border-t border-neutral-800">
                            <Link href="/login" className="block">
                                <Button variant="ghost" className="w-full justify-center">Sign In</Button>
                            </Link>
                            <Link href="/chat" className="block">
                                <Button variant="primary" className="w-full">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
