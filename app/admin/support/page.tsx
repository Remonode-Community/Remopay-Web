'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Headphones,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  UserX,
  Filter,
  X,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Spinner } from '@/components/shared/Spinner';
import { useAuthStore } from '@/store/auth.store';
import { supportService } from '@/services/support.service';
import { formatDate, formatRelativeTime } from '@/utils/format.utils';
import type { SupportTicket, SupportTicketStats, SupportStatus, SupportCategory, SupportPriority } from '@/types/api.types';

const STATUS_CONFIG: Record<SupportStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  open: { label: 'Open', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  awaiting_user_response: { label: 'Awaiting User', variant: 'danger' },
  awaiting_agent_response: { label: 'Awaiting Agent', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'default' },
};

const PRIORITY_CONFIG: Record<SupportPriority, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  low: { label: 'Low', variant: 'default' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
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

export default function AdminSupportPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');

  const summaryRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = () => {
    const el = summaryRef.current;
    if (!el) return;
    setCanScrollPrev(el.scrollLeft > 0);
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = summaryRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth * 0.75 : el.clientWidth * 0.75, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = summaryRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [tickets]);

  const isAdmin = useMemo(() => user?.roles?.some((r) => r === 'admin'), [user]);

  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true);
      const response = await supportService.adminGetTickets({
        page,
        per_page: 15,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        assigned_to: assignedFilter || undefined,
        search: search || undefined,
      });

      if (response?.data) {
        setTickets(response.data.tickets ?? []);
        setStats(response.data.stats ?? null);
        if (response.pagination) {
          setTotalPages(response.pagination.last_page ?? 1);
          setTotalCount(response.pagination.total ?? 0);
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
  }, [statusFilter, categoryFilter, priorityFilter, assignedFilter, search]);

  useEffect(() => {
    fetchTickets(currentPage);
  }, [currentPage]);

  if (!isAdmin) return null;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen space-y-8 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Support Tickets</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Manage and respond to user support requests</p>
      </div>

      {/* Stats Summary */}
      {stats && (
        <section className="relative">
          {canScrollPrev && (
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 -translate-x-12 md:block">
              <div className="rounded-full bg-white shadow-lg border border-gray-200 p-3 hover:bg-gray-50 transition"><ChevronLeft className="h-5 w-5 text-gray-700" /></div>
            </button>
          )}
          {canScrollNext && (
            <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-12 md:block">
              <div className="rounded-full bg-white shadow-lg border border-gray-200 p-3 hover:bg-gray-50 transition"><ChevronRight className="h-5 w-5 text-gray-700" /></div>
            </button>
          )}
          <div ref={summaryRef} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-x-visible">
            {[
              { title: 'Total', value: stats.total, Icon: Headphones, bg: 'bg-[#eef2ff]', color: 'text-[#4a5ff7]' },
              { title: 'Open', value: stats.open, Icon: AlertCircle, bg: 'bg-blue-50', color: 'text-blue-500' },
              { title: 'In Progress', value: stats.in_progress, Icon: Clock, bg: 'bg-amber-50', color: 'text-amber-500' },
              { title: 'Unassigned', value: stats.unassigned, Icon: UserX, bg: 'bg-red-50', color: 'text-[#d71927]' },
              { title: 'Resolved', value: stats.resolved, Icon: CheckCircle, bg: 'bg-green-50', color: 'text-green-500' },
            ].map(({ title, value, Icon, bg, color }) => (
              <Card key={title} className="min-w-[160px] snap-start rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm md:min-w-0">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl ${bg} p-2.5`}><Icon className={`h-4 w-4 ${color}`} /></div>
                  <div>
                    <p className="text-xs font-medium text-[#6b7280]">{title}</p>
                    <p className="text-2xl font-bold text-[#111827]">{value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search tickets, users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-[#111] focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_user_response">Awaiting User</option>
          <option value="awaiting_agent_response">Awaiting Agent</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-[#111] focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]">
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-[#111] focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)} className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm text-[#111] focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]">
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <Card className="overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white p-0 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#f1f5f9] px-6 py-5">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">All Tickets</h2>
            <p className="mt-1 text-sm text-[#6b7280]">{totalCount} total tickets</p>
          </div>

          {tickets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Headphones className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-bold text-[#111827]">No tickets found</h3>
              <p className="mt-2 text-sm text-[#6b7280]">No tickets match your current filters</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                      {['Ticket', 'User', 'Category', 'Priority', 'Status', 'Replied', 'Actions'].map((h) => (
                        <th key={h} className={`px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#6b7280] ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => {
                      const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open;
                      const pc = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.medium;
                      return (
                        <tr key={t.id} className="border-b border-[#f8fafc] transition-colors hover:bg-[#fafafa]">
                          <td className="px-5 py-4">
                            <p className="text-xs font-mono text-[#6b7280]">{t.ticket_number}</p>
                            <p className="mt-0.5 text-sm font-semibold text-[#111827] truncate max-w-[200px]">{t.subject}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-[#111827]">{t.user?.first_name} {t.user?.last_name}</p>
                            <p className="text-xs text-[#9ca3af]">{t.user?.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#6b7280]">
                              {CATEGORY_LABELS[t.category] ?? t.category}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={pc.variant} size="sm">{pc.label}</Badge>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                          </td>
                          <td className="px-5 py-4 text-xs text-[#9ca3af]">
                            {t.last_replied_at ? formatRelativeTime(t.last_replied_at) : '—'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => router.push(`/admin/support/${t.id}`)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#4a5ff7] transition hover:bg-[#eef2ff]"
                              title="View Ticket"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="space-y-3 p-4 xl:hidden">
                {tickets.map((t) => {
                  const sc = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open;
                  return (
                    <div key={t.id} className="rounded-2xl border border-[#edf2f7] bg-[#fcfcfd] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-[#6b7280]">{t.ticket_number}</p>
                          <p className="mt-0.5 text-sm font-bold text-[#111827] truncate">{t.subject}</p>
                          <p className="text-xs text-[#6b7280]">{t.user?.first_name} {t.user?.last_name}</p>
                        </div>
                        <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-[#6b7280]">
                          {CATEGORY_LABELS[t.category] ?? t.category}
                        </span>
                        <button
                          onClick={() => router.push(`/admin/support/${t.id}`)}
                          className="rounded-lg p-2 text-[#4a5ff7] transition hover:bg-[#eef2ff]"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#f1f5f9] px-6 py-4">
              <p className="text-sm text-[#6b7280]">
                Page <span className="font-bold text-[#111827]">{currentPage}</span> of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-9 rounded-lg border border-black/10 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50">
                  <ChevronLeft size={16} className="text-[#111]" />
                </button>
                <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-9 rounded-lg border border-black/10 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50">
                  <ChevronRight size={16} className="text-[#111]" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
