'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Wallet,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Activity,
  Network,
  RefreshCw,
  Zap,
  BarChart3,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts';
import { useAuthStore } from '@/store/auth.store';
import { DashboardSkeleton } from '@/components/shared/SkeletonLoader';
import { formatCurrency } from '@/utils/format.utils';
import { adminService } from '@/services/admin.service';
import { paymentService } from '@/services/payment.service';
import { AdminStatisticsData } from '@/types/vtu.types';
import type {
  WalletBalance,
  MapleradWalletBalancesData,
} from '@/types/maplerad.types';

function formatCompactCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '₦0';
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value.toLocaleString()}`;
}

function formatFullCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '₦0.00';
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatUSDCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type AdminDashboardPeriod = 'day' | 'week' | 'month' | 'year';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<AdminStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<AdminDashboardPeriod>('month');
  const [customRangeEnabled, setCustomRangeEnabled] = useState(false);
  const [startDate, setStartDate] = useState(formatDateInput(new Date()));
  const [endDate, setEndDate] = useState(formatDateInput(new Date()));
  const [providerBalances, setProviderBalances] = useState({ paystack: 0, vtpass: 0, maplerad: 0, telnyx: 0 });
  const [mapleradWallets, setMapleradWallets] = useState<MapleradWalletBalancesData | null>(null);

  const isAdmin = useMemo(() => Boolean(user?.roles?.some((r) => r === 'admin')), [user]);
  const isManager = useMemo(() => Boolean(user?.roles?.some((r) => r === 'manager')), [user]);

  useEffect(() => {
    if (user && !isAdmin) {
      // Managers only have access to the blog & newsletter management area
      if (isManager) {
        router.push('/admin/blog');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isAdmin, isManager, router]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);

        // Determine if custom range is properly configured
        const hasCustomRange = customRangeEnabled && Boolean(startDate) && Boolean(endDate);
        
        // Set period to 'custom' if custom range is enabled, otherwise use selectedPeriod
        const effectivePeriod = hasCustomRange ? 'custom' : selectedPeriod;
        
        // Only pass filters for custom range
        const effectiveFilters = hasCustomRange
          ? { start_date: startDate, end_date: endDate }
          : undefined;

        // Validate custom range
        if (hasCustomRange) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          if (end < start) {
            throw new Error('End date must be greater than or equal to start date');
          }
        }

        const res = await adminService.getAdminDashboardComprehensive(effectivePeriod, effectiveFilters);
        
        if (res.success && res.data) {
          
          setData(res.data);
          setError(null);
        } else {
          setError('Invalid response');
        }
      } catch (err: any) {
        console.error('   Full Error:', err);
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) fetch();
  }, [isAdmin, selectedPeriod, customRangeEnabled, startDate, endDate]);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const balances = { paystack: 0, vtpass: 0, maplerad: 0, telnyx: 0 };

        console.log('💳 [AdminDashboard] Starting provider balance fetches...');

        // Paystack
        try {
          const res = await paymentService.getPaystackBalance();
          const data = Array.isArray(res?.data) ? res.data[0] : null;
          const b = data?.balance || 0;
          balances.paystack = (typeof b === 'string' ? parseFloat(b) : b) / 100;
        } catch (err) {
          console.error('❌ [Paystack] Failed to fetch balance:', err);
        }

        // VTPass
        try {
          const res = await paymentService.getVTPassBalance();
          balances.vtpass = res.code === 1 ? parseFloat(res.contents?.balance || '0') : 0;
        } catch (err) {
          console.error('❌ [VTPass] Failed to fetch balance:', err);
        }

        // Maplerad — Aggregated wallets (Treasury NGN, Treasury USD, Spend USD)
        try {
          const res = await paymentService.getMapleradWalletBalances();
          if (res.success && res.data) {
            setMapleradWallets(res.data);
          }
        } catch (err) {
          console.error('❌ [Maplerad Wallets] Failed to fetch wallet balances:', err);
        }

        // Telnyx
        try {
          const res = await paymentService.getTelnyxBalance();
          balances.telnyx = res.success ? parseFloat(res.data?.available_credit || '0') : 0;
        } catch (err) {
          console.error('❌ [Telnyx] Failed to fetch balance:', err);
        }

        setProviderBalances(balances);
      } catch (err) {
        console.error('❌ [AdminDashboard] Error in fetchBalances:', err);
      }
    };

    fetchBalances();
  }, []);

  if (!isAdmin) return null;
  if (loading) return <div className="px-4 py-6 sm:px-6 lg:px-8"><DashboardSkeleton /></div>;

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
        <Card className="w-full max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-[#6b7280] mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const verifiedRate = data.users.total ? (data.users.verified / data.users.total) * 100 : 0;
  const totalVtuVolume = data.vtu.by_product_type.reduce((sum, p) => sum + (p.total_amount || 0), 0);

  const kpiCards = [
    { label: 'Total Users', value: data.users.total.toLocaleString(), icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'New Users', value: data.users.new.toLocaleString(), icon: Users, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Total Transactions', value: data.performance.total_transactions.toLocaleString(), icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Success Rate', value: `${data.performance.success_rate.toFixed(1)}%`, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'Wallet Balance', value: formatCurrency(data.wallet.total_balance), icon: Wallet, color: 'bg-purple-50 text-purple-600' },
    { label: 'VTU Volume', value: formatCompactCurrency(data.vtu.summary.total_amount), icon: BarChart3, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Commission', value: formatCompactCurrency(data.vtu.summary.total_commission), icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen bg-[#fafafa]">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* Smooth snap-scroll for mobile KPI cards */
        .kpi-scroll::-webkit-scrollbar {
          display: none;
        }
        .kpi-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media (max-width: 639px) {
          .kpi-card-item {
            min-width: 72vw;
            scroll-snap-align: start;
          }
        }
      `}</style>

      <div className="space-y-5 sm:space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827]">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-[#6b7280] mt-1 truncate">{data.period.toUpperCase()} • {data.start_date} — {data.end_date}</p>
          </div>
          <div
            className="flex flex-col gap-3 lg:items-end"
            data-webmcp-form="dashboard-filter"
            role="group"
            aria-label="Dashboard period and date range filter"
          >
            <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 hidden-scrollbar" role="group" aria-label="Period filter options">
              {(['day', 'week', 'month', 'year'] as const).map((p) => (
                <Button
                  key={p}
                  variant={selectedPeriod === p ? 'primary' : 'secondary'}
                  size="sm"
                  className="whitespace-nowrap shrink-0"
                  onClick={() => {
                    setSelectedPeriod(p);
                    setCustomRangeEnabled(false);
                  }}
                  data-webmcp-action={`filter-period-${p}`}
                  aria-pressed={selectedPeriod === p}
                  aria-label={`Filter dashboard data for the ${p}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
              <Button
                variant={customRangeEnabled ? 'primary' : 'secondary'}
                size="sm"
                className="whitespace-nowrap shrink-0"
                onClick={() => setCustomRangeEnabled((value) => !value)}
                data-webmcp-action="toggle-custom-date-range"
                aria-pressed={customRangeEnabled}
                aria-label="Toggle custom date range picker"
              >
                <span className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Custom range</span>
                  <span className="sm:hidden">Range</span>
                </span>
              </Button>
            </div>

            {customRangeEnabled && (
              <div
                className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 rounded-2xl border border-[#e5e7eb] bg-white p-3"
                data-webmcp-form="custom-date-range"
                role="group"
                aria-label="Custom date range selector"
              >
                <div className="flex items-center gap-2">
                  <label htmlFor="start-date-input" className="text-xs text-[#6b7280] whitespace-nowrap">From</label>
                  <input
                    id="start-date-input"
                    type="date"
                    value={startDate}
                    data-webmcp-input="date"
                    aria-label="Start date for dashboard data"
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setStartDate(nextValue);
                      if (!nextValue) return;
                      if (new Date(nextValue) > new Date(endDate)) {
                        setEndDate(nextValue);
                      }
                    }}
                    className="flex-1 min-w-0 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="end-date-input" className="text-xs text-[#6b7280] whitespace-nowrap">To</label>
                  <input
                    id="end-date-input"
                    type="date"
                    value={endDate}
                    data-webmcp-input="date"
                    aria-label="End date for dashboard data"
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setEndDate(nextValue);
                      if (!nextValue) return;
                      if (new Date(startDate) > new Date(nextValue)) {
                        setStartDate(nextValue);
                      }
                    }}
                    className="flex-1 min-w-0 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards - Horizontal scrollable on mobile, grid on desktop */}
        <div className="relative">
          {/* Mobile scroll hint */}
          <div className="flex sm:hidden items-center gap-1.5 mb-2 text-[#6b7280]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            <span className="text-[10px] font-medium tracking-wide uppercase">Swipe to explore</span>
          </div>

          {/* Mobile: horizontal scrollable flex */}
          <div className="flex sm:hidden kpi-scroll overflow-x-auto gap-3 pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="kpi-card-item rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">{kpi.label}</p>
                      <p className="text-xl font-bold text-[#111827] mt-2.5 truncate">{kpi.value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${kpi.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: grid layout */}
          <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="p-5 sm:p-6 rounded-2xl border border-[#e5e7eb]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{kpi.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#111827] mt-2 sm:mt-3 truncate">{kpi.value}</p>
                    </div>
                    <div className={`p-2.5 sm:p-3 rounded-xl ${kpi.color} shrink-0`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* VTU Charts Grid */}
        <AdminDashboardCharts vtuByProduct={data.vtu.by_product_type} vtuByStatus={data.vtu.by_status} walletTransactions={data.wallet.transactions} />

        {/* Provider Balances */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="p-5 sm:p-6 rounded-2xl border border-[#e5e7eb]">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Provider Balances</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
                <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">Paystack</p>
                <p className="font-bold text-sm sm:text-lg mt-1.5 sm:mt-1 text-[#111827]">{formatFullCurrency(providerBalances.paystack)}</p>
              </div>
              <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
                <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">VTPass</p>
                <p className="font-bold text-sm sm:text-lg mt-1.5 sm:mt-1 text-[#111827]">{formatFullCurrency(providerBalances.vtpass)}</p>
              </div>
              <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
                <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">Maplerad</p>
                <p className="font-bold text-sm sm:text-lg mt-1.5 sm:mt-1 text-[#111827]">{formatFullCurrency(providerBalances.maplerad)}</p>
              </div>
              <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
                <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">Telnyx</p>
                <p className="font-bold text-sm sm:text-lg mt-1.5 sm:mt-1 text-[#111827]">{formatUSDCurrency(providerBalances.telnyx)}</p>
              </div>
            </div>
          </Card>

          {/* Maplerad Wallet Balances */}
          <Card className="p-5 sm:p-6 rounded-2xl border border-[#e5e7eb]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold">Maplerad Wallet Balances</h3>
              {mapleradWallets && (
                <span className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">
                  Aggregated
                </span>
              )}
            </div>
            {mapleradWallets ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <WalletBalanceCard
                  label="NGN Wallet"
                  wallet={mapleradWallets.ngn}
                  symbol="₦"
                  formatFn={formatFullCurrency}
                />
                <WalletBalanceCard
                  label="USD Wallet"
                  wallet={mapleradWallets.usd}
                  symbol="$"
                  formatFn={formatUSDCurrency}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
                  <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">NGN Wallet</p>
                  <p className="font-bold text-sm sm:text-lg mt-1.5 sm:mt-1 text-[#d1d5db] italic">Unavailable</p>
                </div>
                <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
                  <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">USD Wallet</p>
                  <p className="font-bold text-sm sm:text-lg mt-1.5 sm:mt-1 text-[#d1d5db] italic">Unavailable</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Summary */}
        <Card className="p-5 sm:p-6 rounded-2xl border border-[#e5e7eb]">
          <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Reporting Period</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
              <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">Period</p>
              <p className="font-bold text-sm sm:text-base mt-1.5 sm:mt-2 text-[#111827]">{data.period.toUpperCase()}</p>
            </div>
            <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
              <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">Start</p>
              <p className="font-bold text-sm sm:text-base mt-1.5 sm:mt-2 text-[#111827]">{data.start_date}</p>
            </div>
            <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
              <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">End</p>
              <p className="font-bold text-sm sm:text-base mt-1.5 sm:mt-2 text-[#111827]">{data.end_date}</p>
            </div>
            <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
              <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">Transactions</p>
              <p className="font-bold text-sm sm:text-base mt-1.5 sm:mt-2 text-[#111827]">{data.vtu.summary.total_transactions}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/** Small helper component to render a single Maplerad wallet balance card */
function WalletBalanceCard({
  label,
  wallet,
  symbol,
  formatFn,
}: {
  label: string;
  wallet: WalletBalance | null;
  symbol: string;
  formatFn: (value: number | null | undefined) => string;
}) {
  if (!wallet) {
    return (
      <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
        <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">{label}</p>
        <p className="font-bold text-sm sm:text-lg mt-1.5 sm:mt-1 text-[#d1d5db] italic">N/A</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] p-3 sm:p-4 rounded-xl">
      <p className="text-[10px] sm:text-xs font-medium text-[#6b7280] uppercase tracking-wide">{label}</p>
      <p className="font-bold text-sm sm:text-lg mt-1.5 sm:mt-1 text-[#111827]">
        {symbol}
        {(wallet.available_balance ?? wallet.balance).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[9px] sm:text-[10px] font-medium text-[#6b7280]">{wallet.currency}</span>
      </div>
    </div>
  );
}
