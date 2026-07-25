'use client';

import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import type {
  TransferProviderCode,
  TestProviderConnectionData,
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

// ============================================================================
// PROPS
// ============================================================================

interface TestProviderConnectionProps {
  isTesting: boolean;
  testResult: TestProviderConnectionData | null;
  testedProvider: TransferProviderCode | null;
  error: string | null;
  onTest: (provider: TransferProviderCode) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TestProviderConnection({
  isTesting,
  testResult,
  testedProvider,
  error,
  onTest,
}: TestProviderConnectionProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<TransferProviderCode>('paystack');

  const handleTest = useCallback(() => {
    onTest(selectedProvider);
  }, [selectedProvider, onTest]);

  // Determine which result to show
  const currentResult =
    testResult && testedProvider === selectedProvider ? testResult : null;

  return (
    <Card className="rounded-2xl border border-[#e5e7eb]">
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[#111827]">Test Provider Connection</h2>
        <p className="mt-1 text-sm text-[#6b7280]">
          Verify connectivity and check real-time balance for a specific provider.
        </p>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <label
              htmlFor="test-provider-select"
              className="block text-sm font-medium text-[#111827] mb-1.5"
            >
              Select a provider
            </label>
            <select
              id="test-provider-select"
              value={selectedProvider}
              onChange={(e) =>
                setSelectedProvider(e.target.value as TransferProviderCode)
              }
              disabled={isTesting}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white py-2.5 px-3 text-sm text-[#111827] focus:border-[#d71927] focus:outline-none focus:ring-4 focus:ring-[#d71927]/10 transition-all disabled:opacity-50"
            >
              {TRANSFER_PROVIDERS.map((provider) => (
                <option key={provider.code} value={provider.code}>
                  {provider.display_name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleTest}
            isLoading={isTesting}
            disabled={isTesting}
          >
            Test Connection
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Result */}
        {currentResult && (
          <div
            className={clsx(
              'mt-4 rounded-xl border p-4',
              currentResult.connected
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            )}
          >
            <div className="flex items-center gap-2">
              {/* Status indicator */}
              <span
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white',
                  currentResult.connected ? 'bg-green-500' : 'bg-red-500'
                )}
              >
                {currentResult.connected ? '✓' : '✗'}
              </span>
              <span
                className={clsx(
                  'text-sm font-semibold',
                  currentResult.connected ? 'text-green-800' : 'text-red-800'
                )}
              >
                {currentResult.connected
                  ? 'Connection successful'
                  : 'Connection failed'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#6b7280]">Balance:</span>{' '}
                <span className="font-medium text-[#111827]">
                  {formatCurrency(currentResult.balance)}
                </span>
              </div>
              <div>
                <span className="text-[#6b7280]">Healthy:</span>{' '}
                <span className="font-medium text-[#111827]">
                  {currentResult.healthy ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {currentResult.message && (
              <p className="mt-2 text-xs text-[#6b7280]">
                {currentResult.message}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
