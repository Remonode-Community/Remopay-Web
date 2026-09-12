'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { Loader2, AlertCircle } from 'lucide-react';
import { vtuService } from '@/services/vtu.service';
import type { VTUVariation } from '@/types/vtu.types';

// ─── Types ───────────────────────────────────────────────────────────

interface NetworkData {
  id: string;
  name: string;
  serviceId: string;
  logo: string;
  loading: boolean;
  error: string | null;
  variations: VTUVariation[];
}

// ─── Constants ───────────────────────────────────────────────────────

const NETWORKS: Omit<NetworkData, 'loading' | 'error' | 'variations'>[] = [
  {
    id: 'mtn',
    name: 'MTN',
    serviceId: 'mtn-data',
    logo: 'https://vtpass.com/resources/products/200X200/MTN-Data.jpg',
  },
  {
    id: 'airtel',
    name: 'Airtel',
    serviceId: 'airtel-data',
    logo: 'https://vtpass.com/resources/products/200X200/Airtel-Data.jpg',
  },
  {
    id: 'glo',
    name: 'Glo',
    serviceId: 'glo-data',
    logo: 'https://vtpass.com/resources/products/200X200/GLO-Data.jpg',
  },
  {
    id: '9mobile',
    name: '9mobile',
    serviceId: '9mobile-sme-data',
    logo: 'https://vtpass.com/resources/products/200X200/9mobile-SME-Data.jpg',
  },
];

const INITIAL_NETWORKS: NetworkData[] = NETWORKS.map((n) => ({
  ...n,
  loading: false,
  error: null,
  variations: [],
}));

// ─── Helpers ─────────────────────────────────────────────────────────

function extractValidity(name: string): string {
  const parenMatch = name.match(/\((\d+)\s*(Day|Days|Week|Weeks|Month|Year)\)/i);
  if (parenMatch) return `${parenMatch[1]} ${parenMatch[2]}`;

  const named = name.match(/(\d+)\s*(Day|Days|Week|Weeks|Monthly|Yearly)/i);
  if (named) {
    const v = named[2].toLowerCase();
    if (v === 'daily' || v === 'day') return '1 Day';
    if (v === 'weekly' || v === 'week') return '7 Days';
    if (v === 'monthly') return '30 Days';
    if (v === 'yearly') return '1 Year';
    return `${named[1]} ${named[2]}`;
  }

  return '—';
}

function formatPrice(variation: VTUVariation): {
  display: string;
  displayAmount: number;
  original: number | null;
} {
  const variationAmount = Number(variation.variation_amount || 0);
  const hasSubsidy = variation.subsidized?.enabled === true;

  const displayPrice = hasSubsidy
    ? Number(variation.subsidized!.subsidized_amount)
    : variationAmount;

  return {
    display: `₦${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    displayAmount: displayPrice,
    original: hasSubsidy ? variationAmount : null,
  };
}

// ─── Single Network Column ───────────────────────────────────────────

function NetworkColumn({ network }: { network: NetworkData }) {
  const variations = network.variations.slice(0, 12);

  if (network.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <p className="mt-3 text-sm font-medium text-gray-500">Loading...</p>
      </div>
    );
  }

  if (network.error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-5 w-5 text-gray-400" />
        <p className="mt-2 text-xs text-gray-500">{network.error}</p>
      </div>
    );
  }

  if (variations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-5 w-5 text-gray-400" />
        <p className="mt-2 text-xs text-gray-500">No plans</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {variations.map((variation) => {
        const price = formatPrice(variation);
        return (
          <div key={variation.variation_code} className="px-3 py-3">
            <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">
              {variation.name}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                {price.display}
              </span>
              {price.original && (
                <span className="text-[10px] text-gray-400 line-through whitespace-nowrap">
                  ₦{price.original.toLocaleString()}.00
                </span>
              )}
            </div>
            {price.original && variation.subsidized?.savings && variation.subsidized.savings > 0 && (
              <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                Save ₦{variation.subsidized.savings.toLocaleString()}
              </span>
            )}
            <p className="mt-0.5 text-[10px] text-gray-400">
              {extractValidity(variation.name)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export function DataPricingShowcase() {
  const [activeTab, setActiveTab] = useState('mtn');
  const [networks, setNetworks] = useState<NetworkData[]>(INITIAL_NETWORKS);

  const fetchVariations = useCallback(async (network: NetworkData) => {
    setNetworks((prev) =>
      prev.map((n) =>
        n.id === network.id ? { ...n, loading: true, error: null } : n,
      ),
    );

    try {
      const data = await vtuService.getVariations(network.serviceId);
      const variations = data?.variations ?? [];
      setNetworks((prev) =>
        prev.map((n) =>
          n.id === network.id ? { ...n, loading: false, variations } : n,
        ),
      );
    } catch {
      setNetworks((prev) =>
        prev.map((n) =>
          n.id === network.id
            ? { ...n, loading: false, error: 'Failed to load plans' }
            : n,
        ),
      );
    }
  }, []);

  useEffect(() => {
    networks.forEach((network) => fetchVariations(network));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentNetwork = networks.find((n) => n.id === activeTab) ?? networks[0];
  const activeVariations = currentNetwork.variations.slice(0, 12);
  const isLoading = currentNetwork.loading;
  const hasError = currentNetwork.error;

  return (
    <section className="bg-white px-5 py-16 sm:py-20 md:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Data Pricing
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-sm leading-6 text-gray-600">
            Affordable data plans across all major networks. See the latest
            prices and buy instantly.
          </p>
        </div>

        {/* Mobile: Tabs + Single Network View */}
        <div className="lg:hidden">
          {/* Network Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {networks.map((network) => {
              const isActive = activeTab === network.id;
              return (
                <button
                  key={network.id}
                  onClick={() => setActiveTab(network.id)}
                  className={clsx(
                    'inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all',
                    isActive
                      ? 'border-[#d71927] bg-[#d71927] text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900',
                  )}
                >
                  <div className="relative h-5 w-5 overflow-hidden rounded">
                    <Image
                      src={network.logo}
                      alt={network.name}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  {network.name}
                </button>
              );
            })}
          </div>

          {/* Mobile Content Card */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <Image
                    src={currentNetwork.logo}
                    alt={currentNetwork.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {currentNetwork.name} Data Plans
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isLoading
                      ? 'Loading...'
                      : `${activeVariations.length} of ${currentNetwork.variations.length} plans`}
                  </p>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-500">Loading plans...</p>
              </div>
            )}

            {!isLoading && hasError && (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-6 w-6 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">{hasError}</p>
                <button
                  onClick={() => fetchVariations(currentNetwork)}
                  className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !hasError && activeVariations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-6 w-6 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No plans available</p>
              </div>
            )}

            {!isLoading && !hasError && activeVariations.length > 0 && (
              <div className="divide-y divide-gray-100">
                {activeVariations.map((variation) => {
                  const price = formatPrice(variation);
                  return (
                    <div key={variation.variation_code} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                            {variation.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {extractValidity(variation.name)}
                          </p>
                          {price.original && variation.subsidized?.savings && variation.subsidized.savings > 0 && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              Save ₦{variation.subsidized.savings.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-gray-900">{price.display}</p>
                          {price.original && (
                            <p className="mt-0.5 text-xs text-gray-400 line-through">
                              ₦{price.original.toLocaleString()}.00
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && !hasError && activeVariations.length > 0 && (
              <div className="border-t border-gray-100 px-5 py-4">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                  <p className="text-xs text-gray-500">Prices update in real-time.</p>
                  <a
                    href="/auth/register"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#d71927] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b91420]"
                  >
                    Buy {currentNetwork.name} Data
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: All 4 Networks Side by Side */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-5">
          {networks.map((network) => {
            const planCount = network.variations.length;
            return (
              <div
                key={network.id}
                className="group rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col"
              >
                {/* Column Header */}
                <div className="border-b border-gray-100 px-4 py-3.5 bg-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-7 w-7 overflow-hidden rounded-lg border border-gray-200 bg-white p-0.5">
                      <Image
                        src={network.logo}
                        alt={network.name}
                        width={28}
                        height={28}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{network.name}</h3>
                      <p className="text-[10px] text-gray-500">
                        {network.loading ? 'Loading...' : `${planCount} plans`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto max-h-[480px] group-scroll-hidden">
                  <NetworkColumn network={network} />
                </div>

                {/* Column Footer */}
                {!network.loading && !network.error && planCount > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <a
                      href="/auth/register"
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#d71927] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#b91420]"
                    >
                      Buy {network.name} Data
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
