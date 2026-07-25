'use client';

import { useState, useRef, useEffect } from 'react';
import { Bank } from '@/types/transfer.types';
import { ChevronDown, Search } from 'lucide-react';

interface BankSelectorProps {
  banks: Bank[];
  selectedBank: Bank | null;
  onSelect: (bank: Bank) => void;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
}

export const BankSelector = ({
  banks,
  selectedBank,
  onSelect,
  disabled = false,
  isLoading = false,
  error,
}: BankSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = banks.filter(b =>
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>

      {/* TRIGGER */}
      <button
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled || isLoading}
        className={`
          w-full px-4 py-3 rounded-lg text-left
          border transition
          bg-white/5
          ${error ? 'border-red-500' : 'border-white/10'}
          hover:border-white/20
          disabled:opacity-50
        `}
      >
        <div className="flex justify-between items-center">
          <span className={selectedBank ? 'text-white' : 'text-white/50'}>
            {isLoading
              ? 'Loading banks...'
              : selectedBank?.name || 'Select bank'}
          </span>

          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#121212] shadow-xl overflow-hidden">

          {/* SEARCH */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search bank..."
                className="
                  w-full pl-9 pr-3 py-2
                  text-sm text-white
                  bg-white/5 border border-white/10
                  rounded-lg
                  focus:outline-none focus:border-[#d71927]
                "
              />
            </div>
          </div>

          {/* LIST */}
          <div className="max-h-64 overflow-auto">
            {filtered.length ? (
              filtered.map(bank => (
                <button
                  key={bank.code}
                  onClick={() => {
                    onSelect(bank);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`
                    w-full px-4 py-3 text-left text-sm
                    border-b border-white/5
                    hover:bg-white/5 transition
                    ${selectedBank?.code === bank.code
                      ? 'text-[#d71927] bg-[#d71927]/10'
                      : 'text-white/80'}
                  `}
                >
                  <p className="font-medium">{bank.name}</p>
                  <p className="text-xs text-white/40">
                    Code: {bank.code}
                  </p>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-white/40 text-sm">
                No matching banks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};