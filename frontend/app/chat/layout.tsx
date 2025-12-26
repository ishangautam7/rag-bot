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
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const authed = !!token;
    setIsAuthed(authed);
    setAuthChecked(true);
    if (!authed) router.push('/login');
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)] flex overflow-hidden">
      {/* Sidebar - Slimmer */}
      <div
        className={`fixed z-40 lg:static bg-[var(--color-card)] border-r border-[var(--color-border)] transition-all duration-200 h-screen ${sidebarOpen ? 'w-56 translate-x-0' : 'w-56 -translate-x-full lg:translate-x-0 lg:w-14'
          }`}
      >
        <SideBar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar - Minimal */}
        <div className="bg-[var(--color-card)]/70 backdrop-blur-sm border-b border-[var(--color-border)] px-4 py-2 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-[var(--color-secondary)] rounded transition-colors text-[var(--color-foreground-muted)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Menu */}
          <Link
            href="/profile"
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] text-xs font-medium hover:bg-[var(--color-secondary)] transition-colors"
          >
            Profile
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
          className="fixed inset-0 bg-black/20 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
