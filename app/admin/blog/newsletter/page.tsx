'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Search } from 'lucide-react';
import { newsletterService } from '@/services/newsletter.service';
import { useUIStore } from '@/store/ui.store';
import type { NewsletterCampaign } from '@/types/newsletter.types';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Spinner } from '@/components/shared/Spinner';
import { NewsletterStatusBadge } from '@/components/admin/blog/NewsletterStatusBadge';
import { formatDate } from '@/utils/format.utils';
import { swallowForbidden } from '@/utils/access-control.utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'sending', label: 'Sending' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_failed', label: 'Partially Failed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function NewsletterHistoryPage() {
  const { addToast } = useUIStore();
  const [items, setItems] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchData = useCallback(async (p = 1, s = search, st = status) => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const res = await newsletterService.listNewsletters(
        { search: s || undefined, status: (st as any) || undefined },
        p,
        15
      );
      setItems(res.data?.items || []);
      setTotal(res.data?.pagination?.total || 0);
      setTotalPages(res.data?.pagination?.last_page || 1);
      setPage(p);
    } catch (err: unknown) {
      // The backend returns 403 when the current role lacks newsletter permission.
      // Swallow the global 403 modal and show a clear inline message instead.
      if (swallowForbidden(err)) {
        setAccessDenied(true);
      } else {
        addToast({ type: 'error', message: 'Failed to load newsletters.' });
      }
    } finally {
      setLoading(false);
    }
  }, [search, status, addToast]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => fetchData(1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">Newsletter Campaigns</h2>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <Link href="/admin/blog/newsletter/new">
          <Button>
            <Plus size={16} /> New Campaign
          </Button>
        </Link>
      </div>

      {/* Access denied (403 from backend for current role) */}
      {accessDenied && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-700">
            Your account does not have permission to manage newsletters.
          </p>
          <p className="mt-2 text-sm text-red-600">
            Please contact an administrator to request newsletter management access.
          </p>
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Search by subject or article"
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-44">
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
          </div>
          <Button variant="secondary" onClick={applyFilters}>
            Apply
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStatus('');
              fetchData(1, '', '');
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No campaigns yet.{' '}
            <Link href="/admin/blog/newsletter/new" className="font-semibold text-[#d71927]">
              Create your first campaign
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 font-semibold">Subject</th>
                  <th className="px-6 py-3 font-semibold">Article</th>
                  <th className="px-6 py-3 font-semibold">Audience</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Recipients</th>
                  <th className="px-6 py-3 font-semibold">Sent</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="max-w-xs px-6 py-4">
                      <Link
                        href={`/admin/blog/newsletter/${campaign.id}`}
                        className="font-semibold text-gray-900 hover:text-[#d71927]"
                      >
                        {campaign.subject}
                      </Link>
                    </td>
                    <td className="max-w-40 truncate px-6 py-4 text-gray-600">
                      {campaign.blog_post?.title || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {campaign.audience_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <NewsletterStatusBadge status={campaign.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-600">{campaign.recipient_count}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {campaign.sent_at ? formatDate(campaign.sent_at) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/blog/newsletter/${campaign.id}`}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#d71927]"
                          aria-label="View campaign"
                        >
                          <Eye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => fetchData(page - 1)}>
                Prev
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => fetchData(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
