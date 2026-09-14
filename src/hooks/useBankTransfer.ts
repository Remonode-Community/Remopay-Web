/**
 * useBankTransfer Hook
 * Handles bank transfer logic, account verification, and state management
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { transferService } from '@/services/transfer.service';
import {
  BankTransferFormData,
  BankTransferResponse,
  Bank,
  TransferValidationResult,
} from '@/types/transfer.types';
import { generateIdempotencyKey } from '@/utils/idempotency.utils';
import {
  validateBankTransferForm,
  validateAccountNumber,
  maskAccountNumber,
  extractErrorMessage,
} from '@/utils/transfer.utils';

interface UseBankTransferOptions {
  onSuccess?: (response: BankTransferResponse) => void;
  onError?: (error: any) => void;
}

export const useBankTransfer = (options?: UseBankTransferOptions) => {
  const { user } = useAuthStore();
  const { addToast, setIsLoading } = useUIStore();

  // State management
  const [formData, setFormData] = useState<BankTransferFormData>({
    selectedBank: null,
    accountNumber: '',
    accountName: '',
    amount: 0,
    reason: '',
    accountVerified: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // 🛡️ Idempotency key: persists across retries, resets on successful transfer
  const idempotencyKeyRef = useRef<string | null>(null);

  /**
   * Load list of supported banks on mount
   */
  useEffect(() => {
    loadBanks();
  }, []);

  /**
   * Load banks from API
   */
  const loadBanks = useCallback(async () => {
    setIsLoadingBanks(true);
    try {
      const bankList = await transferService.getBanks();
      if (bankList && bankList.length > 0) {
        setBanks(bankList);
      } else {
        addToast({ type: 'error', message: 'Failed to load banks' });
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      addToast({ type: 'error', message: 'Failed to load banks' });
    } finally {
      setIsLoadingBanks(false);
    }
  }, [addToast]);

  /**
   * Update form field
   */
  const updateField = useCallback(
    (field: keyof BankTransferFormData, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }

      // Reset account verification if account number changes
      if (field === 'accountNumber') {
        setFormData((prev) => ({
          ...prev,
          accountVerified: false,
          accountName: '',
        }));
      }
    },
    [validationErrors]
  );

  /**
   * Select a bank
   */
  const selectBank = useCallback((bank: Bank) => {
    setFormData((prev) => ({
      ...prev,
      selectedBank: bank,
    }));
    if (validationErrors.bank) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated.bank;
        return updated;
      });
    }
  }, [validationErrors]);

  /**
   * Verify bank account number and get account holder name
   */
  const verifyBankAccount = useCallback(async () => {
    if (!formData.selectedBank) {
      setValidationErrors({ bank: 'Please select a bank first' });
      return;
    }

    if (!formData.accountNumber) {
      setValidationErrors({ accountNumber: 'Please enter account number' });
      return;
    }

    // Validate account number format
    const validation = validateAccountNumber(formData.accountNumber);
    if (!validation.valid) {
      setValidationErrors({ accountNumber: validation.error || 'Invalid account number' });
      return;
    }

    setIsVerifyingAccount(true);
    setValidationErrors({});

    try {
      const response = await transferService.resolveBankAccount(
        formData.selectedBank.code,
        formData.accountNumber
      );

      if (response?.status && response.data) {
        setFormData((prev) => ({
          ...prev,
          accountName: response.data!.account_name,
          accountVerified: true,
        }));
        addToast({
          type: 'success',
          message: 'Account verified successfully',
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          accountVerified: false,
          accountName: '',
        }));
        setValidationErrors({
          accountNumber: 'Invalid account number for this bank. Please check and try again.',
        });
      }
    } catch (error: any) {
      setFormData((prev) => ({
        ...prev,
        accountVerified: false,
        accountName: '',
      }));

      const errorMsg = extractErrorMessage(error);
      setValidationErrors({ accountNumber: errorMsg || 'Failed to verify account' });
      setTransferError(errorMsg);
    } finally {
      setIsVerifyingAccount(false);
    }
  }, [formData.selectedBank, formData.accountNumber, addToast]);

  /**
   * Validate form before proceeding to review
   */
  const validateForm = useCallback(
    (walletBalance: number): boolean => {
      const validation = validateBankTransferForm(
        formData.selectedBank?.code || null,
        formData.accountNumber,
        formData.accountName,
        formData.amount,
        '', // PIN is verified separately
        walletBalance,
        formData.accountVerified
      );

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return false;
      }

      setValidationErrors({});
      return true;
    },
    [formData.selectedBank?.code, formData.accountNumber, formData.accountName, formData.amount, formData.accountVerified]
  );

  /**
   * Submit bank transfer request
   */
  const submitTransfer = useCallback(
    async (pin: string): Promise<BankTransferResponse | null> => {
      if (!user) {
        addToast({ type: 'error', message: 'User not authenticated' });
        return null;
      }

      if (!formData.selectedBank) {
        addToast({ type: 'error', message: 'Please select a bank' });
        return null;
      }

      setIsLoading(true);
      setTransferError(null);

      try {
        // 🛡️ Generate idempotency key for this transfer attempt
        // Reuses the same key on retry to prevent duplicate transfers
        if (!idempotencyKeyRef.current) {
          idempotencyKeyRef.current = generateIdempotencyKey();
        }

        const payload: any = {
          account_number: formData.accountNumber,
          bank_code: formData.selectedBank.code,
          bank_name: formData.selectedBank.name,
          account_name: formData.accountName,
          amount: formData.amount,
          pin,
          idempotency_key: idempotencyKeyRef.current,
        };

        if (formData.reason) {
          payload.reason = formData.reason;
        }

        const response = await transferService.initiateBankTransfer(payload);

        if (response?.success) {
          // 🛡️ Success — reset key so next transfer gets a fresh one
          idempotencyKeyRef.current = null;

          addToast({
            type: 'success',
            message: `Transfer of ₦${formData.amount.toLocaleString()} to ${formData.selectedBank.name} initiated!`,
          });

          options?.onSuccess?.(response);
          return response;
        } else {
          throw new Error(response?.message || 'Transfer failed');
        }
      } catch (error: any) {
        // 🛡️ Failure — KEEP the same idempotency_key so retry is safe
        // The backend will return cached response instead of processing again
        const errorMsg = extractErrorMessage(error);
        setTransferError(errorMsg);

        // Handle specific error cases
        if (error.response?.status === 429) {
          // PIN locked
          const lockData = error.response?.data?.data;
          addToast({
            type: 'error',
            message: `PIN is locked. Try again in ${lockData?.remaining_seconds || 30} seconds.`,
          });
        } else if (error.response?.status === 401) {
          // Invalid PIN
          const failedAttempts = error.response?.data?.data?.failed_attempts || 0;
          const remaining = 3 - failedAttempts;
          addToast({
            type: 'error',
            message: `Invalid PIN. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
          });
        } else if (error.response?.status === 500) {
          addToast({
            type: 'error',
            message: 'Transfer service temporarily unavailable. Please try again later.',
          });
        } else {
          addToast({ type: 'error', message: errorMsg });
        }

        options?.onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user, formData, addToast, setIsLoading, options]
  );

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setFormData({
      selectedBank: null,
      accountNumber: '',
      accountName: '',
      amount: 0,
      reason: '',
      accountVerified: false,
    });
    setValidationErrors({});
    setTransferError(null);
    idempotencyKeyRef.current = null;
  }, []);

  /**
   * Restore form data from sessionStorage (used on review pages)
   */
  const restoreFormData = useCallback((data: BankTransferFormData) => {
    setFormData(data);
  }, []);

  return {
    // State
    formData,
    validationErrors,
    banks,
    isLoadingBanks,
    isVerifyingAccount,
    transferError,

    // Methods
    updateField,
    selectBank,
    verifyBankAccount,
    validateForm,
    submitTransfer,
    resetForm,
    restoreFormData,
    loadBanks,
  };
};
