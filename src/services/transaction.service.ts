import { apiClient } from './api-client';
import {
  Transaction,
  TransactionFilters,
  PurchaseAirtimeRequest,
  PurchaseDataRequest,
  PayBillsRequest,
  ReportTransactionIssueRequest,
  PaginatedResponse,
  ApiResponse,
} from '@/types/api.types';
import type { TransactionDetailData, TransactionDetailResponse } from '@/types/transaction-detail.types';
import { useAuth } from '@/hooks/useAuth';

// Extended transaction type for API responses
export interface ExtendedTransaction extends Transaction {
  transaction_type?: string;
  transaction_date?: string;
  service_logo?: string | null;
  purchased_code?: string | null;
  metadata?: Record<string, any>;
  transactionable_type?: string;
  transactionable_id?: string;
  transactionable?: Record<string, any>;
}

export interface TransactionsApiResponse {
  success: boolean;
  message: string;
  data: {
    transactions: ExtendedTransaction[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
  };
}

class TransactionService {
  async getTransactions(userIdOrFilters?: string | TransactionFilters, filters?: TransactionFilters): Promise<TransactionsApiResponse> {
    let userId = '';
    let actualFilters = filters;

    // Handle both call signatures:
    // getTransactions(userId, filters)
    // getTransactions(filters)
    if (typeof userIdOrFilters === 'string') {
      userId = userIdOrFilters;
      actualFilters = filters;
    } else if (typeof userIdOrFilters === 'object' && userIdOrFilters !== null) {
      actualFilters = userIdOrFilters as TransactionFilters;
    }

    const params = new URLSearchParams();

    if (actualFilters) {
      Object.entries(actualFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const endpoint = userId ? `/transactions/me/${userId}${query}` : `/transactions${query}`;
    return apiClient.get(endpoint) as Promise<TransactionsApiResponse>;
  }

  async getTransaction(transactionId: string): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.get(`/transactions/${transactionId}`);
  }

  /**
   * Get detailed transaction information with full breakdown
   * Uses the new /api/v1/transactions/{id} endpoint
   */
  async getTransactionDetail(transactionId: number | string): Promise<TransactionDetailResponse> {
    const res = await apiClient.get<TransactionDetailData>(`/transactions/${transactionId}`);
    return {
      success: res.success,
      message: res.message,
      data: res.data!,
    };
  }

  async purchaseAirtime(data: PurchaseAirtimeRequest): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.post('/vtu/pay', data);
  }

  async purchaseData(data: PurchaseDataRequest): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.post('/transactions/data/purchase', data);
  }

  async payBills(data: PayBillsRequest): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.post('/transactions/bills/pay', data);
  }

  async getReceipt(
    transactionId: string,
    format: 'pdf' | 'json' | 'email' = 'json'
  ): Promise<any> {
    return apiClient.get(`/transactions/${transactionId}/receipt?format=${format}`);
  }

  async reportIssue(
    transactionId: string,
    data: ReportTransactionIssueRequest
  ): Promise<ApiResponse<{ report: any }>> {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return apiClient.post(`/transactions/${transactionId}/report`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const transactionService = new TransactionService();
