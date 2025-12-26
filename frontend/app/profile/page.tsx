'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/app/lib/api';
import Link from 'next/link';

interface Model {
    id: string;
    name: string;
    provider: 'openrouter' | 'google' | 'openai';
    description: string;
    isFree?: boolean;
}

const FREE_MODEL_ID = 'openrouter/auto';

const AVAILABLE_MODELS: Model[] = [
    { id: FREE_MODEL_ID, name: 'Auto', provider: 'openrouter', description: 'Uses best available free model', isFree: true },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', provider: 'google', description: 'Requires Google API key' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'Requires OpenAI API key' },
];

interface UserProfile {
    id: string;
    email: string;
    username: string | null;
    avatar: string | null;
    createdAt: string;
    isAdmin?: boolean;
}

type TabType = 'profile' | 'models' | 'api-keys' | 'about';

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [selectedModel, setSelectedModel] = useState(FREE_MODEL_ID);
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [saveMessage, setSaveMessage] = useState('');
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getProfile();
                setUser(res.data as UserProfile);
            } catch {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();

        const savedModel = localStorage.getItem('selectedModel');
        const savedKeys = localStorage.getItem('modelApiKeys');
        const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
        if (savedModel) setSelectedModel(savedModel);
        if (savedKeys) setApiKeys(JSON.parse(savedKeys));
        if (savedTheme) setTheme(savedTheme);
    }, [router]);

    const handleSaveSettings = () => {
        localStorage.setItem('selectedModel', selectedModel);
        localStorage.setItem('modelApiKeys', JSON.stringify(apiKeys));
        setSaveMessage('Saved!');
        setTimeout(() => setSaveMessage(''), 2000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
                <div className="w-6 h-6 border-2 border-[var(--color-foreground-muted)] border-t-[var(--color-foreground)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] flex">
            {/* Fixed Sidebar */}
            <div className="fixed top-0 left-0 w-48 h-screen bg-[var(--color-background)] border-r border-[var(--color-border)] flex flex-col text-sm z-40">
                {/* Back Button */}
                <Link
                    href="/chat"
                    className="flex items-center gap-2 px-4 py-3 text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] border-b border-[var(--color-border)] transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                </Link>

                {/* Menu Items */}
                <nav className="flex-1 py-2 px-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors mb-0.5 ${activeTab === 'profile'
                            ? 'text-[var(--color-foreground)] bg-[var(--color-secondary)]'
                            : 'text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profile</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('models')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors mb-0.5 ${activeTab === 'models'
                            ? 'text-[var(--color-foreground)] bg-[var(--color-secondary)]'
                            : 'text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]'
                            }`}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                        <span>Models</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('api-keys')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors mb-0.5 ${activeTab === 'api-keys'
                            ? 'text-[var(--color-foreground)] bg-[var(--color-secondary)]'
                            : 'text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>API Keys</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('about')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors mb-0.5 ${activeTab === 'about'
                            ? 'text-[var(--color-foreground)] bg-[var(--color-secondary)]'
                            : 'text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)]'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>About</span>
                    </button>
                </nav>

                {/* Bottom */}
                <div className="border-t border-[var(--color-border)] py-2 px-2">
                    {user?.isAdmin && (
                        <Link
                            href="/admin"
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Admin</span>
                        </Link>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            {theme === 'dark' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'light' ? 'bg-[var(--color-foreground)]' : 'bg-[var(--color-secondary-light)]'}`}>
                            <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-[var(--color-background)] transition-transform ${theme === 'light' ? 'left-4' : 'left-0.5'}`}></span>
                        </div>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-foreground-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Log Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto ml-48">
                <div className="max-w-2xl mx-auto w-full">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-5 animate-fade-in">
                            <h2 className="text-lg font-medium text-[var(--color-foreground)] mb-4">Profile</h2>

                            {/* User Info Card */}
                            <div className="bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-foreground)] text-xl font-medium">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            (user?.username || user?.email)?.[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[var(--color-foreground)] font-medium">{user?.username || 'User'}</p>
                                        <p className="text-[var(--color-foreground-muted)] text-sm">{user?.email}</p>
                                        <p className="text-[var(--color-foreground-muted)] text-xs mt-1 opacity-60">
                                            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                                        </p>
                                    </div>
                                    {user?.isAdmin && (
                                        <span className="px-2 py-1 bg-[var(--color-secondary)] text-[var(--color-foreground-muted)] text-xs rounded">Admin</span>
                                    )}
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
                                <h3 className="text-sm font-medium text-[var(--color-foreground)]">Account Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-[var(--color-foreground-muted)] block mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={user?.username || ''}
                                            disabled
                                            className="w-full bg-[var(--color-input)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--color-foreground-muted)] block mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full bg-[var(--color-input)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[var(--color-card-solid)] border border-red-500/20 rounded-xl p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[var(--color-foreground)] text-sm">Delete Account</p>
                                        <p className="text-[var(--color-foreground-muted)] text-xs">Permanently delete your account</p>
                                    </div>
                                    <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors border border-red-500/20">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Models Tab */}
                    {activeTab === 'models' && (
                        <ModelsTab selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
                    )}

                    {/* API Keys Tab */}
                    {activeTab === 'api-keys' && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-medium text-[var(--color-foreground)] mb-4">API Keys</h2>

                            <div className="bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--color-foreground)] text-sm">Google API Key</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${apiKeys.google ? 'bg-green-500/20 text-green-400' : 'bg-[var(--color-secondary)] text-[var(--color-foreground-muted)]'}`}>
                                        {apiKeys.google ? 'Set' : 'Not Set'}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showKeys.google ? 'text' : 'password'}
                                        value={apiKeys.google || ''}
                                        onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
                                        placeholder="Enter API key"
                                        className="w-full bg-[var(--color-input)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-border-strong)]"
                                    />
                                    <button
                                        onClick={() => setShowKeys({ ...showKeys, google: !showKeys.google })}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] text-xs"
                                    >
                                        {showKeys.google ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--color-foreground)] text-sm">OpenAI API Key</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${apiKeys.openai ? 'bg-green-500/20 text-green-400' : 'bg-[var(--color-secondary)] text-[var(--color-foreground-muted)]'}`}>
                                        {apiKeys.openai ? 'Set' : 'Not Set'}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showKeys.openai ? 'text' : 'password'}
                                        value={apiKeys.openai || ''}
                                        onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                                        placeholder="Enter API key"
                                        className="w-full bg-[var(--color-input)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-border-strong)]"
                                    />
                                    <button
                                        onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] text-xs"
                                    >
                                        {showKeys.openai ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                className="px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg transition-opacity hover:opacity-90"
                            >
                                {saveMessage || 'Save Keys'}
                            </button>
                        </div>
                    )}

                    {/* About Tab */}
                    {activeTab === 'about' && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-lg font-medium text-[var(--color-foreground)] mb-4">About</h2>

                            <div className="bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-foreground)] flex items-center justify-center">
                                        <svg className="w-5 h-5 text-[var(--color-background)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                            <path d="M2 17l10 5 10-5" />
                                            <path d="M2 12l10 5 10-5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[var(--color-foreground)] font-medium">NexusAI</p>
                                        <p className="text-[var(--color-foreground-muted)] text-xs">v1.0.0</p>
                                    </div>
                                </div>
                                <p className="text-[var(--color-foreground-muted)] text-sm">
                                    Chat with your documents using AI.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Custom Model interface
interface CustomModel {
    id: string;
    name: string;
    provider: string;
    apiKey: string;
    apiEndpoint?: string;
}

// Provider presets
const PROVIDER_PRESETS = [
    { id: 'openrouter', name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1' },
    { id: 'google', name: 'Google', endpoint: 'https://generativelanguage.googleapis.com/v1beta' },
    { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1' },
    { id: 'custom', name: 'Custom', endpoint: '' },
];

// Models Tab
function ModelsTab({ selectedModel, setSelectedModel }: { selectedModel: string; setSelectedModel: (m: string) => void }) {
    const [customModels, setCustomModels] = useState<CustomModel[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = localStorage.getItem('customModels');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('openrouter');
    const [newModel, setNewModel] = useState({
        name: '',
        modelId: '',
        apiKey: '',
        apiEndpoint: 'https://openrouter.ai/api/v1'
    });

    const handleProviderSelect = (providerId: string) => {
        setSelectedProvider(providerId);
        const preset = PROVIDER_PRESETS.find(p => p.id === providerId);
        if (preset) {
            setNewModel(prev => ({ ...prev, apiEndpoint: preset.endpoint }));
        }
    };

    const handleAddCustomModel = () => {
        if (!newModel.modelId.trim()) return;
        const provider = PROVIDER_PRESETS.find(p => p.id === selectedProvider);
        const customModel: CustomModel = {
            id: newModel.modelId.trim(),
            name: newModel.name.trim() || newModel.modelId.trim(),
            provider: provider?.name || selectedProvider,
            apiKey: newModel.apiKey.trim(),
            apiEndpoint: newModel.apiEndpoint.trim(),
        };
        const updated = [...customModels, customModel];
        setCustomModels(updated);
        localStorage.setItem('customModels', JSON.stringify(updated));
        setNewModel({ name: '', modelId: '', apiKey: '', apiEndpoint: 'https://openrouter.ai/api/v1' });
        setShowAddForm(false);
    };

    const handleDeleteCustomModel = (id: string) => {
        const updated = customModels.filter(m => m.id !== id);
        setCustomModels(updated);
        localStorage.setItem('customModels', JSON.stringify(updated));
        if (selectedModel === id) {
            setSelectedModel(FREE_MODEL_ID);
            localStorage.setItem('selectedModel', FREE_MODEL_ID);
        }
    };

    const allModels = [
        ...AVAILABLE_MODELS.map(m => ({ ...m, isCustom: false })),
        ...customModels.map(m => ({ id: m.id, name: m.name, provider: m.provider, description: `Custom`, isCustom: true, isFree: false }))
    ];

    return (
        <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-medium text-[var(--color-foreground)] mb-4">AI Models</h2>

            <div className="space-y-2">
                {allModels.map((model) => {
                    const isSelected = selectedModel === model.id;
                    return (
                        <div
                            key={model.id}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected
                                ? 'border-[var(--color-border-strong)] bg-[var(--color-secondary)]'
                                : 'border-[var(--color-border)] bg-[var(--color-card-solid)] hover:border-[var(--color-border-strong)]'
                                }`}
                        >
                            <button
                                onClick={() => {
                                    setSelectedModel(model.id);
                                    localStorage.setItem('selectedModel', model.id);
                                }}
                                className="flex items-center gap-3 flex-1"
                            >
                                <div className={`w-2 h-2 rounded-full ${model.isFree ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-foreground-muted)]'}`}></div>
                                <div className="flex-1 text-left">
                                    <p className={`text-sm ${isSelected ? 'text-[var(--color-foreground)]' : 'text-[var(--color-foreground)]'}`}>
                                        {model.name}
                                    </p>
                                    <p className="text-xs text-[var(--color-foreground-muted)]">{model.description}</p>
                                </div>
                            </button>
                            {model.isCustom && (
                                <button
                                    onClick={() => handleDeleteCustomModel(model.id)}
                                    className="p-1.5 text-[var(--color-foreground-muted)] hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add Model */}
            <div className="pt-3 border-t border-[var(--color-border)]">
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Custom Model
                    </button>
                ) : (
                    <div className="bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl p-4 space-y-4">
                        <h3 className="text-sm font-medium text-[var(--color-foreground)]">Add Model</h3>

                        <div>
                            <label className="text-xs text-[var(--color-foreground-muted)] mb-1.5 block">Provider</label>
                            <div className="flex flex-wrap gap-1.5">
                                {PROVIDER_PRESETS.map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleProviderSelect(provider.id)}
                                        className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${selectedProvider === provider.id
                                            ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]'
                                            : 'bg-[var(--color-input)] text-[var(--color-foreground-muted)] border-[var(--color-input-border)] hover:border-[var(--color-border-strong)]'
                                            }`}
                                    >
                                        {provider.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedProvider === 'custom' && (
                            <div>
                                <label className="text-xs text-[var(--color-foreground-muted)] mb-1.5 block">API Endpoint</label>
                                <input
                                    type="text"
                                    placeholder="http://localhost:11434/v1"
                                    value={newModel.apiEndpoint}
                                    onChange={(e) => setNewModel({ ...newModel, apiEndpoint: e.target.value })}
                                    className="w-full bg-[var(--color-input)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-border-strong)]"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-[var(--color-foreground-muted)] mb-1.5 block">Model ID</label>
                            <input
                                type="text"
                                placeholder="e.g., gpt-4o"
                                value={newModel.modelId}
                                onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                                className="w-full bg-[var(--color-input)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-border-strong)]"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[var(--color-foreground-muted)] mb-1.5 block">API Key</label>
                            <input
                                type="password"
                                placeholder="Your API key"
                                value={newModel.apiKey}
                                onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                                className="w-full bg-[var(--color-input)] border border-[var(--color-input-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-border-strong)]"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleAddCustomModel}
                                disabled={!newModel.modelId.trim()}
                                className="px-3 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40"
                            >
                                Add
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="px-3 py-2 bg-[var(--color-secondary)] text-[var(--color-foreground)] text-sm rounded-lg transition-colors hover:bg-[var(--color-secondary-light)]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
