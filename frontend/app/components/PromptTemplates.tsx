'use client';

import { useState, useEffect } from 'react';
import { getTemplates, type PromptTemplate } from '@/app/lib/api';

interface PromptTemplatesProps {
    onSelect: (prompt: string) => void;
}

export default function PromptTemplates({ onSelect }: PromptTemplatesProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [templates, setTemplates] = useState<PromptTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && templates.length === 0) {
            setLoading(true);
            getTemplates()
                .then(res => setTemplates(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, templates.length]);

    const handleSelect = (template: PromptTemplate) => {
        onSelect(template.prompt);
        setIsOpen(false);
    };

    const categories = [...new Set(templates.map(t => t.category))];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
                title="Prompt Templates"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-12 left-0 w-72 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-3 border-b border-[#333]">
                            <p className="text-sm font-medium text-white">Prompt Templates</p>
                            <p className="text-xs text-neutral-500">Select a template to start</p>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {loading && (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {!loading && categories.map(cat => (
                                <div key={cat}>
                                    <p className="px-3 py-1.5 text-xs text-neutral-500 uppercase tracking-wide bg-[#141414]">
                                        {cat}
                                    </p>
                                    {templates
                                        .filter(t => t.category === cat)
                                        .map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleSelect(t)}
                                                className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors"
                                            >
                                                <p className="text-sm text-white">{t.name}</p>
                                                {t.description && (
                                                    <p className="text-xs text-neutral-500">{t.description}</p>
                                                )}
                                            </button>
                                        ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
