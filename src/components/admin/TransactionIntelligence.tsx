'use client';

import { useMemo } from 'react';
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
  Legend,
} from 'recharts';
import { Card } from '@/components/shared/Card';
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
  ArrowUpRight,
  ArrowDownRight,
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

interface TransactionIntelligenceProps {
  transactions: Transaction[];
  aggregates?: {
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
    failure_rate: number;
    reversal_rate: number;
    unique_users: number;
    by_type: { type: string; count: number; volume: number }[];
    by_status: { status: string; count: number; volume: number }[];
    daily_trend: { date: string; count: number; volume: number }[];
    hourly: { hour: number; count: number; volume: number }[];
  } | null;
}

/* ────────── Color Tokens ────────── */

const COLORS = {
  red: '#d71927',
  redLight: '#fef2f2',
  green: '#10b981',
  greenLight: '#ecfdf5',
  amber: '#f59e0b',
  amberLight: '#fffbeb',
  blue: '#3b82f6',
  blueLight: '#eff6ff',
  purple: '#8b5cf6',
  purpleLight: '#f5f3ff',
  gray: '#6b7280',
  grayLight: '#f9fafb',
  dark: '#111827',
  border: '#e5e7eb',
};

const STATUS_FILLS: Record<string, string> = {
  Completed: COLORS.green,
  Success: COLORS.green,
  Failed: COLORS.red,
  Pending: COLORS.amber,
  Reversed: COLORS.purple,
  Refunded: COLORS.blue,
};

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
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return da.getTime() - db.getTime();
    });
}

function groupByHour(txns: Transaction[]) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${String(i).padStart(2, '0')}:00`,
    count: 0,
    volume: 0,
  }));
  txns.forEach((t) => {
    const d = new Date(t.transaction_date);
    if (isNaN(d.getTime())) return;
    hours[d.getHours()].count += 1;
    hours[d.getHours()].volume += Number(t.amount) || 0;
  });
  return hours;
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

function groupByStatus(txns: Transaction[]) {
  const map: Record<string, number> = {};
  txns.forEach((t) => {
    const s =
      t.status === 'completed' || t.status === 'success'
        ? 'Completed'
        : t.status === 'failed'
          ? 'Failed'
          : t.status === 'pending'
            ? 'Pending'
            : t.status === 'reversed'
              ? 'Reversed'
              : t.status === 'refunded'
                ? 'Refunded'
                : t.status;
    map[s] = (map[s] || 0) + 1;
  });
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, fill: STATUS_FILLS[name] || COLORS.gray }));
}

/* ────────── Sub-components ────────── */

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-red-600',
    neutral: 'text-gray-400',
  };
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex items-start justify-between rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{label}</p>
        <p className="mt-1.5 text-xl font-bold text-[#111827] sm:text-2xl">{value}</p>
        {sub && <p className="mt-1 text-xs text-[#6b7280]">{sub}</p>}
      </div>
      <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f8f8f8]">
        <Icon className={`h-5 w-5 ${trend ? trendColors[trend] : 'text-[#d71927]'}`} />
      </div>
    </div>
  );
}

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-[#111827]">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-[#6b7280]">
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

/* ────────── Main Component ────────── */

export function TransactionIntelligence({ transactions, aggregates }: TransactionIntelligenceProps) {
  /* ── Use backend aggregates (all records) instead of computing from paginated data ── */
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
        failureRate: aggregates.failure_rate,
        reversalRate: aggregates.reversal_rate,
        uniqueUsers: aggregates.unique_users,
      };
    }

    // Fallback: compute from transactions if aggregates not available
    const total = transactions.length;
    const successful = transactions.filter(
      (t) => t.status === 'success' || t.status === 'completed'
    );
    const failed = transactions.filter((t) => t.status === 'failed');
    const pending = transactions.filter((t) => t.status === 'pending');
    const reversed = transactions.filter((t) => t.status === 'reversed');

    const totalVolume = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const successVolume = successful.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const failedVolume = failed.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const pendingVolume = pending.reduce((s, t) => s + (Number(t.amount) || 0), 0);

    const avgValue = total > 0 ? totalVolume / total : 0;
    const successRate = total > 0 ? (successful.length / total) * 100 : 0;
    const failureRate = total > 0 ? (failed.length / total) * 100 : 0;
    const reversalRate = total > 0 ? (reversed.length / total) * 100 : 0;

    const uniqueUsers = new Set(transactions.map((t) => t.user_id)).size;

    return {
      total,
      successful: successful.length,
      failed: failed.length,
      pending: pending.length,
      reversed: reversed.length,
      totalVolume,
      successVolume,
      failedVolume,
      pendingVolume,
      avgValue,
      successRate,
      failureRate,
      reversalRate,
      uniqueUsers,
    };
  }, [transactions, aggregates]);

  /* ── Chart data: use backend aggregates when available ── */
  const trendData = useMemo(() => {
    if (aggregates?.daily_trend?.length) return aggregates.daily_trend;
    return groupByDate(transactions);
  }, [aggregates, transactions]);

  const hourlyData = useMemo(() => {
    if (aggregates?.hourly?.length) return aggregates.hourly;
    return groupByHour(transactions);
  }, [aggregates, transactions]);

  const typeData = useMemo(() => {
    if (aggregates?.by_type?.length) return aggregates.by_type;
    return groupByType(transactions);
  }, [aggregates, transactions]);

  const statusData = useMemo(() => {
    const raw = aggregates?.by_status?.length ? aggregates.by_status : groupByStatus(transactions);
    return raw.map((s: any) => ({
      name: s.name || s.status || 'Unknown',
      value: s.value || s.count || 0,
      fill: s.fill || STATUS_FILLS[s.status] || COLORS.gray,
    }));
  }, [aggregates, transactions]);

  const maxHourlyCount = useMemo(
    () => (hourlyData.length > 0 ? Math.max(...hourlyData.map((h) => h.count)) : 1),
    [hourlyData]
  );

  return (
    <div className="space-y-6">
      {/* ── Row 1: Enhanced KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Transactions"
          value={formatNumber(metrics.total)}
          sub={`${formatCurrency(metrics.totalVolume)} volume`}
          icon={BarChart3}
        />
        <MetricCard
          label="Success Rate"
          value={`${metrics.successRate.toFixed(1)}%`}
          sub={`${formatNumber(metrics.successful)} of ${formatNumber(metrics.total)}`}
          icon={CheckCircle2}
          trend="up"
        />
        <MetricCard
          label="Failed Transactions"
          value={formatNumber(metrics.failed)}
          sub={`${formatCurrency(metrics.failedVolume)} value`}
          icon={XCircle}
          trend="down"
        />
        <MetricCard
          label="Pending Review"
          value={formatNumber(metrics.pending)}
          sub={`${formatCurrency(metrics.pendingVolume)} awaiting`}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Avg Transaction Value"
          value={formatCurrency(metrics.avgValue)}
          sub="Per transaction"
          icon={DollarSign}
        />
        <MetricCard
          label="Unique Users"
          value={formatNumber(metrics.uniqueUsers)}
          sub="Active transactors"
          icon={Users}
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

      {/* ── Row 2: Trend + Status Donut ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Volume Trend — Area Chart */}
        <Card className="rounded-2xl border border-[#e5e7eb] p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Transaction Volume Trend</h3>
              <p className="mt-0.5 text-xs text-[#6b7280]">Daily count and amount over time</p>
            </div>
          </div>
          {trendData.length > 0 ? (
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={COLORS.red} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: COLORS.gray }}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.border }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: COLORS.gray }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Transactions"
                    stroke={COLORS.red}
                    strokeWidth={2}
                    fill="url(#gradCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-[#6b7280]">
              No trend data available
            </div>
          )}
        </Card>

        {/* Status Donut */}
        <Card className="rounded-2xl border border-[#e5e7eb] p-5 sm:p-6">
          <h3 className="mb-4 text-base font-bold text-[#111827] sm:mb-6">Status Breakdown</h3>
          {statusData.length > 0 ? (
            <>
              <div className="flex h-[200px] items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
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
                          <div className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 shadow-md">
                            <p className="text-xs font-semibold text-[#111827]">
                              {payload[0].name}
                            </p>
                            <p className="text-xs text-[#6b7280]">
                              {payload[0].value} transactions
                            </p>
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {statusData.map((s) => {
                  const pct = metrics.total > 0 ? ((s.value / metrics.total) * 100).toFixed(1) : '0';
                  return (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: s.fill }}
                        />
                        <span className="font-medium text-[#111827]">{s.name}</span>
                      </div>
                      <span className="text-[#6b7280]">
                        {s.value} <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-[#6b7280]">
              No data
            </div>
          )}
        </Card>
      </div>

      {/* ── Row 3: Type Bar + Hourly Pattern ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Volume by Transaction Type */}
        <Card className="rounded-2xl border border-[#e5e7eb] p-5 sm:p-6">
          <h3 className="mb-4 text-base font-bold text-[#111827] sm:mb-6">Volume by Transaction Type</h3>
          {typeData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: COLORS.gray }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: COLORS.gray }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 shadow-md">
                          <p className="text-xs font-semibold text-[#111827]">
                            {payload[0].payload.name}
                          </p>
                          <p className="text-xs text-[#6b7280]">
                            {formatCurrency(Number(payload[0].value))}
                          </p>
                          <p className="text-xs text-[#6b7280]">
                            {payload[0].payload.count} transactions
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="amount" name="Volume" fill={COLORS.red} radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-[#6b7280]">
              No data
            </div>
          )}
        </Card>

        {/* Hourly Transaction Pattern */}
        <Card className="rounded-2xl border border-[#e5e7eb] p-5 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base font-bold text-[#111827]">Hourly Transaction Pattern</h3>
            <p className="mt-0.5 text-xs text-[#6b7280]">Activity distribution by hour of day</p>
          </div>
          {hourlyData.some((h) => h.count > 0) ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: COLORS.gray }}
                    tickLine={false}
                    axisLine={{ stroke: COLORS.border }}
                    interval={3}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: COLORS.gray }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Transactions" fill={COLORS.red} radius={[3, 3, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-[#6b7280]">
              No hourly data
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
