'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Newspaper, FolderTree, Tags, Mail, BarChart3, LayoutDashboard, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';

const BLOG_TABS = [
  { label: 'Overview', href: '/admin/blog', icon: LayoutDashboard },
  { label: 'Posts', href: '/admin/blog/posts', icon: Newspaper },
  { label: 'Categories', href: '/admin/blog/categories', icon: FolderTree },
  { label: 'Tags', href: '/admin/blog/tags', icon: Tags },
  { label: 'Newsletter', href: '/admin/blog/newsletter', icon: Mail },
  { label: 'Analytics', href: '/admin/blog/analytics', icon: BarChart3 },
];

export default function BlogAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const isStaff = user.roles?.some((r) => r === 'admin' || r === 'manager');
      if (!isStaff) {
        router.push('/dashboard');
        return;
      }
      setLoading(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [isMounted, user, router]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-5 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Blog & Newsletter</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage articles, categories, tags and email campaigns.
          </p>
        </div>
        <Link
          href="/blog"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
        >
          <ExternalLink size={15} /> View public blog
        </Link>
      </div>

      {/* Tabs */}
      <nav className="mb-6 flex flex-wrap gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        {BLOG_TABS.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === '/admin/blog'
              ? pathname === '/admin/blog' || pathname === '/admin/blog/'
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition',
                active
                  ? 'bg-[#d71927] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
