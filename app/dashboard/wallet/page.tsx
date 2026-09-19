'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DollarSign,
  ArrowRightLeft,
  RefreshCw,
  Loader,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Toast } from '@/components/shared/Toast';
import { CardSkeleton } from '@/components/shared/SkeletonLoader';
import { useUsdWallet } from '@/hooks/useUsdWallet';
import { walletService } from '@/services/wallet.service';
import { fxService } from '@/services/fx.service';
import { CurrencySelector } from '@/components/dashboard/fx/CurrencySelector';
import type { Currency } from '@/types/fx.types';
import type { WalletCurrency } from '@/types/usd-wallet.types';
import type { ParsedUsdTransaction } from '@/types/usd-wallet.types';

function fmtAmount(v: number | null | undefined, currency: Currency): string {
  const n = Number(v ?? 0);
  const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency === 'NGN' ? `₦${formatted}` : `$${formatted}`;
}

function srcBalance(c: Currency, ngnBal: number, usdBal: number): number {
  return c === 'NGN' ? ngnBal : usdBal;
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function WalletPage() {
  const {
    usdWalletState, fetchUsdWallet,
    parsedTransactions,
    conversion, quoteExpiresIn, setConversionDirection,
    setConversionAmount, generateQuote, executeExchange, resetConversion,
  } = useUsdWallet();

  const [ngnBal, setNgnBal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enabledCurrencies, setEnabledCurrencies] = useState<Record<string, boolean>>({});

  const [sourceCurrency, setSourceCurrency] = useState<Currency>('NGN');
  const [targetCurrency, setTargetCurrency] = useState<Currency>('USD');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [ngnRes, currRes] = await Promise.all([
          walletService.getBalance(),
          fxService.getSupportedCurrencies(),
        ]);
        if (ngnRes.success && ngnRes.data) setNgnBal(ngnRes.data.balance);
        if (currRes?.success && currRes.data?.supported_currencies) {
          setEnabledCurrencies(currRes.data.supported_currencies);
        }
      } catch { /* */ }
      setLoading(false);
    };
    init();
  }, []);

  const refreshBalances = useCallback(async () => {
    try {
      const ngnRes = await walletService.getBalance();
      if (ngnRes.success && ngnRes.data) setNgnBal(ngnRes.data.balance);
    } catch { /* */ }
  }, []);

  const handleSourceChange = (c: Currency) => {
    setSourceCurrency(c);
    if (c === targetCurrency) setTargetCurrency(c === 'NGN' ? 'USD' : 'NGN');
    setAmount(''); setError(null); resetConversion(); setStep('input');
  };

  const handleTargetChange = (c: Currency) => {
    setTargetCurrency(c);
    if (c === sourceCurrency) setSourceCurrency(c === 'NGN' ? 'USD' : 'NGN');
    setAmount(''); setError(null); resetConversion(); setStep('input');
  };

  const handleSwap = () => {
    const prev = sourceCurrency;
    setSourceCurrency(targetCurrency);
    setTargetCurrency(prev);
    setAmount(''); setError(null); resetConversion(); setStep('input');
  };

  const handleGenerateQuote = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount'); return; }

    const bal = srcBalance(sourceCurrency, ngnBal, usdWalletState.balance);
    if (amt > bal) {
      setError(`Insufficient ${sourceCurrency} balance. Available: ${fmtAmount(bal, sourceCurrency)}`);
      return;
    }

    setError(null);
    setConversionDirection(sourceCurrency as WalletCurrency, targetCurrency as WalletCurrency);
    setConversionAmount(amount);
    setSubmitting(true);
    const quote = await generateQuote();
    setSubmitting(false);
    if (quote) { setStep('confirm'); } else { setError('Failed to generate quote. Please try again.'); }
  };

  const handleConfirmExchange = async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    setSubmitting(true);
    setError(null);
    const ok = await executeExchange();
    setSubmitting(false);
    submitRef.current = false;
    if (ok) {
      setStep('input'); setAmount(''); setError(null); resetConversion();
      refreshBalances(); fetchUsdWallet();
    } else {
      setError('Conversion failed. Please try again.');
    }
  };

  if (loading) return <CardSkeleton count={3} />;

  const isInput = step === 'input';
  const bal = srcBalance(sourceCurrency, ngnBal, usdWalletState.balance);
  const srcAmt = parseFloat(conversion.sourceAmount || '0');
  const tgtAmt = conversion.targetAmount ?? 0;
  const displaySend = fmtAmount(srcAmt, sourceCurrency);
  const displayReceive = fmtAmount(tgtAmt / 100, targetCurrency);
  const rate = conversion.exchangeRate
    ? `1 ${sourceCurrency} = ${fmtAmount(conversion.exchangeRate, targetCurrency)}`
    : '—';
  const usdActivities = parsedTransactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white ${isInput ? 'bg-[#d71927]' : 'bg-gray-300'}`}>1</div>
              <div>
                <p className={`text-sm font-bold ${isInput ? 'text-gray-900' : 'text-gray-400'}`}>Select Currencies & Amount</p>
                <p className="text-xs text-gray-500">Choose pair and enter amount.</p>
              </div>
            </div>
            <div className="hidden h-[2px] flex-1 bg-gray-200 sm:block" />
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white ${!isInput ? 'bg-[#d71927]' : 'bg-gray-300'}`}>2</div>
              <div>
                <p className={`text-sm font-bold ${!isInput ? 'text-gray-900' : 'text-gray-400'}`}>Confirm & Exchange</p>
                <p className="text-xs text-gray-500">Review quote and complete.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column content */}
        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1fr_320px]">
          {/* Left: Conversion Form */}
          <div className="space-y-5">
            {/* Currency selectors */}
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <CurrencySelector
                label="From"
                value={sourceCurrency}
                onChange={handleSourceChange}
                disabled={!isInput}
                excludedCurrency={targetCurrency}
                enabledCurrencies={enabledCurrencies}
              />
              <button
                onClick={handleSwap}
                disabled={!isInput}
                className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#d71927] hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end mb-0.5"
                aria-label="Swap currencies"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
              <CurrencySelector
                label="To"
                value={targetCurrency}
                onChange={handleTargetChange}
                disabled={!isInput}
                excludedCurrency={sourceCurrency}
                enabledCurrencies={enabledCurrencies}
              />
            </div>

            {/* Amount input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-900">Amount ({sourceCurrency})</label>
                <span className="text-xs text-gray-500">Balance: {fmtAmount(bal, sourceCurrency)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                  {sourceCurrency === 'NGN' ? '₦' : '$'}
                </span>
                <input
                  type="number"
                  step={sourceCurrency === 'NGN' ? '100' : '0.01'}
                  min="0"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(null); }}
                  disabled={!isInput}
                  placeholder={sourceCurrency === 'NGN' ? '100,000' : '50.00'}
                  className="w-full rounded-lg border border-gray-200 bg-white py-3.5 pl-10 pr-4 text-lg font-bold text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927] disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Quote received — show details */}
            {!isInput && (
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {/* Status bar */}
                <div className={`flex items-center gap-3 px-5 py-3.5 ${submitting ? 'bg-amber-50 border-b border-amber-100' : 'bg-green-50 border-b border-green-100'}`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${submitting ? 'bg-amber-100' : 'bg-green-100'}`}>
                    {submitting
                      ? <Loader className="h-4 w-4 text-amber-600 animate-spin" />
                      : <CheckCircle2 className="h-4 w-4 text-green-600" />
                    }
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${submitting ? 'text-amber-800' : 'text-green-800'}`}>
                      {submitting ? 'Processing exchange...' : 'Quote ready'}
                    </p>
                    <p className={`text-xs ${submitting ? 'text-amber-600' : 'text-green-600'}`}>
                      {submitting
                        ? 'Please wait while we complete your conversion'
                        : quoteExpiresIn !== null
                          ? `Expires in ${Math.floor(quoteExpiresIn / 60)}:${(quoteExpiresIn % 60).toString().padStart(2, '0')}`
                          : 'Confirm within 2 minutes'
                      }
                    </p>
                  </div>
                </div>

                {/* Conversion summary */}
                <div className="px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">You send</p>
                      <p className="text-lg font-extrabold text-gray-900">{displaySend}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{sourceCurrency}</p>
                    </div>
                    <div className="mx-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">You receive</p>
                      <p className="text-lg font-extrabold text-green-700">{displayReceive}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{targetCurrency}</p>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <span className="text-xs text-gray-500">Rate</span>
                    <span className="text-xs font-bold text-gray-900">{rate}</span>
                  </div>

                  {quoteExpiresIn !== null && !submitting && quoteExpiresIn < 60 && (
                    <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-100 px-4 py-3 mt-2">
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Expiring soon
                      </span>
                      <span className="text-xs font-bold text-red-600">
                        {Math.floor(quoteExpiresIn / 60)}:{(quoteExpiresIn % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {isInput ? (
              <button
                onClick={handleGenerateQuote}
                disabled={submitting || !amount || parseFloat(amount) <= 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d71927] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#b81420] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                {submitting ? 'Generating...' : 'Generate Quote'}
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep('input'); setAmount(''); setError(null); resetConversion(); }}
                  disabled={submitting}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmExchange}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71927] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#b81420] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {submitting ? 'Exchanging...' : 'Confirm & Exchange'}
                </button>
              </div>
            )}

            {/* USD Recent Activity */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                <button onClick={() => fetchUsdWallet()} disabled={usdWalletState.isLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
                  <RefreshCw className={`h-3.5 w-3.5 text-gray-600 ${usdWalletState.isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {usdActivities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                  <DollarSign className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-900">No activity yet</p>
                  <p className="text-xs text-gray-500 mt-1">Make a conversion to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {usdActivities.map((tx: ParsedUsdTransaction) => (
                    <div key={tx.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${tx.isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.isCredit ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{tx.typeLabel}</p>
                          <p className="text-xs text-gray-500">
                            {tx.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm font-extrabold flex-shrink-0 ml-3 ${tx.isCredit ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.isCredit ? '+' : '-'}{tx.amountFormatted}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Balances Sidebar */}
          <aside className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d71927]">
                  <span className="text-xs font-black text-white">₦</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">NGN Balance</p>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{fmtAmount(ngnBal, 'NGN')}</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">USD Balance</p>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{fmtAmount(usdWalletState.balance, 'USD')}</p>
              {usdWalletState.lastSyncedAt && (
                <p className="mt-1 text-[10px] text-gray-400">
                  Last synced: {new Date(usdWalletState.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>

            <button onClick={() => { refreshBalances(); fetchUsdWallet(); }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              <RefreshCw className="h-4 w-4" /> Refresh Balances
            </button>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Info</p>
              <p className="mt-2 text-xs leading-6 text-gray-600">
                Convert between currencies at live market rates. Rates are locked for 2 minutes once a quote is generated.
              </p>
            </div>
          </aside>
        </div>
      </Card>

      <Toast />
    </div>
  );
}