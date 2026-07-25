'use client';

import { clsx } from 'clsx';
import { Button } from '@/components/shared/Button';
import type {
  TransferProviderBalancesData,
  TransferProviderMeta,
  TransferProviderCode,
} from '@/types/transfer-provider.types';
import { TRANSFER_PROVIDERS } from '@/types/transfer-provider.types';

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

function getFailureReason(
  code: TransferProviderCode,
  meta: TransferProviderMeta
): string {
  if (!meta.configured) return 'Provider not configured';
  if (!meta.healthy && meta.balance < meta.threshold)
    return `Insufficient balance (${formatCurrency(meta.balance)} / ${formatCurrency(meta.threshold)} threshold)`;
  if (!meta.healthy) return 'Provider API error';
  return 'Unknown error';
}

// ============================================================================
// PROPS
// ============================================================================

interface AllProvidersDownAlertProps {
  balances: TransferProviderBalancesData;
  onDismiss?: () => void;
  onRetryAll?: () => void;
  show: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AllProvidersDownAlert({
  balances,
  onDismiss,
  onRetryAll,
  show,
}: AllProvidersDownAlertProps) {
  if (!show || balances.overall_status !== 'unavailable') {
    return null;
  }

  const providers = TRANSFER_PROVIDERS.map((p) => ({
    code: p.code,
    meta: balances.providers[p.code] as TransferProviderMeta | undefined,
  })).filter((p): p is { code: TransferProviderCode; meta: TransferProviderMeta } =>
    Boolean(p.meta)
  );

  return (
    <div className="rounded-2xl border border-red-300 bg-red-50 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-red-900">
          All Transfer Providers Unavailable
        </h3>
        <p className="mt-1 text-sm text-red-700">
          Bank transfers are currently unavailable. Admins have been notified.
        </p>
      </div>

      {/* Provider list */}
      <div className="mb-4 space-y-2">
        {providers.map(({ code, meta }) => (
          <div
            key={code}
            className="flex items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
              ✗
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-[#111827]">
                {meta.display_name}
              </span>
              <p className="text-xs text-red-600">{getFailureReason(code, meta)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Impact notice */}
      <div className="mb-4 rounded-xl border border-red-200 bg-white px-4 py-3">
        <p className="text-xs font-medium text-red-800">
          System Impact: Bank transfers are currently unavailable. Users will see a
          friendly message advising them to try again later.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onDismiss && (
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
        {onRetryAll && (
          <Button variant="primary" size="sm" onClick={onRetryAll}>
            Retry All
          </Button>
        )}
      </div>
    </div>
  );
}
