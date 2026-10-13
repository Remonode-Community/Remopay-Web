'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CreateCardFormData, CardBrand } from '@/types/card.types';
import { Plus, Loader, AlertCircle, CreditCard, Info } from 'lucide-react';
import { cardService } from '@/services/card.service';

interface CreateCardFormProps {
  formData: CreateCardFormData;
  onFieldChange: (field: keyof CreateCardFormData, value: any) => void;
  onSubmit: () => Promise<void>;
  errors: Record<string, string>;
  isLoading: boolean;
  onSuccess?: () => void;
}

interface FeeDisplay {
  our_fee: number;
  provider_fee: number;
  total_fee: number;
  display_name: string;
  description: string;
  currency: string;
}

export const CreateCardForm: React.FC<CreateCardFormProps> = ({
  formData,
  onFieldChange,
  onSubmit,
  errors,
  isLoading,
  onSuccess,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeSchedule, setFeeSchedule] = useState<FeeDisplay | null>(null);
  const [feeLoading, setFeeLoading] = useState(true);

  // Fetch issuance fee on mount
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const response = await cardService.getFeeSchedule();
        if (response?.data?.fee_schedule) {
          const issuanceFee = response.data.fee_schedule.find(
            (f: any) => f.fee_type === 'issuance'
          );
          if (issuanceFee) {
            const ourFee = parseFloat(String(issuanceFee.our_fee?.fixed_amount || 0));
            const providerFee = parseFloat(String(issuanceFee.provider_fee?.fixed_amount || 0));
            setFeeSchedule({
              our_fee: ourFee,
              provider_fee: providerFee,
              total_fee: ourFee + providerFee,
              display_name: issuanceFee.display_name,
              description: issuanceFee.description,
              currency: issuanceFee.currency || 'USD',
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch fee schedule:', err);
        // Fallback to defaults
        setFeeSchedule({
          our_fee: 0,
          provider_fee: 2,
          total_fee: 2,
          display_name: 'Card Issuance',
          description: 'One-time fee for issuing a new virtual card',
          currency: 'USD',
        });
      } finally {
        setFeeLoading(false);
      }
    };
    fetchFees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit();
      setIsExpanded(false);
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
const feeAmount = feeLoading ? '...' : `$${(feeSchedule?.total_fee || 0).toFixed(2)}`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden transition-all duration-300">
      {/* Header */}
      <button
        onClick={toggleExpanded}
        disabled={isLoading || isSubmitting}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50/50 disabled:opacity-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d71927] to-[#ff4444] shadow-lg shadow-red-200">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-gray-900">Create New Card</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Get a virtual USD card instantly
              {feeSchedule && ` (${feeAmount} fee applies)`}
            </p>
          </div>
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform duration-300 ${
          isExpanded ? 'border-[#d71927] bg-[#d71927] rotate-45' : 'border-gray-300'
        }`}>
          <Plus className={`h-4 w-4 transition-colors ${isExpanded ? 'text-white' : 'text-gray-500'}`} />
        </div>
      </button>

      {/* Form Content */}
      {isExpanded && (
        <>
          <div className="border-t border-gray-100" />
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Card Brand Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Card Brand</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(CardBrand).map((brand) => (
                  <label
                    key={brand}
                    className={`
                      relative flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${formData.brand === brand
                        ? brand === 'VISA'
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-orange-500 bg-orange-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="brand"
                      value={brand}
                      checked={formData.brand === brand}
                      onChange={(e) => onFieldChange('brand', e.target.value as CardBrand)}
                      disabled={isLoading || isSubmitting}
                      className="sr-only"
                    />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 p-1.5">
                      <Image
                        src={brand === 'VISA' ? '/visa.webp' : '/mastercard.svg'}
                        alt={brand}
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                    </div>
                    <div className="w-full min-w-0 sm:w-auto sm:flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{brand}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {brand === 'VISA' ? 'Global acceptance' : 'Widely accepted'}
                      </p>
                    </div>
                    {formData.brand === brand && (
                      <div className={`absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center ${
                        brand === 'VISA' ? 'bg-blue-500' : 'bg-orange-500'
                      }`}>
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.brand && (
                <div className="flex items-center gap-2 mt-2 text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{errors.brand}</span>
                </div>
              )}
            </div>

            {/* Funding Note */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Info className="h-3.5 w-3.5 flex-shrink-0" />
              Your card is created unfunded — you can add funds anytime after
              creation. Minimum $1 for funding.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#d71927] to-[#ff4444] px-6 py-3.5 text-sm font-bold text-white hover:shadow-lg hover:shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Creating Card...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Create Virtual Card
                </>
              )}
            </button>

            {/* Error Display */}
            {errors.general && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-900">{errors.general}</p>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
};
