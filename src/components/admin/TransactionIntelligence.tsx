'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/utils/format.utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BarChart3,
  X,
  CalendarDays,
} from 'lucide-react';

/* ────────── Types ────────── */

interface Transaction {
  id: string | number;
  user_id: number;
  transaction_type: string;
  amount: string | number;
  status: string;
  transaction_date: string;
  reference: string;
  user?: { id: number; first_name: string; last_name: string; email: string };
}

interface UniqueUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  transaction_count: number;
  total_volume: number;
}

interface Aggregates {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  reversed: number;
  total_volume: number;
  success_volume: number;
  failed_volume: number;
  pending_volume: number;
  avg_value: number;
  success_rate: number;
  failure_rate?: number;
  reversal_rate?: number;
  unique_users: number;
  unique_users_list: UniqueUser[];
  by_type: { type: string; count: number; volume: number }[];
  by_status: { status: string; count: number; volume: number }[];
  daily_trend: { date: string; count: number; volume: number }[];
  hourly: { hour: number; label: string; count: number; volume: number }[];
}

interface TransactionIntelligenceProps {
  transactions: Transaction[];
  aggregates?: Aggregates | null;
  activeDateRange?: string;
  onDateRangeChange?: (range: { date_from?: string; date_to?: string; label: string }) => void;
}

/* ────────── Date Range Presets ────────── */

type DateRangePreset = { label: string; key: string; getDateRange: () => { date_from: string; date_to: string } };

function getDateRangePresets(): DateRangePreset[] {
  const today = new Date();
  const toISO = (d: Date) => d.toISOString().split('T')[0];

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const last30 = new Date(today);
  last30.setDate(today.getDate() - 30);

  return [
    {
      label: 'Today',
      key: 'today',
      getDateRange: () => ({ date_from: toISO(today), date_to: toISO(today) }),
    },
    {
      label: 'Yesterday',
      key: 'yesterday',
      getDateRange: () => {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        return { date_from: toISO(y), date_to: toISO(y) };
      },
    },
    {
      label: 'This Week',
      key: 'this_week',
      getDateRange: () => ({ date_from: toISO(startOfWeek), date_to: toISO(today) }),
    },
    {
      label: 'This Month',
      key: 'this_month',
      getDateRange: () => ({ date_from: toISO(startOfMonth), date_to: toISO(today) }),
    },
    {
      label: 'Last 30 Days',
      key: 'last_30',
      getDateRange: () => ({ date_from: toISO(last30), date_to: toISO(today) }),
    },
    {
      label: 'This Year',
      key: 'this_year',
      getDateRange: () => ({ date_from: toISO(startOfYear), date_to: toISO(today) }),
    },
  ];
}

/* ────────── Color Tokens ────────── */

const COLORS = {
  red: '#d71927',
  green: '#10b981',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  rose: '#f43f5e',
  gray: '#6b7280',
  border: '#e5e7eb',
};

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  success: { color: COLORS.green, label: 'Success', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { color: COLORS.green, label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { color: COLORS.red, label: 'Failed', bg: 'bg-red-50 text-red-700 border-red-200' },
  pending: { color: COLORS.amber, label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  reversed: { color: COLORS.purple, label: 'Reversed', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  refunded: { color: COLORS.blue, label: 'Refunded', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const TYPE_COLORS = [COLORS.red, COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.cyan, COLORS.rose, COLORS.gray];

/* ────────── Helpers ────────── */

function groupByDate(txns: Transaction[]) {
  const map: Record<string, { count: number; volume: number }> = {};
  txns.forEach((t) => {
    const d = new Date(t.transaction_date);
    if (isNaN(d.getTime())) return;
    const key = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    if (!map[key]) map[key] = { count: 0, volume: 0 };
    map[key].count += 1;
    map[key].volume += Number(t.amount) || 0;
  });
  return Object.entries(map)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function groupByType(txns: Transaction[]) {
  const map: Record<string, { count: number; volume: number }> = {};
  txns.forEach((t) => {
    const type = (t.transaction_type || 'Unknown').replace(/_/g, ' ');
    if (!map[type]) map[type] = { count: 0, volume: 0 };
    map[type].count += 1;
    map[type].volume += Number(t.amount) || 0;
  });
  return Object.entries(map)
    .map(([type, data]) => ({ type, ...data }))
    .sort((a, b) => b.volume - a.volume);
}

/* ────────── Sub-components ────────── */

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  onClick,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  accent?: boolean;
}) {
  const trendColors = { up: 'text-emerald-600', down: 'text-red-600', neutral: 'text-gray-400' };
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-start justify-between rounded-xl border bg-white p-4 sm:p-5 text-left transition-all ${
        accent
          ? 'border-[#d71927]/20 hover:border-[#d71927]/40 hover:shadow-md'
          : 'border-[#e5e7eb] hover:border-[#d71927]/20 hover:shadow-md'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">{label}</p>
        <p className="mt-1.5 text-xl font-extrabold text-[#111827] sm:text-2xl tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-[#6b7280]">{sub}</p>}
      </div>
      <div className={`ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
        accent ? 'bg-[#d71927]/10 group-hover:bg-[#d71927]/15' : 'bg-[#f8f8f8] group-hover:bg-[#f0f0f0]'
      }`}>
        <Icon className={`h-5 w-5 ${trend ? trendColors[trend] : accent ? 'text-[#d71927]' : 'text-[#6b7280]'}`} />
      </div>
    </button>
  );
}

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-[#111827] mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-[#6b7280]">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color || COLORS.red }} />
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ message = 'No data for this period', height = 'h-[300px]' }: { message?: string; height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center`}>
      <div className="text-center">
        <BarChart3 className="mx-auto mb-2 h-8 w-8 text-gray-200" />
        <p className="text-sm font-medium text-[#9ca3af]">{message}</p>
      </div>
    </div>
  );
}

function UniqueUsersModal({ users, onClose }: { users: UniqueUser[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Active Users</h3>
            <p className="text-xs text-[#6b7280] mt-0.5">{users.length} unique transactor{users.length !== 1 ? 's' : ''} in this period</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100 transition" type="button">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] p-3 hover:bg-[#f8f8f8] transition">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d71927]/8 text-[#d71927] text-xs font-bold shrink-0">
                  {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-[11px] text-[#6b7280] truncate">{user.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#111827] tabular-nums">{user.transaction_count}</p>
                  <p className="text-[11px] text-[#6b7280]">{formatCurrency(user.total_volume)}</p>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-8 text-center text-sm text-[#9ca3af]">No user data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────── Main Component ────────── */

export function TransactionIntelligence({ transactions, aggregates, activeDateRange = 'all', onDateRangeChange }: TransactionIntelligenceProps) {
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [chartMetric, setChartMetric] = useState<'count' | 'volume'>('count');

  const dateRangePresets = useMemo(() => getDateRangePresets(), []);

  const metrics = useMemo(() => {
    if (aggregates) {
      return {
        total: aggregates.total,
        successful: aggregates.successful,
        failed: aggregates.failed,
        pending: aggregates.pending,
        reversed: aggregates.reversed,
        totalVolume: aggregates.total_volume,
        successVolume: aggregates.success_volume,
        failedVolume: aggregates.failed_volume,
        pendingVolume: aggregates.pending_volume,
        avgValue: aggregates.avg_value,
        successRate: aggregates.success_rate,
        failureRate: aggregates.failure_rate ?? (aggregates.total > 0 ? Math.round((aggregates.failed / aggregates.total) * 1000) / 10 : 0),
        reversalRate: aggregates.reversal_rate ?? (aggregates.total > 0 ? Math.round((aggregates.reversed / aggregates.total) * 1000) / 10 : 0),
        uniqueUsers: aggregates.unique_users,
        uniqueUsersList: aggregates.unique_users_list || [],
      };
    }

    const total = transactions.length;
    const successful = transactions.filter((t) => t.status === 'success' || t.status === 'completed');
    const failed = transactions.filter((t) => t.status === 'failed');
    const pending = transactions.filter((t) => t.status === 'pending');
    const reversed = transactions.filter((t) => t.status === 'reversed');
    const totalVolume = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const successVolume = successful.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const failedVolume = failed.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const pendingVolume = pending.reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const userMap = new Map<number, { count: number; volume: number }>();
    transactions.forEach((t) => {
      const prev = userMap.get(t.user_id) || { count: 0, volume: 0 };
      userMap.set(t.user_id, { count: prev.count + 1, volume: prev.volume + (Number(t.amount) || 0) });
    });

    const uniqueUsersList: UniqueUser[] = [];
    userMap.forEach((data, userId) => {
      const txn = transactions.find((t) => t.user_id === userId);
      if (txn?.user) {
        uniqueUsersList.push({
          id: txn.user.id,
          first_name: txn.user.first_name,
          last_name: txn.user.last_name,
          email: txn.user.email,
          transaction_count: data.count,
          total_volume: data.volume,
        });
      }
    });

    return {
      total, successful: successful.length, failed: failed.length, pending: pending.length,
      reversed: reversed.length, totalVolume, successVolume, failedVolume, pendingVolume,
      avgValue: total > 0 ? totalVolume / total : 0,
      successRate: total > 0 ? (successful.length / total) * 100 : 0,
      failureRate: total > 0 ? (failed.length / total) * 100 : 0,
      reversalRate: total > 0 ? (reversed.length / total) * 100 : 0,
      uniqueUsers: userMap.size,
      uniqueUsersList,
    };
  }, [transactions, aggregates]);

  /* ── Chart data normalization ── */
  const trendData = useMemo(() => {
    if (aggregates?.daily_trend?.length) return aggregates.daily_trend;
    return groupByDate(transactions);
  }, [aggregates, transactions]);

  const hourlyData = useMemo(() => {
    if (aggregates?.hourly?.length) {
      const byHour = new Map(aggregates.hourly.map((h) => [h.hour, h]));
      return Array.from({ length: 24 }, (_, i) => byHour.get(i) || {
        hour: i,
        label: `${String(i).padStart(2, '0')}:00`,
        count: 0,
        volume: 0,
      });
    }
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      count: 0,
      volume: 0,
    }));
    transactions.forEach((t) => {
      const d = new Date(t.transaction_date);
      if (!isNaN(d.getTime())) {
        hours[d.getHours()].count += 1;
        hours[d.getHours()].volume += Number(t.amount) || 0;
      }
    });
    return hours;
  }, [aggregates, transactions]);

  const hasHourlyData = hourlyData.some((h) => h.count > 0);

  const typeData = useMemo(() => {
    if (aggregates?.by_type?.length) {
      return aggregates.by_type.map((t) => ({
        type: (t.type || 'Unknown').replace(/_/g, ' '),
        count: t.count,
        volume: t.volume,
      }));
    }
    return groupByType(transactions);
  }, [aggregates, transactions]);

  const statusData = useMemo(() => {
    const raw = aggregates?.by_status || [];
    if (raw.length === 0 && transactions.length > 0) {
      const map: Record<string, { count: number; volume: number }> = {};
      transactions.forEach((t) => {
        const s = t.status || 'unknown';
        if (!map[s]) map[s] = { count: 0, volume: 0 };
        map[s].count += 1;
        map[s].volume += Number(t.amount) || 0;
      });
      return Object.entries(map)
        .filter(([, data]) => data.count > 0)
        .map(([status, data]) => ({
          name: STATUS_CONFIG[status]?.label || status.charAt(0).toUpperCase() + status.slice(1),
          value: data.count,
          volume: data.volume,
          fill: STATUS_CONFIG[status]?.color || COLORS.gray,
        }));
    }
    return raw
      .filter((s) => s.count > 0)
      .map((s) => ({
        name: STATUS_CONFIG[s.status]?.label || s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count,
        volume: s.volume,
        fill: STATUS_CONFIG[s.status]?.color || COLORS.gray,
      }));
  }, [aggregates, transactions]);

  const totalForPercentage = statusData.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-6">
      {/* ── Date Range Quick Select ── */}
      <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <CalendarDays className="h-4 w-4 text-[#6b7280]" />
            <span className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">Period</span>
          </div>
          <div className="h-5 w-px bg-[#e5e7eb] shrink-0" />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onDateRangeChange?.({ date_from: undefined, date_to: undefined, label: 'all' })}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeDateRange === 'all'
                  ? 'bg-[#d71927] text-white shadow-sm'
                  : 'text-[#6b7280] hover:bg-gray-100 hover:text-[#111827]'
              }`}
            >
              All Time
            </button>
            {dateRangePresets.map((preset) => {
              const range = preset.getDateRange();
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => onDateRangeChange?.({ ...range, label: preset.key })}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    activeDateRange === preset.key
                      ? 'bg-[#d71927] text-white shadow-sm'
                      : 'text-[#6b7280] hover:bg-gray-100 hover:text-[#111827]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── KPI Cards Row 1 ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Transactions"
          value={formatNumber(metrics.total)}
          sub={`${formatCurrency(metrics.totalVolume)} volume`}
          icon={BarChart3}
          accent
        />
        <MetricCard
          label="Success Rate"
          value={`${metrics.successRate.toFixed(1)}%`}
          sub={`${formatNumber(metrics.successful)} of ${formatNumber(metrics.total)}`}
          icon={CheckCircle2}
          trend="up"
        />
        <MetricCard
          label="Failed"
          value={formatNumber(metrics.failed)}
          sub={`${formatCurrency(metrics.failedVolume)} value`}
          icon={XCircle}
          trend="down"
        />
        <MetricCard
          label="Pending"
          value={formatNumber(metrics.pending)}
          sub={`${formatCurrency(metrics.pendingVolume)} awaiting`}
          icon={Clock}
        />
      </div>

      {/* ── KPI Cards Row 2 ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Avg Value"
          value={formatCurrency(metrics.avgValue)}
          sub="Per transaction"
          icon={DollarSign}
        />
        <MetricCard
          label="Unique Users"
          value={formatNumber(metrics.uniqueUsers)}
          sub={`${metrics.uniqueUsersList.length} in list — click to view`}
          icon={Users}
          onClick={() => metrics.uniqueUsersList.length > 0 && setShowUsersModal(true)}
        />
        <MetricCard
          label="Reversal Rate"
          value={`${metrics.reversalRate.toFixed(1)}%`}
          sub={`${formatNumber(metrics.reversed)} reversed`}
          icon={Activity}
          trend={metrics.reversalRate > 5 ? 'down' : 'neutral'}
        />
        <MetricCard
          label="Successful Volume"
          value={formatCurrency(metrics.successVolume)}
          sub="Revenue processed"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      {/* ── Volume Trend + Status Donut ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Volume Trend */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 sm:mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Transaction Trend</h3>
              <p className="mt-0.5 text-[11px] text-[#6b7280]">
                {chartMetric === 'count' ? 'Transaction count over time' : 'Volume in Naira over time'}
              </p>
            </div>
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5">
              <button
                type="button"
                onClick={() => setChartMetric('count')}
                className={`rounded-md px-3 py-1 text-[11px] font-bold transition ${
                  chartMetric === 'count' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                Count
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('volume')}
                className={`rounded-md px-3 py-1 text-[11px] font-bold transition ${
                  chartMetric === 'volume' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                Volume
              </button>
            </div>
          </div>
          {trendData.length > 0 ? (
            <div className="h-[260px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.12} />
                      <stop offset="100%" stopColor={COLORS.red} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(v) => {
                      if (typeof v === 'string' && v.includes('-')) {
                        const d = new Date(v);
                        if (!isNaN(d.getTime())) return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
                      }
                      return v;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => chartMetric === 'volume' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    name={chartMetric === 'count' ? 'Transactions' : 'Volume (₦)'}
                    stroke={COLORS.red}
                    strokeWidth={2}
                    fill="url(#gradCount)"
                    dot={{ r: 3, fill: COLORS.red, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: COLORS.red, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No trend data for the selected period" height="h-[260px] sm:h-[300px]" />
          )}
        </div>

        {/* Status Donut */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 sm:p-6">
          <h3 className="mb-1 text-sm font-bold text-[#111827]">Status Breakdown</h3>
          <p className="mb-4 text-[11px] text-[#6b7280]">{statusData.length} status{statusData.length !== 1 ? 'es' : ''}</p>
          {statusData.length > 0 ? (
            <>
              <div className="flex h-[180px] items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <div className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 shadow-xl">
                            <p className="text-xs font-bold text-[#111827]">{payload[0].name}</p>
                            <p className="text-xs text-[#6b7280]">{payload[0].value?.toLocaleString()} transactions</p>
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {statusData.map((s) => {
                  const pct = totalForPercentage > 0 ? ((s.value / totalForPercentage) * 100).toFixed(1) : '0';
                  return (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                        <span className="text-xs font-semibold text-[#111827]">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#111827] tabular-nums">{s.value.toLocaleString()}</span>
                        <span className="text-[10px] text-[#9ca3af] tabular-nums">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyChart message="No status data" height="h-[280px]" />
          )}
        </div>
      </div>

      {/* ── Type Bar + Hourly Pattern ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Volume by Transaction Type */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#111827]">Volume by Transaction Type</h3>
            <p className="mt-0.5 text-[11px] text-[#6b7280]">{typeData.length} type{typeData.length !== 1 ? 's' : ''} recorded</p>
          </div>
          {typeData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                    tickFormatter={(v) => v.length > 18 ? `${v.substring(0, 16)}...` : v}
                  />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-xl">
                          <p className="text-xs font-bold text-[#111827] capitalize">{payload[0].payload.type}</p>
                          <p className="mt-1 text-xs text-[#6b7280]">Volume: {formatCurrency(Number(payload[0].value))}</p>
                          <p className="text-xs text-[#6b7280]">Count: {payload[0].payload.count?.toLocaleString()}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="volume" name="Volume" radius={[0, 4, 4, 0]} barSize={20}>
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No transaction types recorded" height="h-[280px]" />
          )}
        </div>

        {/* Hourly Transaction Pattern */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#111827]">Hourly Transaction Pattern</h3>
            <p className="mt-0.5 text-[11px] text-[#6b7280]">
              {hasHourlyData
                ? `${hourlyData.filter((h) => h.count > 0).length} active hour${hourlyData.filter((h) => h.count > 0).length !== 1 ? 's' : ''}`
                : 'No activity by hour'}
            </p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey={chartMetric}
                  name={chartMetric === 'count' ? 'Transactions' : 'Volume (₦)'}
                  fill={COLORS.red}
                  radius={[3, 3, 0, 0]}
                  barSize={hasHourlyData ? 14 : 8}
                  opacity={hasHourlyData ? 1 : 0.3}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!hasHourlyData && (
            <p className="mt-2 text-center text-[11px] text-[#9ca3af]">No transactions in the selected period</p>
          )}
        </div>
      </div>

      {/* ── Unique Users Modal ── */}
      {showUsersModal && (
        <UniqueUsersModal users={metrics.uniqueUsersList} onClose={() => setShowUsersModal(false)} />
      )}
    </div>
  );
}
