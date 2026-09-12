'use client';

import { useState } from 'react';
import { Globe, History } from 'lucide-react';
import { FxExchangeForm } from '@/components/dashboard/fx/FxExchangeForm';
import { FxHistoryList } from '@/components/dashboard/fx/FxHistoryList';
import { Card } from '@/components/shared/Card';
import { clsx } from 'clsx';

/**
 * FX (Foreign Exchange) Admin Page
 * Allows admins to exchange between NGN and USD with real-time rates
 */
export default function AdminFxPage() {
  const [activeTab, setActiveTab] = useState<'exchange' | 'history'>('exchange');

  const tabs = [
    { id: 'exchange', label: 'Exchange', icon: Globe },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      <Card className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d71927] text-sm font-extrabold text-white">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Currency Exchange
                </p>
                <p className="text-xs text-gray-600">
                  Exchange between NGN and USD at competitive rates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 px-6 py-4 sm:px-8">
          <div className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon as any;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'exchange' | 'history')}
                  className={clsx(
                    'flex items-center gap-2 px-0 py-2 font-semibold transition-colors border-b-2 -mb-4',
                    isActive
                      ? 'border-[#d71927] text-[#d71927]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Exchange Tab */}
          {activeTab === 'exchange' && (
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Supported Currencies</h3>
                  <p className="text-2xl font-black text-[#d71927]">NGN • USD</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Quote Validity</h3>
                  <p className="text-2xl font-black text-[#d71927]">30 Minutes</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Processing Time</h3>
                  <p className="text-2xl font-black text-[#d71927]">Instant</p>
                </div>
              </div>

              {/* Exchange Form */}
              <FxExchangeForm />

              {/* Information Section */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">How it works</h3>
                <ol className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#d71927] text-xs font-bold text-white">
                      1
                    </span>
                    <span>Enter the amount you want to exchange and select your currencies</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#d71927] text-xs font-bold text-white">
                      2
                    </span>
                    <span>Get a quote with the current exchange rate (valid for 30 minutes)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#d71927] text-xs font-bold text-white">
                      3
                    </span>
                    <span>Review the fees and confirm the exchange</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#d71927] text-xs font-bold text-white">
                      4
                    </span>
                    <span>Your funds are exchanged instantly and deposited to your account</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && <FxHistoryList />}
        </div>
      </Card>
    </div>
  );
}
