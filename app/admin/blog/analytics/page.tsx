'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Newspaper, Eye, Send, MousePointerClick } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import type { BlogAnalytics } from '@/types/blog.types';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Select } from '@/components/shared/Select';
import { Spinner } from '@/components/shared/Spinner';

function normalizeSeries(analytics: BlogAnalytics | null) {
  const publication = analytics?.publication_series || [];
  const views = analytics?.views_series || [];
  const byLabel = new Map<string, Record<string, string | number>>();

  publication.forEach((point) => {
    const label = String(point.label || point.month || point.date || '');
    byLabel.set(label, {
      label,
      published: Number(point.published || 0),
      views: 0,
    });
  });
  views.forEach((point) => {
    const label = String(point.label || point.month || point.date || '');
    const existing = byLabel.get(label) || { label, published: 0, views: 0 };
    existing.views = Number(point.views || 0);
    byLabel.set(label, existing);
  });

  return Array.from(byLabel.values());
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export default function BlogAnalyticsPage() {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<BlogAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await blogService.getDashboardAnalytics(months);
        if (!cancelled) setData(res.data || null);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load analytics.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [months]);

  const series = normalizeSeries(data);
  const topPosts = data?.top_posts || [];
  const newsletter = data?.newsletter;

  const totalPublished = series.reduce((sum, point) => sum + Number(point.published || 0), 0);
  const totalViews = series.reduce((sum, point) => sum + Number(point.views || 0), 0);

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">Analytics</h2>
          <p className="text-sm text-gray-500">Publication and engagement trends over time.</p>
        </div>
        <div className="w-40">
          <Select
            label="Period"
            value={String(months)}
            onChange={(e) => setMonths(Number(e.target.value))}
            options={[
              { value: '3', label: 'Last 3 months' },
              { value: '6', label: 'Last 6 months' },
              { value: '12', label: 'Last 12 months' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-semibold text-red-700">{error}</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <p className="text-xs font-semibold uppercase tracking-wide">Publications</p>
                  <Newspaper className="h-5 w-5 text-[#d71927]" />
                </div>
                <p className="text-2xl font-black text-gray-900">{totalPublished}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <p className="text-xs font-semibold uppercase tracking-wide">Total views</p>
                  <Eye className="h-5 w-5 text-[#d71927]" />
                </div>
                <p className="text-2xl font-black text-gray-900">{formatCount(totalViews)}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <p className="text-xs font-semibold uppercase tracking-wide">Campaigns</p>
                  <Send className="h-5 w-5 text-[#d71927]" />
                </div>
                <p className="text-2xl font-black text-gray-900">{newsletter?.total_campaigns ?? 0}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <p className="text-xs font-semibold uppercase tracking-wide">Recipients</p>
                  <MousePointerClick className="h-5 w-5 text-[#d71927]" />
                </div>
                <p className="text-2xl font-black text-gray-900">{newsletter?.total_recipients ?? 0}</p>
              </CardBody>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h3 className="font-bold text-gray-900">Publications per month</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" fontSize={12} tick={{ fill: '#6b7280' }} />
                    <YAxis fontSize={12} tick={{ fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="published" name="Published" fill="#d71927" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-bold text-gray-900">Views per month</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" fontSize={12} tick={{ fill: '#6b7280' }} />
                    <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" name="Views" stroke="#d71927" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          {/* Top posts */}
          <Card>
            <CardHeader>
              <h3 className="font-bold text-gray-900">Top articles</h3>
            </CardHeader>
            {topPosts.length === 0 ? (
              <CardBody className="p-8 text-center text-sm text-gray-500">No article data yet.</CardBody>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-6 py-3 font-semibold">#</th>
                      <th className="px-6 py-3 font-semibold">Title</th>
                      <th className="px-6 py-3 text-right font-semibold">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.map((post, index) => (
                      <tr key={post.id ?? index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-6 py-3 font-black text-gray-300">{index + 1}</td>
                        <td className="px-6 py-3">
                          <a
                            href={post.slug ? `/blog/${post.slug}` : '#'}
                            className="font-semibold text-gray-900 hover:text-[#d71927]"
                          >
                            {post.title || 'Untitled'}
                          </a>
                        </td>
                        <td className="px-6 py-3 text-right text-gray-700">{post.view_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
