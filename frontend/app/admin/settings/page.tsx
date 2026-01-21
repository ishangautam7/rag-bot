'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface SystemSettings {
    openrouterApiKey: string | null;
    defaultModel: string;
    maxFreeMessagesPerDay: number;
    systemStatus: 'active' | 'maintenance';
    grantableModels: any[];
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [openrouterApiKey, setOpenrouterApiKey] = useState('');
    const [defaultModel, setDefaultModel] = useState('');
    const [maxFreeMessagesPerDay, setMaxFreeMessagesPerDay] = useState(50);
    const [systemStatus, setSystemStatus] = useState<'active' | 'maintenance'>('active');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const res = await axios.get('http://localhost:4000/api/admin/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            setSettings(data);
            setOpenrouterApiKey(data.openrouterApiKey || '');
            setDefaultModel(data.defaultModel);
            setMaxFreeMessagesPerDay(data.maxFreeMessagesPerDay);
            setSystemStatus(data.systemStatus);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setError('Failed to load settings');
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.put('http://localhost:4000/api/admin/settings', {
                openrouterApiKey: openrouterApiKey || null,
                defaultModel,
                maxFreeMessagesPerDay: Number(maxFreeMessagesPerDay),
                systemStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Settings updated successfully');
            fetchSettings(); // Refresh
        } catch (err: any) {
            console.error('Failed to save settings:', err);
            setError(err.response?.data?.error || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">System Settings</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 border border-green-200">
                    {success}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Main Settings Section */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b pb-2">
                            General Configuration
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    OpenRouter API Key (Admin)
                                </label>
                                <input
                                    type="password"
                                    value={openrouterApiKey}
                                    onChange={(e) => setOpenrouterApiKey(e.target.value)}
                                    placeholder="sk-or-..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    This key will be used by the Python backend for model inference if configured.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Default Model
                                </label>
                                <select
                                    value={defaultModel}
                                    onChange={(e) => setDefaultModel(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Daily Free Message Limit
                                </label>
                                <input
                                    type="number"
                                    value={maxFreeMessagesPerDay}
                                    onChange={(e) => setMaxFreeMessagesPerDay(Number(e.target.value))}
                                    min="0"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    System Status
                                </label>
                                <select
                                    value={systemStatus}
                                    onChange={(e) => setSystemStatus(e.target.value as 'active' | 'maintenance')}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="active">Active</option>
                                    <option value="maintenance">Maintenance Mode</option>
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Maintenance mode will prevent standard users from sending messages.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    Public Settings Endpoint
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                    The Python backend server uses the public settings endpoint to fetch the configuration below.
                </p>
                <div className="bg-white dark:bg-gray-900 p-3 rounded-lg font-mono text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                    GET /api/admin/settings/public
                </div>
            </div>
        </div>
    );
}
