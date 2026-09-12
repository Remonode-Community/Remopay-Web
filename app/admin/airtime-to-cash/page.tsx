'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Clock,
  Check,
  TrendingUp,
  DollarSign,
  AlertCircle,
  X,
  ChevronRight,
  Filter,
  Loader2,
  Settings,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Toast } from '@/components/shared/Toast';
import { CardSkeleton } from '@/components/shared/SkeletonLoader';
import { useUIStore } from '@/store/ui.store';
import { useAuth } from '@/hooks/useAuth';
import { airtimeToCashService } from '@/services/airtime-to-cash.service';
import {
  AdminDashboardData,
  AdminTransactionView,
  AirtimeCashTransactionStatus,
  HistoryWithSummary,
  AirtimeToCashTransaction,
} from '@/types/airtime-to-cash.types';

const STATUS_CONFIG: Record<AirtimeCashTransactionStatus, { color: string; label: string }> = {
  pending: { color: 'bg-gray-100 text-gray-700', label: 'Pending' },
  transfer_submitted: { color: 'bg-blue-100 text-blue-700', label: 'Proof Submitted' },
  verification_in_progress: { color: 'bg-yellow-100 text-yellow-700', label: 'Verifying' },
  approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
  processing: { color: 'bg-blue-100 text-blue-700', label: 'Processing' },
  completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
  rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
};

interface FilterState {
  status?: string;
  provider?: string;
  searchTerm?: string;
}

export default function AdminAirtimeToCashPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>({
    overview: { total_requests: 0, pending_approval: 0, approved_today: 0, completed_today: 0 },
    volume: { today_total_converted: 0, this_month_total_converted: 0, today_airtime_received: 0, this_month_airtime_received: 0 },
    revenue: { today_fees_earned: 0, this_month_fees_earned: 0, total_fees_earned: 0 },
    status: { completed: 0, rejected: 0, pending: 0 },
    by_provider: {},
  });
  const [pendingTransactions, setPendingTransactions] = useState<AdminTransactionView[]>([]);
  const [allTransactions, setAllTransactions] = useState<AdminTransactionView[]>([]);

  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [allLoading, setAllLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    provider: '',
    searchTerm: '',
  });

  // User's own conversion history
  const [userHistory, setUserHistory] = useState<AirtimeToCashTransaction[]>([]);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);

  // Fetch dashboard on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await airtimeToCashService.getAdminDashboard();
        setDashboardData(data);
      } catch (error: any) {
        addToast({
          message: 'Failed to load dashboard',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchUserHistory = async () => {
      if (!user?.id) return;
      try {
        setUserHistoryLoading(true);
        const history = await airtimeToCashService.getHistory({ per_page: 5 });
        setUserHistory(history.data?.data || []);
      } catch (error: any) {
        console.error('Failed to fetch user history:', error);
      } finally {
        setUserHistoryLoading(false);
      }
    };

    fetchDashboard();
    fetchUserHistory();
    
    // Fetch all transactions on mount for recent section
    const fetchAll = async () => {
      try {
        const response = await airtimeToCashService.getAdminAll({ per_page: 50 });
        setAllTransactions(response.data || []);
      } catch (error: any) {
        // Silently fail for initial load
      }
    };
    
    fetchAll();
  }, [addToast, user?.id]);

  // Fetch pending when tab changes to pending
  useEffect(() => {
    if (activeTab === 'pending') {
      const fetchPending = async () => {
        try {
          setPendingLoading(true);
          const response = await airtimeToCashService.getAdminPending({
            per_page: 50,
          });
          setPendingTransactions(response.data || []);
        } catch (error: any) {
          addToast({
            message: 'Failed to load pending transactions',
            type: 'error',
          });
        } finally {
          setPendingLoading(false);
        }
      };

      fetchPending();
    }
  }, [activeTab, addToast]);

  // Fetch all transactions with filters
  useEffect(() => {
    if (activeTab === 'all') {
      const fetchAll = async () => {
        try {
          setAllLoading(true);
          const params: any = { per_page: 50 };

          if (filters.status) params.status = filters.status;
          if (filters.provider) params.provider = filters.provider;
          if (filters.searchTerm) params.reference = filters.searchTerm;

          const response = await airtimeToCashService.getAdminAll(params);
          setAllTransactions(response.data || []);
        } catch (error: any) {
          addToast({
            message: 'Failed to load transactions',
            type: 'error',
          });
        } finally {
          setAllLoading(false);
        }
      };

      fetchAll();
    }
  }, [activeTab, filters, addToast]);

  if (loading) {
    return <CardSkeleton count={4} />;
  }

  const transactions = activeTab === 'pending' ? pendingTransactions : allTransactions;
  const isLoadingTransactions = activeTab === 'pending' ? pendingLoading : allLoading;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">
          Airtime-to-Cash Management
        </h1>
        <p className="mt-2 text-gray-600">
          Review and manage conversion requests from users
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => router.push('/admin/airtime-to-cash/providers')}
          className="rounded-xl bg-[#d71927] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#c01820] flex items-center gap-2"
        >
          <Settings size={18} />
          Manage Providers
        </Button>
      </div>

      {/* Dashboard Metrics */}
      {dashboardData && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Pending Approval */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="mt-2 text-3xl font-extrabold text-amber-600">
                    {dashboardData.overview.pending_approval}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
                  <Clock className="text-amber-600" size={24} />
                </div>
              </div>
            </Card>

            {/* Total Conversions */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="mt-2 text-3xl font-extrabold text-blue-600">
                    {dashboardData.overview.total_requests}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                  <Send className="text-blue-600" size={24} />
                </div>
              </div>
            </Card>

            {/* Completed Today */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="mt-2 text-3xl font-extrabold text-green-600">
                    {dashboardData.overview.completed_today}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                  <Check className="text-green-600" size={24} />
                </div>
              </div>
            </Card>

            {/* Today's Revenue */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Fees</p>
                  <p className="mt-2 text-2xl font-extrabold text-[#d71927]">
                    ₦{dashboardData.revenue.today_fees_earned.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                  <DollarSign className="text-[#d71927]" size={24} />
                </div>
              </div>
            </Card>
          </div>

          {/* Volume & Revenue Summary */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-bold text-gray-900">Today's Volume</p>
              <p className="mt-4 text-2xl font-extrabold text-gray-900">
                ₦{dashboardData.volume.today_total_converted.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Airtime received: ₦
                {dashboardData.volume.today_airtime_received.toLocaleString()}
              </p>
            </Card>

            <Card className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-bold text-gray-900">This Month</p>
              <p className="mt-4 text-2xl font-extrabold text-gray-900">
                ₦{dashboardData.volume.this_month_total_converted.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Total conversions this month
              </p>
            </Card>

            <Card className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-bold text-gray-900">Total Revenue</p>
              <p className="mt-4 text-2xl font-extrabold text-[#d71927]">
                ₦{dashboardData.revenue.total_fees_earned.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-gray-600">All-time service fees</p>
            </Card>
          </div>

          {/* Provider Breakdown */}
          <Card className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="mb-6 text-lg font-bold text-gray-900">Provider Breakdown</p>

            <div className="space-y-3">
              {Object.entries(dashboardData.by_provider).map(([provider, stats]) => (
                <div key={provider} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{provider}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {stats.total_requests} total • {stats.completed} completed •{' '}
                        {stats.rejected} rejected
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₦{stats.total_cash_converted.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        Fees: ₦{stats.total_fees.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Recent Conversions Section */}
      {allTransactions.length > 0 && (
        <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
            <p className="text-lg font-bold text-gray-900">Recent Conversions</p>
            <Button
              onClick={() => setActiveTab('all')}
              className="rounded-lg text-white font-bold text-sm hover:text-white flex items-center gap-2"
            >
              View All
              <ChevronRight size={18} />
            </Button>
          </div>

          <div className="p-6">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {allTransactions.slice(0, 5).map((transaction) => {
                const config = STATUS_CONFIG[transaction.status];

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() =>
                      router.push(
                        `/admin/airtime-to-cash/${transaction.id}`
                      )
                    }
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <Send className="text-gray-600" size={20} />
                      </div>

                      <div>
                        <p className="font-bold text-gray-900">
                          {transaction.user?.first_name || 'User'}{' '}
                          {transaction.user?.last_name || ''}
                        </p>
                        <p className="text-xs text-gray-600">
                          {transaction.provider.toUpperCase()} •{' '}
                          {transaction.reference}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-bold text-gray-900">
                          ₦{transaction.airtime_amount.toLocaleString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-lg font-bold ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* User's Conversion History Section */}
      {user && (
        <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div>
              <p className="text-lg font-bold text-gray-900">Your Conversion History</p>
              <p className="text-sm text-gray-600 mt-1">
                {user.first_name} {user.last_name}
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard/airtime-to-cash')}
              className="rounded-lg text-white font-bold text-sm hover:text-white flex items-center gap-2"
            >
              View All
              <ChevronRight size={18} />
            </Button>
          </div>

          <div className="p-6">
            {userHistoryLoading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="animate-spin text-[#d71927]" size={20} />
                <p className="text-gray-600">Loading your history...</p>
              </div>
            ) : userHistory.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {userHistory.map((transaction) => {
                  const config = STATUS_CONFIG[transaction.status as AirtimeCashTransactionStatus];
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() =>
                        router.push(`/dashboard/airtime-to-cash/${transaction.id}/details`)
                      }
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <Send className="text-gray-600" size={20} />
                        </div>

                        <div>
                          <p className="font-bold text-gray-900">
                            {transaction.provider.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(transaction.created_at).toLocaleDateString()} •{' '}
                            {transaction.reference}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="font-bold text-gray-900">
                            ₦{Number(transaction.airtime_amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {transaction.cash_credited > 0
                              ? `→ ₦${transaction.cash_credited.toLocaleString()}`
                              : `→ ₦${Number(Math.round(Number(transaction.net_amount) * Number(transaction.conversion_rate) * 100) / 100).toLocaleString()}`}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-lg font-bold ${config?.color || 'bg-gray-100 text-gray-700'}`}>
                          {config?.label || transaction.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Send className="mx-auto text-gray-300 mb-3" size={32} />
                <p className="text-gray-600">No conversion history yet</p>
                <p className="text-sm text-gray-500">Start converting airtime to cash on your dashboard</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Transactions Section */}
      <Card className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-sm font-bold transition-colors ${
                activeTab === 'pending'
                  ? 'border-b-2 border-[#d71927] text-[#d71927]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({dashboardData?.overview.pending_approval || 0})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-sm font-bold transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-[#d71927] text-[#d71927]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Transactions
            </button>
          </div>
        </div>

        {/* Filters for "All" tab */}
        {activeTab === 'all' && (
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="grid gap-4 md:grid-cols-4">
              <input
                type="text"
                placeholder="Search reference or phone..."
                value={filters.searchTerm || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    searchTerm: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#d71927] focus:outline-none"
              />

              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#d71927] focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="transfer_submitted">Proof Submitted</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={filters.provider || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    provider: e.target.value,
                  }))
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#d71927] focus:outline-none"
              >
                <option value="">All Providers</option>
                <option value="mtn">MTN</option>
                <option value="airtel">Airtel</option>
                <option value="glo">Globacom</option>
                <option value="9mobile">9mobile</option>
              </select>

              <button
                onClick={() => {
                  setFilters({
                    status: '',
                    provider: '',
                    searchTerm: '',
                  });
                }}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="p-6">
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="animate-spin text-[#d71927]" size={24} />
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Send className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-bold text-gray-900">No transactions</p>
              <p className="mt-2 text-gray-600">
                {activeTab === 'pending'
                  ? 'All conversion requests are approved!'
                  : 'No transactions match your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => {
                const config = STATUS_CONFIG[transaction.status];

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() =>
                      router.push(
                        `/admin/airtime-to-cash/${transaction.id}`
                      )
                    }
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <Send className="text-gray-600" size={20} />
                      </div>

                      <div>
                        <p className="font-bold text-gray-900">
                          {transaction.user?.first_name || 'User'}{' '}
                          {transaction.user?.last_name || ''}
                        </p>
                        <p className="text-xs text-gray-600">
                          {transaction.provider.toUpperCase()} •{' '}
                          {transaction.reference}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-bold text-gray-900">
                          ₦{transaction.airtime_amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">
                          {transaction.cash_credited > 0
                            ? `→ ₦${transaction.cash_credited.toLocaleString()}`
                            : `→ ₦${Number(Math.round(Number(transaction.net_amount) * Number(transaction.conversion_rate) * 100) / 100).toLocaleString()}`}
                        </p>
                      </div>

                      <div
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${config.color}`}
                      >
                        {config.label}
                      </div>

                      <ChevronRight className="text-gray-400" size={20} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <Toast />
    </div>
  );
}
