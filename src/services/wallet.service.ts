import { apiClient } from './api-client';
import {
  Wallet,
  WalletTransaction,
  InitializePaymentRequest,
  VerifyPaymentRequest,
  Payment,
  PaymentMethod,
  AddPaymentMethodRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types/api.types';

class WalletService {
  async getBalance(): Promise<ApiResponse<Wallet>> {
    return apiClient.get('/wallet/balance');
  }

  async getTransactions(page = 1, per_page = 20): Promise<ApiResponse<PaginatedResponse<WalletTransaction>>> {
    return apiClient.get(`/wallet/transactions?page=${page}&per_page=${per_page}`);
  }
}
class PaymentService {
  async initializePayment(data: InitializePaymentRequest): Promise<ApiResponse<any>> {
    return apiClient.post('/payments/initialize', data);
  }

  async verifyPayment(data: VerifyPaymentRequest): Promise<ApiResponse<{ payment: Payment; wallet_updated: boolean }>> {
    return apiClient.post('/payments/verify', data);
  }

  async getPaymentMethods(): Promise<ApiResponse<{ payment_methods: PaymentMethod[] }>> {
    return apiClient.get('/payment-methods');
  }

  async addPaymentMethod(data: AddPaymentMethodRequest): Promise<ApiResponse<{ payment_method: PaymentMethod }>> {
    return apiClient.post('/payment-methods', data);
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/payment-methods/${paymentMethodId}`);
  }
}

export const walletService = new WalletService();
export const paymentService = new PaymentService();
