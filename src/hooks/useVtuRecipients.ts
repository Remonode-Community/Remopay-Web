import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { vtuRecipientsService } from '@/services/vtu-recipients.service';
import { toBackendTransactionType } from '@/utils/transaction-type.utils';
import {
  VtuRecipient,
  GetAllRecipientsRequest,
  GetAllRecipientsResponse,
  RecipientSearchSuggestion,
  UpdateVtuRecipientRequest,
  ApiResponse,
} from '@/types/api.types';
import { debug } from '@/utils/debug.utils';

interface UseVtuRecipientsState {
  recipients: VtuRecipient[];
  recentlyUsed: VtuRecipient[];
  frequentlyUsed: VtuRecipient[];
  favorites: VtuRecipient[];
  suggestions: RecipientSearchSuggestion[];
  selectedRecipient: VtuRecipient | null;
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  pagination: {
    total: number;
    currentPage: number;
    lastPage: number;
    perPage: number;
    hasMore: boolean;
  };
}

const initialState: UseVtuRecipientsState = {
  recipients: [],
  recentlyUsed: [],
  frequentlyUsed: [],
  favorites: [],
  suggestions: [],
  selectedRecipient: null,
  isLoading: false,
  isSearching: false,
  error: null,
  pagination: {
    total: 0,
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    hasMore: false,
  },
};

export const useVtuRecipients = () => {
  const { addToast } = useUIStore();
  const [state, setState] = useState<UseVtuRecipientsState>(initialState);

  /**
   * Fetch all recipients with filters and pagination
   */
  const fetchRecipients = useCallback(
    async (params: GetAllRecipientsRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await vtuRecipientsService.getAllRecipients({
          page: params.page || 1,
          per_page: params.per_page || 15,
          search: params.search,
          transaction_type: params.transaction_type,
          service_identifier: params.service_identifier,
          sort_by: params.sort_by,
        });

        if (response.success && Array.isArray(response.data)) {
          const currentPage = response.pagination?.current_page || 1;
          const lastPage = response.pagination?.last_page || 1;
          setState((prev) => ({
            ...prev,
            recipients: response.data as VtuRecipient[],
            pagination: {
              total: response.pagination?.total || 0,
              currentPage,
              lastPage,
              perPage: response.pagination?.per_page || 15,
              hasMore: currentPage < lastPage,
            },
            isLoading: false,
          }));
        } else {
          throw new Error(response.message || 'Failed to fetch recipients');
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to fetch recipients';
        debug.error('[useVtuRecipients] fetchRecipients error', error);
        setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
        addToast({
          type: 'error',
          message: errorMsg,
        });
      }
    },
    [addToast]
  );

  /**
   * Fetch recently used recipients
   */
  const fetchRecentlyUsed = useCallback(
    async (
      limit: number = 5,
      transactionType?: string,
      serviceIdentifier?: string
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        // Convert frontend transaction type to backend format
        const backendTransactionType = toBackendTransactionType(transactionType);

        const response = await vtuRecipientsService.getRecentlyUsed(
          limit,
          backendTransactionType,
          serviceIdentifier
        );

        if (response.success && Array.isArray(response.data)) {
          setState((prev) => ({
            ...prev,
            recentlyUsed: response.data as VtuRecipient[],
            isLoading: false,
          }));
        } else {
          throw new Error(
            response.message || 'Failed to fetch recently used recipients'
          );
        }
      } catch (error: any) {
        debug.error('[useVtuRecipients] fetchRecentlyUsed error', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  /**
   * Fetch frequently used recipients
   */
  const fetchFrequentlyUsed = useCallback(
    async (
      minUsage: number = 3,
      transactionType?: string,
      serviceIdentifier?: string
    ) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        // Convert frontend transaction type to backend format
        const backendTransactionType = toBackendTransactionType(transactionType);

        const response = await vtuRecipientsService.getFrequentlyUsed(
          minUsage,
          backendTransactionType,
          serviceIdentifier
        );

        if (response.success && Array.isArray(response.data)) {
          setState((prev) => ({
            ...prev,
            frequentlyUsed: response.data as VtuRecipient[],
            isLoading: false,
          }));
        } else {
          throw new Error(
            response.message || 'Failed to fetch frequently used recipients'
          );
        }
      } catch (error: any) {
        debug.error('[useVtuRecipients] fetchFrequentlyUsed error', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  /**
   * Search recipients
   */
  const searchRecipients = useCallback(
    async (credential: string, transactionType?: string, serviceIdentifier?: string) => {
      // Remove spaces from credential for API call
      const cleanedCredential = credential.replace(/\s/g, '');

      if (cleanedCredential.length < 2) {
        setState((prev) => ({ ...prev, suggestions: [] }));
        return;
      }

      setState((prev) => ({ ...prev, isSearching: true, error: null }));

      try {
        // Convert frontend transaction type to backend format
        const backendTransactionType = toBackendTransactionType(transactionType);

        const response = await vtuRecipientsService.searchRecipients({
          credential: cleanedCredential,
          transaction_type: backendTransactionType,
          service_identifier: serviceIdentifier,
          limit: 10,
        });

        if (response.success && Array.isArray(response.data)) {
          setState((prev) => ({
            ...prev,
            suggestions: response.data as RecipientSearchSuggestion[],
            isSearching: false,
          }));
        } else {
          throw new Error(response.message || 'Failed to search recipients');
        }
      } catch (error: any) {
        debug.error('[useVtuRecipients] searchRecipients error', error);
        setState((prev) => ({
          ...prev,
          suggestions: [],
          isSearching: false,
        }));
      }
    },
    []
  );

  /**
   * Clear search suggestions
   */
  const clearSuggestions = useCallback(() => {
    setState((prev) => ({ ...prev, suggestions: [] }));
  }, []);

  /**
   * Update a recipient
   */
  const updateRecipient = useCallback(
    async (id: number, data: UpdateVtuRecipientRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await vtuRecipientsService.updateRecipient(id, data);

        if (response.success && response.data?.data) {
          setState((prev) => ({
            ...prev,
            recipients: prev.recipients
              .map((r) => r?.id === id ? response.data?.data : r)
              .filter((r): r is VtuRecipient => r !== undefined),
            selectedRecipient: response.data?.data || null,
            isLoading: false,
          }));

          addToast({
            type: 'success',
            message: 'Recipient updated successfully',
          });
        } else {
          throw new Error(response.message || 'Failed to update recipient');
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to update recipient';
        debug.error('[useVtuRecipients] updateRecipient error', error);
        setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
        addToast({
          type: 'error',
          message: errorMsg,
        });
      }
    },
    [addToast]
  );

  /**
   * Record recipient usage
   */
  const recordUsage = useCallback(
    async (id: number) => {
      try {
        const response = await vtuRecipientsService.recordUsage(id);

        if (response.success) {
          debug.log('[useVtuRecipients] Usage recorded successfully', { id });
          // Update the recipient's usage count in state
          setState((prev) => ({
            ...prev,
            recipients: prev.recipients.map((r) =>
              r.id === id
                ? {
                    ...r,
                    usage_count: r.usage_count + 1,
                    last_used_at: new Date().toISOString(),
                  }
                : r
            ),
          }));
        }
      } catch (error: any) {
        debug.error('[useVtuRecipients] recordUsage error', error);
      }
    },
    []
  );

  /**
   * Delete a recipient
   */
  const deleteRecipient = useCallback(
    async (id: number) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await vtuRecipientsService.deleteRecipient(id);

        if (response.success) {
          setState((prev) => ({
            ...prev,
            recipients: prev.recipients.filter((r) => r.id !== id),
            favorites: prev.favorites.filter((r) => r.id !== id),
            selectedRecipient:
              prev.selectedRecipient?.id === id ? null : prev.selectedRecipient,
            isLoading: false,
          }));

          addToast({
            type: 'success',
            message: 'Recipient deleted successfully',
          });
        } else {
          throw new Error(response.message || 'Failed to delete recipient');
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to delete recipient';
        debug.error('[useVtuRecipients] deleteRecipient error', error);
        setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
        addToast({
          type: 'error',
          message: errorMsg,
        });
      }
    },
    [addToast]
  );

  /**
   * Fetch favorite recipients
   */
  const fetchFavorites = useCallback(
    async (limit: number = 20) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await vtuRecipientsService.getFavorites(limit);

        if (response.success && Array.isArray(response.data)) {
          setState((prev) => ({
            ...prev,
            favorites: response.data as VtuRecipient[],
            isLoading: false,
          }));
        } else {
          throw new Error(response.message || 'Failed to fetch favorites');
        }
      } catch (error: any) {
        debug.error('[useVtuRecipients] fetchFavorites error', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  /**
   * Toggle favorite status for a recipient
   */
  const toggleFavorite = useCallback(
    async (id: number) => {
      try {
        const response = await vtuRecipientsService.toggleFavorite(id);

        if (response.success && response.data?.data) {
          const updated = response.data.data as VtuRecipient;

          setState((prev) => ({
            ...prev,
            recipients: prev.recipients.map((r) =>
              r.id === id ? { ...r, is_favorite: updated.is_favorite } : r
            ),
            recentlyUsed: prev.recentlyUsed.map((r) =>
              r.id === id ? { ...r, is_favorite: updated.is_favorite } : r
            ),
            frequentlyUsed: prev.frequentlyUsed.map((r) =>
              r.id === id ? { ...r, is_favorite: updated.is_favorite } : r
            ),
            favorites: updated.is_favorite
              ? [...prev.favorites.filter((r) => r.id !== id), updated]
              : prev.favorites.filter((r) => r.id !== id),
          }));

          addToast({
            type: 'success',
            message: updated.is_favorite ? 'Added to favorites' : 'Removed from favorites',
          });
        } else {
          throw new Error(response.message || 'Failed to toggle favorite');
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to toggle favorite';
        debug.error('[useVtuRecipients] toggleFavorite error', error);
        addToast({
          type: 'error',
          message: errorMsg,
        });
      }
    },
    [addToast]
  );

  /**
   * Select a recipient
   */
  const selectRecipient = useCallback((recipient: VtuRecipient | null) => {
    setState((prev) => ({ ...prev, selectedRecipient: recipient }));
  }, []);

  /**
   * Clear all errors
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchRecipients,
    fetchRecentlyUsed,
    fetchFrequentlyUsed,
    fetchFavorites,
    searchRecipients,
    clearSuggestions,
    updateRecipient,
    recordUsage,
    deleteRecipient,
    toggleFavorite,
    selectRecipient,
    clearError,
  };
};
