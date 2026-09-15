'use client';

import { useState, ReactNode, useCallback, useMemo, useRef, useEffect } from 'react';
import { X, RotateCcw, Check, Search, User } from 'lucide-react';
import { Button } from './Button';

export type FilterInputType = 'text' | 'select' | 'date' | 'checkbox' | 'number' | 'user-search';

export interface SearchResult {
  id: string | number;
  label: string;
  subtitle?: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: FilterInputType;
  placeholder?: string;
  defaultValue?: string | boolean;
  options?: Array<{ value: string | boolean; label: string }>;
  required?: boolean;
  helpText?: string;
  searchFn?: (query: string) => Promise<SearchResult[]>;
  renderResult?: (result: SearchResult) => ReactNode;
}

export interface FilterConfig {
  title: string;
  description?: string;
  fields: FilterField[];
  onApply: (values: Record<string, any>) => void;
  onReset?: () => void;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

interface FilterPanelProps extends FilterConfig {
  /**
   * Position of the panel: 'right' (default) or 'top'
   * 'right' for desktop, auto-switches to 'top' on mobile if mobilePosition is 'auto'
   */
  position?: 'right' | 'top';
  /** Mobile breakpoint - default 'md' (768px) */
  mobilePosition?: 'top' | 'right' | 'auto';
}

export function FilterPanel({
  title,
  description,
  fields,
  onApply,
  onReset,
  isOpen,
  onClose,
  isLoading = false,
  position = 'right',
  mobilePosition = 'auto',
}: FilterPanelProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach((field) => {
      initial[field.id] = field.defaultValue ?? '';
    });
    return initial;
  });

  const hasActiveFilters = useMemo(
    () => Object.values(values).some((val) => val !== '' && val !== false),
    [values]
  );

  const handleChange = useCallback(
    (fieldId: string, value: any) => {
      setValues((prev) => ({
        ...prev,
        [fieldId]: value,
      }));
    },
    []
  );

  const handleApply = useCallback(() => {
    onApply(values);
  }, [values, onApply]);

  const handleReset = useCallback(() => {
    const resetValues: Record<string, any> = {};
    fields.forEach((field) => {
      resetValues[field.id] = field.defaultValue ?? '';
    });
    setValues(resetValues);
    onReset?.();
  }, [fields, onReset]);

  if (!isOpen) return null;

  // Determine responsive position
  const isMobilePosition = mobilePosition === 'top' || (mobilePosition === 'auto');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Filter Panel - Right Slide (Desktop) */}
      {position === 'right' && (
        <div
          className={`fixed right-0 top-0 z-50 h-screen w-full max-w-md flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:max-w-md ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex-shrink-0 border-b border-black/5 bg-gradient-to-r from-[#d71927]/5 to-transparent px-6 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-black tracking-tight text-[#111]">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-sm leading-6 text-black/50">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 rounded-lg p-2 hover:bg-black/5 transition"
              >
                <X className="h-5 w-5 text-black/50" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {fields.map((field) => (
                <FilterField
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  onChange={(value) => handleChange(field.id, value)}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-black/5 bg-gray-50 px-6 py-4 space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleApply}
                isLoading={isLoading}
                disabled={isLoading}
                className="flex-1 h-11 rounded-xl bg-[#d71927] px-6 font-black text-white shadow-lg shadow-[#d71927]/20 hover:bg-[#b91521] disabled:opacity-50"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>

              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 h-11 rounded-xl border-black/10 px-6 font-black text-[#111] hover:bg-[#f8f8f8]"
              >
                Cancel
              </Button>
            </div>

            {hasActiveFilters && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full h-10 rounded-xl border-black/10 px-4 font-semibold text-[#d71927] hover:bg-[#fff1f2]"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filter Panel - Top Slide (Mobile) */}
      {position === 'top' && (
        <div
          className={`fixed left-0 right-0 top-0 z-50 max-h-[85vh] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          {/* Header */}
          <div className="flex-shrink-0 border-b border-black/5 bg-gradient-to-r from-[#d71927]/5 to-transparent px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-black tracking-tight text-[#111] sm:text-xl">
                  {title}
                </h2>
                {description && (
                  <p className="mt-1 text-xs leading-5 text-black/50 sm:text-sm">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 rounded-lg p-2 hover:bg-black/5 transition"
              >
                <X className="h-5 w-5 text-black/50" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="space-y-6">
              {fields.map((field) => (
                <FilterField
                  key={field.id}
                  field={field}
                  value={values[field.id]}
                  onChange={(value) => handleChange(field.id, value)}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-black/5 bg-gray-50 px-4 py-3 space-y-2 sm:px-6 sm:py-4 sm:space-y-3">
            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={handleApply}
                isLoading={isLoading}
                disabled={isLoading}
                className="flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl bg-[#d71927] px-4 sm:px-6 text-sm sm:text-base font-black text-white shadow-lg shadow-[#d71927]/20 hover:bg-[#b91521] disabled:opacity-50"
              >
                <Check className="h-3 h-4 sm:h-4 mr-2" />
                Apply
              </Button>

              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl border-black/10 px-4 sm:px-6 text-sm sm:text-base font-black text-[#111] hover:bg-[#f8f8f8]"
              >
                Cancel
              </Button>
            </div>

            {hasActiveFilters && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full h-9 sm:h-10 rounded-lg sm:rounded-xl border-black/10 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-[#d71927] hover:bg-[#fff1f2]"
              >
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Individual filter field renderer
 */
interface FilterFieldProps {
  field: FilterField;
  value: any;
  onChange: (value: any) => void;
}

function FilterField({ field, value, onChange }: FilterFieldProps) {
  switch (field.type) {
    case 'text':
    case 'number':
      return (
        <div>
          <label className="block text-sm font-black text-[#111] mb-2">
            {field.label}
            {field.required && <span className="text-[#d71927]">*</span>}
          </label>
          <input
            type={field.type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-sm text-[#111] outline-none transition placeholder:text-black/35 focus:border-[#d71927] focus:ring-4 focus:ring-[#d71927]/10"
          />
          {field.helpText && (
            <p className="mt-1 text-xs text-black/50">{field.helpText}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-black text-[#111] mb-2">
            {field.label}
            {field.required && <span className="text-[#d71927]">*</span>}
          </label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-sm text-[#111] outline-none transition focus:border-[#d71927] focus:ring-4 focus:ring-[#d71927]/10"
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {field.options?.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </option>
            ))}
          </select>
          {field.helpText && (
            <p className="mt-1 text-xs text-black/50">{field.helpText}</p>
          )}
        </div>
      );

    case 'date':
      return (
        <div>
          <label className="block text-sm font-black text-[#111] mb-2">
            {field.label}
            {field.required && <span className="text-[#d71927]">*</span>}
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-sm text-[#111] outline-none transition focus:border-[#d71927] focus:ring-4 focus:ring-[#d71927]/10"
          />
          {field.helpText && (
            <p className="mt-1 text-xs text-black/50">{field.helpText}</p>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-5 w-5 rounded border-2 border-black/10 accent-[#d71927] transition focus:ring-4 focus:ring-[#d71927]/10"
          />
          <div className="flex-1">
            <p className="font-semibold text-[#111]">{field.label}</p>
            {field.helpText && (
              <p className="text-xs text-black/50">{field.helpText}</p>
            )}
          </div>
        </label>
      );

    case 'user-search':
      return (
        <UserSearchField field={field} value={value} onChange={onChange} />
      );

    default:
      return null;
  }
}

function UserSearchField({ field, value, onChange }: FilterFieldProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(
    (q: string) => {
      if (!field.searchFn || q.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsLoading(true);
      setIsOpen(true);
      field.searchFn(q.trim()).then((items) => {
        setResults(items);
        setIsLoading(false);
      }).catch(() => {
        setResults([]);
        setIsLoading(false);
      });
    },
    [field.searchFn]
  );

  const handleQueryChange = useCallback(
    (val: string) => {
      setQuery(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(val), 300);
    },
    [doSearch]
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onChange(result.id);
      setSelectedLabel(result.label);
      setQuery('');
      setResults([]);
      setIsOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange('');
    setSelectedLabel('');
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div ref={containerRef}>
      <label className="block text-sm font-black text-[#111] mb-2">
        {field.label}
        {field.required && <span className="text-[#d71927]">*</span>}
      </label>

      {/* Selected value chip or search input */}
      {value ? (
        <div className="flex items-center gap-2 rounded-lg border-2 border-[#d71927]/20 bg-[#d71927]/5 px-3 py-2">
          <User className="h-4 w-4 text-[#d71927] shrink-0" />
          <span className="flex-1 text-sm font-medium text-[#111] truncate">{selectedLabel || `User #${value}`}</span>
          <button type="button" onClick={handleClear} className="ml-1 rounded p-0.5 hover:bg-black/5">
            <X className="h-3.5 w-3.5 text-black/40" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/35 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
              placeholder={field.placeholder || 'Type to search users...'}
              className="w-full rounded-lg border-2 border-black/10 bg-white pl-9 pr-3 py-2 text-sm text-[#111] outline-none transition placeholder:text-black/35 focus:border-[#d71927] focus:ring-4 focus:ring-[#d71927]/10"
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-black/10 bg-white shadow-lg">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-black/50">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d71927] border-t-transparent" />
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-black/50">No users found</div>
              ) : (
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f8f8f8] transition-colors border-b border-black/5 last:border-0"
                  >
                    <User className="h-4 w-4 text-black/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111] truncate">{r.label}</p>
                      {r.subtitle && (
                        <p className="text-xs text-black/50 truncate">{r.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {field.helpText && (
        <p className="mt-1 text-xs text-black/50">{field.helpText}</p>
      )}
    </div>
  );
}
