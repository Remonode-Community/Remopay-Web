'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BatchTable } from '@/components/admin/settlement/BatchTable';
import { useSettlement } from '@/hooks/useSettlement';
import type { BatchListFilters } from '@/types/settlement.types';

export default function SettlementBatchesPage() {
  const router = useRouter();
  const {
    state,
    fetchBatches,
    generateBatch,
    approveBatch,
    settleBatch,
  } = useSettlement();

  const [filters, setFilters] = useState<BatchListFilters>({
    per_page: 20,
    page: 1,
  });

  useEffect(() => {
    fetchBatches(filters);
  }, [filters, fetchBatches]);

  const handleApprove = useCallback(
    async (id: number) => {
      await approveBatch(id, { notes: 'Approved by admin' });
    },
    [approveBatch]
  );

  const handleSettle = useCallback(
    async (id: number) => {
      await settleBatch(id, { dry_run: false });
    },
    [settleBatch]
  );

  const handleView = useCallback(
    (id: number) => {
      router.push(`/admin/settlements/batches/${id}`);
    },
    [router]
  );

  const handleGenerate = useCallback(
    async (data: { settlement_date: string; period_days: number }) => {
      const success = await generateBatch({
        settlement_date: data.settlement_date,
        period_days: data.period_days,
      });
      if (success) {
        fetchBatches(filters);
      }
    },
    [generateBatch, fetchBatches, filters]
  );

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settlements"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white hover:bg-[#f8fafc] transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-[#6b7280]" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Settlement Batches</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            View, generate, approve, and settle batches
          </p>
        </div>
      </div>

      <BatchTable
        batches={state.batches}
        isLoading={state.isLoadingBatches}
        pagination={state.batchesPagination}
        filters={filters}
        onFiltersChange={setFilters}
        onApprove={handleApprove}
        onSettle={handleSettle}
        onView={handleView}
        onGenerate={handleGenerate}
        isGenerating={state.isGeneratingBatch}
      />
    </div>
  );
}
