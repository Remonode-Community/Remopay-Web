/**
 * Transfer Provider Management Hook - useTransferProvider
 * Date: July 24, 2026
 *
 * React hook for managing multi-provider bank transfer operations
 * with state management, loading/error states, and toast notifications.
 */

'use client';

import { useCallback, useState } from 'react';
import { useUIStore } from '@/store/ui.store';
import { transferProviderService } from '@/services/transfer-provider.service';
import type {
  TransferProviderSettings,
  UpdateTransferProviderSettingsRequest,
  TransferProviderBalancesData,
  TransferProviderCode,
  TestProviderConnectionData,
} from '@/types/transfer-provider.types';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface UseTransferProviderState {
  // Data
  settings: TransferProviderSettings | null;
  balances: TransferProviderBalancesData | null;
  testResult: TestProviderConnectionData | null;
  testedProvider: TransferProviderCode | null;

  // Loading states
  isLoadingSettings: boolean;
  isLoadingBalances: boolean;
  isUpdatingSettings: boolean;
  isTestingConnection: boolean;

  // Error states
  settingsError: string | null;
  balancesError: string | null;
  updateError: string | null;
  testError: string | null;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: UseTransferProviderState = {
  settings: null,
  balances: null,
  testResult: null,
  testedProvider: null,

  isLoadingSettings: false,
  isLoadingBalances: false,
  isUpdatingSettings: false,
  isTestingConnection: false,

  settingsError: null,
  balancesError: null,
  updateError: null,
  testError: null,
};

// ============================================================================
// HOOK
// ============================================================================

export const useTransferProvider = () => {
  const [state, setState] = useState<UseTransferProviderState>(initialState);
  const { addToast, setIsLoading } = useUIStore();

  // --------------------------------------------------------------------------
  // Error Handler
  // --------------------------------------------------------------------------

  const handleError = useCallback(
    (
      error: unknown,
      errorField?: keyof Pick<
        UseTransferProviderState,
        'settingsError' | 'balancesError' | 'updateError' | 'testError'
      >
    ) => {
      const message =
        (error as { message?: string })?.message || 'An error occurred';

      setState((prev) => ({
        ...prev,
        [errorField || 'settingsError']: message,
      }));

      addToast({ type: 'error', message });
    },
    [addToast]
  );

  // --------------------------------------------------------------------------
  // Success Toast
  // --------------------------------------------------------------------------

  const showSuccess = useCallback(
    (message: string) => {
      addToast({ type: 'success', message });
    },
    [addToast]
  );

  // ==========================================================================
  // SETTINGS OPERATIONS
  // ==========================================================================

  /**
   * Fetch current transfer provider settings
   */
  const fetchSettings = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoadingSettings: true,
      settingsError: null,
    }));
    setIsLoading(true);

    try {
      const response = await transferProviderService.getSettings();

      if (!response.success) {
        throw new Error(response.message);
      }

      setState((prev) => ({
        ...prev,
        settings: response.data!,
      }));
    } catch (error: unknown) {
      handleError(error, 'settingsError');
    } finally {
      setState((prev) => ({ ...prev, isLoadingSettings: false }));
      setIsLoading(false);
    }
  }, [handleError, setIsLoading]);

  /**
   * Update transfer provider settings
   */
  const updateSettings = useCallback(
    async (data: UpdateTransferProviderSettingsRequest): Promise<boolean> => {
      setState((prev) => ({ ...prev, isUpdatingSettings: true, updateError: null }));
      setIsLoading(true);

      try {
        const response = await transferProviderService.updateSettings(data);

        if (!response.success) {
          throw new Error(response.message);
        }

        setState((prev) => ({
          ...prev,
          settings: response.data!,
        }));

        showSuccess('Provider settings updated successfully');
        return true;
      } catch (error: unknown) {
        handleError(error, 'updateError');
        return false;
      } finally {
        setState((prev) => ({ ...prev, isUpdatingSettings: false }));
        setIsLoading(false);
      }
    },
    [handleError, showSuccess, setIsLoading]
  );

  // ==========================================================================
  // BALANCES OPERATIONS
  // ==========================================================================

  /**
   * Fetch real-time provider balances and health status
   */
  const fetchBalances = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoadingBalances: true,
      balancesError: null,
    }));
    setIsLoading(true);

    try {
      const response = await transferProviderService.getBalances();

      if (!response.success) {
        throw new Error(response.message);
      }

      setState((prev) => ({
        ...prev,
        balances: response.data!,
      }));
    } catch (error: unknown) {
      handleError(error, 'balancesError');
    } finally {
      setState((prev) => ({ ...prev, isLoadingBalances: false }));
      setIsLoading(false);
    }
  }, [handleError, setIsLoading]);

  // ==========================================================================
  // TEST CONNECTION OPERATIONS
  // ==========================================================================

  /**
   * Test a specific provider connection
   */
  const testConnection = useCallback(
    async (provider: TransferProviderCode): Promise<boolean> => {
      setState((prev) => ({
        ...prev,
        isTestingConnection: true,
        testError: null,
        testResult: null,
        testedProvider: provider,
      }));
      setIsLoading(true);

      try {
        const response = await transferProviderService.testConnection({
          provider,
        });

        if (!response.success) {
          throw new Error(response.message);
        }

        setState((prev) => ({
          ...prev,
          testResult: response.data!,
        }));

        if (response.data!.connected) {
          showSuccess(`${response.data!.message}`);
        }

        return response.data!.connected;
      } catch (error: unknown) {
        handleError(error, 'testError');
        return false;
      } finally {
        setState((prev) => ({ ...prev, isTestingConnection: false }));
        setIsLoading(false);
      }
    },
    [handleError, showSuccess, setIsLoading]
  );

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * Clear all error states
   */
  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settingsError: null,
      balancesError: null,
      updateError: null,
      testError: null,
    }));
  }, []);

  /**
   * Reset state to initial
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    state,

    // Settings operations
    fetchSettings,
    updateSettings,

    // Balances operations
    fetchBalances,

    // Test connection operations
    testConnection,

    // Utilities
    clearErrors,
    reset,
  };
};
