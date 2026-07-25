'use client';

import { clsx } from 'clsx';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import type {
  TransferProviderBalancesData,
  TransferProviderMeta,
  TransferProviderCode,
  OverallStatus,
} from '@/types/transfer-provider.types';
import { TRANSFER_PROVIDERS, getProviderHealthInfo } from '@/types/transfer-provider.types';

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getOverallStatusInfo(status: OverallStatus): {
  label: string;
  dotColor: string;
  textColor: string;
  bgColor: string;
} {
  switch (status) {
    case 'healthy':
      return {
        label: 'Healthy',
        dotColor: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
      };
    case 'degraded':
      return {
        label: 'Degraded',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
      };
    case 'unavailable':
      return {
        label: 'Unavailable',
        dotColor: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
      };
    default:
      return {
        label: 'Unknown',
        dotColor: 'bg-gray-400',
        textColor: 'text-gray-500',
        bgColor: 'bg-gray-50',
      };
  }
}

// ============================================================================
// PROPS
// ============================================================================

interface ProviderBalancesTableProps {
  balances: TransferProviderBalancesData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// ============================================================================
// PROVIDER ROW COMPONENT
// ============================================================================

function ProviderRow({
  code,
  meta,
  isDefault,
}: {
  code: TransferProviderCode;
  meta: TransferProviderMeta;
  isDefault: boolean;
}) {
  const health = getProviderHealthInfo(meta);

  return (
    <div
      className={clsx(
        'flex items-center gap-4 border-b border-[#e5e7eb] px-6 py-4 last:border-b-0 transition-colors',
        isDefault && 'bg-[#d71927]/[0.02]'
      )}
    >
      {/* Provider name */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#111827]">
            {meta.display_name}
          </span>
          {isDefault && (
            <span className="rounded-full bg-[#d71927]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d71927]">
              Default
            </span>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="w-36 text-right">
        <span className="text-sm font-medium text-[#111827]">
          {formatCurrency(meta.balance)}
        </span>
      </div>

      {/* Status */}
      <div className="w-24 text-center">
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
            health.bgColor,
            health.textColor
          )}
        >
          <span className={clsx('h-1.5 w-1.5 rounded-full', health.dotColor)} />
          {meta.configured ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Threshold */}
      <div className="w-28 text-right">
        <span className="text-sm text-[#6b7280]">{formatCurrency(meta.threshold)}</span>
      </div>

      {/* Health */}
      <div className="w-24 text-right">
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 text-sm font-medium',
            health.textColor
          )}
        >
          <span className={clsx('h-2 w-2 rounded-full', health.dotColor)} />
          {health.label}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProviderBalancesTable({
  balances,
  isLoading,
  error,
  onRefresh,
}: ProviderBalancesTableProps) {
  // --------------------------------------------------------------------------
  // Loading State
  // --------------------------------------------------------------------------

  if (isLoading && !balances) {
    return (
      <Card className="rounded-2xl border border-[#e5e7eb]">
        <div className="p-6">
          <div className="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Error State
  // --------------------------------------------------------------------------

  if (error && !balances) {
    return (
      <Card className="rounded-2xl border border-red-200 bg-red-50">
        <div className="p-6 text-center">
          <p className="mb-4 text-sm font-medium text-red-800">{error}</p>
          <Button variant="outline" onClick={onRefresh}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Empty State
  // --------------------------------------------------------------------------

  if (!balances) {
    return (
      <Card className="rounded-2xl border border-[#e5e7eb]">
        <div className="p-6 text-center">
          <p className="text-sm text-[#6b7280]">No provider balance data available.</p>
        </div>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  const overallStatus = getOverallStatusInfo(balances.overall_status);
  const providers = TRANSFER_PROVIDERS.map((p) => ({
    code: p.code,
    meta: balances.providers[p.code] as TransferProviderMeta | undefined,
  })).filter((p): p is { code: TransferProviderCode; meta: TransferProviderMeta } =>
    Boolean(p.meta)
  );

  return (
    <Card className="rounded-2xl border border-[#e5e7eb]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
        <h2 className="text-lg font-bold text-[#111827]">Transfer Provider Balances</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          isLoading={isLoading}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Table Header */}
      <div className="hidden border-b border-[#e5e7eb] bg-gray-50 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280] sm:flex">
        <div className="flex-1">Provider</div>
        <div className="w-36 text-right">Balance</div>
        <div className="w-24 text-center">Status</div>
        <div className="w-28 text-right">Threshold</div>
        <div className="w-24 text-right">Health</div>
      </div>

      {/* Provider Rows */}
      <div>
        {providers.map(({ code, meta }) => (
          <ProviderRow
            key={code}
            code={code}
            meta={meta}
            isDefault={code === balances.default_provider}
          />
        ))}
      </div>

      {/* Footer: Overall Status */}
      <div
        className={clsx(
          'flex items-center justify-between border-t border-[#e5e7eb] px-6 py-3',
          overallStatus.bgColor
        )}
      >
        <span className="text-sm font-medium text-[#111827]">
          Current default:{' '}
          <span className="font-bold">
            {TRANSFER_PROVIDERS.find((p) => p.code === balances.default_provider)
              ?.display_name || 'N/A'}
          </span>
        </span>
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 text-sm font-semibold',
            overallStatus.textColor
          )}
        >
          <span className={clsx('h-2 w-2 rounded-full', overallStatus.dotColor)} />
          {overallStatus.label}
        </span>
      </div>
    </Card>
  );
}
