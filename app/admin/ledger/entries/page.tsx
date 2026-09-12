'use client';

import React, { useEffect, useState } from 'react';
import { useLedger } from '@/hooks/useLedger';
import { LedgerEntriesList } from '@/components/admin/ledger';
import { EntryFilters } from '@/types/ledger.types';

export default function EntriesPage() {
  const { fetchEntries, fetchAccounts, state } = useLedger();
  const [filters, setFilters] = useState<EntryFilters>({
    per_page: 50,
    page: 1,
  });

  useEffect(() => {
    fetchEntries(filters);
  }, [filters, fetchEntries]);

  useEffect(() => {
    fetchAccounts({ per_page: 100 });
  }, [fetchAccounts]);

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ledger Entries</h1>
        <p className="text-gray-600 mt-2">
          View and manage all ledger entries with complete audit trail
        </p>
      </div>

      <LedgerEntriesList
        entries={state.entries}
        accounts={state.accounts}
        isLoading={state.isLoadingEntries}
        pagination={state.entriesPagination}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
