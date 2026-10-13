'use client';

/**
 * useCards Hook
 * Complete virtual card management with creation, listing, funding, and withdrawals
 */

import { useCallback, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { cardService } from '@/services/card.service';
import {
  VirtualCard,
  CardDetail,
  CardTransaction,
  CreateCardRequest,
  CreateCardFormData,
  CardFilters,
  CardListState,
  CardBrand,
  CardStatus,
  CardCurrency,
  CardType,
  CardActionModalState,
  FundCardRequest,
  WithdrawCardRequest,
  GetCardResponse,
  GetCardTransactionsResponse,
} from '@/types/card.types';

interface UseCardsOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: any) => void;
}

export const useCards = (options?: UseCardsOptions) => {
  const { user } = useAuthStore();
  const { addToast, setIsLoading } = useUIStore();

  // ═════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═════════════════════════════════════════════════════════════════

  const [cardListState, setCardListState] = useState<CardListState>({
    cards: [],
    pagination: {
      current_page: 1,
      total_pages: 0,
      total_records: 0,
      page_size: 10,
    },
    isLoading: false,
    error: null,
    filters: {},
    currentPage: 1,
  });

  const [createFormData, setCreateFormData] = useState<CreateCardFormData>({
    brand: CardBrand.VISA,
    autoApprove: true,
    amount: '0',
  });

  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  // Card detail state
  const [cardDetail, setCardDetail] = useState<CardDetail | null>(null);
  const [cardDetailLoading, setCardDetailLoading] = useState(false);
  const [cardDetailError, setCardDetailError] = useState<string | null>(null);

  // Transactions state
  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsPagination, setTransactionsPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_records: 0,
    page_size: 10,
  });

  // Action modal state
  const [actionModal, setActionModal] = useState<CardActionModalState>({
    isOpen: false,
    action: null,
    cardId: null,
    cardMaskedPan: null,
  });

  // ═════════════════════════════════════════════════════════════════
  // FORM DATA MANAGEMENT
  // ═════════════════════════════════════════════════════════════════

  const updateCreateFormField = useCallback(
    (field: keyof CreateCardFormData, value: any) => {
      setCreateFormData((prev) => ({ ...prev, [field]: value }));
      if (createFormErrors[field]) {
        setCreateFormErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    },
    [createFormErrors]
  );

  const resetCreateForm = useCallback(() => {
    setCreateFormData({
      brand: CardBrand.VISA,
      autoApprove: true,
      amount: '0',
    });
    setCreateFormErrors({});
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═════════════════════════════════════════════════════════════════

  const validateCreateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const amount = parseFloat(createFormData.amount || '0');
    if (isNaN(amount) || amount < 0) {
      errors.amount = 'Amount must be a non-negative number';
    }
    if (!createFormData.brand || !Object.values(CardBrand).includes(createFormData.brand)) {
      errors.brand = 'Please select a valid card brand';
    }
    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [createFormData]);

  // ═════════════════════════════════════════════════════════════════
  // CARD OPERATIONS
  // ═════════════════════════════════════════════════════════════════

  /**
   * Create a new virtual card
   */
  const createCard = useCallback(async () => {
    try {
      if (!validateCreateForm()) {
        addToast({ type: 'error', message: 'Please fix form errors' });
        return null;
      }

      setIsCreatingCard(true);
      setIsLoading(true);

      const payload: CreateCardRequest = {
        currency: CardCurrency.USD,
        type: CardType.VIRTUAL,
        auto_approve: createFormData.autoApprove,
        brand: createFormData.brand,
        amount: Math.max(0, parseInt(createFormData.amount) || 0),
      };

      const response = await cardService.createCard(payload);

      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to create card');
      }

      addToast({
        type: 'success',
        message: response.message || 'Card created successfully',
      });
      options?.onSuccess?.(response.message || 'Card created successfully');

      resetCreateForm();
      await fetchCards(1, cardListState.pagination.page_size, cardListState.filters);

      return response.data.card;
    } catch (error: any) {
      console.error('[useCards] Error creating card:', error);

      if (error.response?.status === 400) {
        addToast({
          type: 'error',
          message: error.response?.data?.message || 'Please complete your profile first',
        });
      } else if (error.response?.status === 403) {
        addToast({
          type: 'error',
          message: error.response?.data?.message || 'Tier 1 account required for card creation',
        });
      } else if (error.response?.status === 402) {
        addToast({
          type: 'error',
          message: error.response?.data?.message || 'Insufficient balance. Card creation requires $3.',
        });
      } else if (error.response?.status === 422) {
        const backendErrors = error.response?.data?.errors || {};
        setCreateFormErrors(
          Object.keys(backendErrors).reduce((acc: Record<string, string>, key: string) => {
            acc[key] = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key];
            return acc;
          }, {})
        );
        addToast({ type: 'error', message: error.response?.data?.message || 'Validation failed' });
      } else {
        addToast({ type: 'error', message: error.message || 'Failed to create card' });
      }

      options?.onError?.(error);
      return null;
    } finally {
      setIsCreatingCard(false);
      setIsLoading(false);
    }
  }, [createFormData, validateCreateForm, addToast, setIsLoading, resetCreateForm, options, cardListState]);

  /**
   * Fetch cards list with filters and pagination
   */
  const fetchCards = useCallback(
    async (page: number = 1, pageSize: number = 10, filters: CardFilters = {}) => {
      try {
        setCardListState((prev) => ({ ...prev, isLoading: true, error: null }));

        const query = {
          page: Math.max(1, page),
          page_size: Math.min(Math.max(1, pageSize), 100),
          ...(filters.brand && { brand: filters.brand }),
          ...(filters.status && { status: filters.status }),
          ...(filters.createdAt && { created_at: filters.createdAt }),
        };

        const response = await cardService.getAllCards(query);

        if (!response) throw new Error('Server returned no response');
        if (response.success === false) {
          throw new Error(response?.message || 'Failed to fetch cards');
        }

        const cardsData = response.data?.cards || [];
        const metaData = response.data?.meta || {
          current_page: page,
          total_pages: 1,
          total_records: cardsData.length,
          page_size: pageSize,
        };

        setCardListState({
          cards: cardsData,
          pagination: metaData,
          isLoading: false,
          error: null,
          filters,
          currentPage: page,
        });

        return cardsData;
      } catch (error: any) {
        let errorMessage = 'Failed to load cards';
        if (error.response?.status === 400) {
          errorMessage = 'Please complete your profile to view cards';
        } else if (error.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        setCardListState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        options?.onError?.(error);
        return null;
      }
    },
    [options]
  );

  /**
   * Get single card details
   */
  const fetchCardDetail = useCallback(async (cardId: string) => {
    try {
      setCardDetailLoading(true);
      setCardDetailError(null);

      const response = await cardService.getCard(cardId);

      if (!response || !response.success) {
        throw new Error(response?.message || 'Failed to load card details');
      }

      setCardDetail(response.data.card);
      return response.data.card;
    } catch (error: any) {
      const message = error.message || 'Failed to load card details';
      setCardDetailError(message);
      addToast({ type: 'error', message });
      return null;
    } finally {
      setCardDetailLoading(false);
    }
  }, [addToast]);

  /**
   * Get card transactions
   */
  const fetchCardTransactions = useCallback(
    async (cardId: string, page: number = 1, pageSize: number = 10) => {
      try {
        setTransactionsLoading(true);

        const response = await cardService.getCardTransactions(cardId, {
          page,
          page_size: pageSize,
        });

        if (!response || !response.success) {
          throw new Error(response?.message || 'Failed to load transactions');
        }

        const transactions = response.data?.transactions || [];
        const meta = response.data?.meta || {
          current_page: page,
          total_pages: 0,
          total_records: 0,
          page_size: pageSize,
        };

        setCardTransactions(transactions);
        setTransactionsPagination(meta);

        return transactions;
      } catch (error: any) {
        console.error('[useCards] Error fetching transactions:', error);
        addToast({
          type: 'error',
          message: error.message || 'Failed to load transactions',
        });
        return [];
      } finally {
        setTransactionsLoading(false);
      }
    },
    [addToast]
  );

  /**
   * Fund a card
   */
  const fundCard = useCallback(
    async (cardId: string, amountInCents: number) => {
      try {
        setIsLoading(true);
        const response = await cardService.fundCard(cardId, amountInCents);

        if (!response || !response.success) {
          throw new Error(response?.message || 'Failed to fund card');
        }

        addToast({
          type: 'success',
          message: response.message || 'Card funded successfully',
        });

        // Refresh card detail if viewing it
        if (cardDetail?.id === cardId) {
          await fetchCardDetail(cardId);
        }

        return true;
      } catch (error: any) {
        addToast({
          type: 'error',
          message: error.message || 'Failed to fund card',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, setIsLoading, cardDetail, fetchCardDetail]
  );

  /**
   * Withdraw from a card
   */
  const withdrawFromCard = useCallback(
    async (cardId: string, amountInCents: number) => {
      try {
        setIsLoading(true);
        const response = await cardService.withdrawFromCard(cardId, amountInCents);

        if (!response || !response.success) {
          throw new Error(response?.message || 'Failed to withdraw from card');
        }

        addToast({
          type: 'success',
          message: response.message || 'Withdrawal successful',
        });

        // Refresh card detail if viewing it
        if (cardDetail?.id === cardId) {
          await fetchCardDetail(cardId);
        }

        return true;
      } catch (error: any) {
        addToast({
          type: 'error',
          message: error.message || 'Failed to withdraw from card',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, setIsLoading, cardDetail, fetchCardDetail]
  );

  // ═════════════════════════════════════════════════════════════════
  // ACTION MODAL
  // ═════════════════════════════════════════════════════════════════

  const openActionModal = useCallback(
    (action: 'fund' | 'withdraw', cardId: string, cardMaskedPan: string | null) => {
      setActionModal({ isOpen: true, action, cardId, cardMaskedPan });
    },
    []
  );

  const closeActionModal = useCallback(() => {
    setActionModal({
      isOpen: false,
      action: null,
      cardId: null,
      cardMaskedPan: null,
    });
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // PAGINATION & FILTERS
  // ═════════════════════════════════════════════════════════════════

  const goToPage = useCallback(
    (page: number) => {
      fetchCards(page, cardListState.pagination.page_size, cardListState.filters);
    },
    [fetchCards, cardListState.pagination.page_size, cardListState.filters]
  );

  const changePageSize = useCallback(
    (pageSize: number) => {
      fetchCards(1, pageSize, cardListState.filters);
    },
    [fetchCards, cardListState.filters]
  );

  const applyFilters = useCallback(
    (newFilters: CardFilters) => {
      fetchCards(1, cardListState.pagination.page_size, newFilters);
    },
    [fetchCards, cardListState.pagination.page_size]
  );

  const clearFilters = useCallback(() => {
    fetchCards(1, cardListState.pagination.page_size, {});
  }, [fetchCards, cardListState.pagination.page_size]);

  /**
   * Load initial cards on mount
   */
  useEffect(() => {
    if (user && cardListState.cards.length === 0 && !cardListState.isLoading) {
      fetchCards(1, 10, {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ═════════════════════════════════════════════════════════════════
  // RETURN PUBLIC API
  // ═════════════════════════════════════════════════════════════════

  return {
    // Card list state and operations
    cardListState,
    fetchCards,
    goToPage,
    changePageSize,
    applyFilters,
    clearFilters,

    // Create form state and operations
    createFormData,
    updateCreateFormField,
    resetCreateForm,
    createFormErrors,
    isCreatingCard,
    createCard,

    // Card detail
    cardDetail,
    cardDetailLoading,
    cardDetailError,
    fetchCardDetail,

    // Transactions
    cardTransactions,
    transactionsLoading,
    transactionsPagination,
    fetchCardTransactions,

    // Actions
    fundCard,
    withdrawFromCard,

    // Action modal
    actionModal,
    openActionModal,
    closeActionModal,

    // Computed values
    hasCards: cardListState.cards.length > 0,
    isEmpty: cardListState.cards.length === 0 && !cardListState.isLoading,
  };
};
