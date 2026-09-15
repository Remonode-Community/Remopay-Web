'use client';

import React, { useEffect } from 'react';
import { Settings, Bell, Mail, Zap, Check } from 'lucide-react';
import { NotificationPreferences } from '@/components/dashboard/NotificationPreferences';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/shared/Card';

export default function NotificationSettingsPage() {
  const { preferences, fetchPreferences } = useNotifications();

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d71927]">
          <Settings className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-950">Notification Settings</h1>
          <p className="text-sm text-gray-500">Customize how and when you receive notifications</p>
        </div>
      </div>

      {/* Status Cards */}
      {preferences && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overall Status</p>
                <p className="mt-1.5 text-2xl font-black text-gray-950">
                  {preferences.enabled ? 'Active' : 'Paused'}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${preferences.enabled ? 'bg-green-50' : 'bg-gray-100'}`}>
                {preferences.enabled ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Bell className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Push Notifications</p>
                <p className="mt-1.5 text-2xl font-black text-gray-950">
                  {preferences.push_notifications ? 'On' : 'Off'}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${preferences.push_notifications ? 'bg-green-50' : 'bg-gray-100'}`}>
                <Zap className={`h-5 w-5 ${preferences.push_notifications ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Notifications</p>
                <p className="mt-1.5 text-2xl font-black text-gray-950">
                  {preferences.email_notifications ? 'On' : 'Off'}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${preferences.email_notifications ? 'bg-green-50' : 'bg-gray-100'}`}>
                <Mail className={`h-5 w-5 ${preferences.email_notifications ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Preferences Form */}
      <NotificationPreferences />
    </div>
  );
}
