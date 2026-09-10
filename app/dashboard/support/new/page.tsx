'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, HelpCircle, Paperclip } from 'lucide-react';
import { Spinner } from '@/components/shared/Spinner';
import { SupportWysiwyg } from '@/components/support/SupportWysiwyg';
import { FileUploader } from '@/components/support/FileUploader';
import { supportService } from '@/services/support.service';
import type { SupportCategory, SupportPriority, CreateSupportTicketRequest } from '@/types/api.types';

const CATEGORIES: { value: SupportCategory; label: string }[] = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'transaction_issue', label: 'Transaction Issue' },
  { value: 'wallet_issue', label: 'Wallet Issue' },
  { value: 'account_issue', label: 'Account Issue' },
  { value: 'card_issue', label: 'Card Issue' },
  { value: 'airtime_data', label: 'Airtime & Data' },
  { value: 'transfer_issue', label: 'Transfer Issue' },
  { value: 'kyc_verification', label: 'KYC Verification' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: SupportPriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'General question or minor issue' },
  { value: 'medium', label: 'Medium', description: 'Need help but not urgent' },
  { value: 'high', label: 'High', description: 'Important issue affecting your account' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue requiring immediate attention' },
];

export default function NewSupportTicketPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CreateSupportTicketRequest>({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
    related_transaction_reference: '',
    initial_message: '',
  });

  const [attachments, setAttachments] = useState<{ url: string; type: string; name?: string }[]>([]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (form.subject.length > 255) errs.subject = 'Subject must be under 255 characters';
    if (!form.description.trim() || form.description === '<br>' || form.description === '<p></p>') {
      errs.description = 'Description is required';
    }
    if (form.description.length > 5000) errs.description = 'Description must be under 5000 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        initial_message: attachments.length > 0
          ? JSON.stringify({ attachments })
          : form.initial_message || undefined,
      };
      const response = await supportService.createTicket(payload);
      const ticket = response?.data?.data?.ticket ?? response?.data?.ticket;
      if (ticket?.id) {
        router.push(`/dashboard/support/${ticket.id}`);
      } else {
        router.push('/dashboard/support');
      }
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-white">
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">New Support Ticket</h1>
            <p className="mt-1 text-sm text-gray-500">Describe your issue and we&apos;ll help you resolve it</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Column — Main Form */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* Subject */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
              <label className="block text-sm font-semibold text-gray-900">Subject</label>
              <p className="mt-0.5 text-xs text-gray-400">Brief description of your issue</p>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Failed transaction, Unable to withdraw..."
                className={`mt-3 h-11 w-full rounded-xl border bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#d71927] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d71927]/10 ${
                  errors.subject ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.subject && <p className="mt-1.5 text-xs text-red-500">{errors.subject}</p>}
            </div>

            {/* Description — WYSIWYG Editor */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
              <label className="block text-sm font-semibold text-gray-900">Description</label>
              <p className="mt-0.5 text-xs text-gray-400">Provide as much detail as possible</p>
              <div className="mt-3">
                <SupportWysiwyg
                  value={form.description}
                  onChange={(html) => setForm({ ...form, description: html })}
                  placeholder="Describe your issue in detail..."
                  minHeight="220px"
                />
              </div>
              {errors.description && <p className="mt-1.5 text-xs text-red-500">{errors.description}</p>}
              <p className="mt-2 text-right text-xs text-gray-400">{form.description.length}/5000</p>
            </div>

            {/* Attachments */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-gray-400" />
                <label className="text-sm font-semibold text-gray-900">Screenshots</label>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">Attach screenshots to help us understand your issue</p>
              <div className="mt-3">
                <FileUploader
                  attachments={attachments}
                  onChange={setAttachments}
                  maxFiles={5}
                />
              </div>
            </div>
          </div>

          {/* Right Column — Sidebar */}
          <div className="w-full shrink-0 lg:w-80">
            <div className="sticky top-6 space-y-6">
              {/* Category */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
                <label className="block text-sm font-semibold text-gray-900">Category</label>
                <p className="mt-0.5 text-xs text-gray-400">Select the topic that best matches</p>
                <div className="mt-3 space-y-1.5">
                  {CATEGORIES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setForm({ ...form, category: value })}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                        form.category === value
                          ? 'border-[#d71927] bg-red-50 text-[#d71927]'
                          : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
                <label className="block text-sm font-semibold text-gray-900">Priority</label>
                <p className="mt-0.5 text-xs text-gray-400">How urgent is this issue?</p>
                <div className="mt-3 space-y-1.5">
                  {PRIORITIES.map(({ value, label, description }) => {
                    const isSelected = form.priority === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setForm({ ...form, priority: value })}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? 'border-[#d71927] bg-red-50'
                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-2 w-2 rounded-full ${
                            value === 'low' ? 'bg-gray-400' :
                            value === 'medium' ? 'bg-blue-500' :
                            value === 'high' ? 'bg-amber-500' :
                            'bg-red-500'
                          }`} />
                          <span className={`text-sm font-semibold ${isSelected ? 'text-[#d71927]' : 'text-gray-900'}`}>
                            {label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction Reference */}
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">Additional Info</h3>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">Optional</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Transaction Reference</label>
                    <input
                      type="text"
                      value={form.related_transaction_reference ?? ''}
                      onChange={(e) => setForm({ ...form, related_transaction_reference: e.target.value })}
                      placeholder="e.g. TXN-20260904-001234"
                      className="mt-1 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d71927] text-sm font-semibold text-white shadow-sm transition hover:bg-[#b91420] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {submitting ? (
                    <Spinner size="sm" className="border-white/30 border-t-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Ticket
                </button>
                <button
                  onClick={() => router.back()}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
