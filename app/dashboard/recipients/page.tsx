'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Edit2,
  Loader2,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { useVtuRecipients } from '@/hooks/useVtuRecipients';
import { VtuRecipient } from '@/types/api.types';
import { formatRelativeTime } from '@/utils/format.utils';

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  airtime: <Phone className="h-4 w-4" />,
  data: <Wifi className="h-4 w-4" />,
  electricity: <Zap className="h-4 w-4" />,
};

const SERVICE_LABELS: Record<string, string> = {
  'Airtime Recharge': 'Airtime',
  'Data Services': 'Data',
  'Electricity Bill Payment': 'Electricity',
  'TV Subscription': 'TV',
};

export default function RecipientsPage() {
  const {
    recipients,
    favorites,
    isLoading,
    error,
    pagination,
    fetchRecipients,
    fetchFavorites,
    toggleFavorite,
    deleteRecipient,
    updateRecipient,
  } = useVtuRecipients();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchRecipients({ page: 1, per_page: 20 });
    fetchFavorites(20);
  }, [fetchRecipients, fetchFavorites]);

  const handleSearch = useCallback(() => {
    fetchRecipients({
      page: 1,
      per_page: 20,
      search: searchTerm || undefined,
    });
  }, [searchTerm, fetchRecipients]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const handleEdit = (recipient: VtuRecipient) => {
    setEditingId(recipient.id);
    setEditName(recipient.recipient_name || '');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;
    await updateRecipient(id, { recipient_name: editName });
    setEditingId(null);
    fetchRecipients({ page: 1, per_page: 20, search: searchTerm || undefined });
  };

  const handleDelete = async (id: number) => {
    await deleteRecipient(id);
    setDeleteConfirmId(null);
    fetchRecipients({ page: 1, per_page: 20, search: searchTerm || undefined });
    fetchFavorites(20);
  };

  const handleToggleFavorite = async (id: number) => {
    await toggleFavorite(id);
    fetchFavorites(20);
  };

  const displayList = activeTab === 'favorites'
    ? favorites.filter((r) => r.is_favorite)
    : recipients;

  const getServiceType = (recipient: VtuRecipient): string => {
    const type = recipient.transaction_type || '';
    return SERVICE_LABELS[type] || type || 'Other';
  };

  const getServiceIcon = (recipient: VtuRecipient) => {
    const type = (recipient.transaction_type || '').toLowerCase();
    if (type.includes('airtime')) return SERVICE_ICONS.airtime;
    if (type.includes('data')) return SERVICE_ICONS.data;
    if (type.includes('electricity') || type.includes('power')) return SERVICE_ICONS.electricity;
    return <Phone className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-950">Saved Recipients</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your saved phone numbers and credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/airtime"
            className="inline-flex items-center gap-2 rounded-xl border border-[#d71927]/15 bg-white px-4 py-2.5 text-sm font-bold text-[#d71927] hover:bg-[#fff8f8] transition"
          >
            Buy Airtime
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/dashboard/data"
            className="inline-flex items-center gap-2 rounded-xl bg-[#d71927] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#d71927]/25 hover:bg-[#b91420] transition"
          >
            Buy Data
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Tabs + Search */}
      <Card className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              type="button"
            >
              <Users className="mr-1.5 inline-block h-4 w-4" />
              All Recipients
              <span className="ml-1.5 text-xs text-gray-400">({pagination.total})</span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                activeTab === 'favorites'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              type="button"
            >
              <Star className="mr-1.5 inline-block h-4 w-4" />
              Favorites
              <span className="ml-1.5 text-xs text-gray-400">({favorites.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]/20 transition"
            />
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {error && (
          <div className="p-6">
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#d71927]" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              {activeTab === 'favorites' ? (
                <Star className="h-7 w-7 text-gray-300" />
              ) : (
                <Users className="h-7 w-7 text-gray-300" />
              )}
            </div>
            <h3 className="text-lg font-black text-gray-950">
              {activeTab === 'favorites' ? 'No favorite recipients' : 'No saved recipients'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {activeTab === 'favorites'
                ? 'Star your important recipients for quick access.'
                : 'Recipients are saved automatically after your first transaction.'}
            </p>
            {activeTab === 'all' && (
              <Link
                href="/dashboard/airtime"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d71927] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#b91420] transition"
              >
                Buy Airtime
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayList.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center gap-4 px-4 py-4 sm:px-6 hover:bg-gray-50 transition group"
              >
                {/* Service Icon */}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 group-hover:bg-[#d71927]/10 group-hover:text-[#d71927] transition">
                  {getServiceIcon(recipient)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {recipient.is_favorite && (
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-current flex-shrink-0" />
                    )}
                    {editingId === recipient.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Enter name"
                        className="max-w-xs rounded-lg border border-[#d71927] bg-[#fff8f8] px-3 py-1 text-sm font-semibold focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(recipient.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <p className="font-bold text-gray-900">
                        {recipient.recipient_name || recipient.credential}
                      </p>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-semibold">{recipient.credential}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 font-bold text-gray-600">
                      {getServiceType(recipient)}
                    </span>
                    <span>{recipient.usage_count}x used</span>
                    {recipient.last_used_at && (
                      <span className="hidden sm:inline">
                        Last used {formatRelativeTime(recipient.last_used_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {deleteConfirmId === recipient.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(recipient.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
                        type="button"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300 transition"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : editingId === recipient.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(recipient.id)}
                        className="rounded-lg bg-[#d71927] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#b91420] transition"
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300 transition"
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleFavorite(recipient.id)}
                        className={`rounded-lg p-2 transition ${
                          recipient.is_favorite
                            ? 'text-amber-500 hover:bg-amber-50'
                            : 'text-gray-400 hover:bg-amber-50 hover:text-amber-500'
                        }`}
                        type="button"
                        title={recipient.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`h-4 w-4 ${recipient.is_favorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEdit(recipient)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition"
                        type="button"
                        title="Rename"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(recipient.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                        type="button"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.lastPage > 1 && activeTab === 'all' && (
          <div className="border-t border-gray-100 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <div className="flex gap-2">
                {pagination.currentPage > 1 && (
                  <button
                    onClick={() =>
                      fetchRecipients({
                        page: pagination.currentPage - 1,
                        per_page: 20,
                        search: searchTerm || undefined,
                      })
                    }
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-bold hover:bg-gray-50 transition"
                    type="button"
                  >
                    Previous
                  </button>
                )}
                {pagination.currentPage < pagination.lastPage && (
                  <button
                    onClick={() =>
                      fetchRecipients({
                        page: pagination.currentPage + 1,
                        per_page: 20,
                        search: searchTerm || undefined,
                      })
                    }
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-bold hover:bg-gray-50 transition"
                    type="button"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
