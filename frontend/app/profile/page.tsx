'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/app/lib/api';
import Link from 'next/link';
import { UserIcon, RobotIcon, KeyIcon, SettingsIcon, InfoIcon, ShieldIcon, ArrowLeftIcon } from '@/app/components/Icons';

interface Model {
    id: string;
    name: string;
    provider: 'openrouter' | 'google' | 'openai';
    description: string;
    isFree?: boolean;
}

const FREE_MODEL_ID = 'openrouter/auto';

const AVAILABLE_MODELS: Model[] = [
    // Free model (no API key needed)
    { id: FREE_MODEL_ID, name: 'Auto', provider: 'openrouter', description: 'Uses best available free model', isFree: true },
    // Paid models (require API key)
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

type TabType = 'profile' | 'models' | 'api-keys' | 'appearance' | 'about';

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('profile');
    const [selectedModel, setSelectedModel] = useState(FREE_MODEL_ID);
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [saveMessage, setSaveMessage] = useState('');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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
        document.documentElement.classList.toggle('light', newTheme === 'light');
    };

    const menuItems = [
        { id: 'profile' as TabType, label: 'Profile', icon: <UserIcon size={16} /> },
        { id: 'models' as TabType, label: 'Models', icon: <RobotIcon size={16} /> },
        { id: 'api-keys' as TabType, label: 'API Keys', icon: <KeyIcon size={16} /> },
        { id: 'appearance' as TabType, label: 'Settings', icon: <SettingsIcon size={16} /> },
        { id: 'about' as TabType, label: 'About', icon: <InfoIcon size={16} /> },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d0d0d] flex">
            {/* Slim Sidebar */}
            <div className="w-48 bg-[#141414] border-r border-[#222] flex flex-col text-sm">
                {/* Back Button */}
                <Link
                    href="/chat"
                    className="flex items-center gap-2 px-3 py-3 text-neutral-400 hover:text-white border-b border-[#222] transition-colors"
                >
                    <ArrowLeftIcon size={16} />
                    <span>Back</span>
                </Link>

                {/* Menu Items */}
                <nav className="flex-1 py-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${activeTab === item.id
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="text-sm">{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Bottom - Disconnect */}
                <div className="border-t border-[#222] py-2">
                    {user?.isAdmin && (
                        <Link
                            href="/admin"
                            className="w-full flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <ShieldIcon size={16} />
                            <span>Admin</span>
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <span className="text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-right" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
                                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
                            </svg>
                        </span>
                        <span>Log Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-medium text-white mb-4">Profile</h2>

                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-medium">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            (user?.username || user?.email)?.[0]?.toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{user?.username || 'User'}</p>
                                        <p className="text-neutral-500 text-sm">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Models Tab */}
                    {activeTab === 'models' && (
                        <ModelsTab
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                        />
                    )}

                    {/* API Keys Tab */}
                    {activeTab === 'api-keys' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-medium text-white mb-4">API Keys</h2>

                            {/* Google */}
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-400">G</span>
                                        <span className="text-white text-sm">Google API Key</span>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded ${apiKeys.google ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-500'}`}>
                                        {apiKeys.google ? 'Set' : 'Not Set'}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showKeys.google ? 'text' : 'password'}
                                        value={apiKeys.google || ''}
                                        onChange={(e) => setApiKeys({ ...apiKeys, google: e.target.value })}
                                        placeholder="sk-..."
                                        className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50"
                                    />
                                    <button
                                        onClick={() => setShowKeys({ ...showKeys, google: !showKeys.google })}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                                    >
                                        {showKeys.google ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            {/* OpenAI */}
                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-400">O</span>
                                        <span className="text-white text-sm">OpenAI API Key</span>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded ${apiKeys.openai ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-neutral-500'}`}>
                                        {apiKeys.openai ? 'Set' : 'Not Set'}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showKeys.openai ? 'text' : 'password'}
                                        value={apiKeys.openai || ''}
                                        onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                                        placeholder="sk-..."
                                        className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50"
                                    />
                                    <button
                                        onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
                                    >
                                        {showKeys.openai ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors"
                            >
                                {saveMessage || 'Save Keys'}
                            </button>
                        </div>
                    )}

                    {/* Settings/Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-medium text-white mb-4">Settings</h2>

                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm">Theme</p>
                                        <p className="text-neutral-500 text-xs">Dark / Light mode</p>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'light' ? 'bg-emerald-500' : 'bg-neutral-700'}`}
                                    >
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${theme === 'light' ? 'left-5' : 'left-0.5'}`}></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* About Tab */}
                    {activeTab === 'about' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-medium text-white mb-4">About</h2>

                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                        N
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">NexusAI</p>
                                        <p className="text-neutral-500 text-xs">v1.0.0</p>
                                    </div>
                                </div>
                                <p className="text-neutral-400 text-sm">
                                    RAG-powered AI chatbot for document conversations.
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

// Provider presets for custom models
const PROVIDER_PRESETS = [
    { id: 'openrouter', name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1' },
    { id: 'google', name: 'Google Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1beta' },
    { id: 'anthropic', name: 'Anthropic Claude', endpoint: 'https://api.anthropic.com/v1' },
    { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1' },
    { id: 'mistral', name: 'Mistral AI', endpoint: 'https://api.mistral.ai/v1' },
    { id: 'groq', name: 'Groq', endpoint: 'https://api.groq.com/openai/v1' },
    { id: 'custom', name: 'Custom / Local', endpoint: '' },
];

const LOCAL_PRESETS = [
    { name: 'Ollama', endpoint: 'http://localhost:11434/v1' },
    { name: 'vLLM', endpoint: 'http://localhost:8000/v1' },
    { name: 'LM Studio', endpoint: 'http://localhost:5000/v1' },
];

// Models Tab Component
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
        setSelectedProvider('openrouter');
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

    const getProviderColor = (provider: string, isFree?: boolean) => {
        if (isFree) return 'bg-emerald-400';
        const lower = provider.toLowerCase();
        if (lower.includes('openrouter')) return 'bg-purple-400';
        if (lower.includes('google') || lower.includes('gemini')) return 'bg-blue-400';
        if (lower.includes('openai') || lower.includes('gpt')) return 'bg-green-400';
        if (lower.includes('anthropic') || lower.includes('claude')) return 'bg-orange-400';
        if (lower.includes('mistral')) return 'bg-red-400';
        if (lower.includes('groq')) return 'bg-yellow-400';
        return 'bg-purple-400';
    };

    const allModels: { id: string; name: string; provider: string; description: string; isCustom: boolean; isFree?: boolean }[] = [
        ...AVAILABLE_MODELS.map(m => ({ ...m, isCustom: false })),
        ...customModels.map(m => ({ id: m.id, name: m.name, provider: m.provider, description: `Custom - ${m.provider}`, isCustom: true, isFree: false }))
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-medium text-white mb-4">AI Models</h2>

            {/* Built-in & Custom Models */}
            <div className="space-y-2">
                {allModels.map((model) => {
                    const isSelected = selectedModel === model.id;
                    return (
                        <div
                            key={model.id}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm ${isSelected
                                ? 'border-emerald-500/50 bg-emerald-500/10 border-l-2 border-l-emerald-500'
                                : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#3a3a3a]'
                                }`}
                        >
                            <button
                                onClick={() => {
                                    setSelectedModel(model.id);
                                    localStorage.setItem('selectedModel', model.id);
                                }}
                                className="flex items-center gap-3 flex-1"
                            >
                                <span className={`w-2 h-2 rounded-full ${getProviderColor(model.provider, model.isFree)}`}></span>
                                <div className="flex-1 text-left">
                                    <p className={`${isSelected ? 'font-semibold text-emerald-400' : 'font-medium text-neutral-300'}`}>
                                        {model.name}
                                    </p>
                                    <p className="text-xs text-neutral-500">{model.description}</p>
                                </div>
                            </button>
                            {model.isCustom && (
                                <button
                                    onClick={() => handleDeleteCustomModel(model.id)}
                                    className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                                    title="Delete custom model"
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

            {/* Add Custom Model Section */}
            <div className="pt-4 border-t border-[#2a2a2a]">
                {!showAddForm ? (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-emerald-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Custom Model
                    </button>
                ) : (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 space-y-4">
                        <h3 className="text-sm font-medium text-white">Add Model</h3>

                        {/* Provider Selection */}
                        <div>
                            <label className="text-xs text-neutral-400 mb-2 block">PROVIDER</label>
                            <div className="flex flex-wrap gap-2">
                                {PROVIDER_PRESETS.map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleProviderSelect(provider.id)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${selectedProvider === provider.id
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-[#0d0d0d] text-neutral-400 border-[#2a2a2a] hover:border-neutral-500'
                                            }`}
                                    >
                                        {provider.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom API Endpoint (shown for custom/local) */}
                        {selectedProvider === 'custom' && (
                            <div>
                                <label className="text-xs text-neutral-400 mb-2 block flex items-center gap-1">
                                    <span className="text-emerald-400">⊕</span> CUSTOM API ENDPOINT
                                </label>
                                <input
                                    type="text"
                                    placeholder="http://localhost:11434/v1"
                                    value={newModel.apiEndpoint}
                                    onChange={(e) => setNewModel({ ...newModel, apiEndpoint: e.target.value })}
                                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 mb-2"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {LOCAL_PRESETS.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => setNewModel({ ...newModel, apiEndpoint: preset.endpoint })}
                                            className="px-2 py-1 text-xs bg-[#0d0d0d] text-neutral-500 border border-[#2a2a2a] rounded hover:border-neutral-500 transition-colors"
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Model ID */}
                        <div>
                            <label className="text-xs text-neutral-400 mb-2 block">MODEL ID</label>
                            <input
                                type="text"
                                placeholder={selectedProvider === 'openrouter' ? 'e.g., anthropic/claude-3-opus' : 'e.g., gpt-4o, claude-3-opus'}
                                value={newModel.modelId}
                                onChange={(e) => setNewModel({ ...newModel, modelId: e.target.value })}
                                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        {/* Display Name (optional) */}
                        <div>
                            <label className="text-xs text-neutral-400 mb-2 block">DISPLAY NAME (optional)</label>
                            <input
                                type="text"
                                placeholder="Friendly name for the model"
                                value={newModel.name}
                                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        {/* API Key */}
                        <div>
                            <label className="text-xs text-neutral-400 mb-2 block">API KEY</label>
                            <input
                                type="password"
                                placeholder="Your API key"
                                value={newModel.apiKey}
                                onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleAddCustomModel}
                                disabled={!newModel.modelId.trim()}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Model
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewModel({ name: '', modelId: '', apiKey: '', apiEndpoint: 'https://openrouter.ai/api/v1' });
                                    setSelectedProvider('openrouter');
                                }}
                                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-medium rounded transition-colors"
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


