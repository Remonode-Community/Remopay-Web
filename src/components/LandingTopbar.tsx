'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

/**
 * LandingTopbar Component
 * 
 * Shows different navigation based on authentication state:
 * - Unauthenticated: Login and Sign Up buttons
 * - Authenticated: User name, profile menu with dashboard and logout
 */
export function LandingTopbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { logout, isLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/icon.png" alt="Remopay Logo" width={48} height={48} />
          <span className="text-2xl font-black tracking-tight text-white">Remopay</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-semibold text-white/85 lg:flex">
          <a href="#services" className="flex items-center gap-1 hover:text-[#ff4b55]">
            Services <ChevronDown size={14} />
          </a>
          <a href="#rewards" className="hover:text-[#ff4b55]">Rewards</a>
          <a href="#security" className="hover:text-[#ff4b55]">Security</a>
          <Link href="/blog" className="hover:text-[#ff4b55]">
            Blog
          </Link>
          <a href="#about" className="hover:text-[#ff4b55]">About Us</a>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            // Authenticated user menu
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <div className="h-8 w-8 rounded-full bg-[#d71927] flex items-center justify-center text-xs font-bold">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <span className="hidden sm:inline">{user.first_name}</span>
                <ChevronDown size={16} className={`transition ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-900 border border-white/10 shadow-xl z-50">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 rounded-t-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-white/10 rounded-b-lg transition disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Unauthenticated user buttons
            <>
              <Link
                href="/auth/login"
                className="hidden rounded-xl border border-[#ff4b55]/50 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10 sm:inline-flex"
              >
                Login
              </Link>

              <Link
                href="/auth/register"
                className="rounded-xl bg-[#c91522] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#c91522]/30 transition hover:bg-[#a9111b]"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
