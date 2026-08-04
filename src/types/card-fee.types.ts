/**
 * Card Fee Management Types
 * Based on the Card Fee Management System API
 */

// ─── Fee Configuration ───────────────────────────────────────────────

export type FeeType =
  | 'issuance'
  | 'funding'
  | 'withdrawal'
  | 'transaction'
  | 'maintenance_monthly'
  | 'cross_border'
  | 'chargeback'
  | 'decline_unsettled'
  | 'fx_markup';

export type FeeCalculationType = 'fixed' | 'percentage' | 'hybrid' | 'threshold';

export type AppliesTo = 'user' | 'admin_only' | 'both';

export interface FeeConfig {
  id: number;
  fee_type: FeeType;
  display_name: string;
  description: string;
  fee_calculation_type: FeeCalculationType;
  fixed_amount: string | null;
  percentage_rate: string | null;
  threshold_amount: string | null;
  below_threshold_fixed: string | null;
  below_threshold_percentage: string | null;
  above_threshold_fixed: string | null;
  above_threshold_percentage: string | null;
  provider_calculation_type: string | null;
  provider_fixed_amount: string | null;
  provider_percentage_rate: string | null;
  provider_threshold_amount: string | null;
  provider_below_threshold_fixed: string | null;
  provider_below_threshold_percentage: string | null;
  provider_above_threshold_fixed: string | null;
  provider_above_threshold_percentage: string | null;
  currency: string;
  is_active: boolean;
  applies_to: AppliesTo;
  sort_order: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Fee Schedule (User-facing) ──────────────────────────────────────

export interface FeeScheduleEntry {
  fee_type: FeeType;
  display_name: string;
  description: string;
  currency: string;
  fee_calculation_type: FeeCalculationType;
  our_fee: {
    fixed_amount: number;
    percentage_rate: number;
    threshold: number | null;
  };
  provider_fee: {
    calculation_type: string;
    fixed_amount: number | null;
    percentage_rate: number | null;
    threshold: number | null;
  };
}

export interface FeeScheduleResponse {
  fee_schedule: FeeScheduleEntry[];
  currency: string;
  note: string;
}

// ─── Fee Breakdown ───────────────────────────────────────────────────

export interface FeeBreakdownEntry {
  description: string;
  type: string;
  rate?: number;
  threshold?: number;
  below_threshold?: boolean;
}

export interface FeeBreakdown {
  fee_type: FeeType;
  display_name: string;
  currency: string;
  provider_fee: number;
  our_fee: number;
  total_fee: number;
  breakdown: {
    provider: FeeBreakdownEntry;
    our: FeeBreakdownEntry;
  };
}

// ─── Admin API Responses ─────────────────────────────────────────────

export interface FeeConfigListResponse {
  success: boolean;
  data: {
    fees: FeeConfig[];
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  };
}

export interface FeeConfigSingleResponse {
  success: boolean;
  data: {
    fee: FeeConfig;
  };
}

export interface FeePreviewResponse {
  success: boolean;
  data: {
    fee_type: FeeType;
    amount: number;
    calculation: FeeBreakdown;
  };
}

export interface FeeTransaction {
  id: number;
  user_id: number;
  card_id: number;
  fee_type: FeeType;
  operation_type: string;
  provider_fee_amount: string;
  our_fee_amount: string;
  total_fee_amount: string;
  currency: string;
  reference: string;
  transaction_amount: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  card: {
    id: number;
    masked_pan: string;
  } | null;
}

export interface FeeTransactionsResponse {
  success: boolean;
  data: {
    transactions: FeeTransaction[];
    summary: {
      total_our_fees: number;
      total_provider_fees: number;
      total_all_fees: number;
      fee_type_breakdown: Record<string, number>;
    };
    pagination: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  };
}

// ─── Fee Config Form Types ───────────────────────────────────────────

export interface UpdateFeeConfigRequest {
  display_name?: string;
  description?: string;
  fee_calculation_type?: FeeCalculationType;
  fixed_amount?: number;
  percentage_rate?: number;
  threshold_amount?: number;
  below_threshold_fixed?: number;
  below_threshold_percentage?: number;
  above_threshold_fixed?: number;
  above_threshold_percentage?: number;
  provider_fixed_amount?: number;
  provider_percentage_rate?: number;
  provider_threshold_amount?: number;
  provider_below_threshold_fixed?: number;
  provider_below_threshold_percentage?: number;
  provider_above_threshold_fixed?: number;
  provider_above_threshold_percentage?: number;
  currency?: string;
  is_active?: boolean;
  applies_to?: AppliesTo;
  sort_order?: number;
}

// ─── Fee Type Metadata ───────────────────────────────────────────────

export const FEE_TYPE_META: Record<FeeType, {
  label: string;
  description: string;
  icon: string;
  providerFeeLabel: string;
  ourFeeDefault: string;
  calculationType: FeeCalculationType;
}> = {
  issuance: {
    label: 'Card Issuance',
    description: 'One-time fee for issuing a new virtual card',
    icon: 'CreditCard',
    providerFeeLabel: '$2.00 fixed',
    ourFeeDefault: '$0.00 fixed',
    calculationType: 'fixed',
  },
  funding: {
    label: 'Card Funding',
    description: 'Fee for funding/crediting a virtual card',
    icon: 'Wallet',
    providerFeeLabel: '$1 (<$100) / 2% (≥$100)',
    ourFeeDefault: '$0.00',
    calculationType: 'threshold',
  },
  withdrawal: {
    label: 'Card Withdrawal',
    description: 'Fee for withdrawing from a virtual card',
    icon: 'ArrowUpFromLine',
    providerFeeLabel: '$1.00 fixed',
    ourFeeDefault: '$0.00 fixed',
    calculationType: 'fixed',
  },
  transaction: {
    label: 'Card Transaction/Spend',
    description: 'Fee per card transaction',
    icon: 'ArrowRightLeft',
    providerFeeLabel: '$0.00',
    ourFeeDefault: '$0.00',
    calculationType: 'fixed',
  },
  maintenance_monthly: {
    label: 'Card Maintenance (Monthly)',
    description: 'Monthly maintenance fee per active card',
    icon: 'Calendar',
    providerFeeLabel: '$0.00',
    ourFeeDefault: '$0.00',
    calculationType: 'fixed',
  },
  cross_border: {
    label: 'Cross Currency/Border',
    description: 'Fee for cross-currency or cross-border transactions',
    icon: 'Globe',
    providerFeeLabel: '2.5% + $0.50',
    ourFeeDefault: '$0.00',
    calculationType: 'hybrid',
  },
  chargeback: {
    label: 'Chargeback',
    description: 'Fee per chargeback event',
    icon: 'ShieldAlert',
    providerFeeLabel: '$45.00 fixed',
    ourFeeDefault: '$0.00 fixed',
    calculationType: 'fixed',
  },
  decline_unsettled: {
    label: 'Decline/Unsettled',
    description: 'Fee per declined or unsettled transaction',
    icon: 'XCircle',
    providerFeeLabel: '$0.50 fixed',
    ourFeeDefault: '$0.00 fixed',
    calculationType: 'fixed',
  },
  fx_markup: {
    label: 'FX Conversion Markup',
    description: 'Markup applied to foreign exchange conversions',
    icon: 'TrendingUp',
    providerFeeLabel: 'None',
    ourFeeDefault: '0%',
    calculationType: 'percentage',
  },
};
