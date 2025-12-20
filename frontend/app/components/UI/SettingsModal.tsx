'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export default function SettingsModal({ isOpen, onClose, onLogout }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'account'>('general');
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        if (typeof window === 'undefined') return 'dark';
        const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
        return saved || 'dark';
    });

    useEffect(() => {
        document.documentElement.classList.toggle('light', theme === 'light');
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                    <h2 className="text-lg font-medium text-[var(--color-foreground)]">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-[var(--color-secondary)] rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--color-border)]">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'general'
                                ? 'text-[var(--color-foreground)] border-b-2 border-[var(--color-foreground)]'
                                : 'text-[var(--color-accent)] hover:text-[var(--color-foreground)]'
                            }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'account'
                                ? 'text-[var(--color-foreground)] border-b-2 border-[var(--color-foreground)]'
                                : 'text-[var(--color-accent)] hover:text-[var(--color-foreground)]'
                            }`}
                    >
                        Account
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* Theme Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-foreground)]">Theme</p>
                                    <p className="text-xs text-[var(--color-accent)]">Switch between dark and light mode</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`w-14 h-7 rounded-full relative transition-colors ${theme === 'light' ? 'bg-blue-500' : 'bg-neutral-700'
                                        }`}
                                >
                                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${theme === 'light' ? 'left-8' : 'left-1'
                                        }`}>
                                        {theme === 'light' ? (
                                            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                            </svg>
                                        )}
                                    </span>
                                </button>
                            </div>

                            {/* Notifications */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-foreground)]">Notifications</p>
                                    <p className="text-xs text-[var(--color-accent)]">Receive email notifications</p>
                                </div>
                                <button className="w-12 h-6 rounded-full bg-neutral-700 relative transition-colors">
                                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-neutral-400 transition-transform" />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-4">
                            <p className="text-[var(--color-accent)] text-sm">Manage your account settings</p>

                            <button className="w-full text-left px-4 py-3 rounded-lg bg-[var(--color-secondary)] hover:opacity-80 border border-[var(--color-border)] transition-colors">
                                <p className="text-sm font-medium text-[var(--color-foreground)]">Change Password</p>
                                <p className="text-xs text-[var(--color-accent)]">Update your password</p>
                            </button>

                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-3 rounded-lg bg-red-900/20 hover:bg-red-900/30 border border-red-800/50 transition-colors"
                            >
                                <p className="text-sm font-medium text-red-400">Sign Out</p>
                                <p className="text-xs text-red-400/70">Log out of your account</p>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
