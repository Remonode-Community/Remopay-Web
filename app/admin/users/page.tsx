'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  Shield,
  Users2,
  UserCheck,
  UserMinus,
  ShieldCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell,
  Trash2,
  X,
  CheckCircle,
  MailPlus,
  Send,
} from 'lucide-react';
import { FilterPanel, type FilterField } from '@/components/shared/FilterPanel';
import { useFilters } from '@/hooks/useFilters';

import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { Card } from '@/components/shared/Card';
import { Modal } from '@/components/shared/Modal';
import { TableSkeleton } from '@/components/shared/SkeletonLoader';
import { Spinner } from '@/components/shared/Spinner';
import { useAuthStore } from '@/store/auth.store';
import { useAlert } from '@/hooks/useAlert';
import { adminService } from '@/services/admin.service';
import { formatDate } from '@/utils/format.utils';
import type { AdminUser, SendBulkEmailRequest, SendBulkEmailResponse, SendBulkEmailInlineBanner } from '@/types/api.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStatus = 'active' | 'suspended' | 'inactive';
type BulkAction = 'verify' | 'unverify' | 'delete';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusVariant(
  status?: UserStatus | string
): 'success' | 'danger' | 'warning' | 'info' {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
    active: 'success',
    suspended: 'danger',
    inactive: 'warning',
  };
  return map[status ?? ''] ?? 'info';
}

// Filter configuration for FilterPanel component
const USERS_FILTER_FIELDS: FilterField[] = [
  {
    id: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by name, email, or phone…',
    helpText: 'Find users by their name, email, or phone number',
  },
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All Status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    id: 'verified',
    label: 'Verified',
    type: 'select',
    placeholder: 'All',
    options: [
      { value: 'all', label: 'All' },
      { value: 'verified', label: 'Verified' },
      { value: 'unverified', label: 'Unverified' },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showAlert } = useAlert();

  // ── State - Data ────────────────────────────────────────────────────────────

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [userDetails, setUserDetails] = useState<AdminUser | null>(null);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // ── State - Selected User ───────────────────────────────────────────────────

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string | number>>(new Set());
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedBulkAction, setSelectedBulkAction] = useState<BulkAction>('verify');
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [canScrollSummaryPrev, setCanScrollSummaryPrev] = useState(false);
  const [canScrollSummaryNext, setCanScrollSummaryNext] = useState(false);

  const updateSummaryScrollState = () => {
    const el = summaryRef.current;
    if (!el) return;
    setCanScrollSummaryPrev(el.scrollLeft > 0);
    setCanScrollSummaryNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scrollSummary = (direction: 'left' | 'right') => {
    const el = summaryRef.current;
    if (!el) return;
    const offset = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const el = summaryRef.current;
    if (!el) return;

    const handleScroll = () => {
      setCanScrollSummaryPrev(el.scrollLeft > 0);
      setCanScrollSummaryNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    handleScroll();
    el.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [users]);

  // Use the standardized filter hook
  const {
    isOpen,
    filters,
    hasActiveFilters,
    getActiveFilterCount,
    openFilters,
    closeFilters,
    applyFilters,
    resetFilters,
  } = useFilters({
    fields: USERS_FILTER_FIELDS,
    initialFilters: {
      search: '',
      status: 'all',
      verified: 'all',
    },
    onFiltersChange: () => {
      setCurrentPage(1); // Reset to page 1 when filters change
    },
  });

  // ── State - Modals ──────────────────────────────────────────────────────────

  const [showDetails, setShowDetails] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showBulkEmailConfirm, setShowBulkEmailConfirm] = useState(false);
  const [showBulkEmailResult, setShowBulkEmailResult] = useState(false);

  // ── State - Bulk Email ──────────────────────────────────────────────────────

  const [bulkEmailRecipientMode, setBulkEmailRecipientMode] = useState<'all' | 'specific'>('all');
  const [bulkEmailRecipientSearch, setBulkEmailRecipientSearch] = useState('');
  const [bulkEmailRecipientResults, setBulkEmailRecipientResults] = useState<AdminUser[]>([]);
  const [bulkEmailSelectedUsers, setBulkEmailSelectedUsers] = useState<AdminUser[]>([]);
  const [bulkEmailSearchLoading, setBulkEmailSearchLoading] = useState(false);
  const [bulkEmailResult, setBulkEmailResult] = useState<SendBulkEmailResponse | null>(null);

  const [bulkEmailData, setBulkEmailData] = useState({
    title: '',
    body: '',
    type: 'system' as 'transaction' | 'system' | 'promotion' | 'update' | 'alert',
    priority: 'normal' as 'low' | 'normal' | 'high',
    email_template: 'admin-custom',
    custom_greeting: '',
    highlight_info: '',
    details_section_title: '',
    action_button_url: '',
    action_button_text: '',
    support_text: '',
    custom_closing_message: '',
    ads_banner_enabled: true,
    ads_banner_title: '',
    ads_banner_description: '',
    ads_banner_cta_text: '',
    ads_banner_cta_url: '',
    inline_banners: [] as Array<{
      image_url: string;
      link_url: string;
      alt_text: string;
      width: string;
    }>,
  });

  // ── State - Form Data ───────────────────────────────────────────────────────

  const [editFormData, setEditFormData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    dob?: string;
    address?: string;
    bvn?: string;
    nin?: string;
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    dob: '',
    address: '',
    bvn: '',
    nin: '',
  });

  const [notificationData, setNotificationData] = useState({
    title: '',
    body: '',
    type: 'system',
    priority: 'normal',
    send_push: true,
    send_email: false,
  });

  const [emailData, setEmailData] = useState({
    title: '',
    body: '',
    type: 'system' as 'transaction' | 'system' | 'promotion' | 'update' | 'alert',
    priority: 'normal' as 'low' | 'normal' | 'high',
    send_push: false,
    send_email: true,
    email_template: 'admin-custom',
    extra_data: {
      greeting: '',
      details: [] as Array<{ label: string; value: string }>,
      details_title: '',
      highlight: '',
      actionUrl: '',
      actionText: '',
      support_text: '',
      closing_message: '',
    },
  });

  // ── State - Loading ─────────────────────────────────────────────────────────

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [creatingVirtualAccount, setCreatingVirtualAccount] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────────

  const isAdmin = useMemo(
    () => Boolean(user?.roles?.some((role) => role === 'admin')),
    [user]
  );

  useEffect(() => {
    if (user && !isAdmin) router.push('/dashboard');
  }, [user, isAdmin, router]);

  // Initial fetch on mount
  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchUsers = async (page = 1) => {
    try {
      if (page === currentPage && users.length > 0) {
        setLoading(true);
      } else if (page !== 1 || users.length > 0) {
        setIsPaginationLoading(true);
      } else {
        setLoading(true);
      }
      const filterParams: any = {
        search: filters.search || undefined,
      };

      if (filters.status && filters.status !== 'all') {
        filterParams.status = filters.status;
      }

      if (filters.verified && filters.verified !== 'all') {
        filterParams.verified = filters.verified === 'verified';
      }

      const response = await adminService.getUsers(page, 10, filterParams);

      if (response?.data) {
        const userData = Array.isArray(response.data)
          ? response.data
          : response.data.data ?? [];
        setUsers(userData);
        if (response.pagination) {
          setTotalPages(response.pagination.last_page ?? 1);
        }
        
        // Use stats from API response
        if (response.stats) {
          setTotalUsersCount(response.stats.total_users ?? 0);
          setWalletBalance(response.stats.total_wallet_balance ?? 0);
        } else {
          // Fallback if stats not provided
          setTotalUsersCount(response.pagination?.total ?? userData.length);
          setWalletBalance(0);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
      setIsPaginationLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await adminService.getRoles();

      let rolesData = [];
      if (Array.isArray(response)) {
        rolesData = response;
      } else if (Array.isArray(response.data)) {
        rolesData = response.data;
      } else if (response?.data && Array.isArray(response.data)) {
        rolesData = response.data;
      }

      setRoles(rolesData);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showAlert('Failed to fetch roles', 'error');
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchUserDetails = async (userId: string | number) => {
    try {
      const response = await adminService.getUser(String(userId));
      // Combine data with statistics and other fields from response
      const userData = response?.data?.user || response?.data;
      if (userData && typeof userData === 'object') {
        // Merge statistics, kyc_data and other root-level properties with user data
        const completeUserData = {
          ...userData,
          statistics: (response as any)?.statistics,
          kyc_data: (response as any)?.kyc_data,
        };
        setUserDetails(completeUserData as AdminUser);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      showAlert('Failed to fetch user details', 'error');
    }
  };

  const fetchUserTransactions = async (userId: string | number) => {
    try {
      setLoadingTransactions(true);
      const response = await adminService.getUserTransactions(String(userId), 1, 20);
      if (response?.data) {
        const txns = Array.isArray(response.data) ? response.data : response.data.data ?? [];
        setUserTransactions(txns);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showAlert('Failed to fetch transactions', 'error');
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Fetch users when page changes
  useEffect(() => {
    fetchUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Reset to page 1 when filters change (already handled by useFilters onFiltersChange)
  useEffect(() => {
    // Fetch with page 1 when filters change
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.verified]);

  // ── Action Handlers ────────────────────────────────────────────────────────

  const handleOpenDetails = async (user: AdminUser) => {
    router.push(`/admin/users/${user.id}`);
  };

  const handleOpenRoleModal = async (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedRole('');

    if (roles.length === 0) {
      await fetchRoles();
    }

    setShowRoleModal(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      setLoadingAction(true);
      await adminService.changeUserRole(selectedUser.id, selectedRole);
      showAlert('Role changed successfully', 'success');
      setShowRoleModal(false);
      setSelectedRole('');
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Error assigning role:', error);
      showAlert('Failed to change user role', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateVirtualAccount = async () => {
    if (!userDetails) return;

    try {
      setCreatingVirtualAccount(true);
      const response = await adminService.createVirtualAccount(userDetails.id);
      showAlert('Virtual account created successfully', 'success');
      setUserDetails({ ...userDetails, virtual_account_number: response?.data?.data?.virtual_accounts?.[0]?.virtual_account_number || 'Pending' });
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.requires_tier_upgrade) {
        showAlert('User must upgrade to Tier 1 before a virtual account can be created.', 'error');
      } else {
        showAlert(data?.message || 'Failed to create virtual account', 'error');
      }
    } finally {
      setCreatingVirtualAccount(false);
    }
  };

  const handleOpenNotificationModal = (user: AdminUser) => {
    setSelectedUser(user);
    setNotificationData({
      title: '',
      body: '',
      type: 'system',
      priority: 'normal',
      send_push: true,
      send_email: false,
    });
    setShowNotificationModal(true);
  };

  const handleSendNotification = async () => {
    if (!selectedUser || !notificationData.title || !notificationData.body) {
      showAlert('Please fill all required fields', 'warning');
      return;
    }

    try {
      setLoadingAction(true);
      await adminService.sendNotificationWithData(selectedUser.id, {
        title: notificationData.title,
        body: notificationData.body,
        type: notificationData.type,
        priority: notificationData.priority as 'high' | 'normal' | 'low',
        send_push: notificationData.send_push,
        send_email: notificationData.send_email,
      });
      showAlert('Notification sent successfully', 'success');
      setShowNotificationModal(false);
    } catch (error) {
      console.error('Error sending notification:', error);
      showAlert('Failed to send notification', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenEmailModal = (user: AdminUser) => {
    setSelectedUser(user);
    setEmailData({
      title: '',
      body: '',
      type: 'system',
      priority: 'normal',
      send_push: false,
      send_email: true,
      email_template: 'admin-custom',
      extra_data: {
        greeting: '',
        details: [],
        details_title: '',
        highlight: '',
        actionUrl: '',
        actionText: '',
        support_text: '',
        closing_message: '',
      },
    });
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!selectedUser || !emailData.title || !emailData.body) {
      showAlert('Please fill all required fields (Subject and Message)', 'warning');
      return;
    }

    try {
      setLoadingAction(true);
      
      // Build payload with only populated extra_data fields
      const payload: any = {
        title: emailData.title,
        body: emailData.body,
        type: emailData.type,
        priority: emailData.priority,
        send_push: emailData.send_push,
        send_email: emailData.send_email,
        email_template: emailData.email_template,
      };

      // Only include extra_data if any field is populated
      const hasExtraData = Object.entries(emailData.extra_data).some(([key, value]) => {
        if (key === 'details') return Array.isArray(value) && value.length > 0;
        return Boolean(value);
      });

      if (hasExtraData) {
        payload.extra_data = emailData.extra_data;
      }

      await adminService.sendEmailToUser(selectedUser.id, payload);
      showAlert('Email sent successfully', 'success');
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email:', error);
      showAlert('Failed to send email', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setEditFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number || '',
      dob: (user as any).dob || '',
      address: typeof (user as any).address === 'string' ? (user as any).address : JSON.stringify((user as any).address || {}),
      bvn: user.bvn || '',
      nin: user.nin || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setLoadingAction(true);
      const updatePayload = {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        email: editFormData.email,
        phone_number: editFormData.phone_number,
        ...(editFormData.dob && { dob: editFormData.dob }),
        ...(editFormData.address && { address: editFormData.address }),
        ...(editFormData.bvn && { bvn: editFormData.bvn }),
        ...(editFormData.nin && { nin: editFormData.nin }),
      };
      await adminService.updateUser(String(selectedUser.id), updatePayload);
      showAlert('User updated successfully', 'success');
      setShowEditModal(false);
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert('Failed to update user', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleOpenTransactionsModal = async (user: AdminUser) => {
    setSelectedUser(user);
    await fetchUserTransactions(user.id);
    setShowTransactionsModal(true);
  };

  const toggleUserSelection = (userId: string | number) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUsers(newSet);
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const handleExecuteBulkAction = async () => {
    if (selectedUsers.size === 0) {
      showAlert('Please select at least one user', 'warning');
      return;
    }

    try {
      setLoadingAction(true);
      await adminService.bulkUserAction(
        Array.from(selectedUsers) as number[],
        selectedBulkAction
      );
      showAlert(`Bulk action '${selectedBulkAction}' completed successfully`, 'success');
      setShowBulkActionModal(false);
      setSelectedUsers(new Set());
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Error executing bulk action:', error);
      showAlert(`Failed to execute bulk action`, 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${user.first_name} ${user.last_name}?`
      )
    ) {
      return;
    }

    try {
      setLoadingAction(true);
      await adminService.deleteUser(String(user.id));
      showAlert('User deleted successfully', 'success');
      fetchUsers(currentPage);
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('Failed to delete user', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  // ── Bulk Email Handlers ─────────────────────────────────────────────────────

  const handleOpenBulkEmailModal = () => {
    setBulkEmailRecipientMode('all');
    setBulkEmailRecipientSearch('');
    setBulkEmailRecipientResults([]);
    setBulkEmailSelectedUsers([]);
    setBulkEmailResult(null);
    setBulkEmailData({
      title: '',
      body: '',
      type: 'system',
      priority: 'normal',
      email_template: 'admin-custom',
      custom_greeting: '',
      highlight_info: '',
      details_section_title: '',
      action_button_url: '',
      action_button_text: '',
      support_text: '',
      custom_closing_message: '',
      ads_banner_enabled: true,
      ads_banner_title: '',
      ads_banner_description: '',
      ads_banner_cta_text: '',
      ads_banner_cta_url: '',
      inline_banners: [],
    });
    setShowBulkEmailModal(true);
    setShowBulkEmailConfirm(false);
    setShowBulkEmailResult(false);
  };

  const handleBulkEmailSearchUsers = async (query: string) => {
    setBulkEmailRecipientSearch(query);
    if (!query.trim()) {
      setBulkEmailRecipientResults([]);
      return;
    }

    try {
      setBulkEmailSearchLoading(true);
      const response = await adminService.getUsers(1, 20, { search: query });
      const userData = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data ?? [];
      setBulkEmailRecipientResults(userData);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setBulkEmailSearchLoading(false);
    }
  };

  const handleAddBulkEmailRecipient = (user: AdminUser) => {
    if (!bulkEmailSelectedUsers.find((u) => u.id === user.id)) {
      setBulkEmailSelectedUsers([...bulkEmailSelectedUsers, user]);
    }
    setBulkEmailRecipientSearch('');
    setBulkEmailRecipientResults([]);
  };

  const handleRemoveBulkEmailRecipient = (userId: string | number) => {
    setBulkEmailSelectedUsers(bulkEmailSelectedUsers.filter((u) => u.id !== userId));
  };

  const handleSendBulkEmail = async () => {
    if (!bulkEmailData.title || !bulkEmailData.body) {
      showAlert('Please fill all required fields (Subject and Message)', 'warning');
      return;
    }

    // Build payload
    const payload: SendBulkEmailRequest = {
      title: bulkEmailData.title,
      body: bulkEmailData.body,
      type: bulkEmailData.type,
      priority: bulkEmailData.priority,
      email_template: bulkEmailData.email_template,
    };

    // Only include user_ids if sending to specific users
    if (bulkEmailRecipientMode === 'specific' && bulkEmailSelectedUsers.length > 0) {
      payload.user_ids = bulkEmailSelectedUsers.map((u) => Number(u.id));
    }

    // Optional fields — only include if populated
    if (bulkEmailData.custom_greeting) payload.custom_greeting = bulkEmailData.custom_greeting;
    if (bulkEmailData.highlight_info) payload.highlight_info = bulkEmailData.highlight_info;
    if (bulkEmailData.details_section_title) payload.details_section_title = bulkEmailData.details_section_title;
    if (bulkEmailData.action_button_url) payload.action_button_url = bulkEmailData.action_button_url;
    if (bulkEmailData.action_button_text) payload.action_button_text = bulkEmailData.action_button_text;
    if (bulkEmailData.support_text) payload.support_text = bulkEmailData.support_text;
    if (bulkEmailData.custom_closing_message) payload.custom_closing_message = bulkEmailData.custom_closing_message;
    if (!bulkEmailData.ads_banner_enabled) payload.ads_banner_enabled = false;
    if (bulkEmailData.ads_banner_title) payload.ads_banner_title = bulkEmailData.ads_banner_title;
    if (bulkEmailData.ads_banner_description) payload.ads_banner_description = bulkEmailData.ads_banner_description;
    if (bulkEmailData.ads_banner_cta_text) payload.ads_banner_cta_text = bulkEmailData.ads_banner_cta_text;
    if (bulkEmailData.ads_banner_cta_url) payload.ads_banner_cta_url = bulkEmailData.ads_banner_cta_url;

    // Inline banners — only include if at least one has an image_url
    const validBanners = bulkEmailData.inline_banners.filter((b) => b.image_url.trim());
    if (validBanners.length > 0) {
      payload.inline_banners = validBanners.map((b) => ({
        image_url: b.image_url,
        ...(b.link_url && { link_url: b.link_url }),
        ...(b.alt_text && { alt_text: b.alt_text }),
        ...(b.width && { width: b.width }),
      }));
    }

    try {
      setLoadingAction(true);
      const response = await adminService.sendBulkEmail(payload);
      const resultData = response?.data?.data as SendBulkEmailResponse;
      if (resultData) {
        setBulkEmailResult(resultData);
      }
      showAlert('Bulk email queued successfully', 'success');
      setShowBulkEmailConfirm(false);
      setShowBulkEmailModal(false);
      setShowBulkEmailResult(true);
    } catch (error) {
      console.error('Error sending bulk email:', error);
      showAlert('Failed to send bulk email', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleProceedToConfirm = () => {
    if (!bulkEmailData.title || !bulkEmailData.body) {
      showAlert('Please fill all required fields (Subject and Message)', 'warning');
      return;
    }
    if (bulkEmailRecipientMode === 'specific' && bulkEmailSelectedUsers.length === 0) {
      showAlert('Please select at least one user or switch to "All Users"', 'warning');
      return;
    }
    setShowBulkEmailConfirm(true);
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const summary = useMemo(() => {
    const active = users.filter((u) => u.status === 'active' || !u.status).length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;
    return { total: totalUsersCount, active, suspended, inactive };
  }, [users, totalUsersCount]);

  // ── Guard render ────────────────────────────────────────────────────────────

  if (!isAdmin) return null;

  if (loading) {
    return <TableSkeleton rows={6} cols={5} />;
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen space-y-8 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 dark:bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#090707] dark:text-white"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Desktop Navigation Buttons */}
        {canScrollSummaryPrev && (
          <button
            onClick={() => scrollSummary('left')}
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 -translate-x-12 md:block"
            aria-label="Scroll cards left"
          >
            <div className="rounded-full bg-white shadow-lg border border-gray-200 p-3 hover:bg-gray-50 transition">
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </div>
          </button>
        )}
        
        {canScrollSummaryNext && (
          <button
            onClick={() => scrollSummary('right')}
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-12 md:block"
            aria-label="Scroll cards right"
          >
            <div className="rounded-full bg-white shadow-lg border border-gray-200 p-3 hover:bg-gray-50 transition">
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </div>
          </button>
        )}

        <div
          ref={summaryRef}
          className="flex gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 md:overflow-x-visible xl:grid-cols-5"
          onScroll={updateSummaryScrollState}
        >
          {[
            {
              title: 'All Users',
              value: summary.total,
              note: 'Registered user accounts',
              Icon: Users2,
            },
            {
              title: 'Active Accounts',
              value: summary.active,
              note: 'Users currently active',
              Icon: UserCheck,
            },
            {
              title: 'Suspended Accounts',
              value: summary.suspended,
              note: 'Restricted user accounts',
              Icon: ShieldCheck,
            },
            {
              title: 'Inactive Accounts',
              value: summary.inactive,
              note: 'Dormant or unused accounts',
              Icon: UserMinus,
            },
            {
              title: 'Total Wallet Balance',
              value: `₦${walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              note: 'Combined wallet balance',
              Icon: Users2,
              bgColor: 'bg-[#fef2f2]',
              iconColor: 'text-[#d71927]',
            },
          ].map(({ title, value, note, Icon, bgColor, iconColor }) => (
            <Card
              key={title}
              className="min-w-full snap-start rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.04)] md:min-w-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#6b7280]">{title}</p>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#111827]">
                    {value}
                  </p>
                  <p className="mt-2 text-sm text-[#6b7280]">{note}</p>
                </div>
                <div className={`rounded-2xl ${bgColor || 'bg-[#eef2ff]'} p-3`}>
                  <Icon className={`h-5 w-5 ${iconColor || 'text-[#4a5ff7]'}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Filters with FilterPanel ────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Button
          onClick={handleOpenBulkEmailModal}
          className="h-11 rounded-xl bg-[#d71927] px-4 font-semibold text-white shadow-lg shadow-[#d71927]/20 transition hover:bg-[#b91521]"
        >
          <MailPlus className="h-4 w-4 mr-2 inline" />
          Bulk Email
        </Button>
        <Button
          onClick={openFilters}
          className={`h-11 rounded-xl px-4 font-semibold transition ${
            hasActiveFilters
              ? 'bg-[#d71927] text-white shadow-lg shadow-[#d71927]/20 hover:bg-[#b91521]'
              : 'border border-black/10 text-[#111] hover:bg-[#f8f8f8]'
          }`}
        >
          <Filter className="h-4 w-4 mr-2 inline" />
          Filters {hasActiveFilters && `(${getActiveFilterCount()})`}
        </Button>
      </div>

      {/* FilterPanel Component */}
      <FilterPanel
        title="Filter Users"
        description="Search users and narrow results by status and verification status"
        fields={USERS_FILTER_FIELDS}
        isOpen={isOpen}
        onClose={closeFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        position="right"
        mobilePosition="auto"
      />

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white p-0 shadow-[0_10px_35px_rgba(0,0,0,0.04)]">
        <div className="border-b border-[#f1f5f9] px-6 py-5">
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
            User Records
          </h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            Manage user accounts, send communications, and update user information.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eef2ff]">
              <Users2 className="h-8 w-8 text-[#4a5ff7]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#111827]">
              No users found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#6b7280]">
              No users match your current search or filter criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b border-[#f1f5f9] bg-[#fcfcfd]">
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === users.length && users.length > 0}
                        onChange={toggleAllUsers}
                        className="h-4 w-4 rounded border-[#d1d5db] text-[#4a5ff7]"
                      />
                    </th>
                    {[
                      'User',
                      'Email',
                      'Phone',
                      'Status',
                      'Verified',
                      'Joined',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[#6b7280] ${
                          h === 'Actions' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[#f8fafc] transition-colors hover:bg-[#fafafa]"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(u.id)}
                          onChange={() => toggleUserSelection(u.id)}
                          className="h-4 w-4 rounded border-[#d1d5db] text-[#4a5ff7]"
                        />
                      </td>

                      {/* User */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.profile_photo_url ? (
                            <img
                              src={u.profile_photo_url}
                              alt={`${u.first_name} ${u.last_name}`}
                              className="h-11 w-11 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-bold text-[#4a5ff7]">
                              {u.first_name.charAt(0)}
                              {u.last_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[#111827]">
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-xs text-[#9ca3af]">ID: {u.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-[#6b7280]">
                        {u.email}
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-sm text-[#6b7280]">
                        {u.phone_number ?? '—'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(u.status)} size="sm">
                          {u.status ?? 'active'}
                        </Badge>
                      </td>

                      {/* Verified */}
                      <td className="px-6 py-4">
                        <Badge
                          variant={u.is_verified ? 'success' : 'warning'}
                          size="sm"
                        >
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 text-sm text-[#6b7280]">
                        {formatDate(u.created_at ?? '')}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetails(u)}
                            title="View Details"
                            aria-label={`View details for user ${u.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#4a5ff7] transition hover:bg-[#eef2ff]"
                          >
                            <Eye size={15} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleOpenNotificationModal(u)}
                            title="Send Notification"
                            aria-label={`Send notification to user ${u.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#6b7280] transition hover:bg-[#f1f5f9]"
                          >
                            <Bell size={15} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => handleOpenEmailModal(u)}
                            title="Send Email"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#6b7280] transition hover:bg-[#f1f5f9]"
                          >
                            <Mail size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            title="Change Role"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#6b7280] transition hover:bg-[#f1f5f9]"
                          >
                            <Shield size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-4 p-4 xl:hidden">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="rounded-[22px] border border-[#edf2f7] bg-[#fcfcfd] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                        className="h-4 w-4 rounded border-[#d1d5db] text-[#4a5ff7]"
                      />
                      <div>
                        <p className="text-base font-bold text-[#111827]">
                          {u.first_name} {u.last_name}
                        </p>
                        <p className="text-sm text-[#6b7280]">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(u.status)} size="sm">
                      {u.status ?? 'active'}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                        Phone
                      </p>
                      <p className="mt-1 text-sm text-[#111827]">
                        {u.phone_number ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-[#9ca3af]">
                        Verified
                      </p>
                      <p className="mt-1">
                        <Badge
                          variant={u.is_verified ? 'success' : 'warning'}
                          size="sm"
                        >
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="text-xs text-[#6b7280]">
                      Joined {formatDate(u.created_at ?? '')}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenDetails(u)}
                        className="rounded-lg p-2 text-[#4a5ff7] transition hover:bg-[#eef2ff]"
                        aria-label={`View details for user ${u.id}`}
                        title="View Details"
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleOpenNotificationModal(u)}
                        className="rounded-lg p-2 text-[#6b7280] transition hover:bg-[#f1f5f9]"
                        aria-label={`Send notification to user ${u.id}`}
                        title="Send Notification"
                      >
                        <Bell size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEmailModal(u)}
                        className="rounded-lg p-2 text-[#6b7280] transition hover:bg-[#f1f5f9]"
                      >
                        <Mail size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-4 rounded-[24px] border border-[#e5e7eb] bg-white px-6 py-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-medium text-[#6b7280]">
              Showing{' '}
              <span className="font-black text-[#111827]">
                {(currentPage - 1) * 10 + 1}
              </span>{' '}
              to{' '}
              <span className="font-black text-[#111827]">
                {Math.min(currentPage * 10, totalUsersCount)}
              </span>{' '}
              of{' '}
              <span className="font-black text-[#111827]">{totalUsersCount}</span>{' '}
              users
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* First */}
              <button
                type="button"
                disabled={currentPage <= 1 || isPaginationLoading}
                onClick={() => setCurrentPage(1)}
                className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-[#111] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
              >
                First
              </button>

              {/* Prev */}
              <button
                type="button"
                disabled={currentPage <= 1 || isPaginationLoading}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="h-10 rounded-lg border border-black/10 bg-white px-3 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
              >
                <ChevronLeft size={16} className="text-[#111]" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => {
                    let pageNum: number;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (
                      currentPage >=
                      totalPages - 2
                    ) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isPaginationLoading}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-black transition-colors ${
                          pageNum === currentPage
                            ? 'bg-[#d71927] text-white shadow-lg shadow-[#d71927]/20'
                            : 'border border-black/10 bg-white text-[#111] hover:bg-[#fff1f2]'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Next */}
              <button
                type="button"
                disabled={currentPage >= totalPages || isPaginationLoading}
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, totalPages)
                  )
                }
                className="h-10 rounded-lg border border-black/10 bg-white px-3 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
              >
                <ChevronRight size={16} className="text-[#111]" />
              </button>

              {/* Last */}
              <button
                type="button"
                disabled={currentPage >= totalPages || isPaginationLoading}
                onClick={() => setCurrentPage(totalPages)}
                className="h-10 rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-[#111] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#fff1f2]"
              >
                Last
              </button>
            </div>
          </div>

          {isPaginationLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-[#6b7280]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d71927] border-t-transparent" />
              Loading...
            </div>
          )}
        </div>
      )}

      {/* ── User Details Modal ───────────────────────────────────────────── */}
      {showDetails && userDetails && (
        <Modal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          title="User Details"
          size="xl"
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Profile Photo */}
            {userDetails.profile_photo_url && (
              <div className="flex justify-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#d71927] shadow-lg">
                  <img
                    src={userDetails.profile_photo_url}
                    alt={`${userDetails.first_name} ${userDetails.last_name}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <h3 className="mb-4 font-semibold text-[#111827]">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    User ID
                  </p>
                  <p className="mt-2 font-mono text-sm font-semibold text-[#111827]">
                    #{userDetails.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Full Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">
                    {userDetails.first_name} {userDetails.last_name}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Email Address
                  </p>
                  <p className="mt-2 font-mono text-sm text-[#111827]">
                    {userDetails.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Phone Number
                  </p>
                  <p className="mt-2 font-mono text-sm text-[#111827]">
                    {userDetails.phone_number ?? 'Not Provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Date of Birth
                  </p>
                  <p className="mt-2 text-sm text-[#111827]">
                    {userDetails.dob ? formatDate(userDetails.dob) : 'Not Provided'}
                  </p>
                </div>
                {userDetails.address && (
                  <div className="md:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      Address
                    </p>
                    <p className="mt-2 text-sm text-[#111827]">
                      {typeof userDetails.address === 'string'
                        ? userDetails.address
                        : userDetails.address
                        ? `${userDetails.address.street || ''}, ${userDetails.address.city || ''}`
                        : 'Not Provided'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Status */}
            <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <h3 className="mb-4 font-semibold text-[#111827]">
                Verification Status
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Overall Verification
                  </p>
                  <p className="mt-2">
                    <Badge
                      variant={userDetails.is_verified ? 'success' : 'warning'}
                    >
                      {userDetails.is_verified ? '✓ Verified' : 'Unverified'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Email Verification
                  </p>
                  <p className="mt-2">
                    <Badge
                      variant={userDetails.isEmailVerified ? 'success' : 'warning'}
                    >
                      {userDetails.isEmailVerified ? '✓ Verified' : 'Not Verified'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Phone Verification
                  </p>
                  <p className="mt-2">
                    <Badge
                      variant={userDetails.isPhoneVerified ? 'success' : 'warning'}
                    >
                      {userDetails.isPhoneVerified ? '✓ Verified' : 'Not Verified'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Account Status
                  </p>
                  <p className="mt-2">
                    <Badge variant={getStatusVariant(userDetails.status)}>
                      {(userDetails.status ?? 'active').charAt(0).toUpperCase() + (userDetails.status ?? 'active').slice(1)}
                    </Badge>
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-[#e5e7eb] pt-4">
                {userDetails.email_verified_at && (
                  <p className="text-xs text-[#6b7280]">
                    <span className="font-medium">Email verified:</span> {formatDate(userDetails.email_verified_at)}
                  </p>
                )}
                {userDetails.phone_verified_at && (
                  <p className="text-xs text-[#6b7280]">
                    <span className="font-medium">Phone verified:</span> {formatDate(userDetails.phone_verified_at)}
                  </p>
                )}
              </div>
            </div>

            {/* KYC Information */}
            <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <h3 className="mb-4 font-semibold text-[#111827]">
                KYC Information
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    KYC Tier
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#111827]">
                    {userDetails.kyc_tier ? userDetails.kyc_tier.toUpperCase() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    KYC Status
                  </p>
                  <p className="mt-2">
                    <Badge
                      variant={
                        userDetails.kyc_status === 'approved'
                          ? 'success'
                          : userDetails.kyc_status === 'pending'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {(userDetails.kyc_status || 'N/A').toUpperCase()}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    BVN (Bank Verification Number)
                  </p>
                  <p className="mt-2 font-mono text-sm font-medium text-[#111827]">
                    {userDetails.bvn ? `${userDetails.bvn.slice(0, 4)}${'*'.repeat(7)}${userDetails.bvn.slice(-3)}` : 'Not Provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    NIN (National ID Number)
                  </p>
                  <p className="mt-2 font-mono text-sm font-medium text-[#111827]">
                    {userDetails.nin ? `${userDetails.nin.slice(0, 4)}${'*'.repeat(7)}${userDetails.nin.slice(-3)}` : 'Not Provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Maplerad ID */}
            {userDetails.maplerad_id && (
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
                <h3 className="mb-4 font-semibold text-[#111827]">
                  Maplerad Information
                </h3>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Maplerad ID
                  </p>
                  <p className="mt-2 font-mono text-sm text-[#111827]">
                    {userDetails.maplerad_id}
                  </p>
                </div>
                {userDetails.virtual_account_number ? (
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      Virtual Account Number
                    </p>
                    <p className="mt-2 font-mono text-sm text-[#111827]">
                      {userDetails.virtual_account_number}
                    </p>
                    {userDetails.virtual_account_bank && (
                      <p className="mt-1 text-xs text-[#6b7280]">
                        {userDetails.virtual_account_bank}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      No Virtual Account
                    </p>
                    <Button
                      onClick={handleCreateVirtualAccount}
                      disabled={creatingVirtualAccount}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#d71927] px-4 py-2 text-sm font-medium text-white hover:bg-[#b81420]"
                    >
                      {creatingVirtualAccount ? (
                        <>
                          <Spinner size="sm" className="border-white/30 border-t-white" />
                          Creating…
                        </>
                      ) : (
                        'Create Virtual Account'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Financial Information */}
            <div>
              <h3 className="mb-4 font-semibold text-[#111827]">
                Financial Information
              </h3>
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                  Account Balance
                </p>
                <p className="mt-2 text-2xl font-bold text-[#111827]">
                  ₦{(userDetails.balance || userDetails.statistics?.wallet_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Statistics */}
            {userDetails.statistics && (
              <div>
                <h3 className="mb-4 font-semibold text-[#111827]">
                  Transaction Statistics
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      Total Transactions
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#111827]">
                      {userDetails.statistics.total_transactions}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      Successful Transactions
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#111827]">
                      {userDetails.statistics.successful_transactions}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      Total Spending
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#111827]">
                      ₦{userDetails.statistics.total_spending.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                      Unread Notifications
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#111827]">
                      {userDetails.statistics.unread_notifications}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Roles */}
            {userDetails.roles && userDetails.roles.length > 0 && (
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
                <h3 className="mb-4 font-semibold text-[#111827]">
                  User Roles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {userDetails.roles.map((role: string) => (
                    <Badge key={role} variant={role === 'admin' ? 'danger' : role === 'agent' ? 'warning' : 'info'}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Account Dates */}
            <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <h3 className="mb-4 font-semibold text-[#111827]">
                Account Timeline
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">Account Created</span>
                  <span className="font-mono text-[#111827]">
                    {(userDetails as any)?.created_at
                      ? formatDate((userDetails as any)?.created_at)
                      : 'N/A'}
                  </span>
                </div>
                <div className="border-t border-[#e5e7eb]"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">Last Updated</span>
                  <span className="font-mono text-[#111827]">
                    {(userDetails as any)?.updated_at
                      ? formatDate((userDetails as any)?.updated_at)
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setShowDetails(false);
                  handleOpenEditModal(userDetails);
                }}
                className="flex-1"
              >
                Edit User
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowDetails(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Send Notification Modal ──────────────────────────────────────── */}
      {showNotificationModal && selectedUser && (
        <Modal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          title="Send Notification"
          size="md"
        >
          <div className="space-y-5">
            {/* User Info */}
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                To
              </p>
              <p className="mt-2 text-sm font-medium text-[#111827]">
                {selectedUser.first_name} {selectedUser.last_name}
              </p>
              <p className="text-xs text-[#6b7280]">{selectedUser.email}</p>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Title
              </label>
              <Input
                placeholder="Notification title..."
                value={notificationData.title}
                onChange={(e) =>
                  setNotificationData({ ...notificationData, title: e.target.value })
                }
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Message
              </label>
              <textarea
                placeholder="Notification message..."
                value={notificationData.body}
                onChange={(e) =>
                  setNotificationData({ ...notificationData, body: e.target.value })
                }
                rows={4}
                className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Type
              </label>
              <select
                value={notificationData.type}
                onChange={(e) =>
                  setNotificationData({ ...notificationData, type: e.target.value })
                }
                className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
              >
                <option value="system">System</option>
                <option value="promotional">Promotional</option>
                <option value="security">Security</option>
                <option value="update">Update</option>
              </select>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationData.send_push}
                  onChange={(e) =>
                    setNotificationData({
                      ...notificationData,
                      send_push: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-[#d1d5db]"
                />
                <span className="text-sm font-medium text-[#111827]">
                  Send as push notification
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={notificationData.send_email}
                  onChange={(e) =>
                    setNotificationData({
                      ...notificationData,
                      send_email: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-[#d1d5db]"
                />
                <span className="text-sm font-medium text-[#111827]">
                  Also send as email
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleSendNotification}
                disabled={loadingAction}
                className="flex-1"
              >
                {loadingAction ? (
                  <>
                    <Spinner />
                    Sending...
                  </>
                ) : (
                  'Send Notification'
                )}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowNotificationModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Send Email Modal ──────────────────────────────────────────────── */}
      {showEmailModal && selectedUser && (
        <Modal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          title="Send Email to User"
          size="lg"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto">
            {/* User Info */}
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                To
              </p>
              <p className="mt-2 text-sm font-medium text-[#111827]">
                {selectedUser.email}
              </p>
            </div>

            {/* REQUIRED FIELDS SECTION */}
            <div className="rounded-lg border border-[#e5e7eb] p-4">
              <h4 className="mb-4 font-semibold text-[#111827]">
                Required Information
              </h4>
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Email subject (max 255 characters)..."
                    value={emailData.title}
                    maxLength={255}
                    onChange={(e) =>
                      setEmailData({ ...emailData, title: e.target.value })
                    }
                  />
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {emailData.title.length}/255
                  </p>
                </div>

                {/* Body */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Email message (max 1000 characters, HTML supported)..."
                    value={emailData.body}
                    maxLength={1000}
                    onChange={(e) =>
                      setEmailData({ ...emailData, body: e.target.value })
                    }
                    rows={4}
                    className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                  />
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {emailData.body.length}/1000
                  </p>
                </div>
              </div>
            </div>

            {/* OPTIONAL FIELDS SECTION */}
            <div className="rounded-lg border border-[#e5e7eb] p-4">
              <h4 className="mb-4 font-semibold text-[#111827]">
                Optional Settings
              </h4>
              <div className="space-y-4">
                {/* Type and Priority Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Type */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#111827]">
                      Email Type
                    </label>
                    <select
                      value={emailData.type}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                    >
                      <option value="system">System</option>
                      <option value="transaction">Transaction</option>
                      <option value="promotion">Promotion</option>
                      <option value="update">Update</option>
                      <option value="alert">Alert</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#111827]">
                      Priority
                    </label>
                    <select
                      value={emailData.priority}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          priority: e.target.value as any,
                        })
                      }
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Toggles Row */}
                <div className="flex items-center gap-6">
                  {/* Send Email Toggle */}
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={emailData.send_email}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          send_email: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-[#d1d5db] text-[#4a5ff7]"
                    />
                    <span className="text-sm font-medium text-[#111827]">
                      Send Email
                    </span>
                  </label>

                  {/* Send Push Toggle */}
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={emailData.send_push}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          send_push: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-[#d1d5db] text-[#4a5ff7]"
                    />
                    <span className="text-sm font-medium text-[#111827]">
                      Send Push Notification
                    </span>
                  </label>
                </div>

                {/* Template */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Email Template
                  </label>
                  <select
                    value={emailData.email_template}
                    onChange={(e) =>
                      setEmailData({
                        ...emailData,
                        email_template: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                  >
                    <option value="admin-custom">Custom Admin</option>
                    <option value="security">Security Alert</option>
                    <option value="promotional">Promotional</option>
                  </select>
                </div>
              </div>
            </div>

            {/* EXTRA DATA SECTION */}
            <div className="rounded-lg border border-[#e5e7eb] p-4">
              <h4 className="mb-4 font-semibold text-[#111827]">
                Email Customization (Optional)
              </h4>
              <div className="space-y-4">
                {/* Greeting */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Custom Greeting
                  </label>
                  <Input
                    placeholder="e.g., 'Hello John!'"
                    value={emailData.extra_data.greeting}
                    onChange={(e) =>
                      setEmailData({
                        ...emailData,
                        extra_data: {
                          ...emailData.extra_data,
                          greeting: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                {/* Highlight */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Highlight/Important Info
                  </label>
                  <textarea
                    placeholder="Important information to highlight in the email..."
                    value={emailData.extra_data.highlight}
                    onChange={(e) =>
                      setEmailData({
                        ...emailData,
                        extra_data: {
                          ...emailData.extra_data,
                          highlight: e.target.value,
                        },
                      })
                    }
                    rows={2}
                    className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                  />
                </div>

                {/* Details Title */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Details Section Title
                  </label>
                  <Input
                    placeholder="e.g., 'Transaction Details'"
                    value={emailData.extra_data.details_title}
                    onChange={(e) =>
                      setEmailData({
                        ...emailData,
                        extra_data: {
                          ...emailData.extra_data,
                          details_title: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                {/* Action URL and Text Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#111827]">
                      Action Button URL
                    </label>
                    <Input
                      placeholder="https://..."
                      value={emailData.extra_data.actionUrl}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          extra_data: {
                            ...emailData.extra_data,
                            actionUrl: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#111827]">
                      Button Text
                    </label>
                    <Input
                      placeholder="e.g., 'View Details'"
                      value={emailData.extra_data.actionText}
                      onChange={(e) =>
                        setEmailData({
                          ...emailData,
                          extra_data: {
                            ...emailData.extra_data,
                            actionText: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Support Text */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Support Text/Help Info
                  </label>
                  <textarea
                    placeholder="Help or support information to include in the email..."
                    value={emailData.extra_data.support_text}
                    onChange={(e) =>
                      setEmailData({
                        ...emailData,
                        extra_data: {
                          ...emailData.extra_data,
                          support_text: e.target.value,
                        },
                      })
                    }
                    rows={2}
                    className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                  />
                </div>

                {/* Closing Message */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Custom Closing Message
                  </label>
                  <Input
                    placeholder="e.g., 'Thank you for your business'"
                    value={emailData.extra_data.closing_message}
                    onChange={(e) =>
                      setEmailData({
                        ...emailData,
                        extra_data: {
                          ...emailData.extra_data,
                          closing_message: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-[#e5e7eb] pt-6">
              <Button
                variant="primary"
                size="md"
                onClick={handleSendEmail}
                disabled={loadingAction}
                className="flex-1"
              >
                {loadingAction ? (
                  <>
                    <Spinner />
                    Sending...
                  </>
                ) : (
                  'Send Email'
                )}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowEmailModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit User Modal ──────────────────────────────────────────────── */}
      {showEditModal && selectedUser && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit User"
          size="lg"
        >
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* First Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                First Name
              </label>
              <Input
                value={editFormData.first_name}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    first_name: e.target.value,
                  })
                }
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Last Name
              </label>
              <Input
                value={editFormData.last_name}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    last_name: e.target.value,
                  })
                }
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Email
              </label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    email: e.target.value,
                  })
                }
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Phone Number
              </label>
              <Input
                value={editFormData.phone_number}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    phone_number: e.target.value,
                  })
                }
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Date of Birth
              </label>
              <Input
                type="date"
                value={editFormData.dob || ''}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    dob: e.target.value,
                  })
                }
              />
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Address
              </label>
              <Input
                placeholder="Enter address or JSON object"
                value={editFormData.address || ''}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    address: e.target.value,
                  })
                }
              />
              <p className="mt-1 text-xs text-[#6b7280]">
                For structured address, use JSON format: {"{\"street\": \"...\", \"city\": \"...\", etc.}"}
              </p>
            </div>

            {/* BVN */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                BVN
              </label>
              <Input
                placeholder="Bank Verification Number"
                value={editFormData.bvn || ''}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    bvn: e.target.value,
                  })
                }
              />
            </div>

            {/* NIN */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                NIN
              </label>
              <Input
                placeholder="National Identification Number"
                value={editFormData.nin || ''}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    nin: e.target.value,
                  })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleUpdateUser}
                disabled={loadingAction}
                className="flex-1"
              >
                {loadingAction ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Assign Role Modal ────────────────────────────────────────────── */}
      {showRoleModal && selectedUser && (
        <Modal
          isOpen={showRoleModal}
          onClose={() => setShowRoleModal(false)}
          title="Assign Role to User"
          size="md"
        >
          <div className="space-y-5">
            {/* User Info */}
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                User
              </p>
              <p className="mt-2 text-sm font-medium text-[#111827]">
                {selectedUser.first_name} {selectedUser.last_name}
              </p>
              <p className="text-xs text-[#6b7280]">{selectedUser.email}</p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Select Role
              </label>
              {loadingRoles ? (
                <div className="flex items-center justify-center rounded-lg border border-[#e5e7eb] bg-[#f8fafc] py-8">
                  <Spinner />
                  <span className="ml-2 text-sm text-[#6b7280]">Loading roles…</span>
                </div>
              ) : roles.length === 0 ? (
                <div className="rounded-lg border border-[#fcd34d] bg-[#fef3c7] p-4 text-sm text-[#92400e]">
                  No roles available. Please contact an administrator.
                </div>
              ) : (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#111827] transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                >
                  <option value="">Select a role…</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleAssignRole}
                disabled={!selectedRole || loadingAction}
                className="flex-1"
              >
                {loadingAction ? (
                  <>
                    <Spinner />
                    Assigning...
                  </>
                ) : (
                  'Assign Role'
                )}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowRoleModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Transactions Modal ───────────────────────────────────────────── */}
      {showTransactionsModal && selectedUser && (
        <Modal
          isOpen={showTransactionsModal}
          onClose={() => setShowTransactionsModal(false)}
          title={`Transactions - ${selectedUser.first_name} ${selectedUser.last_name}`}
          size="lg"
        >
          <div className="space-y-4">
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-16">
                <Spinner />
                <span className="ml-2 text-sm text-[#6b7280]">Loading transactions…</span>
              </div>
            ) : userTransactions.length === 0 ? (
              <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] py-8 text-center">
                <p className="text-sm text-[#6b7280]">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="rounded-lg border border-[#e5e7eb] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-[#111827]">
                          {txn.transaction_type || txn.type}
                        </p>
                        <p className="text-sm text-[#6b7280]">
                          Ref: {txn.reference}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#111827]">
                          ₦{txn.amount.toLocaleString()}
                        </p>
                        <Badge
                          variant={
                            txn.status === 'success'
                              ? 'success'
                              : txn.status === 'failed'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {txn.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-[#6b7280]">
                      {formatDate(txn.created_at || txn.transaction_date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowTransactionsModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Bulk Action Modal ────────────────────────────────────────────── */}
      {showBulkActionModal && (
        <Modal
          isOpen={showBulkActionModal}
          onClose={() => setShowBulkActionModal(false)}
          title="Bulk User Action"
          size="md"
        >
          <div className="space-y-5">
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                Selected Users
              </p>
              <p className="mt-2 text-lg font-bold text-[#111827]">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Action Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]">
                Select Action
              </label>
              <div className="space-y-3">
                {[
                  {
                    value: 'verify' as BulkAction,
                    label: 'Verify Users',
                    icon: CheckCircle,
                  },
                  {
                    value: 'unverify' as BulkAction,
                    label: 'Unverify Users',
                    icon: X,
                  },
                  {
                    value: 'delete' as BulkAction,
                    label: 'Delete Users',
                    icon: Trash2,
                  },
                ].map(({ value, label, icon: Icon }) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] p-3 cursor-pointer transition hover:bg-[#f8fafc]"
                  >
                    <input
                      type="radio"
                      name="bulk-action"
                      value={value}
                      checked={selectedBulkAction === value}
                      onChange={(e) =>
                        setSelectedBulkAction(e.target.value as BulkAction)
                      }
                      className="h-4 w-4"
                    />
                    <Icon size={18} className="text-[#6b7280]" />
                    <span className="text-sm font-medium text-[#111827]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {selectedBulkAction === 'delete' && (
              <div className="rounded-lg border border-[#fee2e2] bg-[#fef2f2] p-4">
                <p className="text-sm font-medium text-[#991b1b]">
                  ⚠️ Warning: This action cannot be undone. All selected users will be permanently deleted.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant={selectedBulkAction === 'delete' ? 'danger' : 'primary'}
                size="md"
                onClick={handleExecuteBulkAction}
                disabled={loadingAction}
                className="flex-1"
              >
                {loadingAction ? (
                  <>
                    <Spinner />
                    Processing...
                  </>
                ) : (
                  'Execute Action'
                )}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowBulkActionModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Bulk Email Modal ─────────────────────────────────────────────── */}
      {showBulkEmailModal && (
        <Modal
          isOpen={showBulkEmailModal}
          onClose={() => setShowBulkEmailModal(false)}
          title="Send Bulk Email"
          size="xl"
        >
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* ── Recipient Selection ──────────────────────────────────── */}
            <div className="rounded-lg border border-[#e5e7eb] p-4">
              <h4 className="mb-4 font-semibold text-[#111827]">
                Recipients
              </h4>

              {/* Toggle */}
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipient-mode"
                    checked={bulkEmailRecipientMode === 'all'}
                    onChange={() => setBulkEmailRecipientMode('all')}
                    className="h-4 w-4 text-[#d71927]"
                  />
                  <span className="text-sm font-medium text-[#111827]">
                    All Users (with verified email)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipient-mode"
                    checked={bulkEmailRecipientMode === 'specific'}
                    onChange={() => setBulkEmailRecipientMode('specific')}
                    className="h-4 w-4 text-[#d71927]"
                  />
                  <span className="text-sm font-medium text-[#111827]">
                    Specific Users
                  </span>
                </label>
              </div>

              {/* Specific Users Search */}
              {bulkEmailRecipientMode === 'specific' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
                    <input
                      type="text"
                      placeholder="Search users by name, email, or phone..."
                      value={bulkEmailRecipientSearch}
                      onChange={(e) => handleBulkEmailSearchUsers(e.target.value)}
                      className="w-full rounded-xl border border-[#d1d5db] py-2.5 pl-10 pr-4 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                    />
                    {bulkEmailSearchLoading && (
                      <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Search Results */}
                  {bulkEmailRecipientResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
                      {bulkEmailRecipientResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleAddBulkEmailRecipient(user)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#f8fafc]"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-xs font-bold text-[#4a5ff7]">
                            {user.first_name.charAt(0)}
                            {user.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[#111827]">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-[#6b7280]">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Users Chips */}
                  {bulkEmailSelectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bulkEmailSelectedUsers.map((user) => (
                        <span
                          key={user.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-medium text-[#4a5ff7]"
                        >
                          {user.first_name} {user.last_name}
                          <button
                            onClick={() => handleRemoveBulkEmailRecipient(user.id)}
                            className="ml-0.5 rounded-full p-0.5 transition hover:bg-[#d1d5db]"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recipient Count Info */}
              <div className="mt-3 rounded-lg bg-[#f8fafc] px-4 py-2.5">
                <p className="text-xs text-[#6b7280]">
                  {bulkEmailRecipientMode === 'all'
                    ? 'Email will be sent to all users with verified email addresses. The API determines eligibility automatically.'
                    : `${bulkEmailSelectedUsers.length} user${bulkEmailSelectedUsers.length !== 1 ? 's' : ''} selected`}
                </p>
              </div>
            </div>

            {/* ── Email Composer ──────────────────────────────────────────── */}
            <div className="rounded-lg border border-[#e5e7eb] p-4">
              <h4 className="mb-4 font-semibold text-[#111827]">
                Email Content
              </h4>
              <div className="space-y-4">
                {/* Type and Priority Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#111827]">
                      Email Type
                    </label>
                    <select
                      value={bulkEmailData.type}
                      onChange={(e) =>
                        setBulkEmailData({
                          ...bulkEmailData,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                    >
                      <option value="system">System</option>
                      <option value="transaction">Transaction</option>
                      <option value="promotion">Promotion</option>
                      <option value="update">Update</option>
                      <option value="alert">Alert</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#111827]">
                      Priority
                    </label>
                    <select
                      value={bulkEmailData.priority}
                      onChange={(e) =>
                        setBulkEmailData({
                          ...bulkEmailData,
                          priority: e.target.value as any,
                        })
                      }
                      className="w-full rounded-xl border border-[#d1d5db] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Email subject (max 255 characters)..."
                    value={bulkEmailData.title}
                    maxLength={255}
                    onChange={(e) =>
                      setBulkEmailData({ ...bulkEmailData, title: e.target.value })
                    }
                  />
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {bulkEmailData.title.length}/255
                  </p>
                </div>

                {/* Custom Greeting */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Custom Greeting
                  </label>
                  <Input
                    placeholder='e.g., "Dear Valued Customer," (default: Hi {first_name},)'
                    value={bulkEmailData.custom_greeting}
                    onChange={(e) =>
                      setBulkEmailData({ ...bulkEmailData, custom_greeting: e.target.value })
                    }
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Email body content. Supports plain text or raw HTML (max 10,000 chars)..."
                    value={bulkEmailData.body}
                    maxLength={10000}
                    onChange={(e) =>
                      setBulkEmailData({ ...bulkEmailData, body: e.target.value })
                    }
                    rows={6}
                    className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                  />
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {bulkEmailData.body.length}/10,000
                  </p>
                </div>
              </div>
            </div>

            {/* ── Optional Sections ───────────────────────────────────────── */}
            <div className="rounded-lg border border-[#e5e7eb] p-4">
              <h4 className="mb-4 font-semibold text-[#111827]">
                Optional Customizations
              </h4>
              <div className="space-y-4">
                {/* Highlight Info */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#111827]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fef3c7] text-xs text-[#92400e]">!</span>
                    Highlight / Important Info
                  </label>
                  <textarea
                    placeholder="Important information displayed in a colored highlight box (max 500 chars)..."
                    value={bulkEmailData.highlight_info}
                    maxLength={500}
                    onChange={(e) =>
                      setBulkEmailData({ ...bulkEmailData, highlight_info: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                  />
                </div>

                {/* Details Section Title */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Details Section Title
                  </label>
                  <Input
                    placeholder="e.g., 'What's New in This Update'"
                    value={bulkEmailData.details_section_title}
                    onChange={(e) =>
                      setBulkEmailData({ ...bulkEmailData, details_section_title: e.target.value })
                    }
                  />
                </div>

                {/* Action Button Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#111827]">
                      Action Button URL
                    </label>
                    <Input
                      placeholder="https://..."
                      value={bulkEmailData.action_button_url}
                      onChange={(e) =>
                        setBulkEmailData({ ...bulkEmailData, action_button_url: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#111827]">
                      Button Text
                    </label>
                    <Input
                      placeholder='e.g., "View Details" (default: Visit Remopay)'
                      value={bulkEmailData.action_button_text}
                      onChange={(e) =>
                        setBulkEmailData({ ...bulkEmailData, action_button_text: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Support Text */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dbeafe] text-xs text-[#1e40af] mr-1.5 inline-flex">i</span>
                    Support / Help Text
                  </label>
                  <textarea
                    placeholder="Support or help information in a blue info box (max 500 chars, HTML supported)..."
                    value={bulkEmailData.support_text}
                    maxLength={500}
                    onChange={(e) =>
                      setBulkEmailData({ ...bulkEmailData, support_text: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#4a5ff7] focus:ring-4 focus:ring-[#4a5ff7]/10"
                  />
                </div>

                {/* Custom Closing Message */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#111827]">
                    Custom Closing Message
                  </label>
                  <Input
                    placeholder='e.g., "Happy transacting," (default: "Thank you,")'
                    value={bulkEmailData.custom_closing_message}
                    onChange={(e) =>
                      setBulkEmailData({ ...bulkEmailData, custom_closing_message: e.target.value })
                    }
                  />
                </div>

                {/* Ads Banner Toggle */}
                <div className="border-t border-[#e5e7eb] pt-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={bulkEmailData.ads_banner_enabled}
                      onChange={(e) =>
                        setBulkEmailData({
                          ...bulkEmailData,
                          ads_banner_enabled: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-[#d1d5db] text-[#d71927]"
                    />
                    <span className="text-sm font-medium text-[#111827]">
                      Show Remopay banner at the bottom of the email
                    </span>
                  </label>

                  {bulkEmailData.ads_banner_enabled && (
                    <div className="mt-4 space-y-3 pl-7">
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-[#6b7280]">
                          Banner Title
                        </label>
                        <Input
                          placeholder="Custom banner title"
                          value={bulkEmailData.ads_banner_title}
                          onChange={(e) =>
                            setBulkEmailData({ ...bulkEmailData, ads_banner_title: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold text-[#6b7280]">
                          Banner Description
                        </label>
                        <Input
                          placeholder="Custom banner description"
                          value={bulkEmailData.ads_banner_description}
                          onChange={(e) =>
                            setBulkEmailData({ ...bulkEmailData, ads_banner_description: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-[#6b7280]">
                            CTA Text
                          </label>
                          <Input
                            placeholder="Button text"
                            value={bulkEmailData.ads_banner_cta_text}
                            onChange={(e) =>
                              setBulkEmailData({ ...bulkEmailData, ads_banner_cta_text: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold text-[#6b7280]">
                            CTA URL
                          </label>
                          <Input
                            placeholder="https://..."
                            value={bulkEmailData.ads_banner_cta_url}
                            onChange={(e) =>
                              setBulkEmailData({ ...bulkEmailData, ads_banner_cta_url: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Inline Banners (CDN Images) ──────────────────────────────── */}
                <div className="border-t border-[#e5e7eb] pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-[#111827]">
                      Inline Banners (CDN Images)
                    </h5>
                    <span className="text-xs text-[#6b7280]">
                      {bulkEmailData.inline_banners.length} banner{bulkEmailData.inline_banners.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-[#6b7280]">
                    Add banner images that will be rendered inline within the email body. Each banner is displayed sequentially.
                  </p>

                  {/* Banner List */}
                  <div className="space-y-4">
                    {bulkEmailData.inline_banners.map((banner, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                            Banner {index + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = [...bulkEmailData.inline_banners];
                              updated.splice(index, 1);
                              setBulkEmailData({ ...bulkEmailData, inline_banners: updated });
                            }}
                            className="text-xs font-medium text-[#d71927] transition hover:text-[#b91521]"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                              Image URL <span className="text-red-500">*</span>
                            </label>
                            <Input
                              placeholder="https://cdn.remopay.app/promotions/banner.png"
                              value={banner.image_url}
                              onChange={(e) => {
                                const updated = [...bulkEmailData.inline_banners];
                                updated[index] = { ...updated[index], image_url: e.target.value };
                                setBulkEmailData({ ...bulkEmailData, inline_banners: updated });
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                                Link URL
                              </label>
                              <Input
                                placeholder="https://..."
                                value={banner.link_url}
                                onChange={(e) => {
                                  const updated = [...bulkEmailData.inline_banners];
                                  updated[index] = { ...updated[index], link_url: e.target.value };
                                  setBulkEmailData({ ...bulkEmailData, inline_banners: updated });
                                }}
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                                Alt Text
                              </label>
                              <Input
                                placeholder="Advertisement"
                                value={banner.alt_text}
                                onChange={(e) => {
                                  const updated = [...bulkEmailData.inline_banners];
                                  updated[index] = { ...updated[index], alt_text: e.target.value };
                                  setBulkEmailData({ ...bulkEmailData, inline_banners: updated });
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[#6b7280]">
                              Width (CSS value)
                            </label>
                            <Input
                              placeholder='100% (default)'
                              value={banner.width}
                              onChange={(e) => {
                                const updated = [...bulkEmailData.inline_banners];
                                updated[index] = { ...updated[index], width: e.target.value };
                                setBulkEmailData({ ...bulkEmailData, inline_banners: updated });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Banner Button */}
                  <button
                    onClick={() => {
                      setBulkEmailData({
                        ...bulkEmailData,
                        inline_banners: [
                          ...bulkEmailData.inline_banners,
                          { image_url: '', link_url: '', alt_text: '', width: '' },
                        ],
                      });
                    }}
                    className="mt-3 flex items-center gap-2 rounded-lg border-2 border-dashed border-[#d1d5db] px-4 py-3 text-sm font-medium text-[#4a5ff7] transition hover:border-[#4a5ff7] hover:bg-[#eef2ff] w-full justify-center"
                  >
                    + Add Banner
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleProceedToConfirm}
                disabled={loadingAction}
                className="flex-1"
              >
                {loadingAction ? (
                  <>
                    <Spinner />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2 inline" />
                    Continue to Review
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowBulkEmailModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Bulk Email Confirmation Dialog ────────────────────────────────── */}
      {showBulkEmailConfirm && (
        <Modal
          isOpen={showBulkEmailConfirm}
          onClose={() => setShowBulkEmailConfirm(false)}
          title="⚠️ Confirm Bulk Email"
          size="md"
        >
          <div className="space-y-5">
            <div className="rounded-lg border border-[#fef3c7] bg-[#fffbeb] p-4">
              <p className="text-sm font-medium text-[#92400e]">
                You are about to send an email to{' '}
                <strong>
                  {bulkEmailRecipientMode === 'all'
                    ? 'ALL users with verified emails'
                    : `${bulkEmailSelectedUsers.length} selected user${bulkEmailSelectedUsers.length !== 1 ? 's' : ''}`}
                </strong>
                . This action will dispatch emails asynchronously and cannot be undone.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Subject</span>
                <span className="text-sm font-medium text-[#111827] text-right max-w-xs truncate">
                  {bulkEmailData.title}
                </span>
              </div>
              <div className="border-t border-[#e5e7eb]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Type</span>
                <span className="text-sm font-medium capitalize text-[#111827]">{bulkEmailData.type}</span>
              </div>
              <div className="border-t border-[#e5e7eb]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Priority</span>
                <span className="text-sm font-medium capitalize text-[#111827]">{bulkEmailData.priority}</span>
              </div>
              <div className="border-t border-[#e5e7eb]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Recipients</span>
                <span className="text-sm font-medium text-[#111827]">
                  {bulkEmailRecipientMode === 'all' ? 'All Users' : `${bulkEmailSelectedUsers.length} selected`}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleSendBulkEmail}
                disabled={loadingAction}
                className="flex-1 bg-[#d71927] hover:bg-[#b91521]"
              >
                {loadingAction ? (
                  <>
                    <Spinner />
                    Dispatching...
                  </>
                ) : (
                  'Yes, Send Email'
                )}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowBulkEmailConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Bulk Email Result Display ─────────────────────────────────────── */}
      {showBulkEmailResult && bulkEmailResult && (
        <Modal
          isOpen={showBulkEmailResult}
          onClose={() => setShowBulkEmailResult(false)}
          title="✅ Bulk Email Dispatched"
          size="md"
        >
          <div className="space-y-5">
            <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-4">
              <p className="text-sm font-medium text-[#166534]">
                Bulk email has been queued successfully. Emails are being dispatched asynchronously and will be delivered over the next few minutes.
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Total Recipients</span>
                <span className="text-lg font-bold text-[#111827]">
                  {bulkEmailResult.total_recipients.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-[#e5e7eb]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Batches Dispatched</span>
                <span className="text-sm font-medium text-[#111827]">{bulkEmailResult.total_batches}</span>
              </div>
              <div className="border-t border-[#e5e7eb]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Batch Size</span>
                <span className="text-sm font-medium text-[#111827]">
                  {bulkEmailResult.batch_size} emails per batch
                </span>
              </div>
              <div className="border-t border-[#e5e7eb]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Email Subject</span>
                <span className="text-sm font-medium text-[#111827] text-right max-w-[60%] truncate">
                  {bulkEmailResult.email_title}
                </span>
              </div>
              <div className="border-t border-[#e5e7eb]" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">Type</span>
                <span className="text-sm font-medium capitalize text-[#111827]">{bulkEmailResult.email_type}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setShowBulkEmailResult(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
