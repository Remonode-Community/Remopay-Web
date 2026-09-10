/**
 * NotificationsList Component
 * Displays notifications with filtering, pagination, and bulk actions
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from './NotificationCard';
import { NotificationDetailModal } from './NotificationDetailModal';
import { Notification, NotificationType } from '@/types/notification.types';
import {
  AlertCircle,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  X,
  Inbox,
} from 'lucide-react';

interface NotificationsListProps {
  compact?: boolean;
  limit?: number;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  compact = false,
  limit = 20,
}) => {
  const {
    notifications,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    getUnreadCount,
  } = useNotifications();

  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchNotifications({
      page: currentPage,
      per_page: limit,
      type: (typeFilter as NotificationType) || undefined,
      priority: (priorityFilter as any) || undefined,
      unread_only: unreadOnly,
    });
  }, [
    currentPage,
    typeFilter,
    priorityFilter,
    unreadOnly,
    limit,
    fetchNotifications,
  ]);

  const resetSelection = () => setSelectedIds(new Set());

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
    resetSelection();
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    setCurrentPage(1);
    resetSelection();
  };

  const handleUnreadToggle = (value: boolean) => {
    setUnreadOnly(value);
    setCurrentPage(1);
    resetSelection();
  };

  const clearFilters = () => {
    setTypeFilter('');
    setPriorityFilter('');
    setUnreadOnly(false);
    setCurrentPage(1);
    resetSelection();
  };

  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const handleSelectOne = (id: number) => {
    const newSelected = new Set(selectedIds);

    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }

    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    if (
      window.confirm(`Delete ${selectedIds.size} notification(s)?`)
    ) {
      setIsDeleting(true);

      try {
        await deleteMultiple(Array.from(selectedIds));
        setSelectedIds(new Set());
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = getUnreadCount();

    if (unreadCount === 0) return;

    if (
      window.confirm(
        `Mark all ${unreadCount} unread notification(s) as read?`
      )
    ) {
      await markAllAsRead();
    }
  };

  const unreadCount = getUnreadCount();

  const hasActiveFilters = Boolean(
    typeFilter || priorityFilter || unreadOnly
  );

  if (compact && notifications.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[lab(2_5.17_1.85)]">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#620707]/10 text-[#620707] dark:bg-[#620707]/20 dark:text-red-200">
            <Bell className="h-5 w-5" />
          </div>

          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No Notifications
          </h3>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            You're all caught up.
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="max-h-96 space-y-3 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[lab(2_5.17_1.85)]">
        {notifications.slice(0, 5).map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
          />
        ))}

        {notifications.length > 5 && (
          <div className="border-t border-slate-200 pt-3 dark:border-white/10">
            <a
              href="/dashboard/notifications"
              className="flex items-center justify-center rounded-2xl border border-[#620707]/20 bg-[#620707]/5 px-4 py-3 text-sm font-semibold text-[#620707] transition-all duration-300 hover:bg-[#620707]/10 dark:border-[#620707]/30 dark:bg-[#620707]/10 dark:text-red-200"
            >
              View All Notifications
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-500/20 dark:bg-red-950/20">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-300" />

          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              Error loading notifications
            </p>

            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        </div>
      )}

      <section className="overflow-hidden  shadow-sm dark:border-white/10 bg-[lab(2_5.17_1.85)]">
        {/* HEADER */}
        <div className="relative overflow-hidden border-b border-white/10  p-6 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#620707]/40 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-xl">
                <p className="text-xs text-white/70">Unread</p>

                <p className="text-2xl font-bold">
                  {unreadCount}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#620707] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-red-50"
                >
                  <Check className="h-4 w-4" />
                  Mark all as read
                </button>
              )}

              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 backdrop-blur-xl transition-all duration-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />

                  {isDeleting
                    ? 'Deleting...'
                    : `Delete ${selectedIds.size}`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className=" bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#620707]/10 text-[#620707] dark:bg-[#620707]/20 dark:text-red-200">
                <Filter className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Filters
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Filter notifications by type and priority
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={typeFilter}
                onChange={(e) =>
                  handleTypeFilterChange(e.target.value)
                }
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all duration-300 hover:border-[#620707]/40 focus:border-[#620707] focus:ring-4 focus:ring-[#620707]/10 dark:border-white/10 dark:bg-[lab(2_5.17_1.85)] dark:text-slate-200"
              >
                <option value="">All Types</option>
                <option value="transaction">
                  Transaction
                </option>
                <option value="system">System</option>
                <option value="promotion">
                  Promotion
                </option>
                <option value="update">Update</option>
                <option value="alert">Alert</option>
                <option value="support_ticket">Support</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) =>
                  handlePriorityFilterChange(e.target.value)
                }
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition-all duration-300 hover:border-[#620707]/40 focus:border-[#620707] focus:ring-4 focus:ring-[#620707]/10 dark:border-white/10 dark:bg-[lab(2_5.17_1.85)] dark:text-slate-200"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>

              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-[#620707]/40 hover:bg-[#620707]/5 dark:border-white/10 dark:bg-[lab(2_5.17_1.85)] dark:text-slate-200 dark:hover:bg-white/[0.03]">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) =>
                    handleUnreadToggle(e.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#620707] focus:ring-[#620707]"
                />

                Unread only
              </label>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-[#620707]/30 hover:bg-[#620707]/5 hover:text-[#620707] dark:border-white/10 dark:bg-[lab(2_5.17_1.85)] dark:text-slate-200"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-5 md:p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 py-20 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#620707] dark:border-white/10 dark:border-t-red-300" />

              <p className="mt-5 text-sm font-medium text-slate-600 dark:text-slate-300">
                Loading notifications...
              </p>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-24 text-center dark:border-white/10 dark:bg-white/[0.02]">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#620707]/10 text-[#620707] dark:bg-[#620707]/20 dark:text-red-200">
                <Inbox className="h-10 w-10" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                No Notifications Found
              </h3>

              <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                You currently have no notifications available.
                New account updates and transaction activities
                will appear here.
              </p>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-6 rounded-2xl bg-[#620707] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-[#4f0606]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <>
              {notifications.length > 1 && (
                <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 dark:border-white/10 dark:bg-white/[0.02] md:flex-row md:items-center md:justify-between">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === notifications.length &&
                        notifications.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-[#620707] focus:ring-[#620707]"
                    />

                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {selectedIds.size > 0
                        ? `${selectedIds.size} selected`
                        : 'Select all notifications'}
                    </span>
                  </label>

                  {selectedIds.size > 0 && (
                    <span className="rounded-full bg-[#620707]/10 px-4 py-2 text-xs font-semibold text-[#620707] dark:bg-[#620707]/20 dark:text-red-200">
                      Bulk action enabled
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="group flex gap-3 rounded-3xl border border-transparent p-1 transition-all duration-300 hover:border-slate-200 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/[0.02]"
                  >
                    {notifications.length > 1 && (
                      <div className="pt-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(
                            notification.id
                          )}
                          onChange={() =>
                            handleSelectOne(notification.id)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-[#620707] focus:ring-[#620707]"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <NotificationCard
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        onView={(notification) => {
                          setSelectedNotification(notification);
                          setIsModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* PAGINATION */}
        {!loading &&
          pagination &&
          pagination.total &&
          pagination.total > (notifications.length || 0) && (
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/70 px-5 py-5 dark:border-white/10 dark:bg-white/[0.02] md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Page{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentPage}
                </span>{' '}
                of{' '}
                <span className="font-bold text-slate-900 dark:text-white">
                  {pagination.last_page}
                </span>

                <span className="mx-2 text-slate-300 dark:text-slate-600">
                  •
                </span>

                <span className="font-bold text-slate-900 dark:text-white">
                  {pagination.total}
                </span>{' '}
                notifications
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-[#620707]/30 hover:bg-[#620707]/5 hover:text-[#620707] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[lab(2_5.17_1.85)] dark:text-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <button
                  onClick={() =>
                    setCurrentPage((p) => p + 1)
                  }
                  disabled={
                    currentPage === pagination.last_page
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#620707] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-[#4f0606] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
      </section>

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNotification(null);
        }}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />
    </div>
  );
};