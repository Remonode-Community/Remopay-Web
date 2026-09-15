'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';
import { NotificationsList } from '@/components/dashboard/NotificationsList';
import { Card } from '@/components/shared/Card';

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d71927]">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-950">Notifications</h1>
            <p className="text-sm text-gray-500">Manage and review all your notifications</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard/settings/notifications')}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          title="Notification settings"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {/* Notifications List */}
      <NotificationsList limit={20} />
    </div>
  );
}
