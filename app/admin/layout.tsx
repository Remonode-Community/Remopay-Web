'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { Topbar } from '@/components/shared/Topbar';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Gift,
  BarChart3,
  FileText,
  TrendingUp,
  Zap,
  LogOut,
  X,
  Globe,
  Phone,
  BookOpen,
  Layers,
  Percent,
  Settings,
  Newspaper,
  FolderTree,
  Tags,
  Mail,
  Headphones,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Transactions', href: '/admin/transactions', icon: CreditCard },
  // Transfer Provider Management
  { label: 'Transfer Providers', href: '/admin/settings/transfer-provider', icon: Settings },
  { label: 'Airtime to Cash', href: '/admin/airtime-to-cash', icon: Phone },
  { label: 'Currency Exchange', href: '/admin/fx', icon: Globe },
  { label: 'Offer Codes', href: '/admin/offer-codes', icon: Gift },
  { label: 'Advertisements', href: '/admin/advertisements', icon: Zap },
  // Card Fee Management
  { label: 'Card Fees', href: '/admin/cards/fees', icon: CreditCard },
  { label: 'Fee History', href: '/admin/cards/fees/transactions', icon: BarChart3 },
  // Ledger System
  { label: 'Ledger Dashboard', href: '/admin/ledger', icon: BookOpen },
  { label: 'Ledger Accounts', href: '/admin/ledger/accounts', icon: BookOpen },
  { label: 'Ledger Entries', href: '/admin/ledger/entries', icon: FileText },
  { label: 'Reconciliation', href: '/admin/ledger/reconciliation', icon: BarChart3 },
  { label: 'Settlement Batches', href: '/admin/ledger/settlement', icon: CreditCard },
  { label: 'Ledger Reports', href: '/admin/ledger/reports', icon: FileText },
  // Settlement Management
  { label: 'Settlements', href: '/admin/settlements', icon: CreditCard },
  { label: 'Settlement Config', href: '/admin/settlements/config', icon: FileText },
  { label: 'Settlement Batches', href: '/admin/settlements/batches', icon: Layers },
  { label: 'VTU Subsidies', href: '/admin/vtu-subsidies', icon: Percent },
  // Blog & Newsletter Management (admin + manager)
  { label: 'Blog Overview', href: '/admin/blog', icon: LayoutDashboard },
  { label: 'Blog Posts', href: '/admin/blog/posts', icon: Newspaper },
  { label: 'Categories', href: '/admin/blog/categories', icon: FolderTree },
  { label: 'Tags', href: '/admin/blog/tags', icon: Tags },
  { label: 'Newsletter', href: '/admin/blog/newsletter', icon: Mail },
  { label: 'Blog Analytics', href: '/admin/blog/analytics', icon: BarChart3 },
  // Support Management
  { label: 'Support Tickets', href: '/admin/support', icon: Headphones },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, activeRole } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const isActive = (href: string) => pathname === href;

  // Wait for hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Add small delay to ensure Zustand persist has hydrated from localStorage
    const timer = setTimeout(() => {
      // Check if user is authenticated
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check if email is verified (safety check, AuthInitializer is primary enforcer)
      if (!user.isEmailVerified) {
        console.warn('[AdminLayout] User email not verified, redirecting to verification page');
        router.replace(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
        return;
      }

      // Check if user has admin or manager role (blog & newsletter management)
      const isStaff = user.roles?.some((r) => r === 'admin' || r === 'manager');
      if (!isStaff) {
        // User doesn't have staff role, let AuthInitializer handle redirect to appropriate dashboard
        router.push('/dashboard');
        return;
      }

      // User is authenticated, email verified, and is admin - allow page to render
      // NOTE: Role-based redirects (if user gains/loses admin role) are handled by AuthInitializer
      setLoading(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [isMounted, user, router]);

  if (loading) {
    return <PageSkeleton />;
  }

  const isAdmin = user?.roles?.some((r) => r === 'admin');
  const isManager = user?.roles?.some((r) => r === 'manager');
  // Managers only see blog & newsletter management items; admins see everything.
  const navItems = isAdmin
    ? adminNavItems
    : adminNavItems.filter((item) => item.href.startsWith('/admin/blog'));
  // Branding label in the sidebar header + home destination per role
  const sidebarLabel = isAdmin ? 'Admin' : isManager ? 'Manager' : 'Admin';
  const homeHref = isAdmin ? '/admin' : isManager ? '/admin/blog' : '/admin';

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {!mobile && (
        <div className="border-b border-white/10 px-5 py-6">
          <Link href={homeHref} className="flex items-center gap-3">
            <Image src="/icon.png" alt={`Remopay ${sidebarLabel}`} width={42} height={42} />
            {(sidebarOpen || mobile) && (
              <div>
                <p className="text-xl font-black tracking-tight text-white">
                  Remopay
                </p>
                <p className="text-xs font-semibold text-white/45">
                  {sidebarLabel}
                </p>
              </div>
            )}
          </Link>
        </div>
      )}

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/40">
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
              {user?.first_name || 'Admin User'}
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#100303] text-white">
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden shrink-0 flex-col border-r border-white/10 bg-[#140404] transition-all duration-300 md:flex',
          sidebarOpen ? 'w-72' : 'w-24'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col bg-[#fafafa]">
        {/* Top Bar */}
        <Topbar onMenuToggle={() => setMobileMenuOpen((open) => !open)} mobileMenuOpen={mobileMenuOpen} />

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={clsx(
            'fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-white/10 bg-[#140404] text-white transition-transform duration-300 md:hidden',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="border-b border-white/10 px-5 py-5 flex items-center justify-between">
            <Link href={homeHref} className="flex items-center gap-3">
              <Image src="/icon.png" alt={`Remopay ${sidebarLabel}`} width={42} height={42} />
              <div>
                <p className="text-xl font-black tracking-tight text-white">Remopay</p>
                <p className="text-xs font-semibold text-white/45">{sidebarLabel}</p>
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
          <SidebarContent mobile />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8]  text-[#111] ">
          {children}
        </main>
      </div>
    </div>
  );
}
