'use client';

import React, { useEffect } from 'react';
import { useLedger } from '@/hooks/useLedger';
import { LedgerDashboardOverview } from '@/components/admin/ledger';

export default function LedgerPage() {
  const { fetchDashboard, state } = useLedger();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ledger System</h1>
        <p className="text-gray-600 mt-2">
          Double-entry bookkeeping accounting system for complete financial tracking
        </p>
      </div>

      <LedgerDashboardOverview
        dashboard={state.dashboard}
        isLoading={state.isLoadingDashboard}
      />
    </div>
  );
}
