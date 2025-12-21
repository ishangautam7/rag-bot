'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api, { getProfile } from '@/app/lib/api';
import type { Session } from '@/app/lib/types';
import { ShieldIcon, RobotIcon, SettingsIcon, LogoutIcon, PlusIcon, CloseIcon } from '@/app/components/Icons';

interface SideBarProps {
  sidebarOpen: boolean;
  onClose?: () => void;
}

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  isPublic?: boolean;
  isGroupChat?: boolean;
  isOwner?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar: string | null;
  createdAt: string;
  isAdmin?: boolean;
}

export default function SideBar({ sidebarOpen, onClose }: SideBarProps) {
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getProfile();
        setUser(res.data as UserProfile);
      } catch {
        // User not logged in
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get<Session[]>('/chat/sessions');
        const sessions = res.data;
        const now = new Date();
        const toDayLabel = (d?: string) => {
          if (!d) return 'Older';
          const dt = new Date(d);
          const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
          if (diff < 1) return 'Today';
          if (diff < 2) return 'Yesterday';
          if (diff < 7) return 'This Week';
          return 'Older';
        };
        const mapped: ChatHistory[] = sessions.map(s => ({
          id: s.id,
          title: s.title || 'Untitled Chat',
          date: toDayLabel(s.updatedAt),
          isPublic: s.isPublic,
          isGroupChat: s.isGroupChat,
          isOwner: s.isOwner !== false, // Default to true if not specified
        }));
        setChats(mapped);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const handleNewChat = () => {
    router.push('/chat');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Separate owned and shared chats
  const myChats = chats.filter(c => c.isOwner);
  const sharedChats = chats.filter(c => !c.isOwner);

  return (
    <div className="h-full flex flex-col bg-[#141414] text-sm">
      {/* Header */}
      <div className="p-3 border-b border-[#222] flex items-center justify-between">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
            N
          </div>
          {sidebarOpen && (
            <span className="font-medium text-white">NexusAI</span>
          )}
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-white/10 rounded transition-colors">
            <CloseIcon size={16} className="text-neutral-400" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        <button
          onClick={handleNewChat}
          className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${sidebarOpen ? 'px-3 py-2 text-sm' : 'p-2'}`}
        >
          <PlusIcon size={16} />
          {sidebarOpen && <span>New Chat</span>}
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-white/5 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* My Chats Section */}
            {myChats.length > 0 && (
              <div>
                {sidebarOpen && (
                  <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1 px-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    My Chats
                  </p>
                )}
                <ChatList chats={myChats} sidebarOpen={sidebarOpen} pathname={pathname} />
              </div>
            )}

            {/* Shared with Me Section */}
            {sharedChats.length > 0 && (
              <div>
                {sidebarOpen && (
                  <p className="text-[10px] font-medium text-blue-400 uppercase tracking-wider mb-1 px-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Shared with Me
                  </p>
                )}
                <ChatList chats={sharedChats} sidebarOpen={sidebarOpen} pathname={pathname} isSharedSection={true} />
              </div>
            )}

            {chats.length === 0 && (
              <p className="text-neutral-500 text-xs text-center py-4">No chats yet</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Menu */}
      <div className="border-t border-[#222] py-2 px-2 space-y-0.5">
        {user?.isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-2 py-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ShieldIcon size={16} />
            {sidebarOpen && <span>Admin</span>}
          </Link>
        )}
        <Link
          href="/profile"
          className="flex items-center gap-2 px-2 py-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <RobotIcon size={16} />
          {sidebarOpen && <span>Settings</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogoutIcon size={16} />
          {sidebarOpen && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );
}

function ChatGroup({ title, chats, sidebarOpen, pathname }: {
  title: string;
  chats: ChatHistory[];
  sidebarOpen: boolean;
  pathname: string | null;
}) {
  return (
    <div>
      {sidebarOpen && (
        <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-1 px-2">{title}</p>
      )}
      <ChatList chats={chats} sidebarOpen={sidebarOpen} pathname={pathname} />
    </div>
  );
}

function ChatList({ chats, sidebarOpen, pathname, isSharedSection = false }: {
  chats: ChatHistory[];
  sidebarOpen: boolean;
  pathname: string | null;
  isSharedSection?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      {chats.map((chat) => (
        <Link
          key={chat.id}
          href={`/chat/${chat.id}`}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded transition-colors truncate ${pathname === `/chat/${chat.id}`
            ? isSharedSection ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
            }`}
        >
          {sidebarOpen ? (
            <>
              <span className="truncate text-xs flex-1">{chat.title}</span>
              {chat.isGroupChat && (
                <span className="text-blue-400" title="Collaborative">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              )}
              {chat.isPublic && !chat.isGroupChat && (
                <span className="text-emerald-400" title="View-only shared">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </span>
              )}
            </>
          ) : (
            <span className="font-medium text-xs">{chat.title.charAt(0)}</span>
          )}
        </Link>
      ))}
    </div>
  );
}


