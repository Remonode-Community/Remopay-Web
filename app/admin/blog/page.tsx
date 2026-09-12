'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  FolderTree,
  Tags,
  Mail,
  BarChart3,
  Eye,
  FilePlus2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { blogService } from '@/services/blog.service';
import type { BlogDashboardOverview } from '@/types/blog.types';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { formatDate, formatNumber } from '@/utils/format.utils';

function safeValue(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return formatNumber(value);
}

const QUICK_LINKS = [
  { label: 'Create Post', href: '/admin/blog/posts/new', icon: FilePlus2 },
  { label: 'Manage Categories', href: '/admin/blog/categories', icon: FolderTree },
  { label: 'Manage Tags', href: '/admin/blog/tags', icon: Tags },
  { label: 'Create Newsletter', href: '/admin/blog/newsletter/new', icon: Mail },
  { label: 'View Analytics', href: '/admin/blog/analytics', icon: BarChart3 },
];

export default function BlogOverviewPage() {
  const [data, setData] = useState<BlogDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await blogService.getDashboardOverview();
        if (!cancelled) {
          setData(res.data || null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load overview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardBody className="space-y-3">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-8 w-16 rounded bg-gray-200" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">{error}</p>
      </div>
    );
  }

  const posts = data?.posts || {};

  const statCards = [
    { label: 'Total Posts', value: safeValue(posts.total), icon: <Newspaper className="h-5 w-5" /> },
    { label: 'Published', value: safeValue(posts.published), icon: <TrendingUp className="h-5 w-5" /> },
    { label: 'Drafts', value: safeValue(posts.drafts), icon: <FilePlus2 className="h-5 w-5" /> },
    { label: 'Scheduled', value: safeValue(posts.scheduled), icon: <Clock className="h-5 w-5" /> },
    { label: 'Archived', value: safeValue(posts.archived), icon: <FolderTree className="h-5 w-5" /> },
    { label: 'Featured', value: safeValue(posts.featured), icon: <BarChart3 className="h-5 w-5" /> },
    { label: 'Total Views', value: safeValue(data?.total_views), icon: <Eye className="h-5 w-5" /> },
    { label: 'Categories', value: safeValue(data?.categories), icon: <FolderTree className="h-5 w-5" /> },
    { label: 'Tags', value: safeValue(data?.tags), icon: <Tags className="h-5 w-5" /> },
    { label: 'Newsletter Subscribers', value: safeValue(data?.newsletter_subscribers), icon: <Mail className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-[#d71927] hover:text-[#d71927]"
            >
              <Icon size={16} className="text-[#d71927]" /> {link.label}
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="space-y-2">
              <div className="flex items-center justify-between text-gray-500">
                <p className="text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
                <span className="text-[#d71927]">{stat.icon}</span>
              </div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Recent posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Posts</h2>
            <Link href="/admin/blog/posts" className="text-sm font-bold text-[#d71927] hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {!data?.recent_posts || data.recent_posts.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No posts yet. Create your first article to get started.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.recent_posts.slice(0, 6).map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/admin/blog/posts/${post.id}/edit`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{post.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {post.published_at ? formatDate(post.published_at) : 'Not published'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye size={14} /> {post.view_count ?? 0}
                      </span>
                      <Badge variant={post.status === 'published' ? 'success' : post.status === 'scheduled' ? 'info' : post.status === 'archived' ? 'default' : 'warning'}>
                        {post.status}
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
