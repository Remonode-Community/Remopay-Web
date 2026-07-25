/**
 * Transfer Provider Management Service
 * Date: July 25, 2026 (Updated for backend API changes)
 *
 * API service for managing multi-provider bank transfer settings,
 * balances, and connection testing.
 */

import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  TransferProviderSettings,
  UpdateTransferProviderSettingsRequest,
  TransferProviderBalancesData,
  TestProviderConnectionRequest,
  TestProviderConnectionData,
} from '@/types/transfer-provider.types';

class TransferProviderService {
  /**
   * Get current transfer provider settings
   */
  async getSettings(): Promise<ApiResponse<TransferProviderSettings>> {
    return apiClient.get('/admin/transfer-provider/settings');
  }

  /**
   * Update transfer provider settings
   * Sends low_balance_thresholds as nested object per backend API
   */
  async updateSettings(
    data: UpdateTransferProviderSettingsRequest
  ): Promise<ApiResponse<TransferProviderSettings>> {
    return apiClient.put('/admin/transfer-provider/settings', data);
  }

  /**
   * Get real-time provider balances and health status
   */
  async getBalances(): Promise<ApiResponse<TransferProviderBalancesData>> {
    return apiClient.get('/admin/transfer-provider/balances');
  }

  /**
   * Test a provider connection
   */
  async testConnection(
    data: TestProviderConnectionRequest
  ): Promise<ApiResponse<TestProviderConnectionData>> {
    return apiClient.post('/admin/transfer-provider/test', data);
  }
}

export const transferProviderService = new TransferProviderService();
