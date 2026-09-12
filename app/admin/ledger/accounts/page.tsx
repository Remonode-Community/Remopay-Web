'use client';

import React, { useEffect, useState } from 'react';
import { useLedger } from '@/hooks/useLedger';
import { LedgerAccountsList } from '@/components/admin/ledger';
import { AccountFilters } from '@/types/ledger.types';

export default function AccountsPage() {
  const { fetchAccounts, state } = useLedger();
  const [filters, setFilters] = useState<AccountFilters>({
    per_page: 50,
    page: 1,
  });

  useEffect(() => {
    fetchAccounts(filters);
  }, [filters, fetchAccounts]);

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ledger Accounts</h1>
        <p className="text-gray-600 mt-2">
          Manage all ledger accounts (Asset, Liability, Equity, Revenue, Expense)
        </p>
      </div>

      <LedgerAccountsList
        accounts={state.accounts}
        isLoading={state.isLoadingAccounts}
        pagination={state.accountsPagination}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
