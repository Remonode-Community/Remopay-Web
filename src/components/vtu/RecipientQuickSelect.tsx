'use client';

import React from 'react';
import { Clock, TrendingUp, Star, Plus } from 'lucide-react';
import { VtuRecipient } from '@/types/api.types';

interface RecipientQuickSelectProps {
  favorites?: VtuRecipient[];
  recentlyUsed?: VtuRecipient[];
  frequentlyUsed?: VtuRecipient[];
  onSelect: (recipient: VtuRecipient) => void;
  onToggleFavorite?: (id: number) => void;
  onAddNew?: () => void;
  isLoading?: boolean;
}

export const RecipientQuickSelect: React.FC<RecipientQuickSelectProps> = ({
  favorites = [],
  recentlyUsed = [],
  frequentlyUsed = [],
  onSelect,
  onToggleFavorite,
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

  const displayFavorites = favorites.filter((r) => r.is_favorite).slice(0, 5);
  const displayRecent = recentlyUsed.slice(0, 3);
  const displayFrequent = frequentlyUsed.slice(0, 3);

  if (displayFavorites.length === 0 && displayRecent.length === 0 && displayFrequent.length === 0) {
    return null;
  }

  const RecipientChip: React.FC<{
    recipient: VtuRecipient;
    icon: React.ReactNode;
    showFavorite?: boolean;
  }> = ({ recipient, icon, showFavorite = false }) => (
    <button
      onClick={() => onSelect(recipient)}
      className="group flex flex-shrink-0 items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition-all hover:border-[#d71927]/30 hover:bg-[#fff8f8]"
      type="button"
      title={recipient.recipient_name || recipient.credential}
    >
      <div className="flex-shrink-0 text-gray-400 group-hover:text-[#d71927] transition">
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <p className="max-w-[140px] truncate text-sm font-semibold text-gray-900">
          {recipient.credential}
        </p>
        {recipient.recipient_name && (
          <p className="max-w-[140px] truncate text-xs text-gray-500">
            {recipient.recipient_name}
          </p>
        )}
      </div>
      {showFavorite && onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(recipient.id);
          }}
          className="ml-1 flex-shrink-0 p-0.5 text-amber-400 hover:text-amber-500 transition"
          type="button"
          title="Remove from favorites"
        >
          <Star className="h-3.5 w-3.5 fill-current" />
        </button>
      )}
    </button>
  );

  return (
    <div className="space-y-5 min-w-0">
      {/* Favorites */}
      {displayFavorites.length > 0 && (
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-400 fill-current" />
            <h3 className="text-sm font-bold text-gray-900">Favorites</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {displayFavorites.map((recipient) => (
              <RecipientChip
                key={recipient.id}
                recipient={recipient}
                icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                showFavorite
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Used */}
      {displayRecent.length > 0 && (
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Recently Used</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
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
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-bold text-gray-900">Frequently Used</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
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
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#d71927]/30 hover:bg-[#fff8f8] transition-all text-gray-600 hover:text-[#d71927] font-semibold"
          type="button"
        >
          <Plus className="h-5 w-5" />
          Add New Recipient
        </button>
      )}
    </div>
  );
};
