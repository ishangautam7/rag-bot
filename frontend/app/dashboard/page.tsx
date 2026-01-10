'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/app/components/AppShell';
import Link from 'next/link';
import { Search, Plus, MessageSquare, Clock, TrendingUp, Upload, Settings, Share2, Activity, Database } from 'lucide-react';
import { getProfile, getSessions, getUsage } from '@/app/lib/api';
import { Session } from '@/app/lib/types';
import { useFreeMessageLimit } from '@/app/hooks/useFreeMessageLimit';
import SettingsModal from '@/app/components/UI/SettingsModal';

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<{ username: string; email: string } | null>(null);
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { remaining, limit } = useFreeMessageLimit();

    const filteredSessions = recentSessions.filter(s =>
        (s.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        router.push('/login');
    };

    const handleUpload = () => {
        // Mock file picker for now
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) alert(`Selected ${file.name} - Upload functionality coming next!`);
        };
        input.click();
    };

    const handleInvite = () => {
        navigator.clipboard.writeText(window.location.origin + '/signup');
        alert('Invite link copied to clipboard!');
    };

    // Auth & Data Fetching
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [profileRes, sessionsRes] = await Promise.all([
                    getProfile(),
                    getSessions()
                ]);

                setProfile(profileRes.data as any);
                setRecentSessions(sessionsRes.data.slice(0, 10)); // Fetch more to allow search
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) {
        return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#444] text-sm tracking-widest uppercase">Loading Studio...</div>;
    }

    // Sidebar Component
    const Sidebar = (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 border-b border-[#1F1F1F]">
                <h2 className="text-xs font-semibold tracking-wider text-[#666] uppercase mb-4">Dashboard</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={14} />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#111] border border-[#222] rounded-md py-2 pl-9 pr-3 text-sm text-[#DDD] focus:outline-none focus:border-[#444] placeholder-[#444] transition-colors"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <h3 className="px-3 py-2 text-[10px] font-bold text-[#444] uppercase tracking-widest mt-2">Recent Chats</h3>

                {filteredSessions.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-[#555] text-center">
                        {searchQuery ? 'No matches found' : 'No recent chats'}
                    </div>
                ) : (
                    filteredSessions.map((session) => (
                        <Link key={session.id} href={`/chat/${session.id}`}>
                            <div className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-[#111] cursor-pointer transition-colors">
                                <div className="flex items-center gap-3 w-full">
                                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[#666] group-hover:text-white transition-colors shrink-0">
                                        <MessageSquare size={14} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm text-[#CCC] group-hover:text-white transition-colors truncate block">{session.title || 'Untitled Chat'}</span>
                                        <span className="text-[10px] text-[#555]">{new Date(session.created_at || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
            <div className="p-4 border-t border-[#1F1F1F]">
                <Link href="/chat" className="w-full flex items-center justify-center gap-2 bg-white text-black py-2 rounded-md text-xs font-bold uppercase tracking-wide hover:bg-[#EEE] transition-colors">
                    <Plus size={14} /> New Project
                </Link>
            </div>
        </div>
    );

    return (
        <AppShell sidebar={Sidebar} title="Dashboard">

            <div className="max-w-5xl mx-auto">
                {/* Header & Quick Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-xl font-light text-white">Welcome back, {profile?.username || 'User'}</h2>
                        <p className="text-xs text-[#666] mt-1">Here is what's happening in your studio today.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={handleUpload} className="flex items-center gap-2 border border-[#222] bg-[#111] px-4 py-2 rounded-md text-xs font-medium text-[#BBB] hover:border-white hover:text-white transition-colors">
                            <Upload size={14} /> <span className="hidden sm:inline">Upload</span>
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 border border-[#222] bg-[#111] px-4 py-2 rounded-md text-xs font-medium text-[#BBB] hover:border-white hover:text-white transition-colors">
                            <Settings size={14} /> <span className="hidden sm:inline">Settings</span>
                        </button>
                        <button onClick={handleInvite} className="flex items-center gap-2 border border-[#222] bg-[#111] px-4 py-2 rounded-md text-xs font-medium text-[#BBB] hover:border-white hover:text-white transition-colors">
                            <Share2 size={14} /> <span className="hidden sm:inline">Invite</span>
                        </button>
                        <div className="w-px h-6 bg-[#222] mx-2"></div>
                        <Link href="/chat" className="flex items-center gap-2 bg-white text-black border border-white px-4 py-2 rounded-md text-xs font-bold hover:bg-[#DDD] transition-colors">
                            <Plus size={14} /> New Chat
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <Card
                        title="Free Messages"
                        value={`${remaining} / ${limit}`}
                        sub="Daily quota remaining"
                        icon={<Clock size={16} />}
                        gradient="from-blue-900/20 to-transparent"
                    />
                    <Card
                        title="Active Chats"
                        value={recentSessions.length.toString()}
                        sub="Total sessions"
                        icon={<MessageSquare size={16} />}
                        gradient="from-purple-900/20 to-transparent"
                    />
                    <Card
                        title="System Health"
                        value="98.2%"
                        sub="Operational"
                        icon={<Activity size={16} />}
                        gradient="from-green-900/20 to-transparent"
                    />
                    <Card
                        title="Knowledge Base"
                        value="12.4 MB"
                        sub="48 Documents"
                        icon={<Database size={16} />}
                        gradient="from-orange-900/20 to-transparent"
                    />
                </div>

                <h2 className="text-xl font-light text-white mb-6">Recent Activity</h2>
                <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden min-h-[200px]">
                    {recentSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-[#444] text-xs">
                            <MessageSquare size={24} className="mb-2 opacity-50" />
                            No activity yet. Start a new chat.
                        </div>
                    ) : (
                        recentSessions.map((session) => (
                            <Link key={session.id} href={`/chat/${session.id}`} className="block">
                                <div className="flex items-center justify-between p-4 border-b border-[#222] last:border-0 hover:bg-[#151515] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#0A0A0A] border border-[#222] flex items-center justify-center group-hover:border-white/20 transition-colors">
                                            <MessageSquare size={16} className="text-[#666] group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors">{session.title || 'Untitled Session'}</p>
                                            <p className="text-xs text-[#555]">
                                                Created • {new Date(session.created_at || Date.now()).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-[#444] font-mono hidden md:block">ID: {session.id.slice(0, 8)}</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    onLogout={handleLogout}
                />
            </div>

        </AppShell>
    );
}

function Card({ title, value, sub, icon, gradient }: { title: string, value: string, sub: string, icon?: any, gradient?: string }) {
    return (
        <div className="relative bg-[#111] border border-[#222] p-6 rounded-xl hover:border-[#444] transition-colors group overflow-hidden">
            {gradient && <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs text-[#666] font-medium uppercase tracking-widest group-hover:text-[#888] transition-colors">{title}</h3>
                    {icon && <div className="text-[#333] group-hover:text-[#666] transition-colors">{icon}</div>}
                </div>
                <div className="flex items-end justify-between">
                    <span className="text-3xl font-light text-white">{value}</span>
                    <span className="text-xs text-[#444] mb-1">{sub}</span>
                </div>
            </div>
        </div>
    )
}
