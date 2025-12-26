'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    getProfile,
    adminGetUsers,
    adminResetUsage,
    adminUpdateAllowedModels,
    adminBroadcast,
    adminGetModels,
    AdminUser,
    GrantableModel
} from '@/app/lib/api';
import { ArrowLeftIcon, ShieldIcon } from '@/app/components/Icons';

interface UserProfile {
    id: string;
    email: string;
    username: string | null;
    avatar: string | null;
    isAdmin?: boolean;
}

type TabType = 'overview' | 'users' | 'broadcast' | 'models' | 'activity' | 'metrics';

export default function AdminPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [unauthorized, setUnauthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getProfile();
                const userData = res.data as UserProfile;
                setUser(userData);
                if (!userData.isAdmin) {
                    setUnauthorized(true);
                }
            } catch {
                router.push('/login');
            }
        };
        fetchUser();
    }, [router]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <ShieldIcon size={32} className="text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">Access Denied</h2>
                    <p className="text-[var(--color-foreground-muted)] mb-6">You don&apos;t have admin access.</p>
                    <button
                        onClick={() => router.push('/chat')}
                        className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium rounded-lg transition-all"
                    >
                        Back to Chat
                    </button>
                </div>
            </div>
        );
    }

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <ChartIcon /> },
        { id: 'users', label: 'Users', icon: <UsersIcon /> },
        { id: 'broadcast', label: 'Broadcast', icon: <MailIcon /> },
        { id: 'activity', label: 'Activity', icon: <LogIcon /> },
        { id: 'metrics', label: 'Metrics', icon: <ClockIcon /> },
    ];

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Header */}
            <div className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-semibold text-[var(--color-foreground)]">Admin Dashboard</h1>
                            <p className="text-xs text-[var(--color-foreground-muted)]">Manage users, settings & more</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push('/chat')}
                        className="flex items-center gap-2 px-4 py-2 text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                        <ArrowLeftIcon size={16} />
                        <span className="text-sm">Back to Chat</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : 'border-transparent text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-6">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'broadcast' && <BroadcastTab />}
                {activeTab === 'activity' && <ActivityTab />}
                {activeTab === 'metrics' && <MetricsTab />}
            </div>
        </div>
    );
}

// ==================== OVERVIEW TAB ====================
function OverviewTab() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await adminGetUsers();
                setUsers(res.data);
            } catch (e) {
                console.error('Failed to load users:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const totalUsers = users.length;
    const admins = users.filter(u => u.isAdmin).length;
    const activeToday = users.filter(u => u.todayUsage > 0).length;
    const totalMessages = users.reduce((sum, u) => sum + (u._count?.sentMessages || 0), 0);
    const totalSessions = users.reduce((sum, u) => sum + (u._count?.sessions || 0), 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={totalUsers} icon={<UsersIcon />} color="emerald" />
                <StatCard label="Active Today" value={activeToday} icon={<ActivityIcon />} color="blue" />
                <StatCard label="Total Chats" value={totalSessions} icon={<ChatIcon />} color="purple" />
                <StatCard label="Total Messages" value={totalMessages} icon={<MessageIcon />} color="orange" />
            </div>

            {/* Recent Users */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                <h3 className="text-sm font-medium text-[var(--color-foreground)] mb-4">Recent Users</h3>
                <div className="space-y-2">
                    {users.slice(0, 5).map((u) => (
                        <div key={u.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] border border-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-foreground)]">
                                    {u.username?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm text-[var(--color-foreground)]">{u.username || u.email}</p>
                                    <p className="text-xs text-[var(--color-foreground-muted)]">{u.email}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-[var(--color-foreground-muted)]">{u._count?.sessions || 0} chats</p>
                                <p className="text-xs text-[var(--color-foreground-muted)]">Today: {u.todayUsage} msgs</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <QuickActionCard title="Export Users" description="Download user list as CSV" icon={<DownloadIcon />} onClick={() => exportUsersCSV(users)} />
                <QuickActionCard title="Send Broadcast" description="Email all users" icon={<MailIcon />} />
                <QuickActionCard title="View Logs" description="Check system activity" icon={<LogIcon />} />
            </div>
        </div>
    );
}

// ==================== USERS TAB ====================
function UsersTab() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await adminGetUsers();
                setUsers(res.data);
            } catch (e) {
                console.error('Failed to load users:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())
    );

    const handleResetUsage = async (userId: string) => {
        try {
            await adminResetUsage(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, todayUsage: 0 } : u));
            alert('Usage reset successfully!');
        } catch (e) {
            console.error('Failed to reset usage:', e);
            alert('Failed to reset usage');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="Search users by email or username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
            </div>

            {/* Users Table */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[var(--color-secondary)] text-left text-xs text-[var(--color-foreground-muted)] uppercase">
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Chats</th>
                            <th className="px-4 py-3">Today Usage</th>
                            <th className="px-4 py-3">Models</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-secondary)]">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-secondary)] border border-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-foreground)]">
                                            {u.username?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm text-[var(--color-foreground)]">{u.username || 'No name'}</p>
                                            <p className="text-xs text-[var(--color-foreground-muted)]">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {u.isAdmin ? (
                                        <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-700 text-xs rounded-full">Admin</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-[var(--color-secondary)] text-[var(--color-foreground-muted)] text-xs rounded-full">User</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-[var(--color-foreground-muted)]">{u._count?.sessions || 0}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-sm ${u.todayUsage >= 15 ? 'text-red-600' : 'text-[var(--color-foreground-muted)]'}`}>
                                        {u.todayUsage}/15
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-xs text-[var(--color-foreground-muted)]">{u.allowedModels?.length || 1} models</span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs rounded hover:bg-emerald-500/20"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleResetUsage(u.id)}
                                            className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-700 text-xs rounded hover:bg-blue-500/20"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onUpdate={(updated) => {
                        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
}

// ==================== BROADCAST TAB ====================
function BroadcastTab() {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ message: string; sent: number } | null>(null);
    const [error, setError] = useState('');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sendToAll, setSendToAll] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await adminGetUsers();
                setUsers(res.data);
            } catch (e) {
                console.error('Failed to load users:', e);
            }
        };
        load();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !content.trim()) {
            setError('Subject and content are required');
            return;
        }
        if (!sendToAll && selectedIds.length === 0) {
            setError('Select at least one user or choose Send to all');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await adminBroadcast(subject, content, sendToAll ? undefined : selectedIds);
            setResult(res.data);
            setSubject('');
            setContent('');
            setSelectedIds([]);
        } catch (e: unknown) {
            const err = e as { response?: { data?: { error?: string } } };
            setError(err.response?.data?.error || 'Failed to send broadcast');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
                <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-4">Send Broadcast Email</h3>
                <form onSubmit={handleSend} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-[var(--color-foreground-muted)]">Recipients</label>
                        <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                            <input
                                type="checkbox"
                                checked={sendToAll}
                                onChange={(e) => setSendToAll(e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--color-border)]"
                            />
                            Send to all users
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--color-foreground-muted)] mb-2">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject line"
                            className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--color-foreground-muted)] mb-2">Content (HTML supported)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="<h1>Hello!</h1><p>Your message here...</p>"
                            rows={8}
                            className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none font-mono text-sm"
                        />
                    </div>
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                    {result && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                            <p className="text-emerald-700 text-sm">{result.message}</p>
                            <p className="text-emerald-700/70 text-xs mt-1">Sent to {result.sent} users</p>
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
                    >
                        {loading ? 'Sending...' : 'Send Broadcast Email'}
                    </button>
                </form>
            </div>
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-[var(--color-foreground)]">Select Users</h4>
                    <span className="text-xs text-[var(--color-foreground-muted)]">{selectedIds.length} selected</span>
                </div>
                <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by email or username..."
                    className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-primary)] mb-3"
                />
                <div className="max-h-72 overflow-auto rounded-lg border border-[var(--color-border)]">
                    {(users || [])
                        .filter(u =>
                            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                            (u.username || '').toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .map((u) => {
                            const checked = selectedIds.includes(u.id);
                            return (
                                <label key={u.id} className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-secondary)]">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                setSelectedIds(prev => {
                                                    if (isChecked) return [...prev, u.id];
                                                    return prev.filter(id => id !== u.id);
                                                });
                                            }}
                                            className="w-4 h-4 rounded border-[var(--color-border)]"
                                        />
                                        <div>
                                            <p className="text-sm text-[var(--color-foreground)]">{u.username || 'No name'}</p>
                                            <p className="text-[var(--color-foreground-muted)] text-xs">{u.email}</p>
                                        </div>
                                    </div>
                                    {u.isAdmin && <span className="text-[var(--color-foreground-muted)] text-xs">Admin</span>}
                                </label>
                            );
                        })}
                </div>
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={() => setSelectedIds(users.map(u => u.id))}
                        className="px-3 py-2 bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-lg"
                    >
                        Select all
                    </button>
                    <button
                        onClick={() => setSelectedIds([])}
                        className="px-3 py-2 bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-lg"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==================== MODELS TAB ====================
function ModelsTab() {
    const [models, setModels] = useState<GrantableModel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await adminGetModels();
                setModels(res.data);
            } catch (e) {
                console.error('Failed to load models:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-4">Available Free Models</h3>
                <p className="text-sm text-[var(--color-foreground-muted)] mb-4">These models can be granted to users. All users have access to the default free model.</p>

                <div className="grid gap-3">
                    {models.map((model) => (
                        <div key={model.id} className="flex items-center justify-between p-3 bg-[var(--color-secondary)] rounded-lg border border-[var(--color-border)]">
                            <div>
                                <p className="text-sm font-medium text-[var(--color-foreground)]">{model.name}</p>
                                <p className="text-xs text-[var(--color-foreground-muted)]">{model.id}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs rounded-full">Free</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==================== ACTIVITY TAB ====================
function ActivityTab() {
    type ActivityLog = {
        id: string;
        user?: { email?: string } | null;
        action: string;
        createdAt: string;
    };
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const { adminGetActivity } = await import('@/app/lib/api');
                const res = await adminGetActivity({ limit: 100 });
                setLogs(res.data.logs);
            } catch (e) {
                console.error('Failed to load activity:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filteredLogs = filter
        ? logs.filter(l => l.action.toLowerCase().includes(filter.toLowerCase()))
        : logs;

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Filter by action..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[var(--color-secondary)] text-left text-xs text-[var(--color-foreground-muted)] uppercase">
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.slice(0, 50).map((log) => (
                            <tr key={log.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-secondary)]">
                                <td className="px-4 py-3 text-sm text-[var(--color-foreground)]">{log.user?.email?.split('@')[0] || 'Unknown'}</td>
                                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-700 text-xs rounded-full">{log.action}</span></td>
                                <td className="px-4 py-3 text-sm text-[var(--color-foreground-muted)]">{new Date(log.createdAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ==================== METRICS TAB ====================
function MetricsTab() {
    type Metrics = {
        avg: number;
        p50: number;
        p95: number;
        count: number;
        history: Array<{ date: string; avg: number }>;
    };
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { adminGetMetrics } = await import('@/app/lib/api');
                const res = await adminGetMetrics(7);
                setMetrics(res.data);
            } catch (e) {
                console.error('Failed to load metrics:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-foreground-muted)] mb-1">Average</p>
                    <p className="text-2xl font-bold text-[var(--color-foreground)]">{metrics?.avg || 0}ms</p>
                </div>
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-foreground-muted)] mb-1">P50</p>
                    <p className="text-2xl font-bold text-[var(--color-foreground)]">{metrics?.p50 || 0}ms</p>
                </div>
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-foreground-muted)] mb-1">P95</p>
                    <p className="text-2xl font-bold text-[var(--color-foreground)]">{metrics?.p95 || 0}ms</p>
                </div>
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-foreground-muted)] mb-1">Total</p>
                    <p className="text-2xl font-bold text-[var(--color-foreground)]">{metrics?.count || 0}</p>
                </div>
            </div>
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
                <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-4">7-Day History</h3>
                {(metrics?.history || []).map((day: { date: string; avg: number }) => (
                    <div key={day.date} className="flex items-center gap-3 py-1">
                        <span className="text-xs text-[var(--color-foreground-muted)] w-20">{day.date}</span>
                        <div className="flex-1 bg-[var(--color-border)] rounded-full h-3">
                            <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${Math.min((day.avg / 3000) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-[var(--color-foreground)] w-16 text-right">{day.avg}ms</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== HELPER COMPONENTS ====================
function UserDetailModal({ user, onClose, onUpdate }: { user: AdminUser; onClose: () => void; onUpdate: (user: AdminUser) => void }) {
    const [models, setModels] = useState<GrantableModel[]>([]);
    const [selectedModels, setSelectedModels] = useState<string[]>(user.allowedModels || ['openrouter/auto']);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        adminGetModels().then(res => setModels(res.data)).catch(console.error);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await adminUpdateAllowedModels(user.id, selectedModels);
            onUpdate(res.data.user);
        } catch (e) {
            console.error('Failed to update models:', e);
            alert('Failed to update models');
        } finally {
            setSaving(false);
        }
    };

    const toggleModel = (modelId: string) => {
        setSelectedModels(prev =>
            prev.includes(modelId)
                ? prev.filter(m => m !== modelId)
                : [...prev, modelId]
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">Edit User</h3>

                <div className="mb-4">
                    <p className="text-sm text-[var(--color-foreground-muted)]">Email</p>
                    <p className="text-[var(--color-foreground)]">{user.email}</p>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-[var(--color-foreground-muted)] mb-2">Allowed Models</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {models.map((model) => (
                            <label key={model.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-secondary)] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedModels.includes(model.id)}
                                    onChange={() => toggleModel(model.id)}
                                    className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                />
                                <span className="text-sm text-[var(--color-foreground)]">{model.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)]">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-[var(--color-primary)] rounded-lg text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    const colors: Record<string, string> = {
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
        orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[var(--color-foreground-muted)]">{icon}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-foreground)]">{value.toLocaleString()}</p>
            <p className="text-xs text-[var(--color-foreground-muted)]">{label}</p>
        </div>
    );
}

function QuickActionCard({ title, description, icon, onClick }: { title: string; description: string; icon: React.ReactNode; onClick?: () => void }) {
    return (
        <button onClick={onClick} className="text-left bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-colors">
            <div className="text-[var(--color-foreground-muted)] mb-2">{icon}</div>
            <p className="text-sm font-medium text-[var(--color-foreground)]">{title}</p>
            <p className="text-xs text-[var(--color-foreground-muted)]">{description}</p>
        </button>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}

// Export CSV helper
function exportUsersCSV(users: AdminUser[]) {
    const headers = ['ID', 'Email', 'Username', 'Admin', 'Sessions', 'Messages', 'Today Usage', 'Created'];
    const rows = users.map(u => [
        u.id,
        u.email,
        u.username || '',
        u.isAdmin ? 'Yes' : 'No',
        u._count?.sessions || 0,
        u._count?.sentMessages || 0,
        u.todayUsage,
        u.createdAt
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Icons
const ChartIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const UsersIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MailIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const RobotIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const ActivityIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const ChatIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const MessageIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
const DownloadIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const LogIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ClockIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
