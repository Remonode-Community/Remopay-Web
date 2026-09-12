'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TransactionTable } from '@/components/admin/settlement/TransactionTable';
import { useSettlement } from '@/hooks/useSettlement';
import type { SettlementTxFilters } from '@/types/settlement.types';

export default function SettlementTransactionsPage() {
  const {
    state,
    fetchTransactions,
  } = useSettlement();

  const [filters, setFilters] = useState<SettlementTxFilters>({
    per_page: 20,
    page: 1,
  });

  useEffect(() => {
    fetchTransactions(filters);
  }, [filters, fetchTransactions]);

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
          <h1 className="text-3xl font-bold text-[#111827]">Settlement Transactions</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            View all settlement transactions with their status and details
          </p>
        </div>
      </div>

      <TransactionTable
        transactions={state.transactions}
        isLoading={state.isLoadingTransactions}
        pagination={state.transactionsPagination}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
