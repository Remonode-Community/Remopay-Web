import { apiClient } from './api-client';
import type {
  VTUService as VTUServiceType,
  VTUProvider,
  VTUVariationResponse,
  VTUPaymentRequest,
  VTUPaymentResponse,
} from '@/types/vtu.types';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

class VTUService {
  /**
   * Get all available VTU services (Airtime, Data, Bills, etc.)
   */
  async getServices(): Promise<VTUServiceType[] | null> {
    try {
      const response = await apiClient.get<any>('/vtu/services');
      
      // Check for content property first, then fall back to data
      let services = response?.content || response?.data || null;
      
      // Check if data is nested
      if (services && typeof services === 'object' && !Array.isArray(services) && 'data' in services) {
        services = services.data;
      }
      
      return services;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all providers for a specific service
   * @param serviceId - The service identifier (e.g., 'airtime', 'data', 'electricity-bill')
   */
  async getServiceProviders(serviceId: string): Promise<VTUProvider[] | null> {
    try {
      const endpoint = `/vtu/service/${serviceId}`;
      const response = await apiClient.get<any>(endpoint);
      
      
      // API returns: { response_description: "000", content: [...] }
      // The apiClient.get() returns res.data which is the API response body
      let providers: any = response?.content || response?.data;
      

      // Check if data is nested (some endpoints might wrap it further)
      if (providers && typeof providers === 'object' && !Array.isArray(providers) && 'data' in providers) {
        providers = providers.data;
      }

      
      return Array.isArray(providers) ? providers : null;
    } catch (error) {
      console.error('[VTUService] Error fetching providers:', error);
      throw error;
    }
  }

  /**
   * Get variations for a specific provider
   * @param serviceId - The service ID (e.g., 'airtel-data', 'mtn-airtime')
   */
  async getVariations(serviceId: string): Promise<VTUVariationResponse | null> {
    try {
      const response = await apiClient.get<any>(
        `/vtu/variations/${serviceId}`
      );
      
      // Check for content property first, then fall back to data
      let variations = response?.content || response?.data || null;
      
      // Check if data is nested
      if (variations && typeof variations === 'object' && !Array.isArray(variations) && 'data' in variations) {
        variations = variations.data;
      }
      
      return variations;
    } catch (error) {
      console.error('[VTUService] getVariations error:', error);
      throw error;
    }
  }

  /**
   * Process VTU payment
   * @param paymentData - Payment request payload
   */
  async processPayment(paymentData: VTUPaymentRequest): Promise<VTUPaymentResponse | null> {
    try {
      const response = await apiClient.post<any>(
        '/vtu/pay',
        paymentData
      );
      
      // Check for content property first, then fall back to data
      let result = response?.content || response?.data || null;
      
      // Check if data is nested
      if (result && typeof result === 'object' && !Array.isArray(result) && 'data' in result) {
        result = result.data;
      }
      
      return result;
    } catch (error) {
      console.error('[VTUService] processPayment error:', error);
      throw error;
    }
  }

  /**
   * Get airtime services (filtered to 'airtime' service)
   * Convenience method for airtime flow
   */
  async getAirtimeProviders(): Promise<VTUProvider[] | null> {
    try {
      const result = await this.getServiceProviders('airtime');
 
      if (Array.isArray(result) && result.length > 0) {
        //
      } else if (result === null) {
        console.warn('[VTUService] ⚠️  WARNING: Result is null');
      } else if (!Array.isArray(result)) {
        console.error('[VTUService] ❌ ERROR: Result is NOT an array!', {
          result,
          resultType: typeof result,
        });
      }
      
      return result;
    } catch (error) {
      console.error('[VTUService] ❌ getAirtimeProviders() EXCEPTION:', error);
      throw error;
    }
  }

  /**
   * Get variations for airtime provider
   * @param providerCode - Provider code (e.g., 'mtn', 'airtel', 'glo', '9mobile')
   */
  async getAirtimeVariations(providerCode: string): Promise<VTUVariationResponse | null> {
    return this.getVariations(`${providerCode}-airtime`);
  }

  /**
   * Get all data providers
   * Convenience method for data purchase flow
   */
  async getDataProviders(): Promise<VTUProvider[] | null> {
   //
    try {
      const result = await this.getServiceProviders('data');
 
      
      return result;
    } catch (error) {
      console.error('[VTUService] ❌ getDataProviders() EXCEPTION:', error);
      throw error;
    }
  }

  /**
   * Get variations (plans) for a data provider
   * @param serviceId - Service ID (e.g., 'airtel-data', 'mtn-data')
   */
  async getDataVariations(serviceId: string): Promise<VTUVariationResponse | null> {
    return this.getVariations(serviceId);
  }

  /**
   * Get all electricity providers
   * Convenience method for electricity bill payment flow
   */
  async getElectricityProviders(): Promise<VTUProvider[] | null> {
    try {
      const result = await this.getServiceProviders('electricity-bill');
      return result;
    } catch (error) {
      console.error('[VTUService] Error fetching electricity providers:', error);
      throw error;
    }
  }

  /**
   * Get variations (prepaid/postpaid) for an electricity provider
   * @param serviceId - Service ID (e.g., 'ikeja-electric')
   */
  async getElectricityVariations(serviceId: string): Promise<VTUVariationResponse | null> {
    return this.getVariations(serviceId);
  }

  /**
   * Verify meter number for electricity bill payment
   * @param meterNumber - Customer's meter number
   * @param serviceID - Electricity provider service ID (e.g., 'ikeja-electric')
   */
  async verifyMeterNumber(
    meterNumber: string,
    serviceID: string
  ): Promise<any> {
    try {
      const response = await apiClient.post('/vtu/merchant-verify', {
        billersCode: meterNumber,
        serviceID: serviceID,
      });

      return response;
    } catch (error) {
      console.error('[VTUService] Meter verification failed:', error);
      throw error;
    }
  }

  /**
   * Get all TV subscription providers
   * Convenience method for TV subscription flow
   */
  async getTVProviders(): Promise<VTUProvider[] | null> {
    try {
      const result = await this.getServiceProviders('tv-subscription');
      return result;
    } catch (error) {
      console.error('[VTUService] Error fetching TV providers:', error);
      throw error;
    }
  }

  /**
   * Get variations (subscription plans) for a TV provider
   * @param serviceId - Service ID (e.g., 'dstv', 'gotv', 'startimes')
   */
  async getTVVariations(serviceId: string): Promise<VTUVariationResponse | null> {
    return this.getVariations(serviceId);
  }

  /**
   * Verify smartcard/decoder number for TV subscription
   * @param smartcardNumber - Customer's smartcard/decoder number
   * @param serviceID - TV provider service ID (e.g., 'dstv', 'gotv')
   */
  async verifySmartcard(
    smartcardNumber: string,
    serviceID: string
  ): Promise<any> {
    try {
      const response = await apiClient.post('/vtu/merchant-verify', {
        billersCode: smartcardNumber,
        serviceID: serviceID,
      });

      return response;
    } catch (error) {
      console.error('[VTUService] Smartcard verification failed:', error);
      throw error;
    }
  }
}

export const vtuService = new VTUService();
