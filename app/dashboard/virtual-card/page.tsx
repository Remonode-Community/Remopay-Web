'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCards } from '@/hooks/useCards';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useUsdWallet } from '@/hooks/useUsdWallet';
import {
  CardList,
  CreateCardForm,
  CardFilterSection,
  CardActionModal,
} from '@/components/dashboard/card';
import { Card } from '@/components/shared/Card';
import {
  CreditCard,
  Shield,
  Globe,
  Zap,
  AlertCircle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

export default function VirtualCardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { usdWalletState, formattedUsdBalance, fetchUsdWallet } = useUsdWallet();

  const {
    cardListState,
    createFormData,
    updateCreateFormField,
    createFormErrors,
    isCreatingCard,
    createCard,
    goToPage,
    changePageSize,
    applyFilters,
    clearFilters,
    hasCards,
    isEmpty,
    actionModal,
    openActionModal,
    closeActionModal,
    fundCard,
    withdrawFromCard,
  } = useCards({
    onSuccess: () => {},
    onError: (error) => {
      console.error('[VirtualCardPage] Card operation error:', error);
    },
  });

  useEffect(() => {
    if (!user) {
      addToast({ type: 'error', message: 'Please log in to access cards' });
      router.push('/auth/login');
    }
  }, [user, router, addToast]);

  const handleViewDetails = useCallback(
    (cardId: string) => {
      router.push(`/dashboard/virtual-card/${cardId}`);
    },
    [router]
  );

  const handleFundSubmit = useCallback(
    async (cardId: string, amountInCents: number) => {
      return await fundCard(cardId, amountInCents);
    },
    [fundCard]
  );

  const handleWithdrawSubmit = useCallback(
    async (cardId: string, amountInCents: number) => {
      return await withdrawFromCard(cardId, amountInCents);
    },
    [withdrawFromCard]
  );

  if (!user) return null;

  const features = [
    {
      icon: Zap,
      title: 'Instant Creation',
      desc: 'Generate virtual cards in seconds, ready to use immediately.',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: Shield,
      title: 'Enhanced Security',
      desc: 'Protect your real card details with disposable virtual numbers.',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: Globe,
      title: 'Global Spending',
      desc: 'Use your USD virtual card anywhere VISA/Mastercard is accepted.',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: CreditCard,
      title: 'Full Control',
      desc: 'Manage funds, freeze, and monitor transactions in real-time.',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="space-y-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d71927] text-sm font-extrabold text-white">
                1
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Create & Manage Cards
                </p>
                <p className="text-xs text-gray-600">
                  Generate and manage your USD virtual cards.
                </p>
              </div>
            </div>

            <div className="hidden h-[2px] flex-1 bg-gray-200 sm:block" />

            <div className="flex items-center gap-3 opacity-60">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-extrabold text-gray-500">
                <CreditCard className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Fund & Use</p>
                <p className="text-xs text-gray-600">
                  Add funds and transact globally.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {/* USD Wallet Balance Summary */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d71927]">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">USD Wallet Balance</p>
                  <p className="text-xl font-black text-gray-900">
                    {usdWalletState.isLoading ? (
                      <span className="animate-pulse text-gray-400">...</span>
                    ) : (
                      formattedUsdBalance
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchUsdWallet}
                disabled={usdWalletState.isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-gray-600 ${usdWalletState.isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use your USD balance to fund virtual cards. Convert NGN to USD in the{' '}
              <a href="/dashboard/wallet" className="font-bold text-[#d71927] hover:text-[#b81420] underline">
                Wallet
              </a>
              .
            </p>
          </div>

          {/* Quick Stats */}
          {hasCards && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cards</p>
                <p className="text-xl font-black text-gray-900 mt-1">
                  {cardListState.pagination.total_records}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  {cardListState.cards.filter(c => c.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 col-span-2 sm:col-span-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Page</p>
                <p className="text-xl font-black text-gray-900 mt-1">
                  {cardListState.currentPage} / {cardListState.pagination.total_pages || 1}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {cardListState.error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">{cardListState.error}</p>
                <p className="text-xs text-red-700 mt-1">
                  Complete your profile and verify your account to access virtual cards.
                </p>
              </div>
            </div>
          )}

          {/* Create Card Form */}
          <CreateCardForm
            formData={createFormData}
            onFieldChange={updateCreateFormField}
            onSubmit={async () => {
              await createCard();
            }}
            errors={createFormErrors}
            isLoading={isCreatingCard || cardListState.isLoading}
            onSuccess={() => {}}
          />

          {/* Filters */}
          {hasCards && (
            <CardFilterSection
              onFiltersChange={applyFilters}
              onClear={clearFilters}
              isLoading={cardListState.isLoading}
            />
          )}

          {/* Cards List */}
          <CardList
            cards={cardListState.cards}
            pagination={cardListState.pagination}
            isLoading={cardListState.isLoading}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
            onViewDetails={handleViewDetails}
            onFund={(cardId, maskedPan) => openActionModal('fund', cardId, maskedPan)}
            onWithdraw={(cardId, maskedPan) => openActionModal('withdraw', cardId, maskedPan)}
          />
        </div>
      </Card>

      {/* Features Section (when no cards) */}
      {isEmpty && (
        <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">
              Why Virtual Cards?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Fund/Withdraw Modal */}
      <CardActionModal
        isOpen={actionModal.isOpen}
        action={actionModal.action}
        cardMaskedPan={actionModal.cardMaskedPan}
        onClose={closeActionModal}
        onSubmit={async (amountInCents) => {
          if (actionModal.action === 'fund' && actionModal.cardId) {
            return await fundCard(actionModal.cardId, amountInCents);
          } else if (actionModal.action === 'withdraw' && actionModal.cardId) {
            return await withdrawFromCard(actionModal.cardId, amountInCents);
          }
          return false;
        }}
        isLoading={isCreatingCard}
      />
    </div>
  );
}
