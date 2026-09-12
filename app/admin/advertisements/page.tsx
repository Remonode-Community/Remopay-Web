'use client';

import React, { useState } from 'react';
import { AdvertisementList } from '@/components/admin/AdvertisementList';
import { AdvertisementForm } from '@/components/admin/AdvertisementForm';
import { AdvertisementAnalyticsDashboard } from '@/components/admin/AdvertisementAnalyticsDashboard';
import { AdvertisementAdmin } from '@/types/api.types';

export default function AdvertisementsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<AdvertisementAdmin | undefined>();
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');

  const handleCreate = () => {
    setEditingAd(undefined);
    setShowForm(true);
  };

  const handleEdit = (ad: AdvertisementAdmin) => {
    setEditingAd(ad);
    setShowForm(true);
  };

  const handleDelete = () => {
    setEditingAd(undefined);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAd(undefined);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingAd(undefined);
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(215,25,39,0.12),transparent_32%),#f8f8f8] p-6 text-slate-950">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advertisements</h1>
        <p className="text-gray-600 mt-2">
          Create, manage, and track dynamic advertisements displayed to users
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Advertisements
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'list' && (
          <AdvertisementList
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'analytics' && (
          <AdvertisementAnalyticsDashboard />
        )}
      </div>

      {/* Advertisement Form Modal */}
      {showForm && (
        <AdvertisementForm
          ad={editingAd}
          onClose={handleCloseForm}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
}
