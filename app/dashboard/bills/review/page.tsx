'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Bolt,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  Lock,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Toast } from '@/components/shared/Toast';
import { PINVerificationModal } from '@/components/shared/PINVerificationModal';
import { useAlert } from '@/hooks/useAlert';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { paymentService } from '@/services/payment.service';
import { formatCurrency } from '@/utils/format.utils';

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

type PaymentMethod = 'wallet' | 'card' | 'bank_transfer';
type TransactionStatus = 'idle' | 'processing' | 'success' | 'error';

export default function ElectricityReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { pinStatus } = useAuthStore();
  const { success, error: alertError } = useAlert();
  const { execute } = useApi();

  const [formData, setFormData] = useState<ElectricityFormData | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [email, setEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('wallet');
  const [showPINModal, setShowPINModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionStatus>('idle');
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [balanceInfo, setBalanceInfo] = useState<{
    requiredAmount: number;
    currentBalance: number;
    shortfall: number;
  } | null>(null);

  // Check if user has PIN set
  const hasPIN = !!(pinStatus?.has_pin);

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('electricityFormData')
        : null;

    if (!stored) {
      router.push('/dashboard/bills');
      return;
    }

    try {
      setFormData(JSON.parse(stored) as ElectricityFormData);
    } catch {
      router.push('/dashboard/bills');
    }
  }, [router]);

  const amountValue = useMemo(() => Number(amount || 0), [amount]);

  const isValidAmount = (): boolean => {
    return amountValue >= 100 && amountValue <= 10000000;
  };

  const isValidPhone = (): boolean => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && /^0[789]\d{9}$/.test(digits)) return true;
    if (digits.length === 13 && /^234[789]\d{9}$/.test(digits)) return true;
    return false;
  };

  const normalizePhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('234') && digits.length >= 13) {
      return '0' + digits.slice(3);
    }
    return digits;
  };

  const isValidEmail = (): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handlePhoneChange = (value: string) => {
    let nextPhone = value.replace(/[^\d+\-\s()]/g, '').slice(0, 15);

    setPhone(nextPhone);
  };

  const handlePayment = () => {
    if (!amount.trim()) {
      alertError('Please enter an amount');
      return;
    }

    if (!isValidAmount()) {
      alertError('Amount must be between ₦100 and ₦10,000,000');
      return;
    }

    if (!isValidPhone()) {
      alertError('Please enter a valid Nigerian phone number');
      return;
    }

    if (!isValidEmail()) {
      alertError('Please enter a valid email address');
      return;
    }

    setShowPINModal(true);
  };

  const handlePINConfirm = async (pin: string) => {
    if (!formData || !user) {
      alertError('Form data missing');
      setShowPINModal(false);
      return;
    }

    setIsProcessing(true);
    setInsufficientBalance(false);
    setTransactionStatus('processing');

    try {
      // Process electricity transaction with PIN included
      console.log('[BillsReview] Processing electricity transaction with PIN...');

      const paymentPayload = {
        serviceID: formData.serviceID,
        phone: normalizePhone(phone),
        amount: amountValue,
        billersCode: formData.billersCode,
        variation_code: formData.variationCode,
        user_id: user.id,
        user_email: email,
        payment_method: paymentMethod,
        pin, // Include PIN directly with request
      };

      const response = await paymentService.payBill(paymentPayload as any);
      console.log('[BillsReview] Transaction response:', response);

      const responseData = response as any;

      // Handle success
      if (responseData?.success && (responseData?.status === 'success' || responseData?.status === 'completed')) {
        success('Electricity bill payment successful!');
        setTransactionStatus('success');
        setShowPINModal(false);
        sessionStorage.removeItem('electricityFormData');

        setTimeout(() => {
          router.push('/dashboard/history');
        }, 2500);

        return;
      }

      // Handle failure (success: false with error message)
      if (responseData?.success === false) {
        const errorMsg = responseData?.error || responseData?.message || 'Payment failed';

        // Check for insufficient balance
        if (
          responseData?.error_code === 'INSUFFICIENT_USER_BALANCE' ||
          /insufficient/i.test(errorMsg)
        ) {
          const required = amountValue;
          const current = responseData?.current_balance || 0;
          const shortfall = required - current;

          setInsufficientBalance(true);
          setBalanceInfo({
            requiredAmount: required,
            currentBalance: current,
            shortfall: Math.max(0, shortfall),
          });
          setTransactionStatus('error');
          setShowPINModal(false);
          return;
        }

        setTransactionStatus('error');
        alertError(errorMsg);
        setErrorMessage(errorMsg);
        setShowPINModal(false);
        return;
      }
    } catch (error: any) {
      console.error('[BillsReview] Error:', error);
      setShowPINModal(false);
      setTransactionStatus('error');

      // Check if there's an originalMessage from backend (idempotency errors)
      if (error.originalMessage) {
        setErrorMessage(error.originalMessage);
        alertError(error.originalMessage);
        return;
      }

      // Handle PIN verification errors
      if (error.code === 'INVALID_PIN') {
        const remaining = error.data?.remaining_attempts;
        const pinErrorMsg = remaining === 0
          ? 'Your PIN is now locked for 30 minutes due to too many failed attempts.'
          : `Invalid PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`;
        setErrorMessage(pinErrorMsg);
        alertError(pinErrorMsg);
        return;
      }

      if (error.code === 'PIN_LOCKED') {
        const lockMsg = `Your PIN is temporarily locked. Try again in ${Math.ceil(
          error.data?.remaining_seconds / 60
        )} minutes.`;
        setErrorMessage(lockMsg);
        alertError(lockMsg);
        return;
      }

      if (error.code === 'PIN_NOT_SET') {
        setErrorMessage('Please set your PIN in settings before making payments.');
        alertError('Please set your PIN in settings before making payments.');
        return;
      }

      const errorMsg = error.message || 'Transaction failed. Please try again.';
      setErrorMessage(errorMsg);
      alertError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!formData) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50">
            <Loader2 className="animate-spin text-[#d71927]" size={28} />
          </div>
          <p className="text-sm font-bold text-[#111827]">Loading review...</p>
          <p className="mt-1 text-xs text-[#667085]">
            Preparing your electricity payment summary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="space-y-8"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="border-b border-[#EEF2F7] bg-white px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-500 bg-white text-sm font-extrabold text-green-500">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Meter Verified
                    </p>
                    <p className="text-xs text-[#667085]">
                      {formData.provider}
                    </p>
                  </div>
                </div>

                <div className="hidden h-[2px] flex-1 bg-[#d71927] sm:block" />

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d71927] text-sm font-extrabold text-white">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Confirm & Pay
                    </p>
                    <p className="text-xs text-[#667085]">
                      Enter amount and pay.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-[#111827]">
                Confirm & Pay
              </h2>
              <p className="mt-1 text-sm text-[#667085]">
                Enter payment details to complete your electricity purchase.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Input
                  label="Amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  error={
                    amount && !isValidAmount()
                      ? 'Amount must be between ₦100 and ₦10,000,000'
                      : undefined
                  }
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="080 1234 5678"
                  value={phone}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  error={
                    phone && !isValidPhone()
                      ? 'Enter a valid Nigerian phone number'
                      : undefined
                  }
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={
                    email && !isValidEmail()
                      ? 'Enter a valid email address'
                      : undefined
                  }
                />
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-[#EEF2F7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#111827]">
                    Total Amount
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#667085]">
                    This amount will be deducted from your selected payment
                    method.
                  </p>
                </div>

                <p className="text-3xl font-extrabold tracking-tight text-[#d71927]">
                  {formatCurrency(amountValue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#111827]">
              Payment Method
            </h2>

            <div className="mt-6 space-y-4">
              {[
                {
                  value: 'wallet',
                  label: 'Remopay',
                  description:
                    'Recommended. Fastest option for secure checkout.',
                  icon: Wallet,
                  disabled: false,
                },
                {
                  value: 'card',
                  label: 'Card / Bank Payment',
                  description:
                    'Additional payment options will be available soon.',
                  icon: CreditCard,
                  disabled: true,
                },
              ].map((method) => {
                const Icon = method.icon;
                const active = paymentMethod === method.value;

                return (
                  <button
                    key={method.value}
                    type="button"
                    disabled={method.disabled || isProcessing}
                    onClick={() =>
                      !method.disabled &&
                      setPaymentMethod(method.value as PaymentMethod)
                    }
                    className={`flex w-full items-start justify-between rounded-[24px] border p-5 text-left transition-all ${
                      method.disabled
                        ? 'cursor-not-allowed border-gray-200 bg-[#F8FAFC] opacity-60'
                        : active
                          ? 'border-[#d71927] bg-white'
                          : 'border-gray-200 bg-white hover:border-[#d71927]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-2xl p-3 ${
                          active ? 'bg-[#d71927]' : 'bg-gray-100'
                        }`}
                      >
                        <Icon
                          className={active ? 'text-white' : 'text-[#d71927]'}
                          size={22}
                        />
                      </div>

                      <div>
                        <p className="text-base font-extrabold text-[#111827]">
                          {method.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#667085]">
                          {method.description}
                        </p>

                        {method.disabled && (
                          <span className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-[#667085]">
                            Coming soon
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        active
                          ? 'border-[#d71927] bg-[#d71927]'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {active && <CheckCircle2 className="text-white" size={14} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <aside>
          <Card className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] xl:sticky xl:top-8">
            <h3 className="text-xl font-extrabold tracking-tight text-[#111827]">
              Order Summary
            </h3>

            <div className="mt-5 space-y-4 border-b border-[#EEF2F7] pb-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#667085]">Provider</span>
                <span className="font-bold text-[#111827]">
                  {formData.provider}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#667085]">Meter Type</span>
                <span className="font-bold text-[#111827]">
                  {formData.meterType}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#667085]">Meter Number</span>
                <span className="font-mono font-bold tracking-wide text-[#111827]">
                  {formData.meterNumber}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-[#667085]">Customer</span>
                <span className="max-w-[190px] text-right font-bold leading-6 text-[#111827]">
                  {formData.customerName}
                </span>
              </div>

              {formData.customerAddress && (
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-[#667085]">Address</span>
                  <span className="max-w-[190px] text-right text-xs leading-5 text-[#111827]">
                    {formData.customerAddress}
                  </span>
                </div>
              )}

              {formData.serviceBand && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#667085]">Service Band</span>
                  <span className="text-right text-xs font-bold text-[#111827]">
                    {formData.serviceBand}
                  </span>
                </div>
              )}

              {formData.customerArrears && formData.customerArrears !== '0.0' && formData.customerArrears !== '' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#667085]">Arrears</span>
                  <span className="font-bold text-amber-600">
                    {formatCurrency(Number(formData.customerArrears))}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#667085]">Phone</span>
                <span className="font-bold text-[#111827]">
                  {phone ? normalizePhone(phone) : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-[#667085]">Email</span>
                <span className="max-w-[190px] text-right text-xs font-bold text-[#111827]">
                  {email || '—'}
                </span>
              </div>
            </div>

            <div className="my-6 flex items-center justify-between rounded-[24px] border border-[#EEF2F7] px-5 py-4">
              <span className="text-base font-bold text-[#111827]">Total</span>
              <span className="text-2xl font-extrabold tracking-tight text-[#d71927]">
                {formatCurrency(amountValue)}
              </span>
            </div>

            {insufficientBalance && balanceInfo && (
              <div className="mb-6 rounded-[24px] border border-red-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 text-red-600" size={22} />
                  <div className="flex-1">
                    <p className="text-sm font-extrabold text-red-900">
                      Insufficient Balance
                    </p>
                    <p className="mt-1 text-xs leading-5 text-red-700">
                      You need {formatCurrency(balanceInfo.requiredAmount)} to
                      complete this payment.
                    </p>

                    <div className="mt-3 space-y-2 rounded-2xl border border-red-100 p-3 text-xs text-red-800">
                      <div className="flex justify-between">
                        <span>Current Balance</span>
                        <span>{formatCurrency(balanceInfo.currentBalance)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Shortfall</span>
                        <span>{formatCurrency(balanceInfo.shortfall)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-4 w-full rounded-xl"
                      onClick={() => router.push('/dashboard/wallet')}
                    >
                      Go to Wallet
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {transactionStatus === 'success' && (
              <div className="mb-6 rounded-[24px] border border-green-200 bg-green-50 p-5 text-center">
                <CheckCircle2 className="mx-auto mb-2 text-green-600" size={28} />
                <p className="text-sm font-extrabold text-green-900">
                  Payment Successful
                </p>
                <p className="mt-1 text-xs text-green-700">
                  Redirecting to transaction history...
                </p>
              </div>
            )}

            {transactionStatus !== 'success' && (
              <>
                {!hasPIN && (
                  <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 text-amber-600" size={22} />
                      <div className="flex-1">
                        <p className="text-sm font-extrabold text-amber-900">
                          Set up your Transaction PIN
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          You'll need a PIN to complete this payment. Set one up now for secure transactions.
                        </p>
                        <button
                          onClick={() => router.push('/dashboard/settings/pin')}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-200"
                        >
                          Set PIN Now
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  fullWidth
                  onClick={handlePayment}
                  disabled={isProcessing || !hasPIN}
                  className="mb-3 h-13 rounded-2xl bg-[#d71927] text-base font-bold text-white shadow-[0_14px_30px_rgba(215,25,39,0.24)] hover:bg-[#b81420] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Processing Payment...
                    </span>
                  ) : !hasPIN ? (
                    'PIN Required to Pay'
                  ) : (
                    'Confirm & Pay'
                  )}
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push('/dashboard/bills')}
              disabled={isProcessing}
              className="h-12 rounded-2xl font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? 'Processing...' : 'Cancel'}
            </Button>

            <div className="mt-5 rounded-2xl border border-[#EEF2F7] bg-white p-4">
              <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#667085]">
                <Lock size={13} />
                Secured by Remopay transaction protection
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#667085]">
              <ShieldCheck size={14} className="text-[#d71927]" />
              PIN verification required
            </div>
          </Card>
        </aside>
      </div>

      <PINVerificationModal
        isOpen={showPINModal}
        onClose={() => !isProcessing && setShowPINModal(false)}
        onVerify={handlePINConfirm}
        isLoading={isProcessing}
        title="Verify Transaction"
        description="Enter your 4-digit PIN to complete this electricity payment"
      />

      <Toast />
    </div>
  );
}

