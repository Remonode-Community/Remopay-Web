import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/api.types';
import { debug } from '@/utils/debug.utils';

/** Dev-only logger: suppresses console output in production */
const devLog = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') console.log(...args);
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') console.error(...args);
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') console.warn(...args);
  },
};
import {
  generateIdempotencyKey,
  getStoredIdempotencyKey,
  storeIdempotencyKey,
  clearIdempotencyKey,
} from '@/utils/idempotency.utils';
import {
  parseIdempotencyError,
  getIdempotencyErrorMessage,
  getErrorAction,
} from '@/utils/idempotency-error.utils';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/utils/safe-storage.utils';
import { trackApiError } from '@/utils/error-tracking.utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gateway.remonode.com/remopay/api/v1';

// Control verbosity of API logging
const VERBOSE_API_LOGGING = process.env.NEXT_PUBLIC_VERBOSE_API_LOGGING === 'true';

// Define payment operation paths that require idempotency keys
// These are all endpoints that modify financial state and must be idempotent
const PAYMENT_OPERATIONS = [
  // Wallet operations
  '/wallet/transfer',
  '/wallet/debit',
  '/wallet/credit',
  '/wallet/withdraw',
  
  // Payment operations
  '/payments/initialize',
  '/payments/verify',
  
  // VTU operations (Airtime, Data, Bills)
  '/vtu/pay',
  '/vtu/service',
  '/transactions/data/purchase',
  '/transactions/bills/pay',
  '/vtu/pay/confirm',
  '/transactions/data/purchase/confirm',
  
  // Additional transaction endpoints
  '/transactions/transfer',
  '/transactions/withdraw',
];

debug.log('[ApiClient] Initializing API Client with:', {
  API_BASE_URL,
  env: process.env.NEXT_PUBLIC_API_BASE_URL,
  isProduction: process.env.NODE_ENV === 'production',
  timestamp: new Date().toISOString(),
});

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  retry?: number;
}

interface ApiClientConfig extends AxiosRequestConfig {
  retry?: number;
}

/**
 * Check if endpoint requires idempotency key (POST/PUT/DELETE payment operations)
 */
const isPaymentOperation = (url: string): boolean => {
  return PAYMENT_OPERATIONS.some((op) => url.includes(op));
};

/**
 * Generate operation ID from URL and request body for idempotency tracking
 */
const generateOperationId = (url: string, data?: any): string => {
  const timestamp = Math.floor(Date.now() / 60000); // Group by minute for consistency
  const dataHash = data ? JSON.stringify(data).substring(0, 50) : '';
  return `${url}-${dataHash}-${timestamp}`;
};

class ApiClient {
  private axiosInstance: AxiosInstance;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Public-Key': process.env.NEXT_PUBLIC_X_PUBLIC_KEY || '',
      },
    });

    this.setupInterceptors();
  }

  private log(label: string, data?: any): void {
    if (VERBOSE_API_LOGGING) {
      debug.log(label, data);
    }
  }

  private logRequest(method: string, url: string, data?: any): void {
    if (VERBOSE_API_LOGGING) {
      debug.logRequest(method, url, data);
    }
  }

  private logResponse(status: number, url: string, data?: any): void {
    if (VERBOSE_API_LOGGING) {
      debug.logResponse(status, url, data);
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        const token = this.getToken();
        
        this.log('[ApiClient] ===== REQUEST INTERCEPTOR =====');
        this.logRequest(config.method?.toUpperCase() || 'GET', config.url || '', config.data);
        
        if (token && token.length > 0) {
          config.headers.Authorization = `Bearer ${token}`;
          this.log('[ApiClient] ✓ Authorization token added to request');
        } else {
          debug.warn('[ApiClient] ⚠️ No valid token found - request will be unauthenticated');
        }

        // Handle FormData: let browser/axios handle Content-Type with proper boundary
        const isFormData = config.data instanceof FormData || 
                          (config.data && typeof config.data === 'object' && 
                           config.data.constructor && 
                           config.data.constructor.name === 'FormData');
        
        if (isFormData) {
          // DO NOT set Content-Type header manually for FormData
          // Let axios/browser automatically set it with boundary
          if (config.headers['Content-Type'] === 'application/json') {
            delete config.headers['Content-Type'];
          }
          debug.log('[ApiClient] ✅ FormData detected - Content-Type header handled for multipart');
        }

        // Add idempotency key for payment operations
        const method = config.method?.toUpperCase() || '';
        const url = config.url || '';

        if (['POST', 'PUT', 'DELETE'].includes(method) && isPaymentOperation(url)) {
          const operationId = generateOperationId(url, config.data);

          // Try to retrieve existing key for this operation (for retries)
          let idempotencyKey = getStoredIdempotencyKey(operationId);

          // Generate new key if not found
          if (!idempotencyKey) {
            idempotencyKey = generateIdempotencyKey();
            storeIdempotencyKey(idempotencyKey, operationId);
          }

          // Add idempotency key header
          config.headers['Idempotency-Key'] = idempotencyKey;
          this.log('[ApiClient] Added Idempotency-Key for payment operation');
        }
        
        config.retry = config.retry || 0;
        this.log('[ApiClient] Request interceptor completed');
        return config;
      },
      (error) => {
        debug.error('[ApiClient] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.log('[ApiClient] ===== RESPONSE RECEIVED =====');
        this.logResponse(response.status, response.config.url || '', response.data);

        // Transform backend response format to match ApiResponse interface
        // Backend returns { status, message, data } but frontend expects { success, message, data }
        if (response.data && typeof response.data === 'object') {
          if ('status' in response.data && !('success' in response.data)) {
            response.data.success = response.data.status;
          }
        }

        // Clear idempotency key on success for payment operations
        const url = response.config.url || '';
        if ((response.status === 200 || response.status === 201) && isPaymentOperation(url)) {
          const operationId = generateOperationId(url, response.config.data);
          // Keep key for 5 minutes in case of additional retries
          setTimeout(() => {
            clearIdempotencyKey(operationId);
          }, 5 * 60 * 1000);
        }

        return response;
      },
      async (error: AxiosError) => {
        debug.error('[ApiClient] ===== RESPONSE ERROR =====');
        const endpoint = error.config?.url || 'unknown';
        debug.error('[ApiClient] Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
        });

        // Track the API error
        trackApiError(endpoint, error, {
          method: error.config?.method?.toUpperCase(),
          headers: error.config?.headers,
          data: error.config?.data,
        });

        // Handle idempotency-specific errors
        const url = error.config?.url || '';
        if (isPaymentOperation(url)) {
          const idempotencyError = parseIdempotencyError(error as AxiosError<any>);
          const action = getErrorAction(idempotencyError);
          
          debug.error('[Idempotency] Error details:', {
            type: idempotencyError.type,
            message: idempotencyError.message,
            isRetryable: idempotencyError.isRetryable,
            action,
          });

          // Clear operation key on duplicate/invalid errors
          if (action === 'check_transaction') {
            const operationId = generateOperationId(url, error.config?.data);
            clearIdempotencyKey(operationId);
          }

          const userMessage = getIdempotencyErrorMessage(idempotencyError.type);
          const responseData = error.response?.data as any;
          const rejectionError = {
            ...this.formatError(error),
            message: userMessage,
            originalMessage: responseData?.message,
            isIdempotencyError: true,
            idempotencyErrorType: idempotencyError.type,
            isRetryable: idempotencyError.isRetryable,
            action,
          };

          return Promise.reject(rejectionError);
        }
        
        const config = error.config as ExtendedAxiosRequestConfig;

        // Retry logic for network errors
        if (error.response?.status !== 401 && config && config.retry! < this.maxRetries) {
          config.retry = (config.retry || 0) + 1;
          this.log(`[ApiClient] Retrying request (attempt ${config.retry}/${this.maxRetries})`);
          await this.delay(this.retryDelay * config.retry);
          return this.axiosInstance(config);
        }

        // Handle 401 - Unauthorized
        // NOTE: We do NOT clear tokens or redirect here. Doing so would be
        // destructive — a single 401 from a non-critical endpoint would
        // forcibly log out the user even when they have a valid session.
        // Callers are responsible for handling 401s gracefully and deciding
        // when (if ever) to escalate to a full logout.
        // The `status` field is included so callers can distinguish between
        // critical (wallet, transactions → trigger logout) and non-critical
        // (virtual accounts, ads → just show error) endpoints.
        if (error.response?.status === 401) {
          this.log('[ApiClient] Got 401 - unauthorized, returning formatted error');
          const formattedError = this.formatError(error);
          debug.error('[ApiClient] 401 error details:', {
            message: formattedError.message,
            url: error.config?.url,
          });
          return Promise.reject({
            ...formattedError,
            status: 401,
          });
        }

        // Handle 403 - Forbidden access
        if (error.response?.status === 403) {
          const errorData = error.response?.data as any;
          
          // Handle account suspension
          if (errorData?.error_code === 'ACCOUNT_SUSPENDED') {
            this.log('[ApiClient] Account suspended, clearing auth state');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('auth-store');
            }
            window.location.href = '/auth/login?reason=suspended';
            return Promise.reject({
              message: (errorData as any)?.message || 'Your account has been suspended.',
              error_code: 'ACCOUNT_SUSPENDED',
              status: 403,
            });
          }

          debug.error('[ApiClient] Got 403 - access forbidden');
          const formattedError = this.formatError(error);
          // Store 403 error in session for error modal to display
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('error_403', JSON.stringify({
              message: formattedError.message,
              endpoint: error.config?.url,
              timestamp: new Date().toISOString(),
            }));
          }
          return Promise.reject(formattedError);
        }

        debug.error('[ApiClient] Request failed - no retry');
        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: AxiosError): ApiResponse {
    const response = error.response?.data as any;
    return {
      success: false,
      message: response?.message || error.message || 'An error occurred',
      error_code: response?.error_code || 'UNKNOWN_ERROR',
      errors: response?.errors,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Token management
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return safeGetItem('token');
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      safeRemoveItem('token');
    }
  }

  private setAccessToken(accessToken: string): void {
    if (typeof window !== 'undefined') {
      safeSetItem('token', accessToken);
    }
  }

  private setRefreshToken(refreshToken: string): void {
    if (typeof window !== 'undefined') {
      safeSetItem('refreshToken', refreshToken);
    }
  }

  // Public API methods
  public get<T = any>(url: string, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    devLog.log(`📡 [API] GET ${API_BASE_URL}${url}`);
    return this.axiosInstance.get<ApiResponse<T>>(url, config).then((res) => {
      devLog.log(`✅ [API] GET ${url} - Status: ${res.status}`);
      return res.data;
    }).catch((error) => {
      devLog.error(`❌ [API] GET ${url} - Error:`, error.response?.status);
      throw error;
    });
  }

  public post<T = any>(url: string, data?: any, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    devLog.log(`📡 [API] POST ${API_BASE_URL}${url}`);
    return this.axiosInstance.post<ApiResponse<T>>(url, data, config).then((res) => {
      devLog.log(`✅ [API] POST ${url} - Status: ${res.status}`);
      return res.data;
    }).catch((error) => {
      devLog.error(`❌ [API] POST ${url} - Error:`, error.response?.status);
      throw error;
    });
  }

  public put<T = any>(url: string, data?: any, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    devLog.log(`📡 [API] PUT ${API_BASE_URL}${url}`);
    return this.axiosInstance.put<ApiResponse<T>>(url, data, config).then((res) => {
      devLog.log(`✅ [API] PUT ${url} - Status: ${res.status}`);
      return res.data;
    }).catch((error) => {
      devLog.error(`❌ [API] PUT ${url} - Error:`, error.response?.status);
      throw error;
    });
  }

  public patch<T = any>(url: string, data?: any, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    devLog.log(`📡 [API] PATCH ${API_BASE_URL}${url}`);
    return this.axiosInstance.patch<ApiResponse<T>>(url, data, config).then((res) => {
      devLog.log(`✅ [API] PATCH ${url} - Status: ${res.status}`);
      return res.data;
    }).catch((error) => {
      devLog.error(`❌ [API] PATCH ${url} - Error:`, error.response?.status);
      throw error;
    });
  }

  public delete<T = any>(url: string, config?: ApiClientConfig): Promise<ApiResponse<T>> {
    devLog.log(`📡 [API] DELETE ${API_BASE_URL}${url}`);
    return this.axiosInstance.delete<ApiResponse<T>>(url, config).then((res) => {
      devLog.log(`✅ [API] DELETE ${url} - Status: ${res.status}`);
      return res.data;
    }).catch((error) => {
      devLog.error(`❌ [API] DELETE ${url} - Error:`, error.response?.status);
      throw error;
    });
  }

  public setAuthTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  public logout(): void {
    this.clearToken();
  }
}

export { ApiClient };
export const apiClient = new ApiClient();
