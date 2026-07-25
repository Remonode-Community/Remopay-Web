/**
 * Transfer Service
 * Handles all transfer-related API calls: Remopay transfers, bank transfers, and recipient management
 * Updated July 25, 2026 - Multi-provider bank transfer support
 */

import { apiClient } from './api-client';
import {
  Bank,
  BankListResponse,
  BankTransferRequest,
  BankTransferResponse,
  RemopayTransferRequest,
  RemopayTransferResponse,
  VerifyRecipientRequest,
  VerifyRecipientResponse,
  RecipientsListResponse,
  AccountResolutionResponse,
  Recipient,
  RecipientUser,
} from '@/types/transfer.types';

class TransferService {
  /**
   * Fetch list of supported banks from a specific provider
   * If provider is omitted, uses the admin-configured default provider
   * Public endpoint, no auth required
   */
  async getBanks(provider?: string): Promise<Bank[] | null> {
    try {
      const params = provider ? `?provider=${provider}` : '';
      const response = (await apiClient.get(`/payment/banks${params}`)) as any;
      if (response && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching banks:', error);
      return null;
    }
  }

  /**
   * Verify recipient exists (Remopay user)
   */
  async verifyRecipient(payload: VerifyRecipientRequest): Promise<RecipientUser | null> {
    try {
      const response = (await apiClient.post('/wallet/transfer/verify/user', payload)) as any;
      
      if (response?.success && response?.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error verifying recipient:', error);
      throw error; // Re-throw to let component handle it
    }
  }

  /**
   * Get recent Remopay transfer recipients (quick selection)
   * limit: max 5 for quick list, can be higher for full list
   */
  async getRecentRemopayRecipients(limit: number = 5): Promise<Recipient[] | null> {
    try {
      const response = (await apiClient.get('/wallet/transfer/recipients/remopay', {
        params: { limit, sort: 'recent' },
      })) as any;
      return response?.data?.recipients || null;
    } catch (error) {
      console.error('Error fetching recent recipients:', error);
      return null;
    }
  }

  /**
   * Get all transfer recipients with pagination
   * bank_type: 'remopay', 'external_bank', or 'all'
   * sort: 'recent', 'alphabetical', or 'frequency'
   */
  async getAllRecipients(
    bankType: string = 'all',
    sort: string = 'recent',
    page: number = 1,
    limit: number = 20
  ): Promise<RecipientsListResponse | null> {
    try {
      const response = (await apiClient.get('/wallet/transfer/recipients', {
        params: { bank_type: bankType, sort, page, limit },
      })) as any;
      return response?.data || null;
    } catch (error) {
      console.error('Error fetching recipients:', error);
      return null;
    }
  }

  /**
   * Initiate Remopay-to-Remopay transfer
   * IMPORTANT: Phone number must be normalized to 10 digits before calling
   */
  async initiateRemopayTransfer(
    payload: RemopayTransferRequest
  ): Promise<RemopayTransferResponse | null> {
    try {
      const response = (await apiClient.post('/wallet/transfer/identifier', payload)) as any;
      // Response is already the full response body with success, reference, amount, etc.
      return response || null;
    } catch (error) {
      console.error('Error initiating Remopay transfer:', error);
      throw error; // Re-throw for component error handling
    }
  }

  /**
   * Resolve bank account details
   * Used to verify account number and fetch account holder name
   * Optional provider param to specify which provider to use for resolution
   */
  async resolveBankAccount(
    bankCode: string,
    accountNumber: string,
    provider?: string
  ): Promise<AccountResolutionResponse | null> {
    try {
      const params = provider ? `?provider=${provider}` : '';
      const response = (await apiClient.post(`/payment/resolve-account${params}`, {
        bank_code: bankCode,
        account_number: accountNumber,
      })) as any;
      return response || null;
    } catch (error) {
      console.error('Error resolving bank account:', error);
      throw error; // Re-throw for component error handling
    }
  }

  /**
   * Initiate bank transfer
   * Account must be verified before calling this
   * Backend auto-selects the best provider
   */
  async initiateBankTransfer(payload: BankTransferRequest): Promise<BankTransferResponse | null> {
    try {
      const response = (await apiClient.post('/payment/initiate-transfer', payload)) as any;
      return response || null;
    } catch (error) {
      console.error('Error initiating bank transfer:', error);
      throw error; // Re-throw for component error handling
    }
  }
}

export const transferService = new TransferService();
