'use client';

import { ArrowLeft, Settings, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/shared/Card';

const settingsSections = [
  {
    title: 'System Settings',
    description: 'Global application settings including feature visibility',
    href: '/admin/settings/system',
    icon: Settings,
  },
  {
    title: 'Transfer Providers',
    description: 'Configure bank transfer providers and thresholds',
    href: '/admin/settings/transfer-provider',
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500">Manage application configuration</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="p-6 transition-colors hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-red-50 p-3">
                  <section.icon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-semibold">{section.title}</h2>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
