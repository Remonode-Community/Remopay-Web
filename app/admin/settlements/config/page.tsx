'use client';

import { useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ConfigForm } from '@/components/admin/settlement/ConfigForm';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { useSettlement } from '@/hooks/useSettlement';
import type { UpdateConfigRequest } from '@/types/settlement.types';

export default function SettlementConfigPage() {
  const {
    state,
    fetchConfig,
    updateConfig,
    validateConfig,
    testConfig,
  } = useSettlement();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSubmit = useCallback(
    async (data: UpdateConfigRequest) => {
      await updateConfig(data);
    },
    [updateConfig]
  );

  const handleValidate = useCallback(async () => {
    await validateConfig();
  }, [validateConfig]);

  const handleTest = useCallback(async () => {
    await testConfig();
  }, [testConfig]);

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settlements"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f8fafc] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[#6b7280]" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">Settlement Configuration</h1>
            <p className="text-sm text-[#6b7280] mt-1">
              Configure settlement schedule, accounts, and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {state.isLoadingConfig && !state.config && (
        <Card className="rounded-2xl border border-[#e5e7eb] p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-[#d71927] border-t-transparent" />
            <p className="text-sm font-medium text-[#6b7280]">Loading configuration...</p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {state.configError && !state.config && (
        <Card className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-800 mb-4">{state.configError}</p>
          <Button variant="outline" onClick={fetchConfig}>
            Retry
          </Button>
        </Card>
      )}

      {/* Config Form */}
      {state.config && (
        <ConfigForm
          config={state.config}
          onSubmit={handleSubmit}
          onValidate={handleValidate}
          onTest={handleTest}
          validationResult={state.configValidation}
          testResult={state.configTestResult}
          isLoading={state.isUpdatingConfig}
          isValidating={state.isValidatingConfig}
          isTesting={state.isTestingConfig}
        />
      )}
    </div>
  );
}
