'use client';

import { useState } from 'react';
import { exportChat } from '@/app/lib/api';

interface ExportModalProps {
    sessionId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ExportModal({ sessionId, isOpen, onClose }: ExportModalProps) {
    const [exporting, setExporting] = useState(false);
    const [format, setFormat] = useState<'json' | 'md' | 'txt'>('json');

    if (!isOpen) return null;

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await exportChat(sessionId, format);

            // Create download link
            const blob = new Blob([response.data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-export.${format === 'md' ? 'md' : format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onClose();
        } catch (e) {
            console.error('Export failed:', e);
            alert('Failed to export chat');
        } finally {
            setExporting(false);
        }
    };

    const formats = [
        { id: 'json' as const, name: 'JSON', desc: 'Machine-readable format' },
        { id: 'md' as const, name: 'Markdown', desc: 'Formatted text with headers' },
        { id: 'txt' as const, name: 'Plain Text', desc: 'Simple text format' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 max-w-sm w-full m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-white mb-4">Export Chat</h3>

                <div className="space-y-2 mb-6">
                    {formats.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFormat(f.id)}
                            className={`w-full p-3 rounded-lg border text-left transition-colors ${format === f.id
                                    ? 'border-emerald-500 bg-emerald-500/10'
                                    : 'border-[#333] hover:border-neutral-600'
                                }`}
                        >
                            <p className="text-sm font-medium text-white">{f.name}</p>
                            <p className="text-xs text-neutral-500">{f.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 border border-[#333] rounded-lg text-neutral-400 hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex-1 py-2 bg-emerald-500 rounded-lg text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                        {exporting ? 'Exporting...' : 'Export'}
                    </button>
                </div>
            </div>
        </div>
    );
}
