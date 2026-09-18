'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
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

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemSettings();
      if (response.data?.data) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (provider: string) => {
    try {
      setUpdating(provider);
      const response = await adminService.toggleProvider(provider);
      if (response.data?.data) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-gray-500">Control which virtual account providers are visible to users</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        These are <strong>global switches</strong>. When a provider is disabled here, it is hidden from all users regardless of their individual settings. Per-user overrides are available on each user&apos;s detail page.
      </div>

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
              const isEnabled = settings[provider.settingKey] ?? true;
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
    </div>
  );
}
