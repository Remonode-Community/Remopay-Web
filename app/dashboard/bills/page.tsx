'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bolt,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Toast } from '@/components/shared/Toast';
import { CardSkeleton } from '@/components/shared/SkeletonLoader';
import { useAlert } from '@/hooks/useAlert';
import { useApi } from '@/hooks/useApi';
import { vtuService } from '@/services/vtu.service';
import { VTUProvider } from '@/types/vtu.types';

type FormStep = 'provider' | 'payment-type' | 'meter';

interface ElectricityFormData {
  serviceID: string;
  billersCode: string;
  provider: string;
  providerID: string;
  meterNumber: string;
  customerName: string;
  customerAddress: string;
  meterType: string;
  serviceBand: string;
  canVend: string;
  minPurchaseAmount: string;
  customerArrears: string;
  paymentType: string;
  variationCode: string;
}

export default function BillsPage() {
  const router = useRouter();
  const { success, error: alertError } = useAlert();
  const { execute } = useApi();

  const [step, setStep] = useState<FormStep>('provider');
  const [providers, setProviders] = useState<VTUProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<VTUProvider | null>(
    null
  );
  const [paymentType, setPaymentType] = useState<'Prepaid' | 'Postpaid'>(
    'Prepaid'
  );
  const [meterNumber, setMeterNumber] = useState('');
  const [meterError, setMeterError] = useState('');
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [verifyingMeter, setVerifyingMeter] = useState(false);
  const [lastVerifyTime, setLastVerifyTime] = useState(0);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoadingProviders(true);
        const result = await vtuService.getElectricityProviders();

        if (Array.isArray(result) && result.length > 0) {
          setProviders(result);
          setSelectedProvider(result[0]);
        } else {
          alertError('Failed to load electricity providers');
        }
      } catch {
        alertError('Error loading electricity providers');
      } finally {
        setLoadingProviders(false);
      }
    };

    loadProviders();
  }, [alertError]);

  const handleBack = () => {
    setMeterError('');

    if (step === 'meter') {
      setStep('payment-type');
      return;
    }

    if (step === 'payment-type') {
      setStep('provider');
      return;
    }

    router.push('/dashboard');
  };

  const handleContinue = () => {
    setMeterError('');

    if (step === 'provider') {
      if (!selectedProvider) {
        setMeterError('Please select an electricity provider');
        return;
      }

      setStep('payment-type');
      return;
    }

    if (step === 'payment-type') {
      setStep('meter');
    }
  };

  const handleVerifyMeter = async () => {
    if (verifyingMeter) return;

    if (!meterNumber.trim()) {
      setMeterError('Please enter your meter number');
      return;
    }

    if (!selectedProvider) {
      setMeterError('Please select a provider first');
      return;
    }

    const now = Date.now();

    if (now - lastVerifyTime < 3000) {
      setMeterError('Please wait a moment before trying again');
      return;
    }

    setVerifyingMeter(true);
    setMeterError('');
    setLastVerifyTime(now);

    try {
      const response = await execute(
        vtuService.verifyMeterNumber(
          meterNumber.trim(),
          selectedProvider.serviceID
        )
      );

      if (response && response.code === '000' && response.content) {
        const content = response.content;
        const customerName = content.Customer_Name || 'Verified Customer';
        const customerAddress = content.Address || '';
        const meterType = content.Meter_Type || paymentType;
        const serviceBand = content.Service_Band || '';
        const canVend = content.Can_Vend || 'yes';
        const minPurchaseAmount = content.Min_Purchase_Amount || '0.0';
        const customerArrears = content.Customer_Arrears || '';

        const dataToStore: ElectricityFormData = {
          serviceID: selectedProvider.serviceID,
          billersCode: meterNumber.trim(),
          provider: selectedProvider.name,
          providerID: selectedProvider.serviceID,
          meterNumber: meterNumber.trim(),
          customerName,
          customerAddress,
          meterType,
          serviceBand,
          canVend,
          minPurchaseAmount,
          customerArrears,
          paymentType: meterType,
          variationCode: meterType.toLowerCase(),
        };

        sessionStorage.setItem(
          'electricityFormData',
          JSON.stringify(dataToStore)
        );

        success('Meter verified successfully!');
        router.push('/dashboard/bills/review');
        return;
      }

      if (response?.code === '012') {
        setMeterError(
          'Verification already in progress. Please wait a moment and try again.'
        );
        return;
      }

      if (response?.code === '015') {
        setMeterError('Invalid meter number for this provider');
        return;
      }

      setMeterError(
        response?.response_description ||
          response?.content?.errors ||
          'Meter verification failed'
      );
    } catch (err: any) {
      setMeterError(err?.message || 'Failed to verify meter number');
    } finally {
      setVerifyingMeter(false);
    }
  };

  if (loadingProviders) {
    return <CardSkeleton count={3} />;
  }

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="space-y-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      <Card className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="border-b border-[#EEF2F7] bg-white px-6 py-5 sm:px-8">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            {[
              ['provider', '1', 'Provider', 'Choose electricity company'],
              ['payment-type', '2', 'Type', 'Select prepaid or postpaid'],
              ['meter', '3', 'Meter', 'Verify meter number'],
              ['review', '4', 'Pay', 'Confirm payment'],
            ].map(([key, number, title, subtitle], index) => {
              const active =
                key === step ||
                (step === 'payment-type' && key === 'provider') ||
                (step === 'meter' &&
                  ['provider', 'payment-type', 'meter'].includes(key));

              return (
                <div key={key} className="flex flex-1 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                      active
                        ? 'bg-[#d71927] text-white'
                        : 'border border-[#CBD5E1] bg-white text-[#667085]'
                    }`}
                  >
                    {number}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#111827] sm:text-sm">{title}</p>
                    <p className="text-xs text-[#667085] line-clamp-1">{subtitle}</p>
                  </div>

                  {index < 3 && (
                    <div className="hidden h-[2px] flex-1 bg-[gray-200] lg:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            {step === 'provider' && (
              <div>
                <label className="mb-4 block text-sm font-bold text-[#111827]">
                  Select Electricity Provider
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {providers.map((provider) => {
                    const active =
                      selectedProvider?.serviceID === provider.serviceID;

                    return (
                      <button
                        key={provider.serviceID}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setMeterError('');
                        }}
                        className={`rounded-2xl border p-4 text-center transition-all ${
                          active
                            ? 'border-[#d71927]  shadow-[0_14px_30px_rgba(215,25,39,0.14)]'
                            : 'border-gray-200 bg-white hover:border-[#d71927] hover:bg-white'
                        }`}
                      >
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8FAFC]">
                          {provider.image ? (
                            <Image
                              src={provider.image}
                              alt={provider.name}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          ) : (
                            <Bolt className="text-[#d71927]" size={26} />
                          )}
                        </div>

                        <p className="text-sm font-extrabold text-[#111827]">
                          {provider.name}
                        </p>

                        <div
                          className={`mx-auto mt-3 h-1.5 w-8 rounded-full transition ${
                            active ? 'bg-[#d71927]' : 'bg-transparent'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {meterError && (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    {meterError}
                  </p>
                )}
              </div>
            )}

            {step === 'payment-type' && (
              <div>
                <label className="mb-4 block text-sm font-bold text-[#111827]">
                  Select Meter Type
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  {(['Prepaid', 'Postpaid'] as const).map((type) => {
                    const active = paymentType === type;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPaymentType(type)}
                        className={`rounded-[24px] border p-5 text-left transition-all ${
                          active
                            ? 'border-[#d71927]  shadow-[0_14px_30px_rgba(215,25,39,0.12)]'
                            : 'border-gray-200 bg-white hover:border-[#d71927]'
                        }`}
                      >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl  text-[#d71927]">
                          <Zap size={22} />
                        </div>

                        <p className="text-base font-extrabold text-[#111827]">
                          {type}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#667085]">
                          {type === 'Prepaid'
                            ? 'Buy electricity token for prepaid meter.'
                            : 'Pay outstanding electricity bill for postpaid meter.'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 'meter' && (
              <div>
                <label className="mb-4 block text-sm font-bold text-[#111827]">
                  Meter Number
                </label>

                <Input
                  type="text"
                  placeholder="Enter meter number"
                  value={meterNumber}
                  onChange={(event) => {
                    setMeterNumber(event.target.value.replace(/\D/g, ''));
                    setMeterError('');
                  }}
                  className="h-13 rounded-2xl border-gray-200 bg-white text-base focus:border-[#d71927]"
                />

                {meterError && (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    {meterError}
                  </p>
                )}

                <div className="mt-5 rounded-2xl border border-red-200  p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d71927]">
                    Verification Required
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">
                    We will verify the meter details before sending you to the
                    final payment screen.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={verifyingMeter}
                className="h-13 rounded-2xl font-bold sm:w-[160px]"
              >
                <ChevronLeft className="mr-2" size={18} />
                Back
              </Button>

              {step === 'meter' ? (
                <Button
                  fullWidth
                  onClick={handleVerifyMeter}
                  disabled={verifyingMeter || !meterNumber.trim()}
                  className="h-13 rounded-2xl bg-[#d71927] text-base font-bold text-white shadow-[0_14px_30px_rgba(215,25,39,0.24)] hover:bg-[#b81420] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifyingMeter ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Verifying Meter...
                    </span>
                  ) : (
                    <>
                      Verify & Continue
                      <ChevronRight className="ml-2" size={20} />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  fullWidth
                  onClick={handleContinue}
                  className="h-13 rounded-2xl bg-[#d71927] text-base font-bold text-white shadow-[0_14px_30px_rgba(215,25,39,0.24)] hover:bg-[#b81420]"
                >
                  Continue
                  <ChevronRight className="ml-2" size={20} />
                </Button>
              )}
            </div>
          </div>

          <aside className="rounded-[28px] border border-gray-200 bg-white p-5">
            <p className="text-sm font-bold text-[#111827]">
              Electricity Summary
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#98A2B3]">
                  Provider
                </p>
                <p className="mt-2 text-sm font-bold text-[#111827]">
                  {selectedProvider?.name || 'Not selected'}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#98A2B3]">
                  Meter Type
                </p>
                <p className="mt-2 text-sm font-bold text-[#111827]">
                  {paymentType}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#98A2B3]">
                  Meter Number
                </p>
                <p className="mt-2 text-sm font-bold text-[#111827]">
                  {meterNumber || 'Not entered'}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-red-200  p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d71927]">
                Secure Bills Flow
              </p>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                Provider, meter type, and customer verification are checked
                before final payment.
              </p>
            </div>
          </aside>
        </div>
      </Card>
      <Toast />
    </div>
  );
}

