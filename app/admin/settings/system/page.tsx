'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { adminService } from '@/services/admin.service';

interface ProviderToggle {
  key: string;
  label: string;
  description: string;
  settingKey: 'paystack_dva_enabled' | 'maplerad_virtual_accounts_enabled';
}

const providers: ProviderToggle[] = [
  {
    key: 'paystack',
    label: 'Paystack Dedicated Virtual Account',
    description: 'Show or hide Paystack DVA account info (bank name, account number) on user dashboards',
    settingKey: 'paystack_dva_enabled',
  },
  {
    key: 'maplerad',
    label: 'Maplerad Virtual Accounts',
    description: 'Show or hide Maplerad virtual account cards (NGN, USD) on user dashboards',
    settingKey: 'maplerad_virtual_accounts_enabled',
  },
];

const CURRENCY_LABELS: Record<string, string> = {
  NGN: 'Nigerian Naira',
  USD: 'US Dollar',
  USDT: 'Tether (USDT)',
  USDC: 'USD Coin (USDC)',
};

type Tab = 'providers' | 'currencies';

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('providers');
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [supportedCurrencies, setSupportedCurrencies] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currencyUpdating, setCurrencyUpdating] = useState<string | null>(null);
  const [expandedCurrencies, setExpandedCurrencies] = useState<Set<string>>(new Set());

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemSettings();
      const data = response?.data;
      if (data) {
        setSettings(data);
        if (data.supported_currencies) {
          setSupportedCurrencies(data.supported_currencies);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportedCurrencies = async () => {
    try {
      const response = await adminService.getSupportedCurrencies();
      const data = response?.data;
      if (data?.supported_currencies) {
        setSupportedCurrencies(data.supported_currencies);
      }
    } catch (error) {
      console.error('Failed to fetch supported currencies:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (provider: string) => {
    try {
      setUpdating(provider);
      const response = await adminService.toggleProvider(provider);
      const data = response?.data;
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleCurrencyToggle = async (currency: string) => {
    try {
      setCurrencyUpdating(currency);
      const updated = { ...supportedCurrencies, [currency]: !supportedCurrencies[currency] };
      const response = await adminService.updateSupportedCurrencies(updated);
      const data = response?.data;
      if (data?.supported_currencies) {
        setSupportedCurrencies(data.supported_currencies);
      }
    } catch (error) {
      console.error('Failed to toggle currency:', error);
    } finally {
      setCurrencyUpdating(null);
    }
  };

  const toggleCurrencyExpand = (currency: string) => {
    setExpandedCurrencies(prev => {
      const next = new Set(prev);
      if (next.has(currency)) {
        next.delete(currency);
      } else {
        next.add(currency);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-gray-500">Control which virtual account providers and currencies are available to users</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-white border border-gray-200 p-1">
        <button
          onClick={() => setActiveTab('providers')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'providers' ? 'bg-[#d71927] text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Virtual Account Providers
        </button>
        <button
          onClick={() => setActiveTab('currencies')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'currencies' ? 'bg-[#d71927] text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Supported Currencies
        </button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        These are <strong>global switches</strong>. When a provider or currency is disabled here, it is hidden from all users regardless of their individual settings. Per-user overrides are available on each user&apos;s detail page.
      </div>

      {activeTab === 'providers' && (
        <Card className="p-6">
          <h2 className="mb-1 text-lg font-semibold">Virtual Account Providers</h2>
          <p className="mb-4 text-sm text-gray-500">
            Toggle each provider independently. When disabled globally, users will not see that provider&apos;s virtual account information regardless of their individual settings.
          </p>
          <p className="mb-4 text-xs text-gray-400">
            Per-user overrides can be configured on individual user pages.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
              Loading settings...
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map((provider) => {
                const isEnabled = !!settings[provider.settingKey];
                const isUpdating = updating === provider.key;

                return (
                  <div
                    key={provider.key}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{provider.label}</p>
                      <p className="text-sm text-gray-500">{provider.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(provider.key)}
                      disabled={isUpdating}
                      className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                        isEnabled ? 'bg-[#d71927]' : 'bg-gray-300'
                      } ${isUpdating ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'currencies' && (
        <Card className="p-6">
          <h2 className="mb-1 text-lg font-semibold">Supported Currencies</h2>
          <p className="mb-4 text-sm text-gray-500">
            Enable or disable currencies for conversion. Only enabled currencies will be available for users to select in the conversion interface.
          </p>
          <p className="mb-4 text-xs text-gray-400">
            Disabled currencies will be hidden from all currency selectors and cannot be used for conversions.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
              Loading currencies...
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(supportedCurrencies).map(([currency, isEnabled]) => {
                const isUpdating = currencyUpdating === currency;
                const isExpanded = expandedCurrencies.has(currency);

                return (
                  <div
                    key={currency}
                    className="rounded-lg border border-gray-200 bg-white overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-semibold text-gray-900">{currency}</span>
                        <span className="text-sm text-gray-500">{CURRENCY_LABELS[currency] || currency}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCurrencyExpand(currency);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCurrencyToggle(currency);
                          }}
                          disabled={isUpdating}
                          className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                            isEnabled ? 'bg-[#d71927]' : 'bg-gray-300'
                          } ${isUpdating ? 'opacity-50' : ''}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Status: </span>
                            <span className={isEnabled ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Wallet: </span>
                            <span className="text-gray-700">
                              {currency === 'NGN' ? 'NGN Wallet (Naira)' : 'USD Wallet (Treasury)'}
                            </span>
                          </div>
                          <div className="sm:col-span-2 text-xs text-gray-500">
                            {isEnabled
                              ? 'This currency is available for conversion in the user dashboard.'
                              : 'This currency is hidden from all currency selectors and cannot be used for conversions.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
