'use client';

import React, { useEffect, useState } from 'react';
import { useLedger } from '@/hooks/useLedger';
import { ReconciliationDashboard } from '@/components/admin/ledger';
import { ReconciliationFilters } from '@/types/ledger.types';

export default function ReconciliationPage() {
  const { fetchReconciliationReports, state } = useLedger();
  const [filters, setFilters] = useState<ReconciliationFilters>({
    per_page: 50,
    page: 1,
  });

  useEffect(() => {
    fetchReconciliationReports(filters);
  }, [filters, fetchReconciliationReports]);

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reconciliation Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate and view daily reconciliation reports with balance verification
        </p>
      </div>

      <ReconciliationDashboard
        reports={state.reconciliationReports}
        isLoading={state.isLoadingReconciliation}
        pagination={state.reconciliationPagination}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
