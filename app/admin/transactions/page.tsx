'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ReceiptText,
} from 'lucide-react';
import { clsx } from 'clsx';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { TransactionIntelligence } from '@/components/admin/TransactionIntelligence';
import { FilterPanel, type FilterField } from '@/components/shared/FilterPanel';
import { useFilters } from '@/hooks/useFilters';
import { Button } from '@/components/shared/Button';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { Modal } from '@/components/shared/Modal';
import { Card } from '@/components/shared/Card';
import type { TransactionUser } from '@/types/api.types';

interface Transaction {
  id: string | number;
  user_id: number;
  transaction_type: string;
  amount: string | number;
  status: string;
  transaction_date: string;
  reference: string;
  metadata?: Record<string, any>;
  user?: TransactionUser;
  transactionable?: Record<string, any>;
  service_logo?: string | null;
}

interface TransactionStats {
  total_transactions?: number;
  total_amount?: number;
  completed_count?: number;
  failed_count?: number;
  pending_count?: number;
}

interface PaginationState {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
}

/** Render a user avatar with initials fallback */
function UserAvatar({ user, size = 'sm' }: { user: TransactionUser; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || '?';

  if (user.profile_photo_url) {
    return (
      <img
        src={user.profile_photo_url}
        alt={`${user.first_name} ${user.last_name}`}
        className={`${sizeClasses} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-[#d71927]/10 text-[#d71927] flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}

/** Status badge with backend status values */
function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
    success:    { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    completed:  { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    failed:     { bg: 'bg-red-100',   text: 'text-red-800',   dot: 'bg-red-500' },
    pending:    { bg: 'bg-yellow-100',text: 'text-yellow-800',dot: 'bg-yellow-500' },
    reversed:   { bg: 'bg-purple-100',text: 'text-purple-800',dot: 'bg-purple-500' },
    refunded:   { bg: 'bg-blue-100',  text: 'text-blue-800',  dot: 'bg-blue-500' },
    delivered:  { bg: 'bg-blue-100',  text: 'text-blue-800',  dot: 'bg-blue-500' },
  };

  const style = statusStyles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} ${style.text} px-3 py-1 text-xs font-medium`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aggregates, setAggregates] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState('all');

  const isAdmin = useMemo(() => {
    return Boolean(user?.roles?.some((role) => role === 'admin'));
  }, [user]);

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  // Define filter fields — matches backend query params
  const filterFields: FilterField[] = [
    {
      id: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Reference, transaction type...',
      helpText: 'Search by reference or transaction type',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'success', label: 'Success' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'reversed', label: 'Reversed' },
        { value: 'refunded', label: 'Refunded' },
      ],
    },
    {
      id: 'transaction_type',
      label: 'Transaction Type',
      type: 'select',
      options: [
        { value: 'VTU Transaction', label: 'VTU Transaction' },
        { value: 'Wallet Funding', label: 'Wallet Funding' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
      ],
    },
    {
      id: 'user_id',
      label: 'Filter by User',
      type: 'user-search',
      placeholder: 'Type name or email to search...',
      helpText: 'Search by name or email to filter transactions',
      searchFn: async (query: string) => {
        try {
          const response = await adminService.searchUsers(query, 10) as any;
          const users = response?.data || [];
          return users.map((u: any) => ({
            id: u.id,
            label: `${u.first_name || ''} ${u.last_name || ''}`.trim() || `User #${u.id}`,
            subtitle: u.email,
          }));
        } catch {
          return [];
        }
      },
    },
    {
      id: 'date_from',
      label: 'From Date',
      type: 'date',
      helpText: 'Filter from this date',
    },
    {
      id: 'date_to',
      label: 'To Date',
      type: 'date',
      helpText: 'Filter to this date',
    },
    {
      id: 'amount_min',
      label: 'Min Amount',
      type: 'number',
      placeholder: '₦0',
      helpText: 'Minimum transaction amount',
    },
    {
      id: 'amount_max',
      label: 'Max Amount',
      type: 'number',
      placeholder: '₦1,000,000',
      helpText: 'Maximum transaction amount',
    },
  ];

  // Use filters hook
  const {
    isOpen,
    filters,
    isLoading: filtersLoading,
    hasActiveFilters,
    openFilters,
    closeFilters,
    applyFilters,
    resetFilters,
    getActiveFilterCount,
  } = useFilters({
    fields: filterFields,
    onFiltersChange: (newFilters) => {
      setCurrentPage(1);
      fetchTransactions(1, newFilters);
    },
  });

  const handleDateRangeChange = useCallback((range: { date_from?: string; date_to?: string; label: string }) => {
    setActiveDateRange(range.label);
    const newFilters: Record<string, any> = { ...filters };
    if (range.date_from) {
      newFilters.date_from = range.date_from;
    } else {
      delete newFilters.date_from;
    }
    if (range.date_to) {
      newFilters.date_to = range.date_to;
    } else {
      delete newFilters.date_to;
    }
    applyFilters(newFilters);
  }, [filters, applyFilters]);

  const handleResetFilters = useCallback(() => {
    setActiveDateRange('all');
    resetFilters();
  }, [resetFilters]);

  const fetchTransactions = async (page = 1, filterValues?: Record<string, any>) => {
    try {
      setIsLoading(true);
      const filtersToUse = filterValues || filters;

      const response = await adminService.getAllTransactions(page, 10, filtersToUse);

      const transactionsData = response?.data?.transactions;
      const paginationData = response?.data?.pagination;
      const aggregatesData = response?.data?.aggregates;

      if (!response?.data) {
        setTransactions([]);
        setAggregates(null);
        return;
      }

      // Normalize transactions from nested format (basic/financial/timeline)
      // to flat format the component expects
      const normalizeTx = (tx: any): Transaction => {
        if (tx.basic) {
          return {
            id: tx.basic.id ?? tx.id,
            user_id: tx.user?.id ?? tx.user_id ?? 0,
            transaction_type: tx.basic.transaction_type ?? tx.transaction_type ?? '',
            amount: tx.financial?.amount ?? tx.amount ?? 0,
            status: tx.basic.status ?? tx.status ?? '',
            transaction_date: tx.timeline?.transaction_date ?? tx.transaction_date ?? '',
            reference: tx.basic.reference ?? tx.reference ?? '',
            metadata: tx.metadata ?? {},
            user: tx.user,
            transactionable: tx.details ? { type: tx.details.type, ...tx.details.data } : tx.transactionable,
            service_logo: tx.basic.service_logo ?? tx.service_logo ?? null,
          };
        }
        return tx as Transaction;
      };

      // Set transactions
      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData.map(normalizeTx));
      } else {
        setTransactions([]);
      }

      // Set pagination
      if (paginationData) {
        setPagination({
          currentPage: paginationData.current_page || page,
          lastPage: paginationData.last_page || 1,
          total: paginationData.total || 0,
          perPage: paginationData.per_page || 10,
        });
      }

      // Use backend aggregates (computed from ALL matching records)
      setAggregates(aggregatesData || null);
    } catch (error) {
      console.error('[AdminTransactions] Error fetching transactions:', error);
      setTransactions([]);
      setAggregates(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]);

  if (!isAdmin) {
    return null;
  }

  const isInitialLoading = isLoading && transactions.length === 0;
  const isPaginationLoading = isLoading && transactions.length > 0;

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-4 text-slate-950 sm:p-6 dark:bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#090707] dark:text-white">
      <AdminHeader
        title="Transactions"
        description="View and manage all platform transactions with user information"
        action={{
          label: 'Export Report',
          onClick: () => console.log('Export report'),
        }}
      />
      {/* Transaction Intelligence Dashboard */}
      <TransactionIntelligence
        transactions={transactions}
        aggregates={aggregates}
        activeDateRange={activeDateRange}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* Filter Button */}
      <div className="flex justify-end">
        <Button
          onClick={openFilters}
          className={clsx(
            'h-11 rounded-xl px-4 font-semibold transition',
            hasActiveFilters
              ? 'bg-[#d71927] text-white shadow-lg shadow-[#d71927]/20 hover:bg-[#b91521]'
              : 'border border-black/10 text-white hover:bg-[#f8f8f8]'
          )}
        >
          <Filter className="h-4 w-4 mr-2 inline" />
          Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
        </Button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        title="Filter Transactions"
        description="Narrow down transactions by status, type, date range, amount, or user"
        fields={filterFields}
        isOpen={isOpen}
        onClose={closeFilters}
        onApply={applyFilters}
        onReset={handleResetFilters}
        isLoading={filtersLoading}
        position="right"
        mobilePosition="auto"
        currentFilters={filters}
      />

      {/* Transactions Section */}
      <Card className="overflow-hidden rounded-2xl border border-[#e5e7eb]">
        <div className="border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
          <h3 className="text-lg font-bold text-[#111827]">All Transactions</h3>
          <p className="text-sm text-[#6b7280] mt-1">
            Showing {pagination.total === 0 ? 0 : (pagination.currentPage - 1) * pagination.perPage + 1}
            {' '}to{' '}
            {Math.min(pagination.currentPage * pagination.perPage, pagination.total)}
            {' '}of{' '}
            <span className="font-semibold text-[#111827]">{pagination.total}</span> transactions
          </p>
        </div>

        {/* Loading State */}
        {isInitialLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#d71927] border-t-transparent" />
              <p className="text-sm font-medium text-[#6b7280]">Loading transactions...</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-12 text-center">
            <ReceiptText className="mb-4 h-10 w-10 text-[#9ca3af]" />
            <h3 className="text-lg font-bold text-[#111827]">No transactions found</h3>
            <p className="mt-2 max-w-md text-sm text-[#6b7280]">
              We could not find any transaction matching your current filters.
              Try adjusting the search terms or resetting the filters.
            </p>
            {hasActiveFilters && (
              <Button variant="outline" className="mt-4" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* ───── Desktop Table ───── */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e5e7eb] bg-[#f8fafc]">
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-[#6b7280]">User</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-[#6b7280]">Reference</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-[#6b7280]">Type</th>
                    <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wide text-[#6b7280]">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-[#6b7280]">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wide text-[#6b7280]">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wide text-[#6b7280]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#fff8f8] transition-colors">
                      <td className="px-6 py-4">
                        {tx.user ? (
                          <div className="flex items-center gap-3 min-w-0 max-w-[260px]">
                            <UserAvatar user={tx.user} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#111827] truncate">
                                {tx.user.first_name} {tx.user.last_name}
                              </p>
                              <p className="text-xs text-[#6b7280] truncate">{tx.user.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-[#6b7280]">User #{tx.user_id}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono font-medium text-[#111827] whitespace-nowrap">
                        {tx.reference}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6b7280] whitespace-nowrap">
                        {tx.transaction_type?.replace(/_/g, ' ') || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#111827] text-right whitespace-nowrap">
                        {formatCurrency(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6b7280] whitespace-nowrap">
                        {formatDate(tx.transaction_date)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-[#d71927]"
                          aria-label={`View details for ${tx.reference}`}
                          title="View transaction details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ───── Mobile Cards ───── */}
            <div className="space-y-4 p-4 lg:hidden">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-[22px] border border-black/5 bg-[#f8f8f8] p-4"
                >
                  {/* Header: User + Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {tx.user ? (
                        <>
                          <UserAvatar user={tx.user} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[#111] truncate">
                              {tx.user.first_name} {tx.user.last_name}
                            </p>
                            <p className="mt-0.5 text-xs text-black/50 truncate">{tx.user.email}</p>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm font-black text-[#111]">User #{tx.user_id}</span>
                      )}
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>

                  {/* Details Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-black/35">Type</p>
                      <p className="mt-1 text-sm font-semibold text-[#111]">
                        {tx.transaction_type?.replace(/_/g, ' ') || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-black/35">Amount</p>
                      <p className="mt-1 text-sm font-black text-[#111]">
                        {formatCurrency(typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-black/35">Date</p>
                      <p className="mt-1 text-sm font-semibold text-[#111]">
                        {formatDate(tx.transaction_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-[#d71927]"
                        aria-label={`View details for ${tx.reference}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Reference */}
                  <div className="mt-3">
                    <p className="text-xs font-black uppercase tracking-wide text-black/35">Reference</p>
                    <p className="mt-1 break-all text-sm font-medium text-black/50 font-mono">
                      {tx.reference || `TXN-${tx.id}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ───── Pagination ───── */}
            {pagination.lastPage > 1 && (
              <div className="flex flex-col gap-4 rounded-b-2xl border-t border-[#e5e7eb] bg-white px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium text-[#6b7280]">
                    Showing{' '}
                    <span className="font-black text-[#111827]">
                      {pagination.total === 0
                        ? 0
                        : (pagination.currentPage - 1) * pagination.perPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-black text-[#111827]">
                      {Math.min(
                        pagination.currentPage * pagination.perPage,
                        pagination.total
                      )}
                    </span>{' '}
                    of{' '}
                    <span className="font-black text-[#111827]">{pagination.total}</span>{' '}
                    transactions
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* First */}
                    <button
                      type="button"
                      disabled={pagination.currentPage <= 1 || isPaginationLoading}
                      onClick={() => setCurrentPage(1)}
                      className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-[#111] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
                    >
                      First
                    </button>

                    {/* Prev */}
                    <button
                      type="button"
                      disabled={pagination.currentPage <= 1 || isPaginationLoading}
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="h-10 rounded-lg border border-black/10 bg-white px-3 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
                    >
                      <ChevronLeft size={16} className="text-[#111]" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(pagination.lastPage, 5) },
                        (_, i) => {
                          let pageNum: number;

                          if (pagination.lastPage <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (
                            pagination.currentPage >=
                            pagination.lastPage - 2
                          ) {
                            pageNum = pagination.lastPage - 4 + i;
                          } else {
                            pageNum = pagination.currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              disabled={isPaginationLoading}
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black transition-colors ${
                                pageNum === pagination.currentPage
                                  ? 'bg-[#d71927] text-white shadow-lg shadow-[#d71927]/20'
                                  : 'border border-black/10 bg-white text-[#111] hover:bg-[#fff1f2]'
                              } disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Next */}
                    <button
                      type="button"
                      disabled={pagination.currentPage >= pagination.lastPage || isPaginationLoading}
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, pagination.lastPage)
                        )
                      }
                      className="h-10 rounded-lg border border-black/10 bg-white px-3 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
                    >
                      <ChevronRight size={16} className="text-[#111]" />
                    </button>

                    {/* Last */}
                    <button
                      type="button"
                      disabled={pagination.currentPage >= pagination.lastPage || isPaginationLoading}
                      onClick={() => setCurrentPage(pagination.lastPage)}
                      className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-[#111] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
                    >
                      Last
                    </button>
                  </div>
                </div>

                {isPaginationLoading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-[#6b7280]">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d71927] border-t-transparent" />
                    Loading...
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Transaction Detail Modal */}
      {showDetails && selectedTransaction && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="Transaction Details"
          size="lg"
        >
          <div className="space-y-5">
            {/* User Info Section */}
            {selectedTransaction.user && (
              <div className="rounded-xl bg-[#f8fafc] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  User Information
                </p>
                <div className="flex items-center gap-4">
                  <UserAvatar user={selectedTransaction.user} size="md" />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 flex-1">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedTransaction.user.first_name} {selectedTransaction.user.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">User ID</p>
                      <p className="text-sm font-semibold text-gray-900">#{selectedTransaction.user_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-700">{selectedTransaction.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-700">{selectedTransaction.user.phone_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Reference</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 font-mono">
                  {selectedTransaction.reference}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <StatusBadge status={selectedTransaction.status} />
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Type</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {selectedTransaction.transaction_type?.replace(/_/g, ' ') || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Amount</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(typeof selectedTransaction.amount === 'string' ? parseFloat(selectedTransaction.amount) : selectedTransaction.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Date</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDate(selectedTransaction.transaction_date)}
                </p>
              </div>
              {selectedTransaction.service_logo && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Service</p>
                  <img
                    src={selectedTransaction.service_logo}
                    alt="Service logo"
                    className="mt-1 h-8 w-8 rounded object-contain"
                  />
                </div>
              )}
            </div>

            {/* Metadata */}
            {selectedTransaction.metadata && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Additional Details</p>
                <pre className="rounded-lg bg-gray-50 p-3 text-xs overflow-auto max-h-[200px] text-gray-900">
                  {JSON.stringify(selectedTransaction.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Transactionable */}
            {selectedTransaction.transactionable && Object.keys(selectedTransaction.transactionable).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Transactionable Data</p>
                <pre className="rounded-lg bg-gray-50 p-3 text-xs overflow-auto max-h-[150px] text-gray-900">
                  {JSON.stringify(selectedTransaction.transactionable, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowDetails(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
