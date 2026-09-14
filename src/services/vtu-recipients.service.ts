import { apiClient } from './api-client';
import {
  VtuRecipient,
  GetAllRecipientsRequest,
  GetAllRecipientsResponse,
  SearchRecipientsSuggestRequest,
  SearchRecipientsSuggestResponse,
  RecipientSearchSuggestion,
  UpdateVtuRecipientRequest,
  UpdateVtuRecipientResponse,
  RecordUsageResponse,
  DeleteRecipientResponse,
  ApiResponse,
} from '@/types/api.types';
import { debug } from '@/utils/debug.utils';

class VtuRecipientsService {
  /**
   * Get all VTU recipients with filtering and pagination
   */
  async getAllRecipients(params: GetAllRecipientsRequest): Promise<ApiResponse<GetAllRecipientsResponse>> {
    try {
      debug.log('[VtuRecipientsService] Fetching all recipients', params);
      
      const response = await apiClient.get<GetAllRecipientsResponse>('/vtu/recipients', { params });
      
      debug.log('[VtuRecipientsService] Recipients fetched successfully', {
        count: response.data?.length,
        total: response.pagination?.total,
      });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to fetch recipients', error);
      throw error;
    }
  }

  /**
   * Get a single recipient by ID
   */
  async getRecipient(id: number): Promise<ApiResponse<{ data: VtuRecipient }>> {
    try {
      debug.log('[VtuRecipientsService] Fetching recipient', { id });
      
      const response = await apiClient.get<{ data: VtuRecipient }>(`/vtu/recipients/${id}`);
      
      debug.log('[VtuRecipientsService] Recipient fetched successfully', { id });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to fetch recipient', error);
      throw error;
    }
  }

  /**
   * Get recently used recipients
   */
  async getRecentlyUsed(
    limit: number = 5,
    transactionType?: string,
    serviceIdentifier?: string
  ): Promise<ApiResponse<VtuRecipient[]>> {
    try {
      debug.log('[VtuRecipientsService] Fetching recently used recipients', {
        limit,
        transactionType,
        serviceIdentifier,
      });
      
      const params: any = { limit };
      if (transactionType) params.transaction_type = transactionType;
      if (serviceIdentifier) params.service_identifier = serviceIdentifier;
      
      const response = await apiClient.get<VtuRecipient[]>(
        '/vtu/recipients/quick-access/recently-used',
        { params }
      );
      
      debug.log('[VtuRecipientsService] Recently used recipients fetched', {
        count: response.data?.length,
      });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to fetch recently used recipients', error);
      throw error;
    }
  }

  /**
   * Get frequently used recipients
   */
  async getFrequentlyUsed(
    minUsage: number = 3,
    transactionType?: string,
    serviceIdentifier?: string
  ): Promise<ApiResponse<VtuRecipient[]>> {
    try {
      debug.log('[VtuRecipientsService] Fetching frequently used recipients', {
        minUsage,
        transactionType,
        serviceIdentifier,
      });
      
      const params: any = { min_usage: minUsage };
      if (transactionType) params.transaction_type = transactionType;
      if (serviceIdentifier) params.service_identifier = serviceIdentifier;
      
      const response = await apiClient.get<VtuRecipient[]>(
        '/vtu/recipients/quick-access/frequently-used',
        { params }
      );
      
      debug.log('[VtuRecipientsService] Frequently used recipients fetched', {
        count: response.data?.length,
      });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to fetch frequently used recipients', error);
      throw error;
    }
  }

  /**
   * Search/suggest recipients based on partial credential input
   */
  async searchRecipients(
    request: SearchRecipientsSuggestRequest
  ): Promise<ApiResponse<RecipientSearchSuggestion[]>> {
    try {
      debug.log('[VtuRecipientsService] Searching recipients', {
        credential: request.credential,
        transactionType: request.transaction_type,
      });
      
      const response = await apiClient.post<RecipientSearchSuggestion[]>(
        '/vtu/recipients/search/suggest',
        request
      );
      
      debug.log('[VtuRecipientsService] Recipients search completed', {
        count: response.data?.length,
      });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to search recipients', error);
      throw error;
    }
  }

  /**
   * Update recipient information
   */
  async updateRecipient(
    id: number,
    data: UpdateVtuRecipientRequest
  ): Promise<ApiResponse<UpdateVtuRecipientResponse>> {
    try {
      debug.log('[VtuRecipientsService] Updating recipient', { id, data });
      
      const response = await apiClient.put<UpdateVtuRecipientResponse>(`/vtu/recipients/${id}`, data);
      
      debug.log('[VtuRecipientsService] Recipient updated successfully', { id });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to update recipient', error);
      throw error;
    }
  }

  /**
   * Record that a recipient was used (call after successful transaction)
   */
  async recordUsage(id: number): Promise<ApiResponse<RecordUsageResponse>> {
    try {
      debug.log('[VtuRecipientsService] Recording recipient usage', { id });
      
      const response = await apiClient.post<RecordUsageResponse>(
        `/vtu/recipients/${id}/record-usage`
      );
      
      debug.log('[VtuRecipientsService] Usage recorded successfully', { id });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to record usage', error);
      throw error;
    }
  }

  /**
   * Delete a recipient
   */
  async deleteRecipient(id: number): Promise<ApiResponse<DeleteRecipientResponse>> {
    try {
      debug.log('[VtuRecipientsService] Deleting recipient', { id });
      
      const response = await apiClient.delete<DeleteRecipientResponse>(`/vtu/recipients/${id}`);
      
      debug.log('[VtuRecipientsService] Recipient deleted successfully', { id });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to delete recipient', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for a recipient
   */
  async toggleFavorite(id: number): Promise<ApiResponse<{ data: VtuRecipient }>> {
    try {
      debug.log('[VtuRecipientsService] Toggling favorite', { id });
      
      const response = await apiClient.post<{ data: VtuRecipient }>(`/vtu/recipients/${id}/toggle-favorite`);
      
      debug.log('[VtuRecipientsService] Favorite toggled successfully', { id });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to toggle favorite', error);
      throw error;
    }
  }

  /**
   * Get all favorite recipients
   */
  async getFavorites(limit: number = 20): Promise<ApiResponse<VtuRecipient[]>> {
    try {
      debug.log('[VtuRecipientsService] Fetching favorites', { limit });
      
      const response = await apiClient.get<VtuRecipient[]>('/vtu/recipients/favorites', {
        params: { limit },
      });
      
      debug.log('[VtuRecipientsService] Favorites fetched', {
        count: response.data?.length,
      });
      
      return response;
    } catch (error: any) {
      debug.error('[VtuRecipientsService] Failed to fetch favorites', error);
      throw error;
    }
  }
}

export const vtuRecipientsService = new VtuRecipientsService();
