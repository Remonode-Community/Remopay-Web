'use client';

import React from 'react';
import { Clock, TrendingUp, Plus } from 'lucide-react';
import { VtuRecipient } from '@/types/api.types';

interface RecipientQuickSelectProps {
  recentlyUsed?: VtuRecipient[];
  frequentlyUsed?: VtuRecipient[];
  onSelect: (recipient: VtuRecipient) => void;
  onAddNew?: () => void;
  isLoading?: boolean;
}

export const RecipientQuickSelect: React.FC<RecipientQuickSelectProps> = ({
  recentlyUsed = [],
  frequentlyUsed = [],
  onSelect,
  onAddNew,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const displayRecent = recentlyUsed.slice(0, 3);
  const displayFrequent = frequentlyUsed.slice(0, 3);

  if (displayRecent.length === 0 && displayFrequent.length === 0) {
    return null;
  }

  const RecipientChip: React.FC<{ recipient: VtuRecipient; icon: React.ReactNode }> = ({
    recipient,
    icon,
  }) => (
    <button
      onClick={() => onSelect(recipient)}
      className="group flex flex-shrink-0 items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition-all hover:border-blue-500 hover:bg-blue-50"
      type="button"
      title={recipient.recipient_name || recipient.credential}
    >
      <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-500 transition">
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <p className="max-w-[140px] truncate text-sm font-medium text-gray-900">
          {recipient.credential}
        </p>
        {recipient.recipient_name && (
          <p className="max-w-[140px] truncate text-xs text-gray-500">
            {recipient.recipient_name}
          </p>
        )}
      </div>
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Recently Used */}
      {displayRecent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Recently Used</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {displayRecent.map((recipient) => (
              <RecipientChip
                key={recipient.id}
                recipient={recipient}
                icon={<Clock className="h-4 w-4" />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Frequently Used */}
      {displayFrequent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">Frequently Used</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {displayFrequent.map((recipient) => (
              <RecipientChip
                key={recipient.id}
                recipient={recipient}
                icon={<TrendingUp className="h-4 w-4" />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add New Button */}
      {onAddNew && (
        <button
          onClick={onAddNew}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-600 font-medium"
          type="button"
        >
          <Plus className="h-5 w-5" />
          Add New Recipient
        </button>
      )}
    </div>
  );
};
