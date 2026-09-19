import { apiClient } from './api-client';
import { debug } from '@/utils/debug.utils';
import { ApiResponse } from '@/types/api.types';
import type {
  MapleradWalletBalancesData,
  MapleradRawWalletsResponse,
} from '@/types/maplerad.types';

/**
 * Payment Service
 * Handles all payment-related operations with automatic idempotency key management
 */

interface InitializePaymentRequest {
  amount: number;
  currency?: 'NGN' | 'USD';
  payment_method: 'card' | 'mobile_money' | 'bank_transfer' | 'wallet';
  description?: string;
  email?: string;
  metadata?: Record<string, any>;
}

interface InitializePaymentResponse {
  success: boolean;
  data: {
    payment: {
      id: string;
      amount: number;
      currency: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      reference: string;
      created_at: string;
    };
    authorization_url?: string;
    access_code?: string;
    public_key?: string;
  };
}

interface AirtimePurchaseRequest {
  provider: string;
  phone_number: string;
  amount: number;
  user_id?: string;
  payment_method?: 'wallet' | 'card' | 'mobile_money';
  recipient_name?: string;
  pin?: string;
}

interface DataPurchaseRequest {
  provider: string;
  phone_number: string;
  plan_id: string;
  amount: number;
  payment_method?: 'wallet' | 'card' | 'mobile_money';
  pin?: string;
}

interface BillPaymentRequest {
  bill_type: 'electricity' | 'water' | 'internet' | 'insurance';
  provider: string;
  account_number: string;
  amount: number;
  payment_method?: 'wallet' | 'card' | 'mobile_money';
  is_estimate?: boolean;
  pin?: string;
}

interface PINVerificationRequest {
  pin: string;
  request_id: string;
}

class PaymentService {
  /**
   * Initialize payment with idempotency key
   * Idempotency key is automatically added by interceptor
   */
  async initializePayment(
    payload: InitializePaymentRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<InitializePaymentResponse>> {
    try {
      debug.log('[PaymentService] Initializing payment', { retryCount });

      const response = await apiClient.post<InitializePaymentResponse>(
        '/payments/initialize',
        payload
      );

      debug.log('[PaymentService] Payment initialization successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Payment initialization failed', error);

      // Retry logic for network errors (not for MISSING_IDEMPOTENCY_KEY)
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying payment initialization (attempt ${retryCount + 1}/3)`);
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.initializePayment(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Verify payment status
   * Also requires idempotency key for safety
   */
  async verifyPayment(reference: string): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Verifying payment');

      const response = await apiClient.post('/payments/verify', {
        reference,
      });

      debug.log('[PaymentService] Payment verification successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Payment verification failed', error);
      throw error;
    }
  }

  /**
   * Purchase airtime with PIN
   * NOTE: PIN is sent directly with the payment request
   * Idempotency-Key is automatically added as REQUEST HEADER by the API interceptor
   */
  async purchaseAirtime(
    payload: AirtimePurchaseRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Purchasing airtime', { retryCount });

      // Map fields to API expected format
      const apiPayload = {
        serviceID: payload.provider,
        phone: payload.phone_number,
        amount: payload.amount,
        ...(payload.user_id && { user_id: payload.user_id }),
        ...(payload.payment_method && { payment_method: payload.payment_method }),
        ...(payload.pin && { pin: payload.pin }),
      };

      const response = await apiClient.post('/vtu/pay', apiPayload);

      debug.log('[PaymentService] Airtime purchase successful', { 
        success: response?.success,
      });
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Airtime purchase failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying airtime purchase (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.purchaseAirtime(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Confirm airtime purchase with PIN verification
   */
  async confirmAirtimePurchase(
    requestId: string,
    pinData: PINVerificationRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Confirming airtime purchase', { retryCount });

      const response = await apiClient.post('/vtu/pay/confirm', {
        ...pinData,
      });

      debug.log('[PaymentService] Airtime purchase confirmation successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Airtime purchase confirmation failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying airtime confirmation (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.confirmAirtimePurchase(requestId, pinData, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Purchase data bundle with PIN
   * NOTE: PIN is sent directly with the payment request
   * Idempotency-Key is automatically added as REQUEST HEADER by the API interceptor
   */
  async purchaseData(
    payload: any,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Purchasing data', { retryCount });

      // Map fields to API expected format for /vtu/pay endpoint
      const apiPayload = {
        serviceID: payload.service_id,
        phone: payload.phone_number,
        amount: payload.amount,
        variation_code: payload.variation_code,
        ...(payload.user_id && { user_id: payload.user_id }),
        ...(payload.payment_method && { payment_method: payload.payment_method }),
        ...(payload.pin && { pin: payload.pin }),
      };

      const response = await apiClient.post('/vtu/pay', apiPayload);

      debug.log('[PaymentService] Data purchase successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Data purchase failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying data purchase (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.purchaseData(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Confirm data purchase with PIN verification
   */
  async confirmDataPurchase(
    requestId: string,
    pinData: PINVerificationRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Confirming data purchase', { retryCount });

      const response = await apiClient.post('/vtu/pay/confirm', {
        ...pinData,
      });

      debug.log('[PaymentService] Data purchase confirmation successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Data purchase confirmation failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying data confirmation (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.confirmDataPurchase(requestId, pinData, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Pay bills with PIN
   * NOTE: PIN is sent directly with the payment request
   * Idempotency-Key is automatically added as REQUEST HEADER by the API interceptor
   */
  async payBill(payload: BillPaymentRequest & { pin?: string }, retryCount: number = 0): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Paying bill', { retryCount });

      // Include pin in payload if provided
      const billPayload = {
        ...payload,
        ...(payload.pin && { pin: payload.pin }),
      };

      const response = await apiClient.post('/vtu/pay', billPayload);

      debug.log('[PaymentService] Bill payment successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Bill payment failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying bill payment (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.payBill(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Confirm bill payment with PIN verification
   */
  async confirmBillPayment(
    requestId: string,
    pinData: PINVerificationRequest,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Confirming bill payment', { retryCount });

      const response = await apiClient.post('/vtu/pay/confirm', {
        ...pinData,
      });

      debug.log('[PaymentService] Bill payment confirmation successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Bill payment confirmation failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying bill confirmation (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.confirmBillPayment(requestId, pinData, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Purchase electricity bill with idempotency
   * Maps electricity form data to /vtu/pay endpoint
   * NOTE: PIN verification happens separately via pinService.verifyPin()
   */
  async purchaseElectricity(payload: any, retryCount: number = 0): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Purchasing electricity', { retryCount });

      // Map fields to API expected format for /vtu/pay endpoint
      const apiPayload = {
        serviceID: payload.serviceID,
        phone: payload.phone,
        amount: payload.amount,
        billersCode: payload.billersCode,
        variation_code: payload.variation_code,
        ...(payload.user_id && { user_id: payload.user_id }),
        ...(payload.user_email && { user_email: payload.user_email }),
        ...(payload.payment_method && { payment_method: payload.payment_method }),
        ...(payload.request_id && { request_id: payload.request_id }),
      };

      const response = await apiClient.post('/vtu/pay', apiPayload);

      debug.log('[PaymentService] Electricity purchase successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Electricity purchase failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying electricity purchase (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.purchaseElectricity(payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Generic confirm payment with PIN verification
   * Works for airtime, data, and electricity
   */
  async confirmPayment(
    pinData: any,
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Confirming payment', { retryCount });

      const response = await apiClient.post('/vtu/pay/confirm', pinData);

      debug.log('[PaymentService] Payment confirmation successful');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Payment confirmation failed', error);

      // Retry logic for network errors
      if (
        retryCount < 3 &&
        !error.isIdempotencyError &&
        (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT')
      ) {
        debug.log(`[PaymentService] Retrying payment confirmation (attempt ${retryCount + 1}/3)`);
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.confirmPayment(pinData, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Get Paystack merchant balance
   * Returns balance in kobo (divide by 100 to get naira)
   */
  async getPaystackBalance(): Promise<ApiResponse<{ data: Array<{ currency: string; balance: number }> }>> {
    try {
      debug.log('[PaymentService] Fetching Paystack merchant balance');

      const response = await apiClient.get('/payment/merchant-balance');

      debug.log('[PaymentService] Paystack balance fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch Paystack balance', error);
      throw error;
    }
  }

  /**
   * Get VTPass balance
   * Returns response with code and contents (not wrapped in ApiResponse success wrapper)
   */
  async getVTPassBalance(): Promise<any> {
    try {
      debug.log('[PaymentService] Fetching VTPass balance');

      const response = await apiClient.get('/vtu/balance');

      debug.log('[PaymentService] VTPass balance fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch VTPass balance', error);
      throw error;
    }
  }

  /**
   * Get Maplerad legacy single balance
   * @deprecated Use getMapleradWalletBalances() instead which returns all 3 wallets
   */
  async getMapleradBalance(): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Fetching Maplerad balance');

      const response = await apiClient.get('/payment/maplerad-balance');

      debug.log('[PaymentService] Maplerad balance fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch Maplerad balance', error);
      throw error;
    }
  }

  /**
   * Get Maplerad aggregated wallet balances (RECOMMENDED)
   * Returns Treasury NGN, Treasury USD, and Spend USD wallets
   * with amounts already normalised to major units.
   *
   * Endpoint: GET /payment/wallets/balances
   */
  async getMapleradWalletBalances(): Promise<ApiResponse<MapleradWalletBalancesData>> {
    try {
      debug.log('[PaymentService] Fetching Maplerad wallet balances');

      const response = await apiClient.get<MapleradWalletBalancesData>(
        '/payment/wallets/balances'
      );

      debug.log('[PaymentService] Maplerad wallet balances fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch Maplerad wallet balances', error);
      throw error;
    }
  }

  /**
   * Get raw Maplerad wallets
   * Fetches the raw wallet list from Maplerad, optionally filtered by wallet_type.
   * Note: Amounts are in the smallest currency unit — divide by 100 for major units.
   *
   * Endpoint: GET /payment/wallets
   * @param walletType Optional filter: 'TREASURY' | 'SPEND'
   */
  async getMapleradWallets(
    walletType?: 'TREASURY' | 'SPEND'
  ): Promise<ApiResponse<MapleradRawWalletsResponse>> {
    try {
      debug.log('[PaymentService] Fetching Maplerad raw wallets', { walletType });

      const params = walletType ? { wallet_type: walletType } : undefined;
      const response = await apiClient.get<MapleradRawWalletsResponse>(
        '/payment/wallets',
        { params }
      );

      debug.log('[PaymentService] Maplerad raw wallets fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch Maplerad raw wallets', error);
      throw error;
    }
  }

  /**
   * Get Telnyx balance
   * Returns available credit for SMS operations
   */
  async getTelnyxBalance(): Promise<ApiResponse<any>> {
    try {
      debug.log('[PaymentService] Fetching Telnyx merchant balance');

      const response = await apiClient.get('/telnyx/merchant-balance');

      debug.log('[PaymentService] Telnyx balance fetched successfully');
      return response;
    } catch (error: any) {
      debug.error('[PaymentService] Failed to fetch Telnyx balance', error);
      throw error;
    }
  }

  /**
   * Get Virtual Accounts (DVA)
   * Fetches all digital virtual accounts for the authenticated user
   * Returns multiple accounts in different currencies (NGN, USD, GBP, etc.)
   */
  async getVirtualAccount(): Promise<ApiResponse<any>> {
    try {
      console.log('🔵 [PaymentService.getVirtualAccount] Fetching virtual accounts');

      const response = await apiClient.get('/payment/customers/virtual-account');

      // API returns: response.original.data.virtual_accounts = Array
      const accounts = response.original?.data?.virtual_accounts || [];
      
      console.log('✅ [PaymentService.getVirtualAccount] Success');
      console.log('   Accounts:', accounts);
      console.log('   Count:', accounts.length);

      // Return normalized response with accounts at .data.virtual_accounts
      return {
        success: true,
        message: response.original?.message || 'Virtual accounts retrieved',
        data: {
          virtual_accounts: accounts,
        },
      } as any;
    } catch (error: any) {
      console.error('❌ [PaymentService.getVirtualAccount] Error:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
