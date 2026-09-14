'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Phone,
  ReceiptText,
  TrendingUp,
  Tv,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { DashboardSkeleton } from '@/components/shared/SkeletonLoader';
import { AdCarousel } from '@/components/dashboard/AdCarousel';
import { AccountsCarousel, UnifiedAccount } from '@/components/dashboard/AccountsCarousel';
import { walletService } from '@/services/wallet.service';
import { transactionService } from '@/services/transaction.service';
import { customerService, DedicatedAccount } from '@/services/customer.service';
import { paymentService } from '@/services/payment.service';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatRelativeTime, formatDate } from '@/utils/format.utils';
import { TRANSACTION_STATUSES, TRANSACTION_TYPES } from '@/utils/constants';
import { VirtualAccount } from '@/types/api.types';

type WalletData = {
  balance: number;
  currency?: string;
  total_spent?: number;
};

type TransactionData = {
  id: string | number;
  type?: string;
  transaction_type?: string;
  provider?: string;
  amount: number | string;
  status: string;
  created_at?: string;
  transaction_date?: string;
  reference?: string;
  metadata?: Record<string, any>;
  service_logo?: string | null;
};

// Loose shape covering the fields actually used off a virtual account,
// without assuming everything the real VirtualAccount type declares.
type VirtualAccountFields = {
  id?: string | number;
  account_number?: string;
  account_name?: string;
  bank_name?: string;
  provider?: string;
  currency?: string;
  country_code?: string;
};

const quickActions = [
  {
    href: '/dashboard/airtime',
    label: 'Buy Airtime',
    description: 'Top up any network instantly',
    icon: Phone,
    image:
      'https://api.remopay.remonode.com/transfer_out_ads_banner.png',
  },
  {
    href: '/dashboard/data',
    label: 'Buy Data',
    description: 'Activate data plans in seconds',
    icon: Wifi,
    image:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    href: '/dashboard/bills',
    label: 'Pay Bills',
    description: 'Electricity, utilities and tokens',
    icon: Zap,
    image:
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    href: '/dashboard/tv',
    label: 'TV Subscription',
    description: 'Renew DSTV, GOtv and more',
    icon: Tv,
    image:
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=1200&q=80',
  },
];

const getTransactionIcon = (type: string, status: string) => {
  const normalizedStatus = status?.toLowerCase?.() || '';

  if (normalizedStatus === 'success') {
    return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
  }

  if (normalizedStatus === 'pending') {
    return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />;
  }

  if (normalizedStatus === 'failed') {
    return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
  }

  return <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#d71927]" />;
};

/** Normalize nested transaction format (basic/financial/timeline) to flat format */
function normalizeTransaction(tx: any): any {
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
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [dedicatedAccount, setDedicatedAccount] = useState<DedicatedAccount | null>(null);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(true);
  const [virtualAccountsLoading, setVirtualAccountsLoading] = useState(true);
  const [virtualAccountsError, setVirtualAccountsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });

  // Fetch customer dedicated account info
  useEffect(() => {
    const fetchAccountInfo = async () => {
      if (!user?.email) return;

      try {
        setAccountLoading(true);
        const response = await customerService.getCurrentUserAccount(user.email);
        if (response.data?.customer?.dedicatedAccount) {
          setDedicatedAccount(response.data.customer.dedicatedAccount);
        }
      } catch (err) {
        console.error('Error fetching dedicated account info:', err);
        // Don't set error state for this - it's optional information
      } finally {
        setAccountLoading(false);
      }
    };

    fetchAccountInfo();
  }, [user?.email]);

  // Fetch virtual accounts (DVA)
  useEffect(() => {
    const fetchVirtualAccounts = async () => {
      try {
        setVirtualAccountsLoading(true);
        setVirtualAccountsError(null);

        const response = await paymentService.getVirtualAccount();
        const accounts = response?.data?.virtual_accounts || [];

        if (Array.isArray(accounts) && accounts.length > 0) {
          setVirtualAccounts(accounts);
        } else {
          setVirtualAccounts([]);
        }
      } catch (err: any) {
        console.error('Error fetching virtual accounts:', err);
        setVirtualAccountsError(err?.message || 'Failed to load virtual accounts');
        setVirtualAccounts([]);
      } finally {
        setVirtualAccountsLoading(false);
      }
    };

    if (user?.id) {
      fetchVirtualAccounts();
    }
  }, [user?.id]);

  // Fetch wallet and transactions (critical data)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [walletRes, transactionsRes] = await Promise.all([
          walletService.getBalance(),
          user?.id
            ? transactionService.getTransactions(String(user.id), {
                page: currentPage,
                per_page: 10,
              })
            : Promise.resolve(null),
        ]);

        if (walletRes?.data) {
          setWallet(walletRes.data as WalletData);
        }

        if (transactionsRes?.data?.transactions) {
          // Normalize nested API format to flat format the table expects
          const normalized = transactionsRes.data.transactions.map(normalizeTransaction);
          setTransactions(normalized);

          if (transactionsRes.data.pagination) {
            setPagination({
              currentPage: transactionsRes.data.pagination.current_page || currentPage,
              lastPage: transactionsRes.data.pagination.last_page || 1,
              total: transactionsRes.data.pagination.total || 0,
              perPage: transactionsRes.data.pagination.per_page || 10,
            });
          }
        } else if (Array.isArray(transactionsRes?.data?.transactions)) {
          setTransactions(transactionsRes.data.transactions);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        // Critical endpoints (wallet + transactions) returning 401 means
        // the token is genuinely expired/invalid — log the user out.
        if (err?.status === 401) {
          await logout();
          return;
        }
        setError('Failed to load dashboard data');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, currentPage, logout]);

  // Merge accounts from both the dedicated-account endpoint and the virtual
  // account (DVA) endpoint into one normalized collection, so the carousel
  // below can render them as a single, seamless set of cards regardless of
  // where each one actually came from. Adding a third source later is just
  // another block pushed into `list` here.
  const unifiedAccounts: UnifiedAccount[] = useMemo(() => {
    const list: UnifiedAccount[] = [];

    if (dedicatedAccount?.account_number) {
      list.push({
        key: `dedicated-${dedicatedAccount.account_number}`,
        source: 'dedicated',
        bankName: dedicatedAccount.bank_name || 'Bank',
        accountNumber: dedicatedAccount.account_number || '',
        accountName: dedicatedAccount.account_name || '',
        currency: 'NGN',
        countryCode: 'NG',
        isPrimary: true,
      });
    }

    virtualAccounts.forEach((account, index) => {
      const acc = account as unknown as VirtualAccountFields;
      list.push({
        key: `virtual-${acc.id ?? acc.account_number ?? index}`,
        source: 'virtual',
        bankName: acc.bank_name || acc.provider || 'Bank',
        accountNumber: acc.account_number || '',
        accountName: acc.account_name || '',
        currency: acc.currency || 'NGN',
        countryCode: (acc.country_code || 'NG').toUpperCase(),
        // Only badge the very first card as "Primary" when there's no
        // dedicated account ahead of it and there's more than one card total.
        isPrimary: !dedicatedAccount && index === 0,
      });
    });

    return list;
  }, [dedicatedAccount, virtualAccounts]);

  const monthlyTransactionsCount = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions.filter((transaction) => {
      const dateStr = transaction.created_at || transaction.transaction_date;
      if (!dateStr) return false;

      const createdAt = new Date(dateStr);

      return (
        createdAt.getMonth() === currentMonth &&
        createdAt.getFullYear() === currentYear
      );
    }).length;
  }, [transactions]);

  const successfulTransactionsCount = useMemo(() => {
    return transactions.filter(
      (transaction) => transaction.status?.toLowerCase() === 'success'
    ).length;
  }, [transactions]);

  const getTransactionTimestamp = (transaction: TransactionData): string => {
    return transaction.created_at || transaction.transaction_date || 'Unknown';
  };

  const getTransactionTypeLabel = (transaction: TransactionData): string => {
    return transaction.transaction_type || transaction.type || 'Transaction';
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusInfo = TRANSACTION_STATUSES[status as keyof typeof TRANSACTION_STATUSES];
    return statusInfo?.color ?? 'secondary';
  };

  const getStatusLabel = (status: string) => {
    const statusInfo = TRANSACTION_STATUSES[status as keyof typeof TRANSACTION_STATUSES];
    return statusInfo?.label ?? status;
  };

  const getServiceName = (transaction: TransactionData): string => {
    const type = transaction.transaction_type || transaction.type;

    return (
      (transaction.metadata as any)?.product_name ||
      (transaction.metadata as any)?.service_type ||
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

        return transaction.provider || '—';
      })()
    );
  };

  const handleRetryVirtualAccounts = () => {
    setVirtualAccountsLoading(true);
    setVirtualAccountsError(null);

    paymentService
      .getVirtualAccount()
      .then((res) => {
        const accounts = res?.data?.virtual_accounts || [];
        if (Array.isArray(accounts) && accounts.length > 0) {
          setVirtualAccounts(accounts);
        } else {
          setVirtualAccounts([]);
        }
      })
      .catch((err) => {
        console.error('Error retrying virtual accounts:', err);
        setVirtualAccountsError(err?.message || 'Failed to load accounts');
      })
      .finally(() => setVirtualAccountsLoading(false));
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 md:space-y-8">
      <section className="relative overflow-hidden bg-[#140404]  text-white ">
        <div className="absolute right-0 top-0 h-48 w-48 sm:h-60 sm:w-60 md:h-72 md:w-72 rounded-full bg-[#d71927]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 sm:h-60 sm:w-60 md:h-72 md:w-72 rounded-full bg-[#ff737b]/10 blur-3xl" />

        <div className="relative grid gap-6 sm:gap-7 md:gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="hidden lg:block">
            <p className="caption font-semibold text-[#ff737b]">Welcome back</p>

            <h1 className="mt-2 h2">
              Hi {user?.first_name || 'there'}, manage your Remopay.
            </h1>

            <p className="mt-3 max-w-2xl body-sm text-white/65">
              Buy airtime, data, pay bills, track your transactions and manage
              your payment activities from one clean dashboard.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/airtime"
                className="inline-flex items-center gap-2 rounded-xl bg-[#d71927] px-5 py-3 button-md text-white shadow-lg shadow-[#d71927]/25 hover:bg-[#b91420]"
              >
                Start Transaction
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/dashboard/history"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 button-md text-white hover:bg-white/15"
              >
                View History
              </Link>
            </div>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/10 p-4 sm:p-5 backdrop-blur">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Top Left - Balance */}
              <div className="col-span-2">
                <p className="caption font-semibold text-white/55">Available Balance</p>
                <h2 className="mt-1.5 text-2xl sm:text-3xl font-black">
                  {wallet ? formatCurrency(wallet.balance, wallet.currency) : '₦0.00'}
                </h2>
              </div>

              {/* Accounts — dedicated account + virtual accounts, rendered as
                  one unified, swipeable/scrollable card collection */}
              <div className="col-span-2 border-t border-white/10 pt-3 space-y-2.5">
                <p className="text-[11px] font-semibold text-white/35 uppercase tracking-wider">Your Accounts</p>
                <AccountsCarousel
                  accounts={unifiedAccounts}
                  isLoadingPrimary={accountLoading && unifiedAccounts.length === 0}
                  isLoadingMore={virtualAccountsLoading}
                  error={virtualAccountsError}
                  isDarkTheme={true}
                  onRetry={handleRetryVirtualAccounts}
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Advertisements Carousel */}
      <section>
        <AdCarousel platform="web" limit={10} autoPlay={true} autoPlayInterval={6000} />
      </section>

      <section>
        <div className="mb-4 sm:mb-5 flex items-center justify-between">
          <div>
            <h2 className="h3 text-gray-950">Quick Actions</h2>
            <p className="mt-1 body-sm text-gray-500">
              Complete your most common Remopay transactions faster.
            </p>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-5 overflow-x-auto sm:grid sm:grid-cols-2 xl:grid-cols-4 pb-2 -mx-6 px-6 sm:mx-0 sm:px-0">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group min-w-[calc(100vw-2rem)] sm:min-w-fit overflow-hidden rounded-2xl sm:rounded-3xl border border-[#d71927]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#d71927]/10"
              >
                <div className="relative h-28 sm:h-32 md:h-36 overflow-hidden">
                  <img
                    src={action.image}
                    alt={action.label}
                    className="h-full w-full object-cover brightness-95 contrast-110 saturate-110 transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-[#d71927] text-white shadow-lg">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="h5 font-bold text-gray-950">{action.label}</h3>
                  <p className="mt-2 body-sm text-gray-500">
                    {action.description}
                  </p>

                  <div className="mt-4 sm:mt-5 flex items-center justify-between">
                    <span className="button-sm text-[#d71927]">Continue</span>
                    <ArrowRight className="h-4 w-4 text-[#d71927] transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <Card className="overflow-hidden rounded-2xl sm:rounded-3xl border border-[#d71927]/10 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:gap-4 border-b border-gray-100 p-4 sm:p-5 md:p-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">Recent Transactions</h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Track your latest Remopay activities and payment records.
              </p>
            </div>

            <Link
              href="/dashboard/history"
              className="inline-flex items-center gap-2 rounded-xl border border-[#d71927]/15 px-4 py-2 text-sm font-black text-[#d71927] hover:bg-[#fff1f2]"
            >
              View All
              <ArrowRight size={15} />
            </Link>
          </div>

          {error ? (
            <div className="p-6 sm:p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-7 w-7 sm:h-8 sm:w-8 text-red-500" />
              <p className="font-semibold text-gray-900">{error}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 sm:p-10 text-center">
              <ReceiptText className="mx-auto mb-4 h-9 w-9 sm:h-10 sm:w-10 text-gray-300" />
              <h3 className="font-black text-gray-950">No transactions yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Your transaction history will appear here once you start using Remopay.
              </p>
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
                    {transactions.map((transaction) => {
                      const typeLabel = getTransactionTypeLabel(transaction);
                      const serviceName = getServiceName(transaction);
                      const timestamp = getTransactionTimestamp(transaction);
                      const statusVariant = getStatusBadgeVariant(transaction.status);
                      const statusLabel = getStatusLabel(transaction.status);

                      return (
                        <tr
                          key={transaction.id}
                          className="border-b border-black/5 cursor-pointer transition-colors hover:bg-[#fff8f8]"
                          onClick={() => router.push(`/dashboard/history/${transaction.id}`)}
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-[#111]">
                            {formatDate(
                              timestamp && timestamp !== 'Unknown' ? timestamp : new Date().toISOString()
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="inline-flex rounded-full bg-[#f0f0f0] px-3 py-1 text-sm font-black capitalize text-[#333]">
                              {typeLabel}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm font-semibold capitalize text-[#111]">
                            {serviceName}
                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-black/50">
                            {transaction.reference || `TXN-${transaction.id}`}
                          </td>

                          <td className="px-6 py-4 text-right text-sm font-black text-[#111]">
                            {formatCurrency(Number(transaction.amount))}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <Badge variant={statusVariant as any}>
                              {statusLabel}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-4 lg:hidden">
                {transactions.map((transaction) => {
                  const typeLabel = getTransactionTypeLabel(transaction);
                  const serviceName = getServiceName(transaction);
                  const timestamp = getTransactionTimestamp(transaction);
                  const statusVariant = getStatusBadgeVariant(transaction.status);
                  const statusLabel = getStatusLabel(transaction.status);

                  return (
                    <div
                      key={transaction.id}
                      className="rounded-[22px] border border-black/5 bg-[#f8f8f8] p-4 cursor-pointer transition-colors hover:bg-[#fff8f8]"
                      onClick={() => router.push(`/dashboard/history/${transaction.id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-black capitalize text-[#111]">
                            {typeLabel}
                          </p>
                          <p className="mt-1 text-sm font-medium text-black/50">
                            {serviceName || 'Service transaction'}
                          </p>
                        </div>

                        <Badge variant={statusVariant as any}>
                          {statusLabel}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-black/35">
                            Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#111]">
                            {formatDate(
                              timestamp && timestamp !== 'Unknown' ? timestamp : new Date().toISOString()
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-black/35">
                            Amount
                          </p>
                          <p className="mt-1 text-sm font-black text-[#111]">
                            {formatCurrency(Number(transaction.amount))}
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
                  );
                })}
              </div>

              {pagination.lastPage > 1 && (
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
                      <button
                        type="button"
                        disabled={pagination.currentPage <= 1}
                        onClick={() => setCurrentPage(1)}
                        className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-[#111] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
                      >
                        First
                      </button>

                      <button
                        type="button"
                        disabled={pagination.currentPage <= 1}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className="h-10 rounded-lg border border-black/10 bg-white px-3 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
                      >
                        <ChevronLeft size={16} className="text-[#111]" />
                      </button>

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
                                onClick={() => setCurrentPage(pageNum)}
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

                      <button
                        type="button"
                        disabled={pagination.currentPage >= pagination.lastPage}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, pagination.lastPage)
                          )
                        }
                        className="h-10 rounded-lg border border-black/10 bg-white px-3 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
                      >
                        <ChevronRight size={16} className="text-[#111]" />
                      </button>

                      <button
                        type="button"
                        disabled={pagination.currentPage >= pagination.lastPage}
                        onClick={() => setCurrentPage(pagination.lastPage)}
                        className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-[#111] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
                      >
                        Last
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </Card>
      </section>
    </div>
  );
}