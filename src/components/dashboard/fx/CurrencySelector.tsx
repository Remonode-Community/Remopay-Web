'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { Currency } from '@/types/fx.types';

export interface CurrencyOption {
  code: Currency;
  name: string;
  symbol: string;
  walletType: 'ngn' | 'usd';
}

export const ALL_CURRENCIES: CurrencyOption[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '\u20A6', walletType: 'ngn' },
  { code: 'USD', name: 'US Dollar', symbol: '$', walletType: 'usd' },
  { code: 'USDT', name: 'Tether', symbol: '$', walletType: 'usd' },
  { code: 'USDC', name: 'USD Coin', symbol: '$', walletType: 'usd' },
];

const BADGE: Record<string, string> = {
  ngn: 'bg-[#d71927]',
  usd: 'bg-gray-800',
};

function meta(code: Currency): CurrencyOption {
  return (
    ALL_CURRENCIES.find((c) => c.code === code) ?? {
      code,
      name: code,
      symbol: code === 'NGN' ? '\u20A6' : '$',
      walletType: code === 'NGN' ? 'ngn' : 'usd',
    }
  );
}

/* ═══════════════════════════════════════════════════════════════
   CurrencySelector — trigger button + inline dropdown
   ═══════════════════════════════════════════════════════════════ */

interface CurrencySelectorProps {
  label?: string;
  value: Currency;
  onChange: (currency: Currency) => void;
  disabled?: boolean;
  excludedCurrency?: Currency;
  enabledCurrencies?: Record<string, boolean>;
  className?: string;
}

export function CurrencySelector({
  label,
  value,
  onChange,
  disabled = false,
  excludedCurrency,
  enabledCurrencies = {},
  className = '',
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const m = meta(value);
  const badge = BADGE[m.walletType] ?? 'bg-gray-800';

  const options = ALL_CURRENCIES.filter((c) => {
    if (enabledCurrencies[c.code] === false) return false;
    if (excludedCurrency && c.code === excludedCurrency) return false;
    return true;
  });

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-2.5 rounded-lg border bg-white px-3.5 py-2.5 text-left transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'border-gray-200 text-gray-900 hover:border-gray-300 focus:outline-none focus:border-[#d71927] focus:ring-1 focus:ring-[#d71927]'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white ${badge}`}
          >
            {m.code}
          </div>
          <span className="text-sm font-semibold">{m.code}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <ul className="py-1" role="listbox">
            {options.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm text-gray-400">
                No currencies available
              </li>
            ) : (
              options.map((c) => {
                const selected = c.code === value;
                const cBadge = BADGE[c.walletType] ?? 'bg-gray-800';
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c.code);
                        setOpen(false);
                      }}
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${
                        selected
                          ? 'bg-red-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold text-white ${cBadge}`}
                      >
                        {c.code}
                      </div>
                      <span
                        className={`text-sm font-semibold flex-1 ${
                          selected ? 'text-[#d71927]' : 'text-gray-900'
                        }`}
                      >
                        {c.code}
                      </span>
                      {selected && (
                        <Check className="h-4 w-4 text-[#d71927] flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
