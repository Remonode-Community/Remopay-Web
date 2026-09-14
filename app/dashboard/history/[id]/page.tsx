'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Printer, Share2, CheckCircle2, Building2 } from 'lucide-react';

import { transactionService } from '@/services/transaction.service';
import { formatCurrency, formatDateTime } from '@/utils/format.utils';
import type { TransactionDetailData } from '@/types/transaction-detail.types';

import {
  StatusBadge,
  LoadingSkeleton,
  ErrorState,
} from '@/components/transactions';

const TYPE_CONFIG: Record<string, { label: string }> = {
  wallet_funding:        { label: 'Wallet Funding' },
  airtime_purchase:     { label: 'Airtime Purchase' },
  data_purchase:        { label: 'Data Purchase' },
  airtime_conversion:   { label: 'Airtime Conversion' },
  bill_payment:         { label: 'Bill Payment' },
  transfer_out:         { label: 'Transfer Sent' },
  transfer_in:          { label: 'Transfer Received' },
  card_funding:         { label: 'Card Funding' },
  transfer:             { label: 'Bank Transfer' },
  'wallet transfer out':{ label: 'Transfer Sent' },
  'wallet transfer in': { label: 'Transfer Received' },
};

function getTypeLabel(type: string): string {
  const normalized = type?.toLowerCase() || '';
  return TYPE_CONFIG[normalized]?.label || type?.replace(/_/g, ' ') || 'Transaction';
}

function ReceiptRow({ label, value, bold = false, mono = false, green = false }: { label: string; value: string; bold?: boolean; mono?: boolean; green?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm text-right max-w-[55%] break-words ${bold ? 'font-bold' : 'font-medium'} ${green ? 'text-green-600' : 'text-gray-900'} ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function ReceiptDivider() {
  return <div className="border-t border-dashed border-gray-200 my-1" />;
}

function ReceiptSectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="h-3.5 w-3.5 text-[#d71927]" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#d71927]">{label}</span>
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<TransactionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  const loadTransaction = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionService.getTransactionDetail(Number(params.id));
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to load transaction details');
      }
    } catch (err: any) {
      if (err.response?.status === 404) setError('Transaction not found');
      else if (err.response?.status === 403) setError('You do not have permission to view this transaction');
      else setError(err.message || 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { loadTransaction(); }, [loadTransaction]);

  const handleBack = useCallback(() => router.push('/dashboard/history'), [router]);

  const handleShare = async () => {
    if (!data) return;
    const label = getTypeLabel(data.basic.transaction_type);
    const lines: string[] = [
      'REMOPAY TRANSACTION RECEIPT',
      `${'─'.repeat(32)}`,
      `Type: ${label}`,
      `Amount: ${formatCurrency(data.financial.amount)}`,
      `Status: ${data.basic.status?.toUpperCase()}`,
      `Reference: ${data.basic.reference}`,
      `Date: ${formatDateTime(data.timeline.transaction_date || data.timeline.created_at)}`,
    ];

    const bankDetails = getBankDetails();
    if (bankDetails) {
      lines.push('', 'BANK DETAILS:');
      lines.push(`${'─'.repeat(20)}`);
      if (bankDetails.bank_name) lines.push(`Bank: ${bankDetails.bank_name}`);
      if (bankDetails.account_name) lines.push(`Name: ${bankDetails.account_name}`);
      if (bankDetails.account_number) lines.push(`Account: ${bankDetails.account_number}`);
    }

    if (data.source?.type === 'vtu' && data.source.recipient) {
      lines.push('', `Recipient: ${data.source.recipient}`);
      if (data.source.product_name) lines.push(`Product: ${data.source.product_name}`);
    }

    if (data.metadata?.sender_bank || data.metadata?.sender_name) {
      lines.push('', 'FUNDING DETAILS:');
      lines.push(`${'─'.repeat(20)}`);
      if (data.metadata.sender_name) lines.push(`From: ${data.metadata.sender_name}`);
      if (data.metadata.sender_bank) lines.push(`Bank: ${data.metadata.sender_bank}`);
    }

    lines.push('', `${'─'.repeat(32)}`, 'Powered by Remopay');

    const shareText = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Remopay Receipt', text: shareText });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } else {
        await navigator.clipboard.writeText(shareText);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {}
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="px-4 py-6"><LoadingSkeleton /></div>;

  if (error) {
    return (
      <div className="px-4 py-6">
        <ErrorState message={error} onRetry={loadTransaction} onBack={handleBack} />
      </div>
    );
  }

  if (!data) return null;

  const typeLabel = getTypeLabel(data.basic.transaction_type);
  const isVtu = data.source?.type === 'vtu';
  const isAirtimeConversion = data.source?.type === 'airtime_conversion';
  const isDebit = data.basic.transaction_type?.toLowerCase().includes('out') || data.basic.transaction_type === 'transfer';

  const getBankDetails = (): Record<string, string> | null => {
    // 1. Check metadata.bank_details (for transfers)
    if (data.metadata && typeof data.metadata.bank_details === 'object') {
      const bd = data.metadata.bank_details as Record<string, any>;
      if (bd.bank_name || bd.account_number) {
        return {
          bank_name: bd.bank_name || '',
          account_name: bd.account_name || '',
          account_number: bd.account_number || '',
        };
      }
    }
    // 2. Check details.data.metadata.recipient.details (Maplerad transfers)
    const detailsMeta = data.details?.data?.metadata as Record<string, any> | undefined;
    if (detailsMeta?.recipient?.details) {
      const rd = detailsMeta.recipient.details as Record<string, any>;
      if (rd.account_number || rd.bank_name) {
        return {
          bank_name: rd.bank_name || '',
          account_name: rd.account_name || '',
          account_number: rd.account_number || '',
        };
      }
    }
    // 3. Check metadata.bank_details fallback
    if (data.metadata && typeof data.metadata.bank_details === 'object') {
      return data.metadata.bank_details as Record<string, string>;
    }
    return null;
  };

  const bankDetails = getBankDetails();

  // For wallet funding: sender bank info
  const senderBank = data.metadata?.sender_bank as string | undefined;
  const senderName = data.metadata?.sender_name as string | undefined;

  return (
    <div
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
      className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 print:bg-white print:p-0"
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', 'Segoe UI', sans-serif; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 0.5in; size: A4; }
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="mx-auto max-w-md" ref={receiptRef}>
        {/* Action Buttons (hidden on print) */}
        <div className="no-print mb-4 flex items-center justify-between">
          <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-black transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            {shared && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Copied!
              </span>
            )}
            <button onClick={handleShare} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </div>
        </div>

        {/* ═══════════ RECEIPT CARD ═══════════ */}
        <div className="bg-white border border-gray-200 shadow-sm print:shadow-none print:border print:border-gray-300 overflow-hidden">
          {/* Brand Header */}
          <div className="bg-[#d71927] px-6 py-5 print:bg-[#d71927]">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <span className="text-sm font-black text-white">R</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Remopay</span>
            </div>
            <p className="mt-1 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">Transaction Receipt</p>
          </div>

          {/* Status Banner */}
          {data.basic.status === 'success' && (
            <div className="flex items-center justify-center gap-2 bg-green-50 py-3 border-b border-green-100">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-green-700">Transaction Successful</span>
            </div>
          )}

          {/* Amount Display */}
          <div className="px-6 py-6 text-center border-b border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Amount</p>
            <p className={`text-3xl font-extrabold ${isDebit ? 'text-gray-900' : 'text-green-600'}`}>
              {formatCurrency(data.financial.amount)}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-500">{typeLabel}</span>
              <span className="text-gray-300">·</span>
              <StatusBadge status={data.basic.status} size="sm" />
            </div>
          </div>

          {/* Receipt Body */}
          <div className="px-6 py-4">
            {/* Reference */}
            <ReceiptRow label="Reference" value={data.basic.reference} mono bold />
            <ReceiptDivider />

            {/* Date & Time */}
            <ReceiptRow
              label="Date & Time"
              value={formatDateTime(data.timeline.transaction_date || data.timeline.created_at)}
            />

            {/* ── VTU Details ── */}
            {isVtu && data.source && data.source.type === 'vtu' && (
              <>
                <ReceiptDivider />
                <ReceiptRow label="Product" value={data.source.product_name || '—'} bold />
                <ReceiptRow label="Recipient" value={data.source.recipient || data.source.unique_element || '—'} mono />
              </>
            )}

            {/* ── Airtime Conversion Details ── */}
            {isAirtimeConversion && (
              <>
                <ReceiptDivider />
                <ReceiptRow label="Airtime Used" value={formatCurrency(data.financial.airtime_amount ?? 0)} />
                <ReceiptRow label="Cash Credited" value={formatCurrency(data.financial.cash_credited ?? 0)} bold />
                <ReceiptRow label="Rate" value={`₦${Number(data.financial.conversion_rate ?? 0).toFixed(4)}`} />
              </>
            )}

            {isAirtimeConversion && data.source && data.source.type === 'airtime_conversion' && (
              <>
                <ReceiptDivider />
                <ReceiptRow label="Phone" value={data.source.phone_number || '—'} mono />
                <ReceiptRow label="Provider" value={data.source.provider?.toUpperCase() || '—'} bold />
              </>
            )}

            {/* VTU Cashback */}
            {isVtu && data.financial.commission != null && data.financial.commission > 0 && (
              <>
                <ReceiptDivider />
                <ReceiptRow label="Cashback" value={formatCurrency(data.financial.commission)} green />
              </>
            )}

            {/* ── Bank Transfer Details ── */}
            {bankDetails && (
              <>
                <ReceiptDivider />
                <div className="py-2">
                  <ReceiptSectionHeader icon={Building2} label="Bank Details" />
                  <div className="space-y-1.5">
                    {bankDetails.bank_name && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Bank</span>
                        <span className="font-semibold text-gray-800">{bankDetails.bank_name}</span>
                      </div>
                    )}
                    {bankDetails.account_name && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Account Name</span>
                        <span className="font-semibold text-gray-800">{bankDetails.account_name}</span>
                      </div>
                    )}
                    {bankDetails.account_number && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Account Number</span>
                        <span className="font-mono font-bold text-gray-800">{bankDetails.account_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Wallet Funding: Sender Bank Details ── */}
            {!bankDetails && (senderBank || senderName) && (
              <>
                <ReceiptDivider />
                <div className="py-2">
                  <ReceiptSectionHeader icon={Building2} label="Funded By" />
                  <div className="space-y-1.5">
                    {senderName && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">From</span>
                        <span className="font-semibold text-gray-800">{senderName}</span>
                      </div>
                    )}
                    {senderBank && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Bank</span>
                        <span className="font-semibold text-gray-800">{senderBank}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Wallet Transfer: Comprehensive Details ── */}
            {(!!data.metadata?.sender_name || !!data.metadata?.recipient_name) && (
              <>
                <ReceiptDivider />
                <div className="py-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Transfer Type</span>
                    <span className="text-[10px] font-medium text-gray-600 capitalize px-2 py-0.5 bg-gray-100 rounded">
                      {String((data.metadata as any)?.transfer_type || 'wallet transfer').replace(/_/g, ' ')}
                    </span>
                  </div>

                  {!!data.metadata?.sender_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">From</span>
                      <span className="font-bold text-gray-900 text-right max-w-[60%]">{String(data.metadata!.sender_name)}</span>
                    </div>
                  )}

                  {!!data.metadata?.recipient_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">To</span>
                      <span className="font-bold text-gray-900 text-right max-w-[60%]">{String(data.metadata!.recipient_name)}</span>
                    </div>
                  )}

                  {!!(data.metadata as any)?.description && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Note</span>
                      <span className="text-gray-600 text-right max-w-[60%]">{String((data.metadata as any).description)}</span>
                    </div>
                  )}

                  {data.details?.data?.balance_before != null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Balance Before</span>
                      <span className="font-mono font-medium text-gray-700">₦{Number(data.details.data.balance_before).toLocaleString()}</span>
                    </div>
                  )}
                  {data.details?.data?.balance_after != null && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Balance After</span>
                      <span className="font-mono font-bold text-gray-900">₦{Number(data.details.data.balance_after).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Currency Conversion Details ── */}
            {data.basic.transaction_type === 'Currency Conversion' && (
              <>
                <ReceiptDivider />
                <div className="py-2 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Conversion Details</p>
                  {!!(data.metadata as any)?.description && (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-6">
                      {(data.metadata as any).description}
                    </p>
                  )}
                  {!!(data.metadata as any)?.quote_reference && (
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-gray-400">Quote Ref</span>
                      <span className="font-mono font-medium text-gray-700">{String((data.metadata as any).quote_reference)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Receipt Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#d71927]/10">
                <span className="text-[8px] font-black text-[#d71927]">R</span>
              </div>
              <span className="text-[11px] font-bold text-gray-600 tracking-tight">Remopay</span>
            </div>
            <p className="text-center text-[10px] text-gray-400">
              Transaction #{data.basic.id} · {data.basic.reference.slice(-8).toUpperCase()}
            </p>
            <p className="text-center text-[9px] text-gray-300 mt-0.5">www.remopay.remonode.com</p>
          </div>
        </div>

        {/* Bottom Action (hidden on print) */}
        <div className="no-print mt-5">
          <button onClick={handlePrint} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Download Receipt (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}
