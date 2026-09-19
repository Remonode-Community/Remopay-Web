'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowRightLeft,
  Loader,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import type { ConversionState, WalletCurrency } from '@/types/usd-wallet.types';

// ─── Props ────────────────────────────────────────────────────────────
interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversion: ConversionState;
  quoteExpiresIn: number | null;
  quoteLoading?: boolean;
  exchangeLoading?: boolean;
  direction: 'ngn-to-usd' | 'usd-to-ngn';
  onSetDirection: (source: WalletCurrency, target: WalletCurrency) => void;
  onSetAmount: (amount: string) => void;
  onGenerateQuote: () => Promise<any>;
  onExecuteExchange: () => Promise<boolean>;
  ngnBalance?: number;
  usdBalance?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────
function fmt(seconds: number | null): string {
  if (seconds === null) return '2:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────
export const ConversionModal: React.FC<ConversionModalProps> = ({
  isOpen,
  onClose,
  conversion,
  quoteExpiresIn,
  quoteLoading = false,
  exchangeLoading = false,
  direction,
  onSetDirection,
  onSetAmount,
  onGenerateQuote,
  onExecuteExchange,
  ngnBalance = 0,
  usdBalance = 0,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset error when conversion step changes
  useEffect(() => { setError(null); }, [conversion.step]);

  if (!isOpen) return null;

  const isNgnToUsd = direction === 'ngn-to-usd';
  const src = isNgnToUsd ? 'NGN' : 'USD';
  const tgt = isNgnToUsd ? 'USD' : 'NGN';
  const srcSym = isNgnToUsd ? '₦' : '$';
  const tgtSym = isNgnToUsd ? '$' : '₦';

  const srcBal = isNgnToUsd ? ngnBalance : usdBalance;
  const srcBalFmt = isNgnToUsd
    ? `₦${(ngnBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : `$${(usdBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // ── Handlers ────────────────────────────────────────────────────
  const toggle = () => {
    if (isNgnToUsd) onSetDirection('USD', 'NGN');
    else onSetDirection('NGN', 'USD');
    setError(null);
  };

  const handleGen = async () => {
    setError(null);
    const amt = parseFloat(conversion.sourceAmount);
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount'); return; }
    
    // Validate wallet balance before generating quote
    const sourceBalance = isNgnToUsd ? ngnBalance : usdBalance;
    const amountInDenomination = isNgnToUsd ? Math.round(amt * 100) : Math.round(amt * 100);
    
    if (sourceBalance < amountInDenomination) {
      const currencyLabel = isNgnToUsd ? 'NGN' : 'USD';
      const available = isNgnToUsd 
        ? `₦${(ngnBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : `$${(usdBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      const required = isNgnToUsd
        ? `₦${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      setError(`Insufficient ${currencyLabel} balance. Available: ${available}, Required: ${required}`);
      return;
    }
    
    await onGenerateQuote();
  };

  const handleExec = async () => {
    setError(null);
    setSubmitting(true);
    const ok = await onExecuteExchange();
    setSubmitting(false);
    if (!ok) setError('Conversion failed. Please try again.');
  };

  const close = () => {
    if (!submitting && !exchangeLoading) { setError(null); onClose(); }
  };

  // ── Input step ──────────────────────────────────────────────────
  const InputStep = () => (
    <div className="space-y-5">
      {/* Direction toggle */}
      <button
        type="button"
        onClick={toggle}
        disabled={quoteLoading}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gray-50 px-4 py-3.5 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
<span className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black text-white ${isNgnToUsd ? 'bg-[#d71927]' : 'bg-gray-800'}`}>
              {src}
            </span>
            {src}
          </span>
          <ArrowRightLeft className="h-4 w-4 text-gray-400" />
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black text-white ${isNgnToUsd ? 'bg-gray-800' : 'bg-[#d71927]'}`}>
              {tgt}
            </span>
            {tgt}
          </span>
      </button>

      {/* Balance */}
      <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold text-gray-700">
          {src} Balance: {srcBalFmt}
        </p>
      </div>

      {/* Amount */}
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-900">
          Amount ({src})
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
            {srcSym}
          </span>
          <input
            type="number"
            step={isNgnToUsd ? '100' : '0.01'}
            min="0"
            value={conversion.sourceAmount}
            onChange={(e) => { onSetAmount(e.target.value); setError(null); }}
            disabled={quoteLoading}
            placeholder={isNgnToUsd ? '100,000' : '50.00'}
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-lg font-bold text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-red-100 disabled:bg-gray-50 transition-colors"
            autoFocus
          />
        </div>
        {isNgnToUsd && (
          <p className="text-xs text-gray-500 mt-2">Amount in Naira (e.g. 100000 for ₦100,000)</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Generate */}
      <button
        type="button"
        onClick={handleGen}
        disabled={quoteLoading || !conversion.sourceAmount}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d71927] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#b81420] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-red-200"
      >
        {quoteLoading ? (
          <><Loader className="h-4 w-4 animate-spin" /> Generating Quote...</>
        ) : (
          <><ArrowRightLeft className="h-4 w-4" /> Generate Quote</>
        )}
      </button>
    </div>
  );

  // ── Confirm step ────────────────────────────────────────────────
  const ConfirmStep = () => {
    const tgtAmt = conversion.targetAmount ?? 0;
    const srcAmt = parseFloat(conversion.sourceAmount || '0');

    const displaySend = isNgnToUsd
      ? `₦${(srcAmt * 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : `$${srcAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const displayReceive = isNgnToUsd
      ? `$${(tgtAmt / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : `₦${(tgtAmt / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const rate = conversion.exchangeRate
      ? `1 USD = ₦${conversion.exchangeRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : '—';

    const isExpiring = (quoteExpiresIn ?? 120) < 30;

    return (
      <div className="space-y-5">
        {/* Success pill */}
        <div className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">Quote Generated</p>
            <p className="text-xs text-green-600">
              Rate locked for {quoteExpiresIn !== null ? fmt(quoteExpiresIn) : '2:00'}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">You send</span>
            <span className="text-sm font-bold text-gray-900">{displaySend}</span>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">You receive</span>
            <span className="text-xl font-black text-green-700">{displayReceive}</span>
          </div>
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">Exchange rate</span>
            <span className="text-sm font-bold text-gray-900">{rate}</span>
          </div>
          {quoteExpiresIn !== null && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Expires in
              </span>
              <span className={`text-sm font-bold ${isExpiring ? 'text-red-600' : 'text-gray-900'}`}>
                {fmt(quoteExpiresIn)}
              </span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { onSetAmount(''); setError(null); }}
            disabled={submitting || exchangeLoading}
            className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExec}
            disabled={submitting || exchangeLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#d71927] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#b81420] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-red-200"
          >
            {submitting || exchangeLoading ? (
              <><Loader className="h-4 w-4 animate-spin" /> Exchanging...</>
            ) : (
              <><ChevronRight className="h-4 w-4" /> Confirm & Exchange</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ── Processing step ─────────────────────────────────────────────
  const ProcessingStep = () => (
    <div className="flex flex-col items-center gap-4 py-12">
      <Loader className="h-12 w-12 animate-spin text-[#d71927]" />
      <p className="text-lg font-bold text-gray-900">Processing Exchange</p>
      <p className="text-sm text-gray-500">Please wait while we process your conversion...</p>
    </div>
  );

  const content = () => {
    switch (conversion.step) {
      case 'confirm': return <ConfirmStep />;
      case 'processing': return <ProcessingStep />;
      default: return <InputStep />;
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      <div className="relative w-full max-w-md animate-in zoom-in-95">
        {/* Modal card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#d71927] to-[#b81420] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <ArrowRightLeft className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isNgnToUsd ? 'Convert NGN to USD' : 'Convert USD to NGN'}
                  </h3>
                  <p className="text-xs text-white/70">
                    {isNgnToUsd ? 'Exchange Naira for Dollars' : 'Exchange Dollars for Naira'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                disabled={submitting || exchangeLoading}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">{content()}</div>
        </div>
      </div>
    </div>
  );
};
