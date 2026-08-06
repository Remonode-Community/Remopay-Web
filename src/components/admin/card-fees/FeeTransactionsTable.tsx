'use client';

import { clsx } from 'clsx';
import {
  ArrowUpDown,
  Calendar,
  Filter,
} from 'lucide-react';
import type { FeeTransaction, FeeTransactionsResponse } from '@/types/card-fee.types';

interface FeeTransactionsTableProps {
  data: FeeTransactionsResponse['data'] | null;
  isLoading?: boolean;
  filters: {
    fee_type?: string;
    operation_type?: string;
    date_from?: string;
    date_to?: string;
  };
  onFilterChange: (filters: any) => void;
  onPageChange: (page: number) => void;
}

export function FeeTransactionsTable({
  data,
  isLoading,
  filters,
  onFilterChange,
  onPageChange,
}: FeeTransactionsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (!data || data.transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-500">No fee transactions found.</p>
      </div>
    );
  }

  const { transactions, summary, pagination } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500">Total Our Fees</p>
          <p className="mt-1 text-2xl font-black text-[#d71927]">
            ${summary.total_our_fees.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500">Total Provider Fees</p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            ${summary.total_provider_fees.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold text-gray-500">Total All Fees</p>
          <p className="mt-1 text-2xl font-black text-gray-900">
            ${summary.total_all_fees.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Fee Type Breakdown */}
      {Object.keys(summary.fee_type_breakdown).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(summary.fee_type_breakdown).map(([type, amount]) => (
            <div
              key={type}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <span className="text-xs font-semibold text-gray-700 capitalize">{type}</span>
              <span className="text-xs font-bold text-gray-900">${Number(amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={filters.fee_type || ''}
            onChange={(e) => onFilterChange({ ...filters, fee_type: e.target.value || undefined })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:border-[#d71927] focus:outline-none"
          >
            <option value="">All Fee Types</option>
            {Array.from(new Set(transactions.map((t) => t.fee_type))).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400" />
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value || undefined })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:border-[#d71927] focus:outline-none"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => onFilterChange({ ...filters, date_to: e.target.value || undefined })}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:border-[#d71927] focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Operation</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Card</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Provider Fee</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Our Fee</th>
              <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((txn) => (
              <tr key={txn.id} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                  {new Date(txn.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 capitalize">
                    {txn.fee_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-700 capitalize">
                  {txn.operation_type.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {txn.user.first_name} {txn.user.last_name}
                    </p>
                    <p className="text-[10px] text-gray-500">{txn.user.email}</p>
                  </div>
                  
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                  {txn.card ? txn.card.masked_pan : <span className="text-gray-400 italic">N/A</span>}
                </td>
                <td className="px-4 py-3 text-right text-xs text-gray-600">
                  ${parseFloat(txn.provider_fee_amount).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-xs font-semibold text-[#d71927]">
                  ${parseFloat(txn.our_fee_amount).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold text-gray-900">
                  ${parseFloat(txn.total_fee_amount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {pagination.current_page} of {pagination.last_page} ({pagination.total} transactions)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.current_page - 1)}
              disabled={pagination.current_page <= 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.current_page + 1)}
              disabled={pagination.current_page >= pagination.last_page}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
