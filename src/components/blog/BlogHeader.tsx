'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Services', href: '/vtu' },
  { label: 'FAQ', href: '/faq' },
];

export function BlogHeader() {
  const { isAuthenticated, user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="Remopay Logo" width={36} height={36} />
          <span className="text-xl font-black tracking-tight text-gray-900">Remopay</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-gray-600 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[#d71927]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-[#d71927] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b91420]"
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-[#d71927] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b91420]"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-semibold text-gray-700">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3">
              {isAuthenticated && user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-[#d71927] px-4 py-2 text-center text-sm font-bold text-white"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-center text-sm font-bold text-gray-700"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-lg bg-[#d71927] px-4 py-2 text-center text-sm font-bold text-white"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
