/**
 * Transfer Provider Management - Complete TypeScript Types
 * Date: July 25, 2026 (Updated from backend spec)
 *
 * Type definitions for the admin Transfer Provider Management system
 * covering Paystack, Kuda, and Maplerad providers.
 */

import type { ApiResponse } from './api.types';

// ============================================================================
// PROVIDER IDENTIFIERS
// ============================================================================

export type TransferProviderCode = 'paystack' | 'kuda' | 'maplerad';

export const TRANSFER_PROVIDERS: { code: TransferProviderCode; display_name: string }[] = [
  { code: 'paystack', display_name: 'Paystack' },
  { code: 'kuda', display_name: 'Kuda Bank' },
  { code: 'maplerad', display_name: 'Maplerad' },
];

// ============================================================================
// PROVIDER METADATA
// ============================================================================

export interface TransferProviderMeta {
  balance: number;
  threshold: number;
  healthy: boolean;
  configured: boolean;
  error: string | null;
  display_name: string;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface TransferProviderSettings {
  default_provider: TransferProviderCode;
  auto_switch: boolean;
  provider_priority: TransferProviderCode[];
  low_balance_thresholds: Record<TransferProviderCode, number>;
  available_providers: TransferProviderCode[];
  provider_names: Record<TransferProviderCode, string>;
}

export interface UpdateTransferProviderSettingsRequest {
  default_provider?: TransferProviderCode;
  auto_switch?: boolean;
  low_balance_thresholds?: Partial<Record<TransferProviderCode, number>>;
}

// ============================================================================
// BALANCES TYPES
// ============================================================================

export type OverallStatus = 'healthy' | 'degraded' | 'unavailable';

export interface TransferProviderBalancesData {
  default_provider: TransferProviderCode;
  default_healthy: boolean;
  auto_switch: boolean;
  providers: Record<TransferProviderCode, TransferProviderMeta>;
  healthy_providers: TransferProviderCode[];
  overall_status: OverallStatus;
  timestamp: string;
}

// ============================================================================
// TEST CONNECTION TYPES
// ============================================================================

export interface TestProviderConnectionRequest {
  provider: TransferProviderCode;
}

export interface TestProviderConnectionData {
  success: boolean;
  provider: TransferProviderCode;
  connected: boolean;
  balance: number;
  healthy: boolean;
  message: string;
}

// ============================================================================
// HEALTH STATUS HELPERS
// ============================================================================

export type ProviderHealthStatus = 'healthy' | 'low' | 'unavailable' | 'inactive';

export interface ProviderHealthInfo {
  status: ProviderHealthStatus;
  label: string;
  textColor: string;
  bgColor: string;
  dotColor: string;
}

export function getProviderHealthInfo(meta: TransferProviderMeta): ProviderHealthInfo {
  if (!meta.configured) {
    return {
      status: 'inactive',
      label: 'Inactive',
      textColor: 'text-gray-500',
      bgColor: 'bg-gray-100',
      dotColor: 'bg-gray-400',
    };
  }

  if (!meta.healthy && meta.balance < meta.threshold) {
    return {
      status: 'low',
      label: 'Low',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      dotColor: 'bg-amber-500',
    };
  }

  if (!meta.healthy) {
    return {
      status: 'unavailable',
      label: 'Unavailable',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      dotColor: 'bg-red-500',
    };
  }

  return {
    status: 'healthy',
    label: 'Healthy',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    dotColor: 'bg-green-500',
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface TransferProviderSettingsResponse extends ApiResponse<TransferProviderSettings> {}
export interface TransferProviderBalancesResponse extends ApiResponse<TransferProviderBalancesData> {}
export interface TestProviderConnectionResponse extends ApiResponse<TestProviderConnectionData> {}
