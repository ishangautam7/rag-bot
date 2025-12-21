'use client';

import { useState, useEffect, useRef } from 'react';

interface Model {
    id: string;
    name: string;
    provider: 'openrouter' | 'google' | 'openai' | 'custom';
    requiresApiKey: boolean;
    isFree?: boolean;
}

interface CustomModel {
    id: string;
    name: string;
    provider: string;
    apiKey: string;
}

const AVAILABLE_MODELS: Model[] = [
    // Free model (no API key needed)
    { id: 'openrouter/auto', name: 'Auto (Free)', provider: 'openrouter', requiresApiKey: false, isFree: true },
    // Paid models (require API key)
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'google', requiresApiKey: true },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', requiresApiKey: true },
];

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (model: string) => void;
    compact?: boolean;
}

export default function ModelSelector({ selectedModel, onModelChange, compact = true }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
        if (typeof window === 'undefined') return {};
        try {
            const saved = localStorage.getItem('modelApiKeys');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    const [customModels, setCustomModels] = useState<CustomModel[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem('customModels');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Combine built-in and custom models
    const allModels: Model[] = [
        ...AVAILABLE_MODELS,
        ...customModels.map(cm => ({ id: cm.id, name: cm.name, provider: 'custom' as const, requiresApiKey: true }))
    ];

    const currentModel = allModels.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

    const hasApiKey = (model: Model) => {
        if (model.isFree) return true; // Free models don't need API key
        if (model.provider === 'google') return !!apiKeys.google;
        if (model.provider === 'openai') return !!apiKeys.openai;
        if (model.provider === 'custom') {
            const custom = customModels.find(cm => cm.id === model.id);
            return custom ? !!custom.apiKey : false;
        }
        return false;
    };

    const getProviderColor = (provider: string, isFree?: boolean) => {
        if (isFree) return 'bg-emerald-400';
        switch (provider) {
            case 'openrouter': return 'bg-purple-400';
            case 'google': return 'bg-blue-400';
            case 'openai': return 'bg-green-400';
            case 'custom': return 'bg-orange-400';
            default: return 'bg-neutral-400';
        }
    };

    const getProviderLabel = (provider: string, isFree?: boolean) => {
        if (isFree) return 'Free';
        switch (provider) {
            case 'openrouter': return 'OpenRouter';
            case 'google': return 'Google';
            case 'openai': return 'OpenAI';
            case 'custom': return 'Custom';
            default: return provider;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-neutral-300 transition-colors`}
            >
                <span className={`w-2 h-2 rounded-full ${getProviderColor(currentModel.provider, currentModel.isFree)}`}></span>
                <span className="truncate max-w-[120px]">{currentModel.name}</span>
                <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-neutral-800">
                        <p className="text-xs text-neutral-500 font-medium">Select Model</p>
                    </div>

                    {/* Free Models Section */}
                    <div className="p-2 border-b border-neutral-800">
                        <p className="text-xs text-emerald-400 font-medium mb-2">Free</p>
                        {allModels.filter(m => m.isFree).map((model) => {
                            const isSelected = selectedModel === model.id;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange(model.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-800 rounded-lg transition-colors ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/50' : ''}`}
                                >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getProviderColor(model.provider, model.isFree)}`}></span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${isSelected ? 'text-emerald-400 font-semibold' : 'text-neutral-200'}`}>
                                            {model.name}
                                        </p>
                                        {/* <p className="text-xs text-emerald-500">No API key needed</p> */}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Paid Models Section */}
                    <div className="max-h-48 overflow-y-auto p-2">
                        <p className="text-xs text-neutral-400 font-medium mb-2">Requires API Key</p>
                        {allModels.filter(m => !m.isFree).map((model) => {
                            const isSelected = selectedModel === model.id;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange(model.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-800 rounded-lg transition-colors ${isSelected ? 'bg-emerald-500/10 border border-emerald-500/50' : ''}`}
                                >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getProviderColor(model.provider)}`}></span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${isSelected ? 'text-emerald-400 font-semibold' : 'text-neutral-200'}`}>
                                            {model.name}
                                        </p>
                                        <p className="text-xs text-neutral-500">{getProviderLabel(model.provider)}</p>
                                    </div>
                                    {hasApiKey(model) ? (
                                        <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Key Set</span>
                                    ) : (
                                        <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">Need Key</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-2 border-t border-neutral-800">
                        <a
                            href="/profile"
                            className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Add Custom Model / API Keys
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
