'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings } from 'lucide-react';
import { VtuRecipient, RecipientSearchSuggestion } from '@/types/api.types';
import { useVtuRecipients } from '@/hooks/useVtuRecipients';
import { RecipientInput } from './RecipientInput';
import { RecipientQuickSelect } from './RecipientQuickSelect';
import { RecipientManager } from './RecipientManager';

interface RecipientSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onRecipientSelect?: (recipient: VtuRecipient | RecipientSearchSuggestion) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  transactionType?: 'airtime' | 'data' | 'electricity' | 'betting' | 'cable_tv';
  serviceIdentifier?: string;
  showQuickSelect?: boolean;
  showManager?: boolean;
  credentialType?: 'phone' | 'meter' | 'card';
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  value,
  onChange,
  onRecipientSelect,
  label = 'Recipient',
  placeholder = 'Enter phone number or select from saved',
  error,
  disabled = false,
  transactionType,
  serviceIdentifier,
  showQuickSelect = true,
  showManager = true,
  credentialType = 'phone',
}) => {
  const {
    recentlyUsed,
    frequentlyUsed,
    favorites,
    suggestions,
    isSearching,
    isLoading: isLoadingRecipients,
    fetchRecentlyUsed,
    fetchFrequentlyUsed,
    fetchFavorites,
    searchRecipients,
    recordUsage,
    toggleFavorite,
  } = useVtuRecipients();

  const [showManagerModal, setShowManagerModal] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);

  // Load recent, frequent, and favorite recipients on mount
  useEffect(() => {
    if (showQuickSelect) {
      fetchRecentlyUsed(5, transactionType, serviceIdentifier);
      fetchFrequentlyUsed(3, transactionType, serviceIdentifier);
      fetchFavorites(5);
    }
  }, [showQuickSelect, transactionType, serviceIdentifier, fetchRecentlyUsed, fetchFrequentlyUsed, fetchFavorites]);

  const handleSearch = useCallback(
    (searchValue: string) => {
      searchRecipients(searchValue, transactionType, serviceIdentifier);
    },
    [searchRecipients, transactionType, serviceIdentifier]
  );

  const handleSelectRecipient = useCallback(
    (recipient: VtuRecipient | RecipientSearchSuggestion) => {
      onChange(recipient.credential);
      setSelectedRecipientId(recipient.id);

      // Record usage for existing recipients
      if ('usage_count' in recipient) {
        recordUsage(recipient.id);
      }

      // Call callback if provided
      if (onRecipientSelect) {
        onRecipientSelect(recipient);
      }
    },
    [onChange, recordUsage, onRecipientSelect]
  );

  const handleQuickSelectRecipient = useCallback(
    (recipient: VtuRecipient) => {
      handleSelectRecipient(recipient);
    },
    [handleSelectRecipient]
  );

  return (
    <div className="space-y-4">
      {/* Main Input */}
      <RecipientInput
        value={value}
        onChange={onChange}
        onSelect={handleSelectRecipient}
        suggestions={suggestions}
        recentlyUsed={recentlyUsed}
        onSearch={handleSearch}
        isSearching={isSearching}
        placeholder={placeholder}
        label={label}
        error={error}
        disabled={disabled}
        credentialType={credentialType}
      />

      {/* Quick Select Section */}
      {showQuickSelect && value.length === 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Your Recipients</h3>
            {showManager && (
              <button
                onClick={() => setShowManagerModal(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition"
                type="button"
              >
                <Settings className="h-4 w-4" />
                Manage
              </button>
            )}
          </div>

          <RecipientQuickSelect
            favorites={favorites}
            recentlyUsed={recentlyUsed}
            frequentlyUsed={frequentlyUsed}
            onSelect={handleQuickSelectRecipient}
            onToggleFavorite={toggleFavorite}
            onAddNew={
              showManager ? () => setShowManagerModal(true) : undefined
            }
            isLoading={isLoadingRecipients}
          />
        </div>
      )}

      {/* Manager Modal */}
      {showManager && (
        <RecipientManager
          isOpen={showManagerModal}
          onClose={() => setShowManagerModal(false)}
          transactionType={transactionType}
          serviceIdentifier={serviceIdentifier}
        />
      )}
    </div>
  );
};
