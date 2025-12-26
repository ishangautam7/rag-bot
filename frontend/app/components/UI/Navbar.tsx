'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem('theme');
            const next = (saved === 'dark' || saved === 'light') ? (saved as 'light' | 'dark') : 'light';
            setTheme(next);
            document.documentElement.classList.toggle('dark', next === 'dark');
        } catch {
            document.documentElement.classList.toggle('dark', false);
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        try {
            localStorage.setItem('theme', next);
        } catch { /* noop */ }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-card)] border-b border-[var(--color-border)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                            <svg className="w-4 h-4 text-[var(--color-primary-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="font-semibold text-[var(--color-foreground)]">NexusAI</span>
                    </Link>

                    {/* Desktop Navigation (Chat removed) */}
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors text-sm"
                        >
                            <span suppressHydrationWarning>
                                {mounted ? (theme === 'dark' ? 'Light' : 'Dark') : 'Theme'}
                            </span>
                        </button>
                        <Link href="/login">
                            <button className="px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] rounded-lg transition-colors">
                                Sign In
                            </button>
                        </Link>
                        <Link href="/signup">
                            <button className="px-4 py-2 text-sm bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg font-medium hover:bg-[var(--color-primary-dark)] transition-colors">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                        >
                            {theme === 'dark' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] transition-colors"
                        >
                            {isOpen ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-[var(--color-card)] border-t border-[var(--color-border)]">
                    <div className="px-4 py-3 space-y-1">
                        {/* Chat link removed */}
                        <div className="pt-3 space-y-2 border-t border-[var(--color-border)]">
                            <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                                <button className="w-full text-left px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] rounded-lg">Sign In</button>
                            </Link>
                            <Link href="/signup" className="block" onClick={() => setIsOpen(false)}>
                                <button className="w-full px-3 py-2 text-sm bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg font-medium hover:bg-[var(--color-primary-dark)]">
                                    Get Started
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
