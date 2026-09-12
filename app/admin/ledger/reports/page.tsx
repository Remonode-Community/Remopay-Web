'use client';

import React, { useState } from 'react';
import { useLedger } from '@/hooks/useLedger';
import { LedgerReportsGenerator } from '@/components/admin/ledger';

export default function ReportsPage() {
  const { state } = useLedger();

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ledger Reports</h1>
        <p className="text-gray-600 mt-2">
          Generate financial reports including trial balance and account ledgers
        </p>
      </div>

      <LedgerReportsGenerator isLoading={state.isLoadingReports} />
    </div>
  );
}
