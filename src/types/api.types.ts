/**
 * API Response and Request Types
 * Based on AFRIDataNG Backend API Specification
 */

import type { MapleradCustomerData } from './tier-upgrade.types';

// ============= Generic Response Wrapper =============
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error_code?: string;
  errors?: Record<string, string[]>;
  pagination?: PaginationMeta;
  stats?: Record<string, any>; // Optional stats object for endpoints that return aggregated data
  // VTU API specific fields
  content?: T;
  response_description?: string;
  // HTTP client wrapper (e.g., axios response)
  original?: ApiResponse<T>;
  headers?: Record<string, any>;
  exception?: any;
}

export interface PaginationMeta {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  stats?: Record<string, any>; // Optional stats object for endpoints that return aggregated data
}

// ============= User & Auth Types =============
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  profile_complete_status: boolean;
  profile_photo_url: string | null;
  created_at: string;
  roles: string[];
  permissions: string[];
  balance: number;
  formatted_balance: string;
  mapleradCustomer?: MapleradCustomerData | null;
}

export interface Role {
  id: string;
  name: 'customer' | 'agent' | 'admin';
  permissions?: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
  login_channel: string;
  pin_status?: {
    has_pin: boolean;
    is_locked: boolean;
    created_at: string | null;
    last_used_at: string | null;
    failed_attempts: string | number;
  };
  location?: {
    has_location: boolean;
  };
  email_verified: boolean;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  password_confirmation: string;
  referral_code?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendEmailVerificationOTPRequest {
  email: string;
}

export interface VerifyEmailWithOTPRequest {
  email: string;
  otp: string;
}

// ============= Phone Verification Types =============
export interface SendPhoneVerificationOTPRequest {
  phone_number: string;
  channel: 'whatsapp' | 'sms';
}

export interface SendPhoneVerificationOTPResponse {
  verification_id: number;
  phone_number: string; // Masked: **********0935
  channel: 'whatsapp' | 'sms';
  expires_in_minutes: number;
  message: string;
}

export interface ResendPhoneVerificationOTPRequest {
  verification_id: number;
  channel?: 'whatsapp' | 'sms';
}

export interface ResendPhoneVerificationOTPResponse {
  verification_id: number;
  channel: 'whatsapp' | 'sms';
  message: string;
  expires_in_minutes: number;
}

export interface VerifyPhoneWithOTPRequest {
  verification_id: number;
  otp: string;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface RequestPhoneVerificationRequest {
  phone: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyPasswordResetOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  reset_token: string;
  password: string;
  password_confirmation: string;
}


// ============= User Profile & Settings =============
export interface UserPreferences {
  user_id: string;
  language: 'en' | 'fr' | 'es';
  currency: 'NGN' | 'USD' | 'EUR';
  timezone: string;
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_app: boolean;
  marketing_emails: boolean;
  two_factor_enabled: boolean;
  theme: 'light' | 'dark';
  show_balance_on_dashboard: boolean;
  show_transaction_history: boolean;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  profile_photo?: File;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface UpdatePreferencesRequest {
  language?: 'en' | 'fr' | 'es';
  currency?: 'NGN' | 'USD' | 'EUR';
  timezone?: string;
  notifications_email?: boolean;
  notifications_sms?: boolean;
  notifications_app?: boolean;
  marketing_emails?: boolean;
  theme?: 'light' | 'dark';
  show_balance_on_dashboard?: boolean;
  show_transaction_history?: boolean;
}

// ============= Transaction Types =============
export type TransactionType = 'airtime' | 'data' | 'bills' | 'wallet_topup' | 'wallet_withdrawal';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type PurchasePaymentMethod = 'wallet' | 'card' | 'mobile_money' | 'bank_transfer';

export interface TransactionMetadata {
  plan_name?: string;
  bundle_size?: string;
  validity_period?: string;
  recipient_name?: string;
  bill_type?: string;
  customer_name?: string;
  due_date?: string;
}

export interface TransactionUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_photo_url: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  provider: string;
  recipient_phone?: string | null;
  recipient_account_number?: string | null;
  amount: number;
  currency: string;
  fee: number;
  net_amount: number;
  status: TransactionStatus;
  reference: string;
  description: string;
  metadata?: TransactionMetadata;
  payment_method?: PurchasePaymentMethod;
  payment_reference?: string | null;
  error_message?: string | null;
  initiated_at: string;
  completed_at?: string | null;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
  user?: TransactionUser;
  transactionable?: Record<string, any>;
  transaction_type?: string;
  transaction_date?: string;
  service_logo?: string | null;
}

export interface TransactionFilters {
  page?: number;
  per_page?: number;
  status?: string;
  type?: string;
  provider?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  // New backend-supported filters
  user_id?: number;
  transaction_type?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

export interface PurchaseAirtimeRequest {
  provider: string;
  phone_number: string;
  amount: number;
  payment_method: PurchasePaymentMethod;
  recipient_name?: string;
}

export interface PurchaseDataRequest {
  provider: string;
  phone_number: string;
  plan_id: string;
  amount: number;
  payment_method: PurchasePaymentMethod;
}

export interface PayBillsRequest {
  bill_type: 'electricity' | 'water' | 'internet' | 'insurance';
  provider: string;
  account_number: string;
  amount: number;
  payment_method: PurchasePaymentMethod;
  is_estimate?: boolean;
}

export interface ReportTransactionIssueRequest {
  issue_type: 'not_received' | 'duplicate' | 'wrong_amount' | 'technical_error';
  description: string;
  attachment?: File;
}

// ============= Provider Types =============
export interface Provider {
  id: string;
  name: string;
  code: string;
  type: string;
  logo_url: string;
  supported_services: string[];
  country: string;
  description: string;
  is_active: boolean;
}

export interface Plan {
  id: string;
  name: string;
  type: 'airtime' | 'data';
  amount: number;
  currency: string;
  description: string;
  metadata?: {
    bundle_size?: string;
    validity?: string;
    speed?: string;
  };
}

export interface VerifyBillAccountRequest {
  account_number: string;
  bill_type: 'electricity' | 'water' | 'internet' | 'insurance';
}

export interface BillAccount {
  account_number: string;
  customer_name?: string | null;
  outstanding_amount: number;
  due_date?: string | null;
  is_valid: boolean;
}

// ============= Wallet Types =============
export interface Wallet {
  user_id: string;
  balance: number;
  currency: string;
  pending_amount?: number;
  locked_amount?: number;
  available_balance?: number;
  total_topups?: number;
  total_spent?: number;
  last_transaction?: {
    id: string;
    type: string;
    amount: number;
    created_at: string;
  };
}

// Helper to get available balance from wallet (handles both 'balance' and 'available_balance' properties)
export const getAvailableBalance = (wallet: Wallet | null | undefined): number => {
  if (!wallet) return 0;
  return wallet.available_balance ?? wallet.balance ?? 0;
};

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'debit' | 'refund';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  description: string;
  created_at: string;
}

// ============= PIN Types =============
export interface PINStatus {
  has_pin: boolean;
  is_locked: boolean;
  failed_attempts: number;
  remaining_seconds?: number;
}

export interface SetTransactionPINRequest {
  current_pin: string | null;
  new_pin: string;
  new_pin_confirmation: string;
  password: string;
}

export interface VerifyTransactionPINRequest {
  pin: string;
}

export interface VerifyTransactionPINResponse {
  verified: boolean;
  message: string;
  remaining_attempts?: number;
}

export interface PINErrorResponse {
  code: 'INVALID_PIN' | 'PIN_LOCKED' | 'PIN_NOT_SET' | 'INVALID_PASSWORD' | string;
  message: string;
  data?: {
    failed_attempts?: number;
    remaining_attempts?: number;
    remaining_seconds?: number;
  };
}

// ============= Payment Types =============
export interface InitializePaymentRequest {
  amount: number;
  currency?: 'NGN' | 'USD';
  payment_method: 'card' | 'mobile_money' | 'bank_transfer';
  description?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitializeResponse {
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    reference: string;
    payment_method: string;
    created_at: string;
  };
  authorization_url: string;
  access_code?: string;
  public_key?: string;
}

export interface VerifyPaymentRequest {
  reference: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  payment_method: string;
  gateway_response?: string;
  verified_at?: string | null;
}

export type PaymentMethodType = 'card' | 'mobile_money' | 'bank_account';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  display_name: string;
  is_default: boolean;
  is_active: boolean;
  metadata?: {
    last_four?: string;
    expiry?: string;
    issuer?: string;
  };
  created_at: string;
}

export interface AddPaymentMethodRequest {
  type: PaymentMethodType;
  card_number?: string;
  card_name?: string;
  expiry?: string;
  cvv?: string;
  phone_number?: string;
  account_number?: string;
  account_name?: string;
  bank_code?: string;
  set_as_default?: boolean;
}

// ============= Admin Types =============
export interface AdminDashboardMetrics {
  total_users: number;
  active_users_today: number;
  total_agents: number;
  total_transactions: number;
  today_transaction_count: number;
  today_revenue: number;
  monthly_revenue: number;
  total_revenue: number;
  failed_transactions_count: number;
  pending_transactions_count: number;
}

export interface TrendData {
  date: string;
  count?: number;
  amount?: number;
  growth_rate?: number;
}

export interface AdminDashboard {
  metrics: AdminDashboardMetrics;
  trends?: {
    user_growth: TrendData[];
    revenue_trend: TrendData[];
    transaction_volume: TrendData[];
  };
  alerts?: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    created_at: string;
  }[];
}

export interface AdminUser extends User {
  status: 'active' | 'inactive' | 'suspended';
  is_verified: boolean;
  last_login?: string | null;
  dob?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  bvn?: string;
  nin?: string;
  kyc_tier?: 'TIER_ONE' | 'TIER_TWO' | 'TIER_THREE';
  kyc_status?: 'pending' | 'approved' | 'rejected';
  maplerad_id?: string;
  statistics?: {
    total_transactions: number;
    successful_transactions: number;
    total_spending: number;
    wallet_balance: number;
    unread_notifications: number;
  };
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'suspended';
  reason?: string;
}

export interface SendEmailRequest {
  title: string;
  body: string;
  type?: 'transaction' | 'system' | 'promotion' | 'update' | 'alert';
  priority?: 'low' | 'normal' | 'high';
  send_push?: boolean;
  send_email?: boolean;
  email_template?: string;
  extra_data?: {
    greeting?: string;
    details?: Array<{ label: string; value: string }>;
    details_title?: string;
    highlight?: string;
    actionUrl?: string;
    actionText?: string;
    support_text?: string;
    closing_message?: string;
  };
}

export interface SendBulkEmailInlineBanner {
  image_url: string;
  link_url?: string;
  alt_text?: string;
  width?: string;
}

export interface SendBulkEmailRequest {
  user_ids?: number[];
  title: string;
  body: string;
  type?: 'transaction' | 'system' | 'promotion' | 'update' | 'alert';
  priority?: 'low' | 'normal' | 'high';
  email_template?: string;
  custom_greeting?: string;
  highlight_info?: string;
  details_section_title?: string;
  action_button_url?: string;
  action_button_text?: string;
  support_text?: string;
  custom_closing_message?: string;
  ads_banner_enabled?: boolean;
  ads_banner_title?: string;
  ads_banner_description?: string;
  ads_banner_cta_text?: string;
  ads_banner_cta_url?: string;
  inline_banners?: SendBulkEmailInlineBanner[];
}

export interface SendBulkEmailResponse {
  total_recipients: number;
  total_batches: number;
  batch_size: number;
  email_title: string;
  email_type: string;
}

export interface SendNotificationRequest {
  title: string;
  body: string;
  type: string;
  priority?: 'high' | 'normal' | 'low';
  send_push?: boolean;
  send_email?: boolean;
  email_template?: string;
  extra_data?: Record<string, any>;
}

export interface ChangeUserRoleRequest {
  role: string;
}

export interface RefundTransactionRequest {
  reason: string;
  refund_amount?: number;
}

export interface Refund {
  id: string;
  transaction_id: string;
  refund_amount: number;
  status: 'processed' | 'pending';
  reason: string;
  created_at: string;
}

export interface GenerateReportRequest {
  type: 'revenue' | 'users' | 'transactions' | 'agents' | 'activity';
  start_date: string;
  end_date: string;
  format?: 'pdf' | 'csv' | 'json';
  include_charts?: boolean;
}

export interface Agent extends User {
  status: 'active' | 'inactive' | 'suspended';
  total_customers: number;
  total_commissions: number;
  this_month_earnings: number;
  performance_rating: number;
}

// ============= Agent Types =============
export interface AgentDashboard {
  agent: {
    id: string;
    name: string;
    commission_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    total_customers: number;
    active_customers: number;
  };
  metrics: {
    total_commission: number;
    monthly_commission: number;
    pending_commission: number;
    total_sales: number;
    this_month_sales: number;
  };
  earnings: Array<{
    date: string;
    amount: number;
    transaction_count: number;
  }>;
  top_customers: Array<{
    id: string;
    name: string;
    total_spent: number;
    transaction_count: number;
  }>;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  total_transactions: number;
  total_spent: number;
  last_transaction_date?: string | null;
  status: 'active' | 'inactive';
  added_at: string;
}

export interface AddCustomerRequest {
  phone: string;
  name?: string;
  email?: string;
}

export interface Commission {
  id: string;
  transaction_id: string;
  amount: number;
  percentage: number;
  status: 'earned' | 'pending' | 'paid';
  transaction_date: string;
  paid_date?: string | null;
}

export interface AgentPerformance {
  period: string;
  metrics: {
    total_sales: number;
    total_commission: number;
    customer_count: number;
    conversion_rate: number;
  };
  comparison_to_previous: {
    sales_growth: number;
    commission_growth: number;
  };
  daily_breakdown: Array<{
    date: string;
    sales: number;
    commission: number;
  }>;
}

// ============= Referral Types =============
export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referred: number;
  total_commission: number;
  pending_commission: number;
  referral_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tier_commission_rate: number;
  referred_users: Array<{
    id: string;
    name: string;
    email: string;
    total_spent: number;
    referred_at: string;
  }>;
}

export interface ReferralCommission {
  id: string;
  from_user: {
    id: string;
    name: string;
  };
  transaction_id: string;
  amount: number;
  rate: number;
  status: 'earned' | 'pending' | 'paid';
  earned_at: string;
  paid_at?: string | null;
}

// ============= Advertisement Types =============
export type ActionType = 'navigation' | 'deepLink' | 'externalUrl' | 'customAction';
export type Platform = 'mobile' | 'web' | 'all';
export type AdStatus = 'active' | 'inactive' | 'expired';

export interface Advertisement {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  buttonText: string;
  actionType: ActionType;
  actionValue: string;
  image: {
    url: string;
    fallbackColor: string;
  };
  gradient: {
    start: string;
    end: string;
  };
  displayDuration: number;
  isActive: boolean;
  displayOrder: number;
  analytics: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  validFrom: string;
  validUntil: string;
  platform?: Platform;
}

export interface AdvertisementAdmin extends Advertisement {
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ============= VTU Recipients Types =============
export interface VtuRecipient {
  id: number;
  credential: string;
  credential_type: 'phone' | 'meter' | 'card';
  recipient_name?: string | null;
  recipient_phone?: string | null;
  recipient_email?: string | null;
  transaction_type: string; // Backend returns: "Airtime Recharge", "Data Services", etc.
  service_identifier: string;
  usage_count: number;
  last_used_at?: string | null;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface GetAllRecipientsRequest {
  transaction_type?: string;
  service_identifier?: string;
  credential_type?: string;
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: 'last_used_at' | 'frequently_used' | 'recently_added';
}

export type GetAllRecipientsResponse = VtuRecipient[];

export interface RecipientSearchSuggestion {
  id: number;
  credential: string;
  credential_type: 'phone' | 'meter' | 'card';
  recipient_name?: string | null;
  service_identifier: string;
  transaction_type: string;
  usage_count: number;
  last_used_at?: string | null;
}

export interface SearchRecipientsSuggestRequest {
  credential: string;
  transaction_type?: string;
  service_identifier?: string;
  limit?: number;
}

export type SearchRecipientsSuggestResponse = RecipientSearchSuggestion[];

export interface UpdateVtuRecipientRequest {
  recipient_name?: string;
  recipient_phone?: string;
  recipient_email?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateVtuRecipientResponse {
  success: boolean;
  message: string;
  data: VtuRecipient;
}

export interface RecordUsageResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    credential: string;
    usage_count: number;
    last_used_at: string;
  };
}

export interface DeleteRecipientResponse {
  success: boolean;
  message: string;
}

export interface AdvertisementResponse {
  advertisements: Advertisement[];
  meta: {
    total: number;
    active: number;
    cached: boolean;
    cacheExpiresAt: string;
  };
}

export interface CreateAdvertisementRequest {
  title: string;
  subtitle: string;
  icon: string;
  button_text: string;
  action_type: ActionType;
  action_value: string;
  image_url: string;
  fallback_color: string;
  gradient_start: string;
  gradient_end: string;
  display_duration: number;
  display_order: number;
  is_active: boolean;
  platform: Platform;
  valid_from: string;
  valid_until: string;
  notes?: string;
}

export interface UpdateAdvertisementRequest {
  title?: string;
  subtitle?: string;
  icon?: string;
  button_text?: string;
  action_type?: ActionType;
  action_value?: string;
  image_url?: string;
  fallback_color?: string;
  gradient_start?: string;
  gradient_end?: string;
  display_duration?: number;
  display_order?: number;
  is_active?: boolean;
  platform?: Platform;
  valid_from?: string;
  valid_until?: string;
  notes?: string;
}

export interface AdvertisementAnalytics {
  ad_id: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number;
  created_at: string;
  valid_from: string;
  valid_until: string;
}

export interface AdvertisementAnalyticsSummary {
  total_ads: number;
  active_ads: number;
  total_impressions: number;
  total_clicks: number;
  average_ctr: number;
  top_performing: Advertisement[];
}

export interface BulkReorderRequest {
  ads: Array<{
    id: number;
    display_order: number;
  }>;
}

export interface BulkToggleStatusRequest {
  ad_ids: number[];
  is_active: boolean;
}

// ============= Virtual Account (DVA) Types =============
export interface VirtualAccount {
  id: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  currency: 'NGN' | 'USD' | 'GBP' | string;
  bank_code?: string;
  status?: 'active' | 'inactive' | string;
  created_at: string;
  require_consent?: boolean;
  consented?: boolean;
  consent_url?: string | null;
  reference?: string | null;
}

export interface VirtualAccountsResponse {
  virtual_accounts: VirtualAccount[];
}

export interface GetVirtualAccountsResponse {
  success: boolean;
  message: string;
  data: VirtualAccountsResponse;
}

// ============= Support Ticket Types =============
export type SupportCategory =
  | 'general'
  | 'transaction_issue'
  | 'wallet_issue'
  | 'account_issue'
  | 'card_issue'
  | 'airtime_data'
  | 'transfer_issue'
  | 'kyc_verification'
  | 'bug_report'
  | 'feature_request'
  | 'other';

export type SupportPriority = 'low' | 'medium' | 'high' | 'urgent';

export type SupportStatus =
  | 'open'
  | 'in_progress'
  | 'awaiting_user_response'
  | 'awaiting_agent_response'
  | 'resolved'
  | 'closed';

export interface SupportTicket {
  id: number;
  user_id: number;
  ticket_number: string;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  status_label: string;
  priority_label: string;
  category_label: string;
  assigned_to: number | null;
  related_transaction_reference: string | null;
  is_read_by_user: boolean;
  is_read_by_agent: boolean;
  messages_count: number;
  last_replied_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  assignee?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  latest_message?: {
    id: number;
    message: string;
    created_at: string;
    user: {
      id: number;
      first_name: string;
      last_name: string;
    };
  } | null;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: number;
  support_ticket_id: number;
  user_id: number;
  message: string;
  is_internal_note: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo_url?: string | null;
  };
}

export interface SupportTicketStats {
  total: number;
  open: number;
  in_progress: number;
  awaiting_user: number;
  awaiting_agent: number;
  resolved: number;
  closed: number;
  unassigned: number;
  unread: number;
}

export interface SupportAgent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  description: string;
  category: SupportCategory;
  priority?: SupportPriority;
  related_transaction_reference?: string;
  initial_message?: string;
}

export interface SendSupportMessageRequest {
  message: string;
  attachment_url?: string;
}

export interface AdminSendSupportMessageRequest {
  message: string;
  is_internal_note?: boolean;
  attachment_url?: string;
}
