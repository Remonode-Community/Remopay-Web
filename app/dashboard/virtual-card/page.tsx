'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCards } from '@/hooks/useCards';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useUsdWallet } from '@/hooks/useUsdWallet';
import { isTierOneOrAbove } from '@/utils/tier.utils';
import {
  CardList,
  CreateCardForm,
  CardFilterSection,
  CardActionModal,
} from '@/components/dashboard/card';
import { LockedServiceView } from '@/components/dashboard/UpgradeRequiredCard';
import { Card } from '@/components/shared/Card';
import {
  CreditCard,
  Shield,
  Globe,
  Wallet,
  Calendar,
  ArrowLeftRight,
  AlertTriangle,
  Timer,
  AlertCircle,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

export default function VirtualCardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { usdWalletState, formattedUsdBalance, fetchUsdWallet } = useUsdWallet();

  const upgraded = isTierOneOrAbove(user?.mapleradCustomer?.tier);

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

  const steps = [
    {
      step: 1,
      icon: Shield,
      title: 'Verify Your Account',
      desc: 'Complete KYC and upgrade to Tier 1 (Bronze) to unlock virtual card creation.',
    },
    {
      step: 2,
      icon: Wallet,
      title: 'Fund Your Wallet',
      desc: 'Convert NGN to USD in the Wallet — your balance covers the one-time card issuance fee.',
    },
    {
      step: 3,
      icon: CreditCard,
      title: 'Create Your Card',
      desc: 'Pick VISA or Mastercard and generate your virtual USD card in seconds.',
    },
    {
      step: 4,
      icon: Globe,
      title: 'Fund & Use It',
      desc: 'Add funds from $1 and spend anywhere VISA/Mastercard is accepted worldwide.',
    },
  ];

  const cardTerms = [
    {
      icon: Globe,
      label: 'Acceptance',
      value: 'Visa & Mastercard',
      desc: 'USD virtual cards that work on all platforms worldwide.',
    },
    {
      icon: Calendar,
      label: 'Validity Period',
      value: '3 Years',
      desc: 'Each card is valid for 3 years from the date of issuance.',
    },
    {
      icon: ArrowLeftRight,
      label: 'Per Transaction Limit',
      value: '$10,000',
      desc: 'Maximum amount allowed on a single transaction.',
    },
    {
      icon: Wallet,
      label: 'Card Balance Limit',
      value: '$100,000',
      desc: 'Maximum balance a card can hold at any time.',
    },
    {
      icon: AlertTriangle,
      label: 'Successive Declines',
      value: '3 Strikes',
      desc: 'Cards are terminated after 3 successive declines.',
    },
    {
      icon: Timer,
      label: 'Funding Window',
      value: '3 Weeks',
      desc: 'Cards are terminated if not funded within 3 weeks.',
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
              <Link
                href="/dashboard/wallet"
                className="font-bold text-[#d71927] hover:text-[#b81420] underline"
              >
                Wallet
              </Link>
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
          <LockedServiceView locked={!upgraded} service="virtual cards">
            <CreateCardForm
              formData={createFormData}
              onFieldChange={updateCreateFormField}
              onSubmit={async () => {
                if (!upgraded) return;
                await createCard();
              }}
              errors={createFormErrors}
              isLoading={isCreatingCard || cardListState.isLoading}
              onSuccess={() => {}}
            />
          </LockedServiceView>

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

      {/* Steps Section (when no cards) */}
      {isEmpty && (
        <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-3">
              <h2 className="text-2xl font-black text-gray-900">
                How to Get Your Virtual Card
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Four simple steps from sign-up to spending worldwide.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="relative rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#d71927] text-sm font-extrabold text-white">
                        {step.step}
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                        <Icon className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    {idx < steps.length - 1 && (
                      <div className="absolute -right-2.5 top-1/2 hidden h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 lg:flex">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Card Terms & Limits */}
      <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d71927]">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Card Terms & Limits</p>
              <p className="text-xs text-gray-600">
                Key rules to keep your virtual card active.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 sm:p-8">
          {cardTerms.map((term, idx) => {
            const Icon = term.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                    <Icon className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {term.label}
                  </p>
                </div>
                <p className="text-xl font-black text-gray-900 mb-1">{term.value}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{term.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

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
