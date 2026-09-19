'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, AlertCircle, CheckCircle2, Clock, Loader2, Wallet } from 'lucide-react';
import { useFx } from '@/hooks/useFx';
import { useUIStore } from '@/store/ui.store';
import type { Currency } from '@/types/fx.types';
import { CurrencySelector } from './CurrencySelector';
import { fxService } from '@/services/fx.service';
import type { GenerateFxQuoteRequest } from '@/types/fx.types';

export function FxExchangeForm() {
  const { generateQuote, quote, quoteLoading, quoteError, quoteExpiresIn, clearQuote, executeExchange, exchangeLoading, exchangeError, transaction, clearTransaction } = useFx();
  const { addToast } = useUIStore();

  // Form state
  const [sourceCurrency, setSourceCurrency] = useState<Currency>('NGN');
  const [targetCurrency, setTargetCurrency] = useState<Currency>('USD');
  const [amount, setAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [supportedCurrencies, setSupportedCurrencies] = useState<Record<string, boolean>>({});
  const [balances, setBalances] = useState({ ngn: 0, usd: 0 });
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [validatingBalance, setValidatingBalance] = useState(false);

  // Fetch supported currencies from admin settings
  const fetchSupportedCurrencies = useCallback(async () => {
    try {
      const response = await fxService.getSupportedCurrencies?.();
      if (response?.success && response.data?.supported_currencies) {
        setSupportedCurrencies(response.data.supported_currencies);
      }
    } catch (error) {
      console.warn('Failed to fetch supported currencies, using defaults');
      setSupportedCurrencies({ NGN: true, USD: true, USDT: true, USDC: true });
    }
  }, []);

  // Fetch wallet balances
  const fetchBalances = useCallback(async () => {
    try {
      setBalanceLoading(true);
      // Try to get balances from the FX endpoint or wallet endpoint
      const response = await fxService.getWalletBalances?.();
      if (response?.success && response.data) {
        setBalances({
          ngn: response.data.ngn_balance || 0,
          usd: response.data.usd_balance || 0,
        });
      }
    } catch (error) {
      console.warn('Failed to fetch wallet balances');
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSupportedCurrencies();
    fetchBalances();
  }, [fetchSupportedCurrencies, fetchBalances]);

  // Format number for display
  const formatCurrency = (value: number, currency: Currency): string => {
    const divisor = currency === 'USD' || currency === 'USDT' || currency === 'USDC' ? 100 : 100;
    const displayValue = value / divisor;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayValue);
  };

  // Parse input amount to lowest denomination
  const parseAmount = (input: string): number => {
    const parsed = parseFloat(input) || 0;
    const multiplier = sourceCurrency === 'USD' || sourceCurrency === 'USDT' || sourceCurrency === 'USDC' ? 100 : 100;
    return Math.round(parsed * multiplier);
  };

  // Get source wallet balance
  const getSourceBalance = () => {
    if (sourceCurrency === 'NGN') return balances.ngn;
    return balances.usd;
  };

  // Validate wallet balance before generating quote
  const validateBalance = (amountInDenomination: number): boolean => {
    const sourceBalance = getSourceBalance();
    if (sourceBalance < amountInDenomination) {
      const currencyLabel = sourceCurrency === 'NGN' ? 'NGN' : 'USD';
      const available = formatCurrency(sourceBalance, sourceCurrency);
      const required = formatCurrency(amountInDenomination, sourceCurrency);
      addToast({
        type: 'error',
        message: `Insufficient ${currencyLabel} balance. Available: ${available}, Required: ${required}`,
      });
      return false;
    }
    return true;
  };

  // Handle currency swap
  const handleSwapCurrencies = () => {
    const temp = sourceCurrency;
    setSourceCurrency(targetCurrency);
    setTargetCurrency(temp);
    clearQuote();
    setAmount('');
  };

  // Handle generate quote with balance validation
  const handleGenerateQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      addToast({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    const amountInDenomination = parseAmount(amount);

    // Validate wallet balance BEFORE calling provider
    if (!validateBalance(amountInDenomination)) {
      return;
    }

    try {
      setValidatingBalance(true);
      
      const response = await generateQuote(sourceCurrency, targetCurrency, amountInDenomination);
      
      if (response) {
        addToast({ type: 'success', message: 'Quote generated successfully' });
      }
    } catch (error: any) {
      addToast({ type: 'error', message: error?.message || 'Failed to generate quote' });
    } finally {
      setValidatingBalance(false);
    }
  };

  // Handle execute exchange
  const handleExecuteExchange = async () => {
    if (!quote) return;
    const transaction = await executeExchange(quote.quote_reference);
    if (transaction) {
      setShowConfirmation(false);
      setAmount('');
      // Refresh balances after successful conversion
      fetchBalances();
    }
  };

  // Auto-close success modal
  useEffect(() => {
    if (transaction && exchangeLoading === false) {
      const timer = setTimeout(() => {
        clearTransaction();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [transaction, exchangeLoading, clearTransaction]);

  const sourceBalance = getSourceBalance();
  const formattedSourceBalance = formatCurrency(sourceBalance, sourceCurrency);
  const sourceWalletLabel = sourceCurrency === 'NGN' ? 'NGN Wallet' : 'USD Wallet';

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
        <h2 className="text-2xl font-black mb-6 text-gray-900">Exchange Currencies</h2>

        {/* Source Currency */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-semibold text-gray-900">From</label>
          
          {/* Currency Selector */}
          <CurrencySelector
            label=""
            value={sourceCurrency}
            onChange={(currency) => {
              setSourceCurrency(currency);
              clearQuote();
            }}
            disabled={quoteLoading || validatingBalance}
            excludedCurrency={targetCurrency}
            enabledCurrencies={supportedCurrencies}
          />

          {/* Amount Input with Balance Display */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">Amount ({sourceCurrency})</span>
              {sourceBalance > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Wallet className="h-3 w-3" />
                  <span>Balance: {formattedSourceBalance} {sourceCurrency}</span>
                </div>
              )}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                clearQuote();
              }}
              placeholder={sourceCurrency === 'NGN' ? '100,000' : '50.00'}
              step={sourceCurrency === 'NGN' ? '100' : '0.01'}
              min="0"
              disabled={quoteLoading || validatingBalance}
              className={`
                w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400
                transition-colors
                ${quoteLoading || validatingBalance
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 focus:outline-none focus:border-[#d71927] focus:ring-1 focus:ring-[#d71927]'
                }
              `}
              autoFocus
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleSwapCurrencies}
            disabled={quoteLoading || validatingBalance}
            className="p-3 rounded-full border border-gray-200 bg-white text-[#d71927] hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRightLeft size={20} />
          </button>
        </div>

        {/* Target Currency */}
        <div className="space-y-4 mb-8">
          <label className="block text-sm font-semibold text-gray-900">To</label>
          <CurrencySelector
            label=""
            value={targetCurrency}
            onChange={(currency) => {
              setTargetCurrency(currency);
              clearQuote();
            }}
            disabled={quoteLoading || validatingBalance}
            excludedCurrency={sourceCurrency}
            enabledCurrencies={supportedCurrencies}
          />

          <input
            type="text"
            value={quote ? formatCurrency(quote.converted_amount, targetCurrency) : '0.00'}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600"
          />
        </div>

        {/* Error Message */}
        {quoteError && (
          <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{quoteError}</p>
          </div>
        )}

        {/* Quote Details */}
        {quote && (
          <div className="mb-8 space-y-4 rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Exchange Rate</span>
              <span className="text-lg font-black text-[#d71927]">
                {quote.exchange_rate ? quote.exchange_rate.toFixed(6) : 'N/A'}
              </span>
            </div>

            {/* Quote Expiration */}
            {quoteExpiresIn !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock size={16} />
                  Quote expires in
                </span>
                <span className={`font-semibold ${quoteExpiresIn < 60 ? 'text-red-600' : 'text-[#d71927]'}`}>
                  {Math.floor(quoteExpiresIn / 60)}:{String(quoteExpiresIn % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!quote ? (
            <button
              onClick={handleGenerateQuote}
              disabled={quoteLoading || validatingBalance || !amount || parseFloat(amount) <= 0}
              className="w-full rounded-lg bg-[#d71927] px-6 py-3 font-semibold text-white transition hover:bg-[#b91420] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validatingBalance && <Loader2 className="h-4 w-4 animate-spin" />}
              {quoteLoading ? 'Generating Quote...' : 'Get Quote'}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={exchangeLoading}
                className="w-full rounded-lg bg-[#d71927] px-6 py-3 font-semibold text-white transition hover:bg-[#b91420] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Exchange
              </button>
              <button
                onClick={clearQuote}
                className="w-full rounded-lg border border-gray-200 px-6 py-3 font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                Change Amount
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && quote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 max-w-md w-full space-y-6">
            <h3 className="text-2xl font-black text-gray-900">Confirm Exchange</h3>

            {/* Transaction Details */}
            <div className="space-y-4 rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sending</span>
                <span className="font-semibold text-gray-900">
                  {quote.source_amount ? formatCurrency(quote.source_amount, quote.source_currency) : 'N/A'} {quote.source_currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Receiving</span>
                <span className="font-semibold text-gray-900">
                  {quote.converted_amount ? formatCurrency(quote.converted_amount, quote.target_currency) : 'N/A'} {quote.target_currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rate</span>
                <span className="font-semibold text-[#d71927]">{quote.exchange_rate ? quote.exchange_rate.toFixed(6) : 'N/A'}</span>
              </div>
            </div>

            {/* Error */}
            {exchangeError && (
              <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{exchangeError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={exchangeLoading}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-3 font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteExchange}
                disabled={exchangeLoading}
                className="flex-1 rounded-lg bg-[#d71927] px-4 py-3 font-semibold text-white transition hover:bg-[#b91420] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exchangeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {exchangeLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {transaction && !exchangeLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-green-200 bg-white p-6 lg:p-8 max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle2 size={64} className="text-green-600" />
            </div>

            <h3 className="text-2xl font-black text-gray-900">Exchange Complete!</h3>

            <div className="space-y-2 text-sm text-gray-600">
              <p>Transaction Reference:</p>
              <p className="font-mono text-[#d71927] font-semibold break-all">{transaction.transaction_reference}</p>
            </div>

            <p className="text-sm text-gray-600">
              Redirecting to history in a moment...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}