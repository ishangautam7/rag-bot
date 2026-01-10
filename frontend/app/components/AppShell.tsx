'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutDashboard, MessageSquare, Settings, User, Bell } from 'lucide-react';
import { ReactNode } from 'react';

interface AppShellProps {
    children: ReactNode;
    sidebar?: ReactNode;
    title?: string;
}

export default function AppShell({ children, sidebar, title }: AppShellProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path || pathname?.startsWith(path + '/');
    };

    return (
        <div className="flex h-screen bg-[#050505] text-[#EDEDED] overflow-hidden font-sans">

            {/* 1. Global Navigation Rail */}
            <nav className="w-16 border-r border-[#1F1F1F] flex flex-col items-center py-6 gap-8 z-20 bg-[#050505]">
                {/* Brand */}
                <Link href="/" className="mb-2">
                    <Layers className="w-6 h-6 text-white" />
                </Link>

                {/* Nav Items */}
                <div className="flex flex-col gap-6 w-full items-center">
                    <NavItem icon={<LayoutDashboard size={20} />} href="/dashboard" active={isActive('/dashboard')} label="Dashboard" />
                    <NavItem icon={<MessageSquare size={20} />} href="/chat" active={isActive('/chat')} label="Chats" />
                    {/* Add more global nav items here if needed */}
                </div>

                <div className="mt-auto flex flex-col gap-6 w-full items-center">
                    <NavItem icon={<Settings size={20} />} href="/profile" active={isActive('/profile')} label="Settings" />
                    <NavItem icon={<User size={20} />} href="/profile" active={isActive('/profile')} label="Profile" />
                </div>
            </nav>

            {/* 2. Context Sidebar (Optional) */}
            {sidebar && (
                <aside className="w-64 border-r border-[#1F1F1F] flex flex-col bg-[#050505]">
                    {sidebar}
                </aside>
            )}

            {/* 3. Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] relative">
                {/* Header */}
                <header className="h-16 border-b border-[#1F1F1F] flex items-center justify-between px-8 bg-[#050505]">
                    <div className="flex items-center gap-4">
                        <h1 className="text-sm font-medium tracking-wide">{title || 'NexusAI'}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-[#888888] hover:text-white transition-colors">
                            <Bell size={18} />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-[#111] border border-[#333]"></div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 md:p-8">
                    {children}
                </div>
            </main>

        </div>
    );
}

function NavItem({ icon, href, active, label }: { icon: ReactNode, href: string, active: boolean, label: string }) {
    return (
        <Link href={href} className={`relative group p-2 rounded-lg transition-all duration-300 ${active ? 'text-white bg-white/10' : 'text-[#666] hover:text-[#CCC]'}`}>
            {icon}
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-[2px] w-[3px] h-8 bg-white rounded-r-full"></div>
            )}
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-2 py-1 bg-[#1A1A1A] border border-[#333] rounded text-[10px] uppercase tracking-wider text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {label}
            </div>
        </Link>
    )
}
