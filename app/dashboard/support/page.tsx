'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Headphones,
  Plus,
  Search,
  ChevronRight,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { Spinner } from '@/components/shared/Spinner';
import { supportService } from '@/services/support.service';
import { formatRelativeTime } from '@/utils/format.utils';
import type { SupportTicket, SupportTicketStats, SupportStatus, SupportCategory } from '@/types/api.types';

const STATUS_CONFIG: Record<SupportStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; dot: string }> = {
  open: { label: 'Open', variant: 'info', dot: 'bg-blue-500' },
  in_progress: { label: 'In Progress', variant: 'warning', dot: 'bg-amber-500' },
  awaiting_user_response: { label: 'Awaiting You', variant: 'danger', dot: 'bg-red-500' },
  awaiting_agent_response: { label: 'Awaiting Agent', variant: 'default', dot: 'bg-gray-400' },
  resolved: { label: 'Resolved', variant: 'success', dot: 'bg-green-500' },
  closed: { label: 'Closed', variant: 'default', dot: 'bg-gray-300' },
};

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  general: 'General',
  transaction_issue: 'Transaction',
  wallet_issue: 'Wallet',
  account_issue: 'Account',
  card_issue: 'Card',
  airtime_data: 'Airtime & Data',
  transfer_issue: 'Transfer',
  kyc_verification: 'KYC',
  bug_report: 'Bug Report',
  feature_request: 'Feature',
  other: 'Other',
};

export default function SupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true);
      const response = await supportService.getTickets({
        page,
        per_page: 10,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
      });

      if (response?.data) {
        setTickets(response.data.tickets ?? []);
        setStats(response.data.stats ?? null);
        if (response.pagination) {
          setTotalPages(response.pagination.last_page ?? 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1);
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => {
    fetchTickets(currentPage);
  }, [currentPage]);

  return (
    <div className="min-h-full bg-white">
      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Main Content — Large */}
        <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Support Center</h1>
              <p className="mt-1 text-sm text-gray-500">Get help with your account, transactions, or issues</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/support/new')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d71927] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b91420] hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </button>
          </div>

          {/* Search + Filters */}
          <div className="mt-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#d71927] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d71927]/10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/10"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_user_response">Awaiting You</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 transition focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/10"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ticket List */}
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
                <Inbox className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-base font-semibold text-gray-900">No tickets yet</h3>
                <p className="mt-1.5 text-sm text-gray-500">Create a support ticket to get help</p>
                <button
                  onClick={() => router.push('/dashboard/support/new')}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d71927] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b91420]"
                >
                  <Plus className="h-4 w-4" />
                  Create Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => {
                  const statusConf = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                  return (
                    <button
                      key={ticket.id}
                      onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
                      className="group w-full rounded-xl border border-gray-100 bg-white p-4 text-left transition hover:border-gray-200 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-gray-400">{ticket.ticket_number}</span>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
                            <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>
                          </div>
                          <h3 className="mt-1.5 text-sm font-semibold text-gray-900 truncate group-hover:text-[#d71927] transition-colors sm:text-base">
                            {ticket.subject}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-1 sm:line-clamp-2">{ticket.description}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
                              {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.messages_count ?? 0}
                            </span>
                            <span>{formatRelativeTime(ticket.last_replied_at ?? ticket.created_at)}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:text-[#d71927] group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-2 text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{currentPage}</span> / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — Small */}
        <div className="w-full shrink-0 border-t border-gray-100 bg-gray-50/50 px-4 py-6 sm:px-6 lg:w-80 lg:border-t-0 lg:border-l lg:border-gray-100 lg:bg-white lg:px-6 lg:py-8">
          {/* Stats */}
          {stats && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Overview</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                {[
                  { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
                  { label: 'Total', value: stats.total, icon: Headphones, color: 'text-[#d71927]', bg: 'bg-red-50' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3.5">
                    <div className={`shrink-0 rounded-lg ${bg} p-2`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">{label}</p>
                      <p className="text-lg font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="mt-8 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Links</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard/support/new')}
                className="group flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 text-left transition hover:border-[#d71927]/20 hover:bg-red-50/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d71927]/10 text-[#d71927]">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">New Ticket</p>
                  <p className="text-xs text-gray-500">Get help from our team</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-[#d71927] group-hover:translate-x-0.5" />
              </button>
              <a
                href="mailto:support@remopay.com"
                className="group flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 text-left transition hover:border-[#d71927]/20 hover:bg-red-50/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Email Support</p>
                  <p className="text-xs text-gray-500">support@remopay.com</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-[#d71927] group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
