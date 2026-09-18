'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Clock,
  Ban,
  CheckCircle,
  Send,
  MailPlus,
  Pencil,
  Landmark,
  FileText,
  TrendingUp,
  Users,
  Eye,
  EyeOff,
  AlertTriangle,
  Wallet,
  Globe,
  KeyRound,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Spinner } from '@/components/shared/Spinner';
import { useAlert } from '@/hooks/useAlert';
import { adminService } from '@/services/admin.service';
import { formatDateTime, formatDate } from '@/utils/format.utils';
import type { AdminUser } from '@/types/api.types';

// ─── Types ────────────────────────────────────────────────────────────────

interface UserTransaction {
  id: number;
  reference: string;
  transaction_type: string;
  amount: number;
  status: string;
  transaction_date: string;
  description?: string;
}

interface UserStats {
  total_transactions: number;
  successful_transactions: number;
  total_spending: number;
  wallet_balance: number;
  unread_notifications: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getStatusVariant(status?: string): 'success' | 'danger' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    active: 'success',
    suspended: 'danger',
    inactive: 'warning',
  };
  return map[status ?? ''] ?? 'info';
}

function getSuccessRate(stats?: UserStats): string {
  if (!stats || stats.total_transactions === 0) return '—';
  return `${((stats.successful_transactions / stats.total_transactions) * 100).toFixed(1)}%`;
}

function getAccountAge(createdAt?: string): string {
  if (!createdAt) return '—';
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Today';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years}y ${remMonths}m`;
}

function maskSensitive(value: string | null | undefined, show: boolean): string {
  if (!value) return 'Not Provided';
  if (show) return value;
  if (value.length <= 4) return '****';
  return `${value.slice(0, 3)}${'*'.repeat(Math.max(0, value.length - 6))}${value.slice(-3)}`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────

function InfoRow({ label, value, mono, sensitive }: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  sensitive?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280] shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-sm font-medium text-[#111827] sm:text-right ${mono ? 'font-mono' : ''} break-all`}>
          {sensitive && typeof value === 'string' ? maskSensitive(value, revealed) : value ?? 'Not Provided'}
        </span>
        {sensitive && typeof value === 'string' && value && (
          <button
            type="button"
            onClick={() => setRevealed(!revealed)}
            className="text-[#6b7280] hover:text-[#111827] transition-colors shrink-0"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, className = '' }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
          <Icon className="h-4 w-4 text-[#6b7280]" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#f8fafc] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-[#111827]">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-[#6b7280]">{sub}</p>}
    </div>
  );
}

function ActionButton({ label, icon: Icon, onClick, variant = 'outline', danger, disabled, loading }: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  const base = 'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all';
  const styles = danger
    ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
    : variant === 'primary'
    ? 'bg-[#d71927] text-white hover:bg-[#b91420]'
    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global system settings
  const [systemSettings, setSystemSettings] = useState<Record<string, boolean>>({});

  // Action states
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [creatingVA, setCreatingVA] = useState(false);

  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  // Form states
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [notificationData, setNotificationData] = useState({ title: '', body: '' });
  const [emailData, setEmailData] = useState({ title: '', body: '' });
  const [suspendReason, setSuspendReason] = useState('');

  const userId = params.id as string;

  // ── Data Fetching ───────────────────────────────────────────────────────

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getUser(userId);
      if (response.success) {
        const userData = (response as any).data;
        const statsData = (response as any).statistics;
        setUser(userData);
        setStats(statsData);
      } else {
        setError('User not found');
      }
    } catch (err: any) {
      if (err.response?.status === 404) setError('User not found');
      else if (err.response?.status === 403) setError('You do not have permission to view this user');
      else setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    try {
      setTxLoading(true);
      const response = await adminService.getUserTransactions(userId, 1, 10);
      const txData = response?.data ?? (Array.isArray(response) ? response : []);
      setTransactions(txData || []);
    } catch {
      // silent
    } finally {
      setTxLoading(false);
    }
  }, [userId]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await adminService.getRoles();
      const rolesData = Array.isArray(response) ? response : (response as any)?.data ?? [];
      setRoles(rolesData);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchTransactions();
  }, [fetchUser, fetchTransactions]);

  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const response = await adminService.getSystemSettings();
        if (response.data?.data) {
          setSystemSettings(response.data.data);
        }
      } catch {
        // silent
      }
    };
    fetchSystemSettings();
  }, []);

  // ── Action Handlers ─────────────────────────────────────────────────────

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    try {
      setLoadingAction(action);
      await fn();
      showAlert(`${action} completed successfully`, 'success');
      await fetchUser();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || `Failed to ${action.toLowerCase()}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSuspend = () => {
    handleAction('Suspend', async () => {
      await adminService.updateUserStatus(userId, { status: 'suspended', reason: suspendReason || undefined });
      setShowSuspendModal(false);
      setSuspendReason('');
      fetchUser();
    });
  };

  const handleActivate = () => {
    handleAction('Activate', async () => {
      await adminService.updateUserStatus(userId, { status: 'active' });
      fetchUser();
    });
  };

  const handleVerify = () => {
    handleAction('Verify', async () => {
      await adminService.updateUser(userId, { is_verified: true });
    });
  };

  const handleUnverify = () => {
    handleAction('Unverify', async () => {
      await adminService.updateUser(userId, { is_verified: false });
    });
  };

  const handleAssignRole = () => {
    if (selectedRoles.length === 0) return;
    handleAction('Update Roles', async () => {
      await adminService.changeUserRoles(userId, selectedRoles);
      setShowRoleModal(false);
      setSelectedRoles([]);
    });
  };

  const handleRevokeRole = (roleName: string) => {
    handleAction('Revoke Role', async () => {
      await adminService.revokeUserRole(userId, roleName);
    });
  };

  const handleToggleVirtualAccounts = () => {
    handleAction('Toggle VA Visibility', async () => {
      await adminService.toggleUserVirtualAccounts(userId);
      fetchUser();
    });
  };

  const handleToggleUserProvider = (provider: string) => {
    handleAction('Toggle Provider', async () => {
      await adminService.toggleUserProvider(userId, provider);
      fetchUser();
    });
  };

  const handleCreateVirtualAccount = async () => {
    try {
      setCreatingVA(true);
      const response = await adminService.createVirtualAccount(userId);
      showAlert('Virtual account created successfully', 'success');
      setUser((prev) => prev ? {
        ...prev,
        virtual_account_number: response?.data?.data?.virtual_accounts?.[0]?.virtual_account_number || 'Pending',
      } : prev);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.requires_tier_upgrade) {
        showAlert('User must upgrade to Tier 1 before a virtual account can be created.', 'error');
      } else {
        showAlert(data?.message || 'Failed to create virtual account', 'error');
      }
    } finally {
      setCreatingVA(false);
    }
  };

  const handleSendTierUpgradeReminder = async () => {
    try {
      setLoadingAction('Send Reminder');
      await adminService.sendTierUpgradeReminder(userId);
      showAlert('Tier upgrade reminder sent to user', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Failed to send reminder', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendNotification = () => {
    if (!notificationData.title || !notificationData.body) return;
    handleAction('Send Notification', async () => {
      await adminService.sendNotificationWithData(userId, {
        title: notificationData.title,
        body: notificationData.body,
        type: 'system',
        priority: 'normal',
      });
      setShowNotificationModal(false);
      setNotificationData({ title: '', body: '' });
    });
  };

  const handleSendEmail = () => {
    if (!emailData.title || !emailData.body) return;
    handleAction('Send Email', async () => {
      await adminService.sendEmailToUser(userId, {
        title: emailData.title,
        body: emailData.body,
        type: 'system',
        priority: 'normal',
      });
      setShowEmailModal(false);
      setEmailData({ title: '', body: '' });
    });
  };

  // ── Computed ────────────────────────────────────────────────────────────

  const isVerified = user?.is_verified ?? false;
  const isSuspended = user?.status === 'suspended';
  const hasVirtualAccount = !!user?.virtual_account_number;

  // ── Loading / Error ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-200" />
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <button
            onClick={() => router.push('/admin/users')}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#d71927] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </button>
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">{error}</h2>
            <p className="mt-2 text-sm text-gray-500">We couldn't load the user details.</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => router.push('/admin/users')}>
                Back to Users
              </Button>
              <Button variant="primary" onClick={fetchUser}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f8f8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ── Back ── */}
        <button
          onClick={() => router.push('/admin/users')}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 transition-colors hover:text-[#d71927]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        {/* ── Header Card ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#d71927] text-lg font-bold text-white">
                {user.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt={fullName} className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
                  <Badge variant={getStatusVariant(user.status)} size="sm">
                    {(user.status ?? 'active').charAt(0).toUpperCase() + (user.status ?? 'active').slice(1)}
                  </Badge>
                  {isVerified && (
                    <Badge variant="success" size="sm">Verified</Badge>
                  )}
                  {user.roles?.map((role) => (
                    <Badge key={role} variant={role === 'admin' ? 'danger' : 'info'} size="sm">
                      {role}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1.5 font-mono text-sm text-gray-500">{user.email}</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  User #{user.id} · Member for {getAccountAge((user as any).created_at)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user.status === 'suspended' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleActivate}
                  disabled={loadingAction === 'Activate'}
                  className="inline-flex items-center gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                >
                  {loadingAction === 'Activate' ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Activating…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" />
                      Unsuspend
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuspendModal(true)}
                  disabled={user.roles?.includes('admin')}
                  className="inline-flex items-center gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Suspend
                </Button>
              )}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { fetchRoles(); setShowNotificationModal(true); }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Notify
                </Button>
                <span
                  className={`h-2 w-2 rounded-full ${user.has_push_token ? 'bg-green-500' : 'bg-gray-300'}`}
                  title={user.has_push_token ? 'Push notifications enabled' : 'No push token — user won\'t receive push notifications'}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchRoles(); setShowEmailModal(true); }}
                className="inline-flex items-center gap-1.5"
              >
                <MailPlus className="h-3.5 w-3.5" />
                Email
              </Button>
            </div>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-6">
            {/* Profile */}
            <SectionCard title="Profile Information" icon={User}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
                <InfoRow label="User ID" value={`#${user.id}`} mono />
                <InfoRow label="Full Name" value={fullName} />
                <InfoRow label="Email Address" value={user.email} mono />
                <InfoRow label="Phone Number" value={user.phone_number} mono />
                <InfoRow label="Date of Birth" value={user.dob ? formatDate(user.dob) : null} />
                {user.address && (
                  <InfoRow
                    label="Address"
                    value={
                      typeof user.address === 'string'
                        ? user.address
                        : [user.address.street, user.address.city, user.address.state, user.address.country].filter(Boolean).join(', ')
                    }
                  />
                )}
                <InfoRow
                  label="Push Notifications"
                  value={
                    user.has_push_token ? (
                      <span className="inline-flex items-center gap-1.5 text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-gray-400">
                        <Ban className="h-3.5 w-3.5" />
                        Not Available
                      </span>
                    )
                  }
                />
              </div>
            </SectionCard>

            {/* Verification */}
            <SectionCard title="Verification & Security" icon={ShieldCheck}>
              <div className="space-y-1">
                <InfoRow
                  label="Email Verification"
                  value={
                    user.isEmailVerified ? (
                      <span className="inline-flex items-center gap-1.5 text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified {user.email_verified_at && `· ${formatDate(user.email_verified_at)}`}
                      </span>
                    ) : (
                      <span className="text-yellow-600">Not Verified</span>
                    )
                  }
                />
                <InfoRow
                  label="Phone Verification"
                  value={
                    user.isPhoneVerified ? (
                      <span className="inline-flex items-center gap-1.5 text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified {user.phone_verified_at && `· ${formatDate(user.phone_verified_at)}`}
                      </span>
                    ) : (
                      <span className="text-yellow-600">Not Verified</span>
                    )
                  }
                />
              </div>
            </SectionCard>

            {/* KYC */}
            <SectionCard title="KYC Information" icon={FileText}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
                <InfoRow
                  label="KYC Tier"
                  value={user.kyc_tier ? user.kyc_tier.replace('_', ' ') : 'N/A'}
                />
                <InfoRow
                  label="KYC Status"
                  value={
                    <Badge
                      variant={
                        user.kyc_status === 'approved' ? 'success' :
                        user.kyc_status === 'pending' ? 'warning' : 'danger'
                      }
                      size="sm"
                    >
                      {(user.kyc_status || 'N/A').toUpperCase()}
                    </Badge>
                  }
                />
                <InfoRow label="BVN" value={user.bvn} sensitive mono />
                <InfoRow label="NIN" value={user.nin} sensitive mono />
              </div>
            </SectionCard>

            {/* Maplerad */}
            {user.maplerad_id && (
              <SectionCard title="Maplerad Integration" icon={Landmark}>
                <div className="space-y-1">
                  <InfoRow label="Maplerad Customer ID" value={user.maplerad_id} mono />
                  {hasVirtualAccount ? (
                    <>
                      <InfoRow label="Virtual Account" value={user.virtual_account_number} mono />
                      {user.virtual_account_bank && (
                        <InfoRow label="Bank" value={user.virtual_account_bank} />
                      )}
                    </>
                  ) : (!user.kyc_tier || user.kyc_tier === 'TIER_ZERO') ? (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-orange-300 bg-orange-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Tier 1 Required</p>
                        <p className="text-xs text-gray-500">User must complete Tier 1 verification (DOB, address, BVN) before a virtual account can be created.</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSendTierUpgradeReminder}
                        disabled={loadingAction === 'Send Reminder'}
                      >
                        {loadingAction === 'Send Reminder' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Send Reminder'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">No Virtual Account</p>
                        <p className="text-xs text-gray-500">User does not have a virtual account assigned.</p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCreateVirtualAccount}
                        disabled={creatingVA}
                      >
                        {creatingVA ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Creating…
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Paystack Virtual Account */}
            {user.paystack_account_number && (
              <SectionCard title="Paystack Virtual Account" icon={Landmark}>
                <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
                  <InfoRow label="Account Number" value={user.paystack_account_number} mono />
                  <InfoRow label="Account Name" value={user.paystack_account_name} />
                  <InfoRow label="Bank" value={user.paystack_bank_name} />
                  <InfoRow
                    label="Status"
                    value={
                      <Badge variant={user.paystack_account_active ? 'success' : 'danger'} size="sm">
                        {user.paystack_account_active ? 'Active' : 'Inactive'}
                      </Badge>
                    }
                  />
                </div>
              </SectionCard>
            )}

            {/* Financial Overview */}
            <SectionCard title="Financial Overview" icon={Wallet}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                  label="Wallet Balance"
                  value={`₦${(user.balance || stats?.wallet_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <StatCard
                  label="Total Spending"
                  value={`₦${(stats?.total_spending || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <StatCard
                  label="Total Transactions"
                  value={stats?.total_transactions ?? 0}
                />
                <StatCard
                  label="Success Rate"
                  value={getSuccessRate(stats ?? undefined)}
                  sub={stats ? `${stats.successful_transactions} successful` : undefined}
                />
              </div>
            </SectionCard>

            {/* Recent Transactions */}
            <SectionCard title="Recent Transactions" icon={Activity}>
              {txLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No transactions yet.</p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="pb-3 font-semibold text-gray-500">Reference</th>
                          <th className="pb-3 font-semibold text-gray-500">Type</th>
                          <th className="pb-3 font-semibold text-gray-500 text-right">Amount</th>
                          <th className="pb-3 font-semibold text-gray-500">Status</th>
                          <th className="pb-3 font-semibold text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {transactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                          >
                            <td className="py-3 font-mono text-xs text-gray-700">{tx.reference}</td>
                            <td className="py-3 text-xs capitalize text-gray-700">
                              {tx.transaction_type?.replace(/_/g, ' ')}
                            </td>
                            <td className="py-3 text-right font-mono text-xs font-semibold text-gray-900">
                              ₦{tx.amount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3">
                              <Badge
                                variant={tx.status === 'success' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'}
                                size="sm"
                              >
                                {tx.status}
                              </Badge>
                            </td>
                            <td className="py-3 text-xs text-gray-500">
                              {formatDateTime(tx.transaction_date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="cursor-pointer rounded-xl border border-gray-100 bg-[#f8fafc] p-4 transition-colors hover:bg-gray-50"
                        onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-xs font-medium text-gray-900">{tx.reference}</p>
                            <p className="mt-1 text-xs capitalize text-gray-500">
                              {tx.transaction_type?.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono text-xs font-semibold text-gray-900">
                              ₦{tx.amount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="mt-1">
                              <Badge
                                variant={tx.status === 'success' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'}
                                size="sm"
                              >
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] text-gray-400">{formatDateTime(tx.transaction_date)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {transactions.length > 0 && (
                <button
                  onClick={() => router.push(`/admin/transactions?user_id=${userId}`)}
                  className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold text-[#d71927] transition-colors hover:bg-red-50"
                >
                  View All Transactions
                </button>
              )}
            </SectionCard>
          </div>

          {/* ── RIGHT COLUMN: Sidebar ── */}
          <aside className="space-y-6">
            {/* Quick Actions */}
            <SectionCard title="Quick Actions" icon={KeyRound}>
              <div className="space-y-2">
                {isSuspended ? (
                  <ActionButton
                    label={loadingAction === 'Activate' ? 'Activating…' : 'Activate Account'}
                    icon={CheckCircle}
                    onClick={handleActivate}
                    variant="primary"
                    loading={loadingAction === 'Activate'}
                  />
                ) : (
                  <ActionButton
                    label="Suspend Account"
                    icon={Ban}
                    onClick={() => setShowSuspendModal(true)}
                    danger
                  />
                )}

                {isVerified ? (
                  <ActionButton
                    label={loadingAction === 'Unverify' ? 'Unverifying…' : 'Revoke Verification'}
                    icon={ShieldAlert}
                    onClick={handleUnverify}
                    loading={loadingAction === 'Unverify'}
                  />
                ) : (
                  <ActionButton
                    label={loadingAction === 'Verify' ? 'Verifying…' : 'Mark as Verified'}
                    icon={ShieldCheck}
                    onClick={handleVerify}
                    variant="primary"
                    loading={loadingAction === 'Verify'}
                  />
                )}

                <ActionButton
                  label="Manage Roles"
                  icon={Users}
                  onClick={() => { fetchRoles(); setSelectedRoles(user.roles || []); setShowRoleModal(true); }}
                />

                <div className="border-t border-gray-100 pt-2">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Virtual Account Visibility</p>
                  
                  {/* Paystack DVA toggle */}
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {user.paystack_dva_visible !== false && systemSettings.paystack_dva_enabled !== false ? (
                        <Eye className="h-4 w-4 text-gray-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700">Paystack DVA</span>
                        {systemSettings.paystack_dva_enabled === false && (
                          <p className="text-[10px] text-amber-600">Globally disabled in System Settings</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleUserProvider('paystack')}
                      disabled={loadingAction === 'Toggle Provider' || systemSettings.paystack_dva_enabled === false}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        user.paystack_dva_visible !== false && systemSettings.paystack_dva_enabled !== false ? 'bg-[#d71927]' : 'bg-gray-300'
                      } ${systemSettings.paystack_dva_enabled === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={systemSettings.paystack_dva_enabled === false ? 'Globally disabled in System Settings' : ''}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          user.paystack_dva_visible !== false && systemSettings.paystack_dva_enabled !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Maplerad VA toggle */}
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {user.maplerad_va_visible !== false && systemSettings.maplerad_virtual_accounts_enabled !== false ? (
                        <Eye className="h-4 w-4 text-gray-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700">Maplerad VA</span>
                        {systemSettings.maplerad_virtual_accounts_enabled === false && (
                          <p className="text-[10px] text-amber-600">Globally disabled in System Settings</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleUserProvider('maplerad')}
                      disabled={loadingAction === 'Toggle Provider' || systemSettings.maplerad_virtual_accounts_enabled === false}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        user.maplerad_va_visible !== false && systemSettings.maplerad_virtual_accounts_enabled !== false ? 'bg-[#d71927]' : 'bg-gray-300'
                      } ${systemSettings.maplerad_virtual_accounts_enabled === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={systemSettings.maplerad_virtual_accounts_enabled === false ? 'Globally disabled in System Settings' : ''}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          user.maplerad_va_visible !== false && systemSettings.maplerad_virtual_accounts_enabled !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <Link href="/admin/settings/system" className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings className="h-3 w-3" />
                    Global System Settings
                  </Link>
                </div>
              </div>
            </SectionCard>

            {/* Roles & Permissions */}
            <SectionCard title="Roles & Permissions" icon={Shield}>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Roles</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <div key={role} className="group flex items-center gap-1">
                          <Badge variant={role === 'admin' ? 'danger' : role === 'agent' ? 'warning' : 'info'} size="sm">
                            {role}
                          </Badge>
                          <button
                            onClick={() => handleRevokeRole(role)}
                            className="hidden h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200 group-hover:inline-flex"
                            title={`Revoke ${role} role`}
                          >
                            <span className="text-[10px] leading-none">&times;</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No roles assigned</span>
                    )}
                  </div>
                </div>
                {user.permissions && user.permissions.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Permissions</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {user.permissions.slice(0, 8).map((perm) => (
                        <Badge key={perm} variant="default" size="sm">{perm}</Badge>
                      ))}
                      {user.permissions.length > 8 && (
                        <Badge variant="default" size="sm">+{user.permissions.length - 8} more</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* User Intelligence */}
            <SectionCard title="User Intelligence" icon={TrendingUp}>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-500">Account Age</span>
                  <span className="text-sm font-semibold text-gray-900">{getAccountAge((user as any).created_at)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-500">Avg. Transaction Value</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats && stats.total_transactions > 0
                      ? `₦${(stats.total_spending / stats.total_transactions).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-500">Conversion Rate</span>
                  <span className="text-sm font-semibold text-gray-900">{getSuccessRate(stats ?? undefined)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-gray-500">Unread Notifications</span>
                  <span className="text-sm font-semibold text-gray-900">{stats?.unread_notifications ?? 0}</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Risk Indicators</p>
                  <div className="mt-2 space-y-1.5">
                    {!user.isEmailVerified && (
                      <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700">Email not verified</span>
                      </div>
                    )}
                    {!user.isPhoneVerified && (
                      <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700">Phone not verified</span>
                      </div>
                    )}
                    {user.status === 'suspended' && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                        <Ban className="h-3.5 w-3.5 text-red-600" />
                        <span className="text-xs font-medium text-red-700">Account suspended</span>
                      </div>
                    )}
                    {user.isEmailVerified && user.isPhoneVerified && user.status !== 'suspended' && (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs font-medium text-green-700">No issues detected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Account Timeline */}
            <SectionCard title="Account Timeline" icon={Clock}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Account Created</p>
                    <p className="text-[11px] text-gray-500">
                      {(user as any).created_at ? formatDateTime((user as any).created_at) : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Last Updated</p>
                    <p className="text-[11px] text-gray-500">
                      {(user as any).updated_at ? formatDateTime((user as any).updated_at) : 'N/A'}
                    </p>
                  </div>
                </div>
                {user.last_login && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <Globe className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Last Login</p>
                      <p className="text-[11px] text-gray-500">{formatDateTime(user.last_login)}</p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* User ID */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">User ID</p>
              <p className="mt-2 font-mono text-sm font-bold text-gray-900">#{user.id}</p>
            </div>
          </aside>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Modals ──────────────────────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}

        {/* Suspend Modal */}
        {showSuspendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">Suspend Account</h3>
              <p className="mt-1 text-sm text-gray-500">This will prevent {fullName} from accessing their account.</p>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Reason (optional)</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for suspension…"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]"
                />
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setShowSuspendModal(false)} className="flex-1">Cancel</Button>
                <Button variant="danger" onClick={handleSuspend} isLoading={loadingAction === 'Suspend'} className="flex-1">Suspend</Button>
              </div>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">Manage Roles</h3>
              <p className="mt-1 text-sm text-gray-500">Select roles for {fullName}. Current roles are pre-selected.</p>
              <div className="mt-4 space-y-2">
                {roles.map((role) => {
                  const isSelected = selectedRoles.includes(role.name);
                  const isCurrentRole = user.roles?.includes(role.name);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoles((prev) =>
                          isSelected ? prev.filter((r) => r !== role.name) : [...prev, role.name]
                        );
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-[#d71927] bg-red-50 text-[#d71927]'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{role.name}</span>
                        {isCurrentRole && !isSelected && (
                          <span className="text-[10px] font-semibold uppercase text-gray-400">current</span>
                        )}
                        {isSelected && (
                          <span className="h-4 w-4 rounded border-2 border-[#d71927] bg-[#d71927] flex items-center justify-center">
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => { setShowRoleModal(false); setSelectedRoles([]); }} className="flex-1">Cancel</Button>
                <Button variant="primary" onClick={handleAssignRole} disabled={selectedRoles.length === 0} isLoading={loadingAction === 'Update Roles'} className="flex-1">Save Roles</Button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">Send Notification</h3>
              <p className="mt-1 text-sm text-gray-500">Send a push notification to {fullName}.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Title</label>
                  <input
                    type="text"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                    placeholder="Notification title…"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Message</label>
                  <textarea
                    value={notificationData.body}
                    onChange={(e) => setNotificationData({ ...notificationData, body: e.target.value })}
                    rows={4}
                    placeholder="Notification message…"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setShowNotificationModal(false)} className="flex-1">Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleSendNotification}
                  disabled={!notificationData.title || !notificationData.body}
                  isLoading={loadingAction === 'Send Notification'}
                  className="flex-1"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">Send Email</h3>
              <p className="mt-1 text-sm text-gray-500">Send an email to {user.email}.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={emailData.title}
                    onChange={(e) => setEmailData({ ...emailData, title: e.target.value })}
                    placeholder="Email subject…"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">Body</label>
                  <textarea
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    rows={6}
                    placeholder="Email body…"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => setShowEmailModal(false)} className="flex-1">Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleSendEmail}
                  disabled={!emailData.title || !emailData.body}
                  isLoading={loadingAction === 'Send Email'}
                  className="flex-1"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend Modal */}
        {showSuspendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900">Suspend Account</h3>
              <p className="mt-1 text-sm text-gray-500">
                This will immediately log out {fullName} and block all access. They will see a
                &quot;Account Suspended&quot; message on next login or API request.
              </p>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">Reason (optional)</label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  placeholder="Why is this account being suspended?"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]"
                />
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => { setShowSuspendModal(false); setSuspendReason(''); }} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSuspend}
                  isLoading={loadingAction === 'Suspend'}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Suspend Account
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
