'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { adminService } from '@/services/admin.service';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({ virtual_accounts_enabled: true });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const handleToggleVirtualAccounts = async () => {
    try {
      setUpdating(true);
      const response = await adminService.toggleVirtualAccounts();
      if (response.data?.data) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to toggle:', error);
    } finally {
      setUpdating(false);
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
          <p className="text-sm text-gray-500">Manage global application settings</p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="mb-1 text-lg font-semibold">Virtual Accounts</h2>
        <p className="mb-4 text-sm text-gray-500">
          Control whether virtual account information is displayed to users across the platform.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
            Loading settings...
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div>
              <p className="font-medium">Show Virtual Accounts</p>
              <p className="text-sm text-gray-500">
                {settings.virtual_accounts_enabled
                  ? 'Virtual accounts are visible to all users'
                  : 'Virtual accounts are hidden from all users'}
              </p>
            </div>
            <button
              onClick={handleToggleVirtualAccounts}
              disabled={updating}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.virtual_accounts_enabled ? 'bg-red-600' : 'bg-gray-300'
              } ${updating ? 'opacity-50' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.virtual_accounts_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
