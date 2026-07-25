'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import type {
  TransferProviderSettings,
  UpdateTransferProviderSettingsRequest,
  TransferProviderCode,
} from '@/types/transfer-provider.types';
import { TRANSFER_PROVIDERS } from '@/types/transfer-provider.types';

// ============================================================================
// PROPS
// ============================================================================

interface ProviderSettingsFormProps {
  settings: TransferProviderSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  onSave: (data: UpdateTransferProviderSettingsRequest) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProviderSettingsForm({
  settings,
  isLoading,
  isSaving,
  error,
  onSave,
}: ProviderSettingsFormProps) {
  const [defaultProvider, setDefaultProvider] = useState<TransferProviderCode>('paystack');
  const [autoSwitch, setAutoSwitch] = useState(false);
  const [thresholds, setThresholds] = useState({
    paystack: 5000,
    kuda: 5000,
    maplerad: 5000,
  });

  // Sync form state when settings load
  useEffect(() => {
    if (settings) {
      setDefaultProvider(settings.default_provider);
      setAutoSwitch(settings.auto_switch);
      setThresholds({
        paystack: settings.low_balance_thresholds.paystack ?? 0,
        kuda: settings.low_balance_thresholds.kuda ?? 0,
        maplerad: settings.low_balance_thresholds.maplerad ?? 0,
      });
    }
  }, [settings]);

  const handleThresholdChange = useCallback(
    (provider: TransferProviderCode, value: string) => {
      const numValue = Number(value) || 0;
      setThresholds((prev) => ({ ...prev, [provider]: numValue }));
    },
    []
  );

  const handleSave = useCallback(() => {
    onSave({
      default_provider: defaultProvider,
      auto_switch: autoSwitch,
      low_balance_thresholds: {
        paystack: thresholds.paystack,
        kuda: thresholds.kuda,
        maplerad: thresholds.maplerad,
      },
    });
  }, [defaultProvider, autoSwitch, thresholds, onSave]);

  // --------------------------------------------------------------------------
  // Loading State
  // --------------------------------------------------------------------------

  if (isLoading && !settings) {
    return (
      <Card className="rounded-2xl border border-[#e5e7eb]">
        <div className="p-8">
          <div className="space-y-6">
            <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
            <div className="h-10 w-32 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </Card>
    );
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Card className="rounded-2xl border border-[#e5e7eb]">
      <div className="p-6 sm:p-8">
        {/* Section 1: Default Transfer Provider */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#111827]">Default Transfer Provider</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Which provider should be used for bank transfers by default?
          </p>

          <fieldset className="mt-4 space-y-3">
            <legend className="sr-only">Default Transfer Provider</legend>
            {TRANSFER_PROVIDERS.map((provider) => {
              const isSelected = defaultProvider === provider.code;
              return (
                <label
                  key={provider.code}
                  className={clsx(
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                    isSelected
                      ? 'border-[#d71927] bg-[#d71927]/5'
                      : 'border-[#e5e7eb] bg-white hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="default_provider"
                    value={provider.code}
                    checked={isSelected}
                    onChange={() => setDefaultProvider(provider.code)}
                    className="h-4 w-4 accent-[#d71927]"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#111827]">
                      {provider.display_name}
                    </span>
                    {isSelected && (
                      <span className="rounded-full bg-[#d71927]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#d71927]">
                        Current
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </fieldset>
        </div>

        {/* Divider */}
        <div className="mb-8 border-t border-[#e5e7eb]" />

        {/* Section 2: Auto-Failover Configuration */}
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Auto-Failover Configuration</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            When enabled, the system automatically switches to an available provider if the
            default has low balance.
          </p>

          {/* Toggle */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={autoSwitch}
              onClick={() => setAutoSwitch(!autoSwitch)}
              className={clsx(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#d71927]/20',
                autoSwitch ? 'bg-[#d71927]' : 'bg-gray-200'
              )}
            >
              <span
                className={clsx(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                  autoSwitch ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
            <span className="text-sm font-medium text-[#111827]">
              Enable automatic provider switching
            </span>
          </div>

          {/* Threshold Inputs */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TRANSFER_PROVIDERS.map((provider) => (
              <div key={provider.code}>
                <label
                  htmlFor={`threshold-${provider.code}`}
                  className="block text-sm font-medium text-[#111827] mb-1.5"
                >
                  {provider.display_name} threshold
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280]">
                    ₦
                  </span>
                  <input
                    id={`threshold-${provider.code}`}
                    type="number"
                    min={0}
                    step={100}
                    value={thresholds[provider.code] ?? 0}
                    onChange={(e) => handleThresholdChange(provider.code, e.target.value)}
                    className="w-full rounded-xl border border-[#e5e7eb] bg-white py-2.5 pl-8 pr-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#d71927] focus:outline-none focus:ring-4 focus:ring-[#d71927]/10 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Hint */}
          <p className="mt-3 text-xs text-[#6b7280]">
            When a provider's balance falls below this amount, the system will try the
            next available provider.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6">
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving || isLoading}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}
