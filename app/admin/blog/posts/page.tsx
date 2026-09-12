'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit2,
  Trash2,
  Send,
  CalendarClock,
  Archive,
  Star,
  Eye,
  Search,
  ExternalLink,
} from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useUIStore } from '@/store/ui.store';
import type { ArticleStatus, BlogPost } from '@/types/blog.types';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Spinner } from '@/components/shared/Spinner';
import { Modal } from '@/components/shared/Modal';
import { PostStatusBadge } from '@/components/admin/blog/PostStatusBadge';
import { ConfirmActionModal } from '@/components/admin/blog/ConfirmActionModal';
import { formatDate } from '@/utils/format.utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'views', label: 'Most viewed' },
  { value: 'updated', label: 'Recently updated' },
];

type Action =
  | { type: 'publish'; post: BlogPost }
  | { type: 'archive'; post: BlogPost }
  | { type: 'feature'; post: BlogPost; value: boolean }
  | { type: 'delete'; post: BlogPost };

export default function BlogPostsPage() {
  const { addToast } = useUIStore();
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');

  const [schedulePost, setSchedulePost] = useState<BlogPost | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(
    async (p = 1, s = search, st = status, so = sort) => {
      setLoading(true);
      try {
        const res = await blogService.listPosts(
          {
            search: s || undefined,
            status: (st as ArticleStatus) || undefined,
            sort: so as any,
          },
          p,
          15
        );
        setItems(res.data?.items || []);
        setTotal(res.data?.pagination?.total || 0);
        setTotalPages(res.data?.pagination?.last_page || 1);
        setPage(p);
      } catch {
        addToast({ type: 'error', message: 'Failed to load posts.' });
      } finally {
        setLoading(false);
      }
    },
    [search, status, sort, addToast]
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => fetchData(1);

  const runAction = async () => {
    if (!action) return;
    setActionLoading(true);
    try {
      switch (action.type) {
        case 'publish':
          await blogService.publishPost(action.post.id);
          addToast({ type: 'success', message: 'Post published.' });
          break;
        case 'archive':
          await blogService.archivePost(action.post.id);
          addToast({ type: 'success', message: 'Post archived.' });
          break;
        case 'feature':
          await blogService.featurePost(action.post.id, action.value);
          addToast({ type: 'success', message: action.value ? 'Post featured.' : 'Post unfeatured.' });
          break;
        case 'delete':
          await blogService.deletePost(action.post.id);
          addToast({ type: 'success', message: 'Post deleted.' });
          break;
      }
      setAction(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Action failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!schedulePost || !scheduleDate) return;
    setScheduleLoading(true);
    try {
      await blogService.schedulePost(schedulePost.id, new Date(scheduleDate).toISOString());
      addToast({ type: 'success', message: 'Post scheduled.' });
      setSchedulePost(null);
      setScheduleDate('');
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to schedule post.' });
    } finally {
      setScheduleLoading(false);
    }
  };

  const actionConfig = action
    ? {
        title:
          action.type === 'publish'
            ? 'Publish Post'
            : action.type === 'archive'
            ? 'Archive Post'
            : action.type === 'feature'
            ? action.value
              ? 'Feature Post'
              : 'Unfeature Post'
            : 'Delete Post',
        message:
          action.type === 'publish'
            ? `Publish "${action.post.title}" now? It will become publicly visible.`
            : action.type === 'archive'
            ? `Archive "${action.post.title}"? It will be hidden from the public blog.`
            : action.type === 'feature'
            ? action.value
              ? `Feature "${action.post.title}" on the blog homepage?`
              : `Remove "${action.post.title}" from featured posts?`
            : `Delete "${action.post.title}"? This is a soft delete.`,
        confirmLabel:
          action.type === 'delete' ? 'Delete' : action.type === 'feature' && !action.value ? 'Unfeature' : 'Confirm',
        danger: action.type === 'delete',
      }
    : null;

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">Posts</h2>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <Link href="/admin/blog/posts/new">
          <Button>
            <Plus size={16} /> New Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Search posts..."
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-44">
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
          </div>
          <div className="w-44">
            <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} options={SORT_OPTIONS} />
          </div>
          <Button variant="secondary" onClick={applyFilters}>
            Apply
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setStatus('');
              setSort('newest');
              fetchData(1, '', '', 'newest');
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No posts found.{' '}
            <Link href="/admin/blog/posts/new" className="font-semibold text-[#d71927]">
              Create your first post
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 font-semibold">Title</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Views</th>
                  <th className="px-6 py-3 font-semibold">Published</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((post) => (
                  <tr key={post.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="max-w-sm px-6 py-4">
                      <Link
                        href={`/admin/blog/posts/${post.id}/edit`}
                        className="font-semibold text-gray-900 hover:text-[#d71927]"
                      >
                        {post.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {post.is_featured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Star size={10} /> Featured
                          </span>
                        )}
                        {post.categories?.map((c) => (
                          <span key={c.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PostStatusBadge status={post.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-600">{post.view_count ?? 0}</td>
                    <td className="px-6 py-4 text-gray-600">{post.published_at ? formatDate(post.published_at) : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        {post.slug && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#d71927]"
                            aria-label="View post"
                          >
                            <ExternalLink size={16} />
                          </Link>
                        )}
                        <button
                          onClick={() => setAction({ type: 'publish', post })}
                          disabled={post.status === 'published'}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-green-600 disabled:opacity-30"
                          aria-label="Publish post"
                          title="Publish"
                        >
                          <Send size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSchedulePost(post);
                            setScheduleDate('');
                          }}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#4a5ff7]"
                          aria-label="Schedule post"
                          title="Schedule"
                        >
                          <CalendarClock size={16} />
                        </button>
                        <button
                          onClick={() => setAction({ type: 'feature', post, value: !post.is_featured })}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-amber-600"
                          aria-label="Toggle featured"
                          title={post.is_featured ? 'Unfeature' : 'Feature'}
                        >
                          <Star size={16} />
                        </button>
                        <button
                          onClick={() => setAction({ type: 'archive', post })}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#4a5ff7]"
                          aria-label="Archive post"
                          title="Archive"
                        >
                          <Archive size={16} />
                        </button>
                        <Link
                          href={`/admin/blog/posts/${post.id}/edit`}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#d71927]"
                          aria-label="Edit post"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button
                          onClick={() => setAction({ type: 'delete', post })}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
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

      {/* Schedule modal */}
      <Modal
        isOpen={Boolean(schedulePost)}
        onClose={() => setSchedulePost(null)}
        title="Schedule Post"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSchedulePost(null)} disabled={scheduleLoading}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} isLoading={scheduleLoading} disabled={!scheduleDate}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Schedule <span className="font-semibold">"{schedulePost?.title}"</span> to auto-publish at a future time.
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Publish at</span>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
            />
          </label>
        </div>
      </Modal>

      {/* Confirm actions */}
      {action && actionConfig && (
        <ConfirmActionModal
          isOpen={Boolean(action)}
          onClose={() => setAction(null)}
          onConfirm={runAction}
          title={actionConfig.title}
          message={actionConfig.message}
          confirmLabel={actionConfig.confirmLabel}
          danger={actionConfig.danger}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
