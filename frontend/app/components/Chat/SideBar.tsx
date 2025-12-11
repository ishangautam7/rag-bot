"use client";
import { MessageSquare, Plus, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  sessions: { id: string; title?: string }[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

export default function Sidebar({ sessions, currentSessionId, onSelectSession, onNewChat }: SidebarProps) {
  const router = useRouter();

  const handleSignOut = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    router.replace('/login');
  };

  return (
    <aside className="w-72 h-screen bg-gradient-to-b from-[#141820] to-[#0f1218] border-r border-gray-800/80 flex flex-col backdrop-blur-xl">
      <div className="px-4 pt-4 pb-3 border-b border-gray-800/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/30" />
            <span className="text-white font-bold tracking-wide">RAG Bot</span>
          </div>
        </div>
        <button 
          onClick={onNewChat}
          className="mt-4 w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-all font-medium shadow-lg shadow-blue-900/20"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <h3 className="text-xs font-semibold text-gray-500 px-4 py-2 uppercase tracking-wider">History</h3>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm transition-all ${
              currentSessionId === session.id 
                ? 'bg-gray-800 text-white shadow-md' 
                : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            <span className="truncate">{session.title || "Untitled Chat"}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800/70">
        <button onClick={handleSignOut} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm w-full px-2 py-2">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
