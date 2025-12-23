'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api, { getProfile, renameSession } from '@/app/lib/api';
import type { Session } from '@/app/lib/types';
import { ShieldIcon, RobotIcon, SettingsIcon, LogoutIcon, PlusIcon, CloseIcon } from '@/app/components/Icons';
import ShareButton from './ShareButton';

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
  isPinned?: boolean;
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
          isOwner: s.isOwner !== false,
          isPinned: (s as any).isPinned || false,
        }));
        // Sort: pinned first, then by date
        mapped.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
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

  const handleRenameChat = async (id: string, title: string) => {
    try {
      await renameSession(id, title);
      setChats(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    try {
      await api.delete(`/chat/sessions/${id}`);
      setChats(prev => prev.filter(c => c.id !== id));
      // Navigate away if currently viewing deleted chat
      if (pathname === `/chat/${id}`) {
        router.push('/chat');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleShareChat = (id: string) => {
    setShareModalChatId(id);
  };

  const handlePinChat = async (id: string) => {
    try {
      const { togglePin } = await import('@/app/lib/api');
      const res = await togglePin(id);
      const newPinned = res.data.isPinned;
      setChats(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, isPinned: newPinned } : c);
        // Re-sort: pinned first
        updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
        return updated;
      });
    } catch (error) {
      console.error('Failed to pin session:', error);
    }
  };

  const [shareModalChatId, setShareModalChatId] = useState<string | null>(null);

  // Separate owned and shared chats
  const myChats = chats.filter(c => c.isOwner);
  const sharedChats = chats.filter(c => !c.isOwner);

  return (
    <div className="h-full flex flex-col bg-[#141414] text-sm">
      {/* Header */}
      <div className="p-3 border-b border-[#222] flex items-center justify-between">
        {sidebarOpen ? (
          <Link href="/chat" className="font-medium text-white hover:text-emerald-400 transition-colors">
            NexusAI
          </Link>
        ) : (
          <Link href="/chat" className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">
            N
          </Link>
        )}
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
                <ChatList
                  chats={myChats}
                  sidebarOpen={sidebarOpen}
                  pathname={pathname}
                  onRename={handleRenameChat}
                  onDelete={handleDeleteChat}
                  onShare={handleShareChat}
                  onPin={handlePinChat}
                />
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

      {/* ShareModal - positioned to right of sidebar */}
      {shareModalChatId && (
        <div className="fixed inset-0 z-[100]" onClick={() => setShareModalChatId(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute left-[260px] top-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl w-80"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShareModalChatId(null)}
              className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-colors z-10"
            >
              <CloseIcon size={16} />
            </button>

            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-3">Share Options</h3>
              <ShareButton sessionId={shareModalChatId} />
            </div>
          </div>
        </div>
      )}
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

function ChatList({ chats, sidebarOpen, pathname, isSharedSection = false, onRename, onDelete, onShare, onPin }: {
  chats: ChatHistory[];
  sidebarOpen: boolean;
  pathname: string | null;
  isSharedSection?: boolean;
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  onPin?: (id: string) => void;
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleMenuToggle = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
    setMenuOpenId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim() && onRename) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleShare = (id: string) => {
    setMenuOpenId(null);
    onShare?.(id);
  };

  const handleDelete = (id: string) => {
    setMenuOpenId(null);
    onDelete?.(id);
  };

  const handlePin = (id: string) => {
    setMenuOpenId(null);
    onPin?.(id);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpenId]);

  return (
    <div className="space-y-0.5">
      {chats.map((chat) => (
        <div key={chat.id} className="group relative">
          {editingId === chat.id ? (
            <div className="flex items-center gap-1 px-2 py-1.5">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, chat.id)}
                onBlur={() => handleSaveEdit(chat.id)}
                className="flex-1 bg-neutral-800 text-white text-xs px-2 py-1 rounded border border-emerald-500 focus:outline-none"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                href={`/chat/${chat.id}`}
                className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-l transition-colors truncate ${pathname === `/chat/${chat.id}`
                  ? isSharedSection ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {sidebarOpen ? (
                  <>
                    {chat.isPinned && (
                      <span className="text-amber-400 flex-shrink-0" title="Pinned">
                        <svg className="w-3 h-3" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </span>
                    )}
                    <span className="truncate text-xs flex-1">{chat.title}</span>
                    {chat.isGroupChat && (
                      <span className="text-blue-400 flex-shrink-0" title="Collaborative">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    )}
                    {chat.isPublic && !chat.isGroupChat && (
                      <span className="text-emerald-400 flex-shrink-0" title="Shared">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-medium text-xs">{chat.title.charAt(0)}</span>
                )}
              </Link>

              {/* Context Menu Button */}
              {sidebarOpen && !isSharedSection && chat.isOwner !== false && (
                <button
                  onClick={(e) => handleMenuToggle(e, chat.id)}
                  className={`p-1 rounded transition-all ${menuOpenId === chat.id ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'}`}
                >
                  <svg className="w-4 h-4 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
              )}

              {/* Dropdown Menu */}
              {menuOpenId === chat.id && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-xl py-1 min-w-[160px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleShare(chat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share conversation
                  </button>
                  <button
                    onClick={() => handlePin(chat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill={chat.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {chat.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => handleStartEdit(chat.id, chat.title)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Rename
                  </button>
                  <div className="border-t border-[#333] my-1"></div>
                  <button
                    onClick={() => handleDelete(chat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


