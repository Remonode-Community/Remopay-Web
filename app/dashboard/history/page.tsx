'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Filter,
  ReceiptText,
} from 'lucide-react';
import { FilterPanel, type FilterField } from '@/components/shared/FilterPanel';
import { useFilters } from '@/hooks/useFilters';

import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Spinner } from '@/components/shared/Spinner';
import { Select } from '@/components/shared/Select';
import {
  transactionService,
  ExtendedTransaction,
} from '@/services/transaction.service';
import {
  TableRowSkeleton,
  MobileCardSkeleton,
  FilterSkeleton,
} from '@/components/shared/Skeleton';
import { formatCurrency, formatDate } from '@/utils/format.utils';
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from '@/utils/constants';

type TransactionStatusKey = keyof typeof TRANSACTION_STATUSES;
type TransactionTypeKey = keyof typeof TRANSACTION_TYPES;

type TransactionItem = ExtendedTransaction;

type TransactionsResponse = {
  success: boolean;
  message: string;
  data?: {
    transactions?: TransactionItem[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  };
};

type FiltersState = {
  status: string;
  type: string;
  search: string;
};

const INITIAL_FILTERS: FiltersState = {
  status: '',
  type: '',
  search: '',
};

// Filter configuration for FilterPanel component
const HISTORY_FILTER_FIELDS: FilterField[] = [
  {
    id: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by ID, provider, reference...',
    helpText: 'Search transaction by ID or reference number',
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All Statuses',
    options: [
      { value: '', label: 'All Statuses' },
      { value: 'success', label: 'Success' },
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'failed', label: 'Failed' },
    ],
  },
  {
    id: 'type',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'All Types',
    options: [
      { value: '', label: 'All Types' },
      { value: 'Airtime Recharge', label: 'Airtime Recharge' },
      { value: 'Wallet Funding', label: 'Wallet Funding' },
      { value: 'Airtime Conversion', label: 'Airtime Conversion' },
      { value: 'Bills', label: 'Bills' },
    ],
  },
];

function getStatusBadgeVariant(status: string) {
  const normalized = status as TransactionStatusKey;
  return TRANSACTION_STATUSES[normalized]?.color ?? 'secondary';
}

function getStatusLabel(status: string) {
  const normalized = status as TransactionStatusKey;
  return TRANSACTION_STATUSES[normalized]?.label ?? status;
}

function getServiceName(transaction: TransactionItem) {
  const type = transaction.transaction_type || transaction.type;

  return (
    transaction.metadata?.product_name ||
    transaction.metadata?.service_type ||
    (() => {
      if (type === 'Wallet Funding' || type === 'wallet_topup') {
        return 'Wallet Funding';
      }

      if (type === 'Airtime Conversion' || type === 'airtime_conversion') {
        return 'Airtime Conversion';
      }

      // Check if type indicates a transfer
      if (type) {
        const typeLower = type.toLowerCase();
        if (
          typeLower === 'transfer' ||
          typeLower === 'withdrawal' ||
          typeLower === 'withdraw' ||
          typeLower === 'bank_transfer' ||
          typeLower === 'wallet_withdrawal' ||
          typeLower.includes('transfer') ||
          typeLower.includes('withdrawal')
        ) {
          return 'Transfer';
        }
      }

      return '—';
    })()
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 15,
  });

  // Use the standardized filter hook
  const {
    isOpen,
    filters,
    hasActiveFilters,
    getActiveFilterCount,
    openFilters,
    closeFilters,
    applyFilters,
    resetFilters,
  } = useFilters({
    fields: HISTORY_FILTER_FIELDS,
    initialFilters: INITIAL_FILTERS,
    onFiltersChange: () => {
      setPage(1); // Reset to page 1 when filters change
    },
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        const res: TransactionsResponse =
          await transactionService.getTransactions(String(user.id), {
            page,
            per_page: 15,
            status: filters.status || undefined,
            type: filters.type || undefined,
            search: filters.search || undefined,
          });

        const payload = res?.data;

        // Normalize nested format (basic/financial/timeline) to flat format
        const rawTransactions = payload?.transactions ?? [];
        const normalized = Array.isArray(rawTransactions)
          ? rawTransactions.map((tx: any) => {
              if (tx.basic) {
                return {
                  ...tx,
                  id: tx.basic.id ?? tx.id,
                  user_id: tx.user?.id ?? tx.user_id ?? 0,
                  transaction_type: tx.basic.transaction_type ?? tx.transaction_type ?? '',
                  amount: tx.financial?.amount ?? tx.amount ?? 0,
                  status: tx.basic.status ?? tx.status ?? '',
                  transaction_date: tx.timeline?.transaction_date ?? tx.transaction_date ?? '',
                  reference: tx.basic.reference ?? tx.reference ?? '',
                  service_logo: tx.basic.service_logo ?? tx.service_logo ?? null,
                };
              }
              return tx;
            })
          : [];
        setTransactions(normalized);
        setPagination({
          currentPage: payload?.pagination?.current_page ?? page,
          lastPage: payload?.pagination?.last_page ?? 1,
          total: payload?.pagination?.total ?? 0,
          perPage: payload?.pagination?.per_page ?? 15,
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
        setPagination({
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 15,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, filters, user?.id]);

  const isInitialLoading = loading && transactions.length === 0;
  const isPaginationLoading = loading && transactions.length > 0;

  return (
    <div className="space-y-8">
      <Card className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_10px_35px_rgba(16,3,3,0.05)] sm:p-6">
        {isInitialLoading ? (
          <FilterSkeleton />
        ) : (
          <>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#111]">
                  Transactions
                </h2>
                <p className="mt-1 text-sm font-medium text-black/50">
                  View and manage your transaction history.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={openFilters}
                  className={`relative h-11 rounded-xl px-5 font-black transition ${
                    hasActiveFilters
                      ? 'bg-[#d71927] text-white shadow-lg shadow-[#d71927]/20 hover:bg-[#b91521]'
                      : 'border border-black/10 text-[#111] hover:bg-[#f8f8f8]'
                  }`}
                >
                  <Filter className="mr-2 h-4 w-4 inline" />
                  Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-black/10 px-5 font-black text-[#111] hover:bg-[#f8f8f8]"
                >
                  <ArrowDownToLine size={16} />
                  Export
                </Button>
              </div>
            </div>

            {/* Standardized FilterPanel component */}
            <FilterPanel
              title="Filter Transactions"
              description="Search and narrow down your transaction records."
              fields={HISTORY_FILTER_FIELDS}
              isOpen={isOpen}
              onClose={closeFilters}
              onApply={applyFilters}
              onReset={resetFilters}
              isLoading={loading}
              position="right"
              mobilePosition="auto"
            />
          </>
        )}
      </Card>

      <Card className="overflow-hidden rounded-[28px] border border-black/5 bg-white p-0 shadow-[0_10px_35px_rgba(16,3,3,0.05)]">
        <div className="border-b border-black/5 px-6 py-5">
          <h2 className="text-2xl font-black tracking-tight text-[#111]">
            Transaction Records
          </h2>
          <p className="mt-1 text-sm font-medium text-black/50">
            A full list of your recent transaction activity.
          </p>
        </div>

        {loading && transactions.length === 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-black/5 bg-[#f8f8f8]">
                    {[
                      'Date',
                      'Transaction Type',
                      'Service',
                      'Reference',
                      'Amount',
                      'Status',
                    ].map((head) => (
                      <th
                        key={head}
                        className={`px-6 py-4 text-xs font-black uppercase tracking-wide text-black/40 ${
                          head === 'Amount'
                            ? 'text-right'
                            : head === 'Status'
                              ? 'text-center'
                              : 'text-left'
                        }`}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              {[...Array(5)].map((_, i) => (
                <MobileCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : transactions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#fff1f2]">
              <ReceiptText className="h-8 w-8 text-[#d71927]" />
            </div>

            <h3 className="mt-5 text-xl font-black text-[#111]">
              No transactions found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-black/50">
              We could not find any transaction matching your current filters.
              Try adjusting the search terms or resetting the filters.
            </p>

            {hasActiveFilters ? (
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={resetFilters}
                  className="h-11 rounded-xl bg-[#d71927] px-6 font-black text-white shadow-lg shadow-[#d71927]/20 hover:bg-[#b91521]"
                >
                  Clear Filters
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-black/5 bg-[#f8f8f8]">
                    {[
                      'Date',
                      'Transaction Type',
                      'Service',
                      'Reference',
                      'Amount',
                      'Status',
                    ].map((head) => (
                      <th
                        key={head}
                        className={`px-6 py-4 text-xs font-black uppercase tracking-wide text-black/40 ${
                          head === 'Amount'
                            ? 'text-right'
                            : head === 'Status'
                              ? 'text-center'
                              : 'text-left'
                        }`}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-black/5 cursor-pointer transition-colors hover:bg-[#fff8f8]"
                      onClick={() => router.push(`/dashboard/history/${transaction.id}`)}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-[#111]">
                        {formatDate(
                          transaction.transaction_date || transaction.created_at
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="inline-flex rounded-full bg-gray px-3 py-1 text-sm font-black capitalize text-gray">
                          {transaction.transaction_type ||
                            transaction.type ||
                            'Transaction'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold capitalize text-[#111]">
                        {getServiceName(transaction)}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-black/50">
                        {transaction.reference || `TXN-${transaction.id}`}
                      </td>

                      <td className="px-6 py-4 text-right text-sm font-black text-[#111]">
                        {formatCurrency(transaction.amount)}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Badge
                          variant={getStatusBadgeVariant(transaction.status) as any}
                        >
                          {getStatusLabel(transaction.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-[22px] border border-black/5 bg-[#f8f8f8] p-4 cursor-pointer transition-colors hover:bg-[#fff8f8]"
                  onClick={() => router.push(`/dashboard/history/${transaction.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-black capitalize text-[#111]">
                        {transaction.transaction_type ||
                          transaction.type ||
                          'Transaction'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-black/50">
                        {getServiceName(transaction) || 'Service transaction'}
                      </p>
                    </div>

                    <Badge
                      variant={getStatusBadgeVariant(transaction.status) as any}
                    >
                      {getStatusLabel(transaction.status)}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-black/35">
                        Date
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#111]">
                        {formatDate(
                          transaction.transaction_date || transaction.created_at
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-black/35">
                        Amount
                      </p>
                      <p className="mt-1 text-sm font-black text-[#111]">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs font-black uppercase tracking-wide text-black/35">
                        Reference
                      </p>
                      <p className="mt-1 break-all text-sm font-medium text-black/50">
                        {transaction.reference || `TXN-${transaction.id}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-col gap-4 rounded-[24px] border border-black/5 bg-white px-6 py-5 shadow-[0_8px_30px_rgba(16,3,3,0.05)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-medium text-black/50">
            Showing{' '}
            <span className="font-black text-[#111]">
              {pagination.total === 0
                ? 0
                : (pagination.currentPage - 1) * pagination.perPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-black text-[#111]">
              {Math.min(
                pagination.currentPage * pagination.perPage,
                pagination.total
              )}
            </span>{' '}
            of{' '}
            <span className="font-black text-[#111]">{pagination.total}</span>{' '}
            transactions
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pagination.currentPage <= 1 || isPaginationLoading}
              onClick={() => setPage(1)}
              className="h-10 rounded-lg border-black/10 px-3 text-sm font-black hover:bg-[#fff1f2]"
            >
              First
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={pagination.currentPage <= 1 || isPaginationLoading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="h-10 rounded-lg border-black/10 px-3 hover:bg-[#fff1f2]"
            >
              <ChevronLeft size={16} />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(pagination.lastPage, 5) },
                (_, i) => {
                  let pageNum;

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
                      onClick={() => setPage(pageNum)}
                      disabled={isPaginationLoading}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black transition-colors ${
                        pageNum === pagination.currentPage
                          ? 'bg-[#d71927] text-white shadow-lg shadow-[#d71927]/20'
                          : 'border border-black/10 bg-white text-[#111] hover:bg-[#fff1f2]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={
                pagination.currentPage >= pagination.lastPage ||
                isPaginationLoading
              }
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, pagination.lastPage))
              }
              className="h-10 rounded-lg border-black/10 px-3 hover:bg-[#fff1f2]"
            >
              <ChevronRight size={16} />
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={
                pagination.currentPage >= pagination.lastPage ||
                isPaginationLoading
              }
              onClick={() => setPage(pagination.lastPage)}
              className="h-10 rounded-lg border-black/10 px-3 text-sm font-black hover:bg-[#fff1f2]"
            >
              Last
            </Button>
          </div>
        </div>

        {isPaginationLoading ? (
          <div className="flex items-center gap-2 text-sm font-black text-[#d71927]">
            <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-[#d71927]" />
            Loading transactions...
          </div>
        ) : null}
      </div>
    </div>
  );
}