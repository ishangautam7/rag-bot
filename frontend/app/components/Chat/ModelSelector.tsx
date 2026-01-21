'use client';

import { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile, getAvailableModels } from '@/app/lib/api';

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

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (model: string) => void;
    compact?: boolean;
}

export default function ModelSelector({ selectedModel, onModelChange, compact = true }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [serverModels, setServerModels] = useState<Model[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // User Permissions
    const [userAllowedModels, setUserAllowedModels] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const profile = localStorage.getItem('userProfile');
            if (profile) {
                const parsed = JSON.parse(profile);
                return parsed.allowedModels || [];
            }
            return [];
        } catch {
            return [];
        }
    });

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

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Available Models from Server
                const modelsRes = await getAvailableModels();
                setServerModels(modelsRes.data);

                // 2. Fetch User Profile for Permissions & Preferences
                const profileRes = await getProfile();
                const userData = profileRes.data as any;

                if (userData.allowedModels) {
                    setUserAllowedModels(userData.allowedModels);
                    // Update localStorage to keep it fresh
                    const savedProfile = localStorage.getItem('userProfile');
                    const currentProfile = savedProfile ? JSON.parse(savedProfile) : {};
                    localStorage.setItem('userProfile', JSON.stringify({ ...currentProfile, allowedModels: userData.allowedModels }));
                }

                // 3. Sync Last Selected Model (if valid)
                if (userData.lastSelectedModel && userData.lastSelectedModel !== selectedModel) {
                    onModelChange(userData.lastSelectedModel);
                }
            } catch (error) {
                console.error("Failed to load models or profile", error);
            } finally {
                setIsLoading(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        loadData();

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []); // Run once on mount

    // Handle Model Selection
    const handleSelect = async (modelId: string) => {
        onModelChange(modelId);
        setIsOpen(false);
        try {
            await updateProfile({ lastSelectedModel: modelId });
        } catch (err) {
            console.error("Failed to persist model selection", err);
        }
    };

    // Combine built-in (server) and custom models
    const allModels: Model[] = [
        ...serverModels,
        ...customModels.map(cm => ({ id: cm.id, name: cm.name, provider: 'custom' as const, requiresApiKey: true }))
    ];


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

    const availableModels = allModels.filter(model => {
        if (model.isFree) {
            return userAllowedModels.includes(model.id);
        }

        const userHasApiKey = hasApiKey(model);
        const adminGrantedPermission = userAllowedModels.includes(model.id);

        return userHasApiKey || adminGrantedPermission || model.provider === 'custom';
    });

    const currentModel = selectedModel ? availableModels.find(m => m.id === selectedModel) : null;

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
                className={`flex items-center gap-2 ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} bg-[var(--color-card)] hover:bg-[var(--color-secondary)] border ${!currentModel ? 'border-amber-500/50' : 'border-[var(--color-border)]'} rounded-lg text-[var(--color-foreground)] transition-colors`}
            >
                <span className={`w-2 h-2 rounded-full ${currentModel ? getProviderColor(currentModel.provider, currentModel.isFree) : 'bg-amber-400 animate-pulse'}`}></span>
                <span className="truncate max-w-[120px]">{currentModel ? currentModel.name : 'Select Model'}</span>
                <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-foreground-muted)] font-medium">Select Model</p>
                    </div>

                    {/* Loading State */}
                    {isLoading && serverModels.length === 0 && (
                        <div className="p-4 text-center text-xs text-[var(--color-foreground-muted)]">
                            Loading models...
                        </div>
                    )}

                    {/* Free Models Section */}
                    <div className="p-2 border-b border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-primary)] font-medium mb-2">Free</p>
                        {availableModels.filter(m => m.isFree).map((model) => {
                            const isSelected = selectedModel === model.id;
                            return (
                                <button
                                    key={model.id}
                                    onClick={() => handleSelect(model.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-secondary)] rounded-lg transition-colors ${isSelected ? 'border border-[var(--color-primary)] bg-[var(--color-secondary)]' : ''}`}
                                >
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getProviderColor(model.provider, model.isFree)}`}></span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${isSelected ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-foreground)]'}`}>
                                            {model.name}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>


                    {/* Paid Models Section - Only show if there are paid models */}
                    {availableModels.filter(m => !m.isFree).length > 0 && (
                        <div className="max-h-48 overflow-y-auto p-2">
                            <p className="text-xs text-[var(--color-foreground-muted)] font-medium mb-2">Requires API Key</p>
                            {availableModels.filter(m => !m.isFree).map((model) => {
                                const isSelected = selectedModel === model.id;
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => handleSelect(model.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-secondary)] rounded-lg transition-colors ${isSelected ? 'border border-[var(--color-primary)] bg-[var(--color-secondary)]' : ''}`}
                                    >
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getProviderColor(model.provider)}`}></span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm truncate ${isSelected ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-foreground)]'}`}>
                                                {model.name}
                                            </p>
                                            <p className="text-xs text-[var(--color-foreground-muted)]">{getProviderLabel(model.provider)}</p>
                                        </div>
                                        {hasApiKey(model) ? (
                                            <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-600 rounded">Key Set</span>
                                        ) : (
                                            <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-700 rounded">{model.provider === 'custom' ? '' : 'Need Key'}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="p-2 border-t border-[var(--color-border)]">
                        <a
                            href="/profile"
                            className="flex items-center justify-center gap-2 px-3 py-2 text-xs text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] rounded-lg transition-colors"
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
