'use client';

import { useState, useEffect } from 'react';
import SideBar from '@/app/components/Chat/SideBar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex overflow-hidden">
      {/* Sidebar - Slimmer */}
      <div
        className={`fixed z-40 lg:static bg-[#141414] border-r border-[#222] transition-all duration-200 h-screen ${sidebarOpen ? 'w-48 translate-x-0' : 'w-48 -translate-x-full lg:translate-x-0 lg:w-12'
          }`}
      >
        <SideBar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar - Minimal */}
        <div className="bg-[#141414]/80 backdrop-blur-sm border-b border-[#222] px-4 py-2 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-neutral-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Menu */}
          <Link
            href="/profile"
            className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            U
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
