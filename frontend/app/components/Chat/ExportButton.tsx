'use client';

import { useState } from 'react';
import { exportChat } from '@/app/lib/api';
import { DownloadIcon } from '../Icons';

interface ExportButtonProps {
    sessionId: string;
}

export default function ExportButton({ sessionId }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const handleExport = async (format: 'json' | 'md' | 'txt') => {
        setLoading(true);
        setShowDropdown(false);
        try {
            const res = await exportChat(sessionId, format);
            const blob = new Blob([res.data], { type: res.headers['content-type'] });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-${sessionId}.${format === 'md' ? 'md' : format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Failed to export chat:', error);
            alert('Failed to export chat');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-all border border-[var(--color-border)]"
                title="Export Chat"
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <DownloadIcon size={16} />
                )}
                Export
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 py-1">
                        <div className="px-3 py-2 border-b border-[var(--color-border)]">
                            <p className="text-xs font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider">Download As</p>
                        </div>
                        <button
                            onClick={() => handleExport('md')}
                            className="w-full text-left px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                        >
                            Markdown (.md)
                        </button>
                        <button
                            onClick={() => handleExport('json')}
                            className="w-full text-left px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                        >
                            JSON (.json)
                        </button>
                        <button
                            onClick={() => handleExport('txt')}
                            className="w-full text-left px-4 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                        >
                            Text (.txt)
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
