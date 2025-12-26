'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from './components/UI/Navbar';
import { usePathname } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Show navbar only on landing page
  const showNavbar = pathname === '/';

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-white text-gray-900 min-h-screen flex flex-col`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          {showNavbar && <Navbar />}
          <main className={`flex-grow ${showNavbar ? 'pt-16' : ''}`}>
            {children}
          </main>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
