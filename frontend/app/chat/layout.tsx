"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../lib/api';
import { Loader2, Menu, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Chat/SideBar';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams(); 
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // 1. Auth Check & Session Fetch
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const res = await api.get('/chat/sessions');
        setSessions(res.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed", error);
        localStorage.removeItem('token'); // Clear bad token
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSelectSession = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleNewChat = () => {
    router.push('/chat'); 
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#0f1117] flex flex-col items-center justify-center text-blue-500">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-gray-400 animate-pulse">Initializing Secure Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null; // Prevent flash of content

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0c0f14] via-[#0f1117] to-[#0c0f14] text-gray-100 font-sans overflow-hidden">
      <div className="hidden md:block">
        <Sidebar 
          sessions={sessions} 
          currentSessionId={params.chatId as string} 
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            <Sidebar 
              sessions={sessions} 
              currentSessionId={params.chatId as string} 
              onSelectSession={(id) => { setMobileOpen(false); handleSelectSession(id); }}
              onNewChat={() => { setMobileOpen(false); handleNewChat(); }}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col relative h-full">
        <header className="flex items-center justify-between p-4 md:p-5 border-b border-gray-800/60 bg-[#0f1117]/80 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-gray-800 text-white">
              <Menu size={20} />
            </button>
            <span className="text-sm text-gray-400">RAG Bot</span>
          </div>
          <div className="hidden md:block text-sm text-gray-400">RAG Bot</div>
          <div className="relative">
            <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-xl">
              <div className="w-6 h-6 rounded-full bg-blue-600" />
              <ChevronDown size={16} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-[#12161d] border border-gray-800 rounded-xl shadow-xl p-2 z-10">
                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg" onClick={() => setProfileOpen(false)}>Profile</button>
                <button className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg" onClick={() => setProfileOpen(false)}>Settings</button>
                <button className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-800 rounded-lg" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setProfileOpen(false); router.replace('/login'); }}>Sign Out</button>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 px-4 md:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
