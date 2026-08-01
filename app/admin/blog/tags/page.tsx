'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Filter, Search } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useUIStore } from '@/store/ui.store';
import type { BlogTag } from '@/types/blog.types';
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { Spinner } from '@/components/shared/Spinner';
import { TagFormModal } from '@/components/admin/blog/TagFormModal';
import { ConfirmActionModal } from '@/components/admin/blog/ConfirmActionModal';
import { formatDate } from '@/utils/format.utils';

export default function BlogTagsPage() {
  const { addToast } = useUIStore();
  const [items, setItems] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogTag | null>(null);
  const [deleting, setDeleting] = useState<BlogTag | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const fetchData = useCallback(async (p = 1, s = search, active = isActive) => {
    setLoading(true);
    try {
      const res = await blogService.listTags(
        {
          search: s || undefined,
          is_active: active === '' ? undefined : active === 'true',
          sort: 'newest',
        },
        p,
        15
      );
      setItems(res.data?.items || []);
      setTotal(res.data?.pagination?.total || 0);
      setTotalPages(res.data?.pagination?.last_page || 1);
      setPage(p);
    } catch {
      addToast({ type: 'error', message: 'Failed to load tags.' });
    } finally {
      setLoading(false);
    }
  }, [search, isActive, addToast]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    fetchData(1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await blogService.deleteTag(deleting.id);
      addToast({ type: 'success', message: 'Tag deleted.' });
      setDeleting(null);
      fetchData();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to delete tag.' });
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900">Tags</h2>
          <p className="text-sm text-gray-500">{total} total</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={16} /> New Tag
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Search by name or slug"
              icon={<Search size={16} />}
            />
          </div>
          <div className="w-40">
            <Select
              label="Status"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
          </div>
          <Button variant="secondary" onClick={applyFilters}>
            <Filter size={16} /> Apply
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch('');
              setIsActive('');
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
          <div className="p-12 text-center text-sm text-gray-500">No tags found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Slug</th>
                  <th className="px-6 py-3 font-semibold">Description</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Updated</th>
                  <th className="px-6 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tag) => (
                  <tr key={tag.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">#{tag.name}</td>
                    <td className="px-6 py-4 text-gray-600">/{tag.slug}</td>
                    <td className="max-w-xs truncate px-6 py-4 text-gray-600">{tag.description || '—'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={tag.is_active ? 'success' : 'default'}>
                        {tag.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(tag.updated_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => { setEditing(tag); setModalOpen(true); }}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-[#d71927]"
                          aria-label="Edit tag"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleting(tag)}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete tag"
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
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
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

      <TagFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchData()}
        tag={editing}
      />

      <ConfirmActionModal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Tag"
        message={`Are you sure you want to delete "#${deleting?.name}"?`}
        confirmLabel="Delete"
        danger
        loading={deletingLoading}
      />
    </div>
  );
}
