'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRightLeft,
  CreditCard,
  DollarSign,
  FileText,
  Globe,
  Home,
  LogOut,
  Phone,
  Send,
  Settings,
  Tv,
  Wallet,
  Wifi,
  X,
  Users,
  Headphones,
} from 'lucide-react';
import { clsx } from 'clsx';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Topbar } from '@/components/shared/Topbar';
import { AuthProtected } from '@/components/AuthProtected';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();
  const { activeRole } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check email verification and role authorization
  useEffect(() => {
    if (!user) {
      setLoading(true);
      return;
    }

    // Email verification is now handled by AuthInitializer at app level
    // This is just a safety check for edge cases
    if (!user.isEmailVerified) {
      router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }

    // Dashboard-specific pages should not trigger admin/agent redirect
    const dashboardSpecificPages = [
      '/dashboard/wallet-statistics',
      '/dashboard/vtu-statistics',
    ];
    const isDashboardSpecificPage = dashboardSpecificPages.some(page => pathname?.startsWith(page));

    // If on dashboard-specific page, allow it to render
    if (isDashboardSpecificPage) {
      setLoading(false);
      return;
    }

    // NOTE: Role-based redirects (admin/agent) are now handled by AuthInitializer
    // at app level during initialization, not here. This prevents race conditions.
    // Dashboard layout only handles:
    // 1. Email verification safety check (above)
    // 2. Renders dashboard UI for customers with verified email
    
    setLoading(false);
  }, [user, router, pathname]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/airtime', label: 'Buy Airtime', icon: Phone },
    { href: '/dashboard/airtime-to-cash', label: 'Airtime-to-Cash', icon: Send },
    { href: '/dashboard/data', label: 'Buy Data', icon: Wifi },
    { href: '/dashboard/tv', label: 'TV Subscription', icon: Tv },
    { href: '/dashboard/bills', label: 'Electricity Token', icon: FileText },
    { href: '/dashboard/transfer', label: 'Transfer Money', icon: ArrowRightLeft },
    { href: '/dashboard/wallet', label: 'FX Conversion', icon: Wallet },
    { href: '/dashboard/virtual-card', label: 'Virtual Cards', icon: CreditCard },
    { href: '/dashboard/usd-account', label: 'USD Account', icon: DollarSign },
    { href: '/dashboard/history', label: 'History', icon: Activity },
    { href: '/dashboard/referral', label: 'Referrals', icon: Users },
    { href: '/dashboard/support', label: 'Support', icon: Headphones },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className="border-b border-white/10 px-5 py-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/icon.png" alt="Remopay" width={42} height={42} />

          {(sidebarOpen || mobile) && (
            <div>
              <p className="text-xl font-black tracking-tight text-white">
                Remopay
              </p>
              <p className="text-xs font-semibold text-white/45">
                Payment Wallet
              </p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={clsx(
                'group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                active
                  ? 'bg-[#d71927] text-white shadow-lg shadow-[#d71927]/25'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon
                size={20}
                className={clsx(
                  active ? 'text-white' : 'text-white/50 group-hover:text-white'
                )}
              />

              {(sidebarOpen || mobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {(sidebarOpen || mobile) && (
          <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-semibold text-white/45">Signed in as</p>
            <p className="mt-1 truncate text-sm font-black text-white">
              {user?.first_name || 'Remopay User'}
            </p>
          </div>
        )}

        <button
          onClick={() => {
            logout();
            if (mobile) setMobileMenuOpen(false);
          }}
          className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={20} />
          {(sidebarOpen || mobile) && <span>Logout</span>}
        </button>
      </div>
    </>
  );


  return (
    <AuthProtected requireAuth>
      <div className="flex h-screen overflow-hidden bg-[#100303] text-white">
        <aside
          className={clsx(
            'no-print hidden shrink-0 flex-col border-r border-white/10 bg-[#140404] transition-all duration-300 md:flex',
            sidebarOpen ? 'w-72' : 'w-24'
          )}
        >
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="no-print">
            <Topbar
              onMenuToggle={() => setMobileMenuOpen((open) => !open)}
              mobileMenuOpen={mobileMenuOpen}
            />
          </div>

          {mobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <aside
            className={clsx(
              'fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/10 bg-[#140404] text-white transition-transform duration-300 md:hidden',
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="border-b border-white/10 px-5 py-5 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3">
                <Image src="/icon.png" alt="Remopay" width={42} height={42} />
                <div>
                  <p className="text-xl font-black tracking-tight text-white">
                    Remopay
                  </p>
                  <p className="text-xs font-semibold text-white/45">
                    Payment Wallet
                  </p>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white flex-shrink-0"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      'group flex items-center gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                      active
                        ? 'bg-[#d71927] text-white shadow-lg shadow-[#d71927]/25'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon
                      size={20}
                      className={clsx(
                        active ? 'text-white' : 'text-white/50 group-hover:text-white'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-semibold text-white/45">Signed in as</p>
                <p className="mt-1 truncate text-sm font-black text-white">
                  {user?.first_name || 'Remopay User'}
                </p>
              </div>

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-2 text-[#111]">
            {children}
          </main>
        </div>
      </div>
    </AuthProtected>
  );
};

export default DashboardLayout;