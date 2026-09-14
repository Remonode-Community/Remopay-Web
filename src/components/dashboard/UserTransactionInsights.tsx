'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card } from '@/components/shared/Card';
import { formatCurrency, formatNumber } from '@/utils/format.utils';
import {
  TrendingUp,
  Activity,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';

interface UserAggregates {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  reversed: number;
  total_volume: number;
  success_volume: number;
  avg_value: number;
  success_rate: number;
  by_type: { type: string; count: number; volume: number }[];
  by_status: { status: string; count: number; volume: number }[];
  daily_trend: { date: string; count: number; volume: number }[];
  monthly_trend: { month: string; count: number; volume: number }[];
}

interface UserTransactionInsightsProps {
  aggregates: UserAggregates;
}

const COLORS = {
  red: '#d71927',
  green: '#10b981',
  amber: '#f59e0b',
  slate: '#64748b',
};

export function UserTransactionInsights({ aggregates }: UserTransactionInsightsProps) {
  const chartData = (aggregates.daily_trend || [])
    .slice(-14)
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
      volume: d.volume,
      count: d.count,
    }));

  const typeData = (aggregates.by_type || [])
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6)
    .map((d) => ({
      type: d.type?.length > 12 ? d.type.slice(0, 10) + '...' : d.type || 'Other',
      fullName: d.type || 'Other',
      count: d.count,
      volume: d.volume,
    }));

  const stats = [
    {
      label: 'Total Transactions',
      value: formatNumber(aggregates.total),
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Success Rate',
      value: `${aggregates.success_rate || 0}%`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Volume',
      value: formatCurrency(aggregates.total_volume || 0),
      icon: DollarSign,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Pending',
      value: formatNumber(aggregates.pending || 0),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d71927]/10">
          <Activity className="h-5 w-5 text-[#d71927]" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-950">Transaction Insights</h2>
          <p className="text-xs text-gray-500">Your activity over the last 14 days</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">{stat.label}</p>
            <p className="mt-1 text-lg sm:text-xl font-black text-gray-950">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_0.4fr]">
        {/* Volume Chart */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-sm font-black text-gray-950">Daily Transaction Volume</h3>
          <div className="mt-4 h-64 sm:h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="userVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.red} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={COLORS.red} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(Number(val)), 'Volume']}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke={COLORS.red}
                    strokeWidth={2}
                    fill="url(#userVolumeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No transaction data yet
              </div>
            )}
          </div>
        </Card>

        {/* Transaction Type Breakdown */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-sm font-black text-gray-950">By Type</h3>
          <div className="mt-4 h-64 sm:h-72">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="type"
                    width={65}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val, name) =>
                      name === 'volume' ? [formatCurrency(Number(val)), 'Volume'] : [val, 'Count']
                    }
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                    cursor={{ fill: 'rgba(215,25,39,0.04)' }}
                  />
                  <Bar dataKey="volume" fill={COLORS.red} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No data
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
