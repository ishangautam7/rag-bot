'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import api, { getProfile, renameSession, moveToFolder, createFolder, getFolders } from '@/app/lib/api';
import type { Session } from '@/app/lib/types';
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
  folderId?: string | null;
}

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar: string | null;
  createdAt: string;
  isAdmin?: boolean;
}

interface Folder {
  id: string;
  name: string;
  color: string;
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

  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveChatId, setMoveChatId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get<Session[]>('/chat/sessions');
        // Fetch folders too
        const folderRes = await getFolders();
        setFolders(folderRes.data);

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
          folderId: (s as any).folderId || null,
        }));
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Session[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const startCreateFolder = () => {
    setIsCreatingFolder(true);
    setNewFolderName('');
  };

  const submitCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await createFolder(newFolderName.trim(), '#FBBC05');
      setFolders(prev => [...prev, res.data]);
      setIsCreatingFolder(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const cancelCreateFolder = () => {
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    if (!moveChatId) return;
    const sessionId = moveChatId;
    try {
      await moveToFolder(sessionId, folderId);
      setChats(prev => prev.map(c => c.id === sessionId ? { ...c, folderId } : c));
      setMoveChatId(null);
    } catch (error) {
      console.error('Failed to move to folder:', error);
    }
  };


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { searchChats } = await import('@/app/lib/api');
      const res = await searchChats(searchQuery);
      setSearchResults(res.data.sessions);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

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

  const myChats = chats.filter(c => c.isOwner);
  const sharedChats = chats.filter(c => !c.isOwner);

  return (
    <div className="h-full flex flex-col bg-[var(--color-background-secondary)] text-sm border-r border-[var(--color-border)]">
      {/* Header */}
      <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
        {sidebarOpen ? (
          <Link href="/chat" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-medium text-[var(--color-foreground)]">NexusAI</span>
          </Link>
        ) : (
          <Link href="/chat" className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </Link>
        )}
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-[var(--color-secondary)] rounded-lg transition-colors">
            <svg className="w-4 h-4 text-[var(--color-foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {sidebarOpen && (
        <div className="px-2 pt-2">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) setSearchResults([]);
              }}
              placeholder="Search chats..."
              className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg pl-8 pr-8 py-1.5 text-xs text-[var(--color-foreground)] placeholder-[var(--color-foreground-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
            <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[var(--color-foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1.5 p-0.5 text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] rounded-full hover:bg-[var(--color-secondary)] transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </form>
        </div>
      )}

      {/* New Chat Button */}
      <div className="p-2 space-y-2">
        <button
          onClick={handleNewChat}
          className={`w-full bg-[var(--color-primary)] text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-[var(--color-primary-dark)] ${sidebarOpen ? 'px-3 py-2 text-sm' : 'p-2'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {sidebarOpen && <span>New Chat</span>}
        </button>

        {/* Folders List (only when sidebar is open for now to keep it clean) */}
        {sidebarOpen && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 text-[var(--color-foreground-muted)]">
              <span className="text-[10px] font-medium uppercase tracking-wider">Folders</span>
              <button onClick={startCreateFolder} className="hover:text-[var(--color-foreground)]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="space-y-0.5">
              {isCreatingFolder && (
                <form onSubmit={submitCreateFolder} className="px-2 py-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      placeholder="Folder name"
                      autoFocus
                      className="flex-1 bg-[var(--color-background)] border border-[var(--color-primary)] rounded px-2 py-1 text-xs text-[var(--color-foreground)] focus:outline-none"
                    />
                    <button type="submit" className="text-green-500 hover:text-green-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button type="button" onClick={cancelCreateFolder} className="text-red-500 hover:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}
              <button
                onClick={() => setActiveFolderId(null)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${activeFolderId === null ? 'bg-[var(--color-secondary)] text-[var(--color-foreground)]' : 'text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                All Chats
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${activeFolderId === folder.id ? 'bg-[var(--color-secondary)] text-[var(--color-foreground)]' : 'text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 bg-[var(--color-secondary)] rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search Results */}
            {searchQuery ? (
              <div>
                {sidebarOpen && (
                  <p className="text-[10px] font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider mb-1.5 px-2">
                    {isSearching ? 'Searching...' : `Found ${searchResults.length} results`}
                  </p>
                )}
                {!isSearching && (
                  <ChatList
                    chats={searchResults.map(s => ({
                      id: s.id,
                      title: s.title || 'Untitled',
                      date: 'Search Result',
                      isOwner: true, // Assuming own chats for now
                    }))}
                    sidebarOpen={sidebarOpen}
                    pathname={pathname}
                  />
                )}
              </div>
            ) : (
              <>
                {myChats.length > 0 && (
                  <div>
                    {sidebarOpen && (
                      <p className="text-[10px] font-medium text-[var(--color-foreground-muted)] uppercase tracking-wider mb-1.5 px-2">
                        My Chats
                      </p>
                    )}
                    <ChatList
                      chats={activeFolderId ? myChats.filter(c => c.folderId === activeFolderId) : myChats}
                      sidebarOpen={sidebarOpen}
                      pathname={pathname}
                      folders={folders}
                      onRename={handleRenameChat}
                      onDelete={handleDeleteChat}
                      onShare={handleShareChat}
                      onPin={handlePinChat}
                      onMoveToFolder={(id) => setMoveChatId(id)}
                    />

                  </div>
                )}

                {sharedChats.length > 0 && (
                  <div>
                    {sidebarOpen && (
                      <p className="text-[10px] font-medium text-[var(--color-primary)] uppercase tracking-wider mb-1.5 px-2">
                        Shared with Me
                      </p>
                    )}
                    <ChatList chats={sharedChats} sidebarOpen={sidebarOpen} pathname={pathname} isSharedSection={true} />
                  </div>
                )}

                {chats.length === 0 && (
                  <div className="text-center py-8 px-2">
                    <p className="text-[var(--color-foreground-muted)] text-xs">No chats yet</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Menu */}
      <div className="border-t border-[var(--color-border)] py-2 px-2 space-y-0.5">
        {/* Login link if not logged in */}
        {!user && (
          <Link
            href="/login"
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Sign In</span>}
          </Link>
        )}
        {user?.isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {sidebarOpen && <span>Admin</span>}
          </Link>
        )}
        <Link
          href="/profile"
          className="flex items-center gap-2 px-2 py-2 rounded-lg text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {sidebarOpen && <span>Settings</span>}
        </Link>
        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[var(--color-foreground-muted)] hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span>Log Out</span>}
          </button>
        )}
      </div>

      {/* Share Modal */}
      {shareModalChatId && (
        <div className="fixed inset-0 z-[100]" onClick={() => setShareModalChatId(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-[260px] lg:translate-x-0 bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl shadow-lg w-[90vw] max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-medium text-[var(--color-foreground)]">Share Options</h3>
              <button
                onClick={() => setShareModalChatId(null)}
                className="text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ShareButton sessionId={shareModalChatId} embedded />
          </div>
        </div>
      )}

      {/* Move To Folder Modal */}
      {moveChatId && (
        <div className="fixed inset-0 z-[100]" onClick={() => setMoveChatId(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:left-[260px] lg:translate-x-0 bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-xl shadow-lg w-[90vw] max-w-xs overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-medium text-[var(--color-foreground)]">Move to Folder</h3>
              <button
                onClick={() => setMoveChatId(null)}
                className="text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleMoveToFolder(null)}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-secondary)] transition-colors text-[var(--color-primary)]"
              >
                No Folder
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveToFolder(folder.id)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-secondary)] transition-colors text-[var(--color-foreground)]"
                >
                  {folder.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



interface ChatListProps {
  chats: ChatHistory[];
  sidebarOpen: boolean;
  pathname: string | null;
  isSharedSection?: boolean;
  folders?: Folder[];
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  onPin?: (id: string) => void;
  onMoveToFolder?: (sessionId: string) => void;
}

function ChatList({ chats, sidebarOpen, pathname, isSharedSection = false, folders = [], onRename, onDelete, onShare, onPin, onMoveToFolder }: ChatListProps) {
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
                className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)] text-xs px-2 py-1.5 rounded border border-[var(--color-primary)] focus:outline-none"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center">
              <Link
                href={`/chat/${chat.id}`}
                className={`flex-1 flex items-center gap-1.5 px-2 py-2 rounded-lg transition-colors truncate ${pathname === `/chat/${chat.id}`
                  ? 'bg-[var(--color-secondary)] text-[var(--color-foreground)]'
                  : 'text-[var(--color-foreground-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)]'
                  }`}
              >
                {sidebarOpen ? (
                  <>
                    {chat.isPinned && (
                      <svg className="w-3 h-3 text-[var(--color-primary)] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                    <span className="truncate text-xs flex-1">{chat.title}</span>
                  </>
                ) : (
                  <span className="font-medium text-xs">{chat.title.charAt(0)}</span>
                )}
              </Link>

              {sidebarOpen && !isSharedSection && chat.isOwner !== false && (
                <button
                  onClick={(e) => handleMenuToggle(e, chat.id)}
                  className={`p-1.5 rounded-lg transition-all ${menuOpenId === chat.id ? 'opacity-100 bg-[var(--color-secondary)]' : 'opacity-0 group-hover:opacity-100 hover:bg-[var(--color-secondary)]'}`}
                >
                  <svg className="w-3.5 h-3.5 text-[var(--color-foreground-muted)]" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
              )}

              {menuOpenId === chat.id && (
                <div
                  className="absolute right-0 top-full mt-1 z-50 bg-[var(--color-card-solid)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[140px] animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => { setMenuOpenId(null); onShare?.(chat.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => { setMenuOpenId(null); onPin?.(chat.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                  >
                    {chat.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => handleStartEdit(chat.id, chat.title)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                  >
                    Rename
                  </button>

                  {/* Move to Folder Submenu */}
                  <button
                    onClick={() => { setMenuOpenId(null); onMoveToFolder?.(chat.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
                  >
                    Move to Folder
                  </button>

                  <div className="border-t border-[var(--color-border)] my-1"></div>
                  <button
                    onClick={() => { setMenuOpenId(null); onDelete?.(chat.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
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
