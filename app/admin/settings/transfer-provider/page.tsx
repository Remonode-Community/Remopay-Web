'use client';

import { useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { useTransferProvider } from '@/hooks/useTransferProvider';
import {
  ProviderSettingsForm,
  ProviderBalancesTable,
  TestProviderConnection,
  AllProvidersDownAlert,
} from '@/components/admin/transfer-provider';
import type { UpdateTransferProviderSettingsRequest } from '@/types/transfer-provider.types';

export default function TransferProviderSettingsPage() {
  const {
    state,
    fetchSettings,
    updateSettings,
    fetchBalances,
    testConnection,
  } = useTransferProvider();

  // Fetch data on mount
  useEffect(() => {
    fetchSettings();
    fetchBalances();
  }, [fetchSettings, fetchBalances]);

  // Handlers
  const handleSaveSettings = useCallback(
    async (data: UpdateTransferProviderSettingsRequest) => {
      const success = await updateSettings(data);
      if (success) {
        // Refresh balances after settings update
        fetchBalances();
      }
    },
    [updateSettings, fetchBalances]
  );

  const handleTestConnection = useCallback(
    async (provider: Parameters<typeof testConnection>[0]) => {
      await testConnection(provider);
    },
    [testConnection]
  );

  const handleRetryAll = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleDismissAlert = useCallback(() => {
    // No-op: alert is conditionally rendered based on balances data
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f8fafc] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[#6b7280]" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">Transfer Provider Settings</h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Manage bank transfer providers, view balances, and configure failover settings.
            </p>
          </div>
        </div>
      </div>

      {/* All Providers Down Alert */}
      {state.balances && (
        <AllProvidersDownAlert
          balances={state.balances}
          show={state.balances.overall_status === 'unavailable'}
          onDismiss={handleDismissAlert}
          onRetryAll={handleRetryAll}
        />
      )}

      {/* Provider Balances Widget */}
      <ProviderBalancesTable
        balances={state.balances}
        isLoading={state.isLoadingBalances}
        error={state.balancesError}
        onRefresh={fetchBalances}
      />

      {/* Provider Settings Form */}
      <ProviderSettingsForm
        settings={state.settings}
        isLoading={state.isLoadingSettings}
        isSaving={state.isUpdatingSettings}
        error={state.updateError || state.settingsError}
        onSave={handleSaveSettings}
      />

      {/* Test Connection */}
      <TestProviderConnection
        isTesting={state.isTestingConnection}
        testResult={state.testResult}
        testedProvider={state.testedProvider}
        error={state.testError}
        onTest={handleTestConnection}
      />
    </div>
  );
}
