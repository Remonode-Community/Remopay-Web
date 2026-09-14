'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Trash2,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Star,
} from 'lucide-react';
import { VtuRecipient } from '@/types/api.types';
import { useVtuRecipients } from '@/hooks/useVtuRecipients';

interface RecipientManagerProps {
  isOpen: boolean;
  onClose: () => void;
  transactionType?: string;
  serviceIdentifier?: string;
}

export const RecipientManager: React.FC<RecipientManagerProps> = ({
  isOpen,
  onClose,
  transactionType,
  serviceIdentifier,
}) => {
  const {
    recipients,
    isLoading,
    error,
    pagination,
    fetchRecipients,
    deleteRecipient,
    updateRecipient,
    toggleFavorite,
  } = useVtuRecipients();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRecipients({
        transaction_type: transactionType,
        service_identifier: serviceIdentifier,
        search: searchTerm,
      });
    }
  }, [isOpen, transactionType, serviceIdentifier, searchTerm, fetchRecipients]);

  const handleEdit = (recipient: VtuRecipient) => {
    setEditingId(recipient.id);
    setEditName(recipient.recipient_name || '');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;

    await updateRecipient(id, {
      recipient_name: editName,
    });

    setEditingId(null);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async (id: number) => {
    await deleteRecipient(id);
    setDeleteConfirmId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Saved Recipients</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your saved VTU recipients
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            type="button"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No recipients saved yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Recipients will appear here after your first transaction
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition group"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {editingId === recipient.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Enter name"
                          className="flex-1 px-3 py-1 border border-[#d71927] rounded bg-[#fff8f8] text-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          {recipient.is_favorite && (
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-current flex-shrink-0" />
                          )}
                          <p className="font-semibold text-gray-900">
                            {recipient.credential}
                          </p>
                          {recipient.is_active && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      {recipient.recipient_name && (
                        <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                          {recipient.recipient_name}
                        </span>
                      )}
                      <span className="text-xs">
                        Used {recipient.usage_count} times
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {deleteConfirmId === recipient.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmDelete(recipient.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                          type="button"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition"
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : editingId === recipient.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(recipient.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                          type="button"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition"
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleFavorite(recipient.id)}
                          className={`p-2 rounded transition ${
                            recipient.is_favorite
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-gray-400 hover:text-amber-500'
                          }`}
                          type="button"
                          title={recipient.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star className={`h-4 w-4 ${recipient.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleEdit(recipient)}
                          className="p-2 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded transition opacity-0 group-hover:opacity-100"
                          type="button"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(recipient.id)}
                          className="p-2 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded transition opacity-0 group-hover:opacity-100"
                          type="button"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {recipients.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 text-sm text-gray-600">
            Showing {recipients.length} of {pagination.total} recipients
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
