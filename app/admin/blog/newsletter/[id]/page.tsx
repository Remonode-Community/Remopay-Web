'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Send,
  CalendarClock,
  XCircle,
  MailCheck,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { newsletterService } from '@/services/newsletter.service';
import { useUIStore } from '@/store/ui.store';
import type {
  NewsletterCampaign,
  NewsletterRecipient,
  NewsletterStats,
} from '@/types/newsletter.types';
import { Card, CardBody, CardHeader } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { Modal } from '@/components/shared/Modal';
import { Spinner } from '@/components/shared/Spinner';
import { NewsletterStatusBadge } from '@/components/admin/blog/NewsletterStatusBadge';
import { ConfirmActionModal } from '@/components/admin/blog/ConfirmActionModal';
import { formatDate } from '@/utils/format.utils';
import { swallowForbidden } from '@/utils/access-control.utils';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardBody className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </CardBody>
    </Card>
  );
}

export default function NewsletterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);
  const { addToast } = useUIStore();

  const [campaign, setCampaign] = useState<NewsletterCampaign | null>(null);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [recipients, setRecipients] = useState<NewsletterRecipient[]>([]);
  const [recipientsPage, setRecipientsPage] = useState(1);
  const [recipientsTotalPages, setRecipientsTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCampaign = useCallback(async () => {
    try {
      const res = await newsletterService.getNewsletter(campaignId);
      setCampaign(res.data?.campaign || null);
      return res.data?.campaign || null;
    } catch (err: any) {
      // Backend 403 = current role lacks newsletter permission; show inline
      // message instead of letting the global 403 modal hijack the page.
      if (swallowForbidden(err)) {
        setError(
          'Your account does not have permission to manage newsletters. Please contact an administrator.'
        );
      } else {
        setError(err?.message || 'Failed to load campaign.');
      }
      return null;
    }
  }, [campaignId]);

  const loadStats = useCallback(async () => {
    try {
      const res = await newsletterService.getStats(campaignId);
      setStats(res.data?.stats || null);
    } catch {
      // Stats may not be available for drafts
    }
  }, [campaignId]);

  const loadRecipients = useCallback(
    async (page = 1) => {
      try {
        const res = await newsletterService.getRecipients(campaignId, page, 20);
        setRecipients(res.data?.items || []);
        setRecipientsPage(page);
        setRecipientsTotalPages(res.data?.pagination?.last_page || 1);
      } catch {
        // Recipients only exist after sending
      }
    },
    [campaignId]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([loadCampaign(), loadStats(), loadRecipients(1)]);
      if (!cancelled) setLoading(false);
    };
    if (campaignId) load();
    return () => {
      cancelled = true;
    };
  }, [campaignId, loadCampaign, loadStats, loadRecipients]);

  const refresh = async () => {
    await Promise.all([loadCampaign(), loadStats(), loadRecipients(recipientsPage)]);
  };

  const openPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await newsletterService.previewNewsletter(campaignId);
      if (res.success) {
        setPreviewHtml(res.data?.html || '');
      } else {
        addToast({ type: 'error', message: res.message || 'Could not generate preview.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Could not generate preview.' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) return;
    setTestLoading(true);
    try {
      const res = await newsletterService.testNewsletter(campaignId, testEmail.trim());
      addToast({ type: 'success', message: res.message || 'Test email sent.' });
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to send test email.' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSend = async () => {
    setActionLoading(true);
    try {
      const res = await newsletterService.sendNewsletter(campaignId);
      addToast({ type: 'success', message: res.message || 'Newsletter send has been queued.' });
      setConfirmSend(false);
      setTimeout(refresh, 3000);
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to send newsletter.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    setScheduleLoading(true);
    try {
      const res = await newsletterService.scheduleNewsletter(campaignId, new Date(scheduleDate).toISOString());
      addToast({ type: 'success', message: res.message || 'Newsletter scheduled.' });
      setScheduleDate('');
      refresh();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to schedule newsletter.' });
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const res = await newsletterService.cancelNewsletter(campaignId);
      addToast({ type: 'success', message: res.message || 'Scheduled send cancelled.' });
      refresh();
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to cancel newsletter.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async () => {
    setActionLoading(true);
    try {
      const res = await newsletterService.retryNewsletter(campaignId);
      if (res.success) {
        addToast({ type: 'success', message: res.message || 'Retry queued — re-sending failed recipients.' });
        refresh();
        // The queue updates the status asynchronously; refresh again shortly after.
        setTimeout(refresh, 3000);
      } else {
        addToast({ type: 'error', message: res.message || 'Failed to retry newsletter.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to retry newsletter.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">{error || 'Campaign not found.'}</p>
      </div>
    );
  }

  const isDraft = campaign.status === 'draft';
  const isScheduled = campaign.status === 'scheduled';
  const canSend = isDraft;
  const canSchedule = isDraft;
  const canCancel = isScheduled;
  const canRetry = campaign.status === 'failed' || campaign.status === 'partially_failed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/blog/newsletter"
            className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#d71927]"
          >
            <ArrowLeft size={16} /> Back to campaigns
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-black text-gray-900">{campaign.subject}</h2>
            <NewsletterStatusBadge status={campaign.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {campaign.blog_post ? (
              <Link href={`/blog/${campaign.blog_post.slug}`} className="font-semibold text-[#d71927] hover:underline">
                {campaign.blog_post.title}
              </Link>
            ) : (
              'Article'
            )}{' '}
            · {campaign.audience_type.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={openPreview} isLoading={previewLoading}>
            <Eye size={16} /> Preview
          </Button>
          {isDraft && (
            <>
              <Button variant="secondary" onClick={() => { setTestModalOpen(true); setTestEmail(''); }}>
                <MailCheck size={16} /> Test
              </Button>
              <Button onClick={() => setConfirmSend(true)}>
                <Send size={16} /> Send Now
              </Button>
              <Button variant="secondary" onClick={() => { setScheduleModalOpen(true); setScheduleDate(''); }}>
                <CalendarClock size={16} /> Schedule
              </Button>
            </>
          )}
          {canCancel && (
            <Button variant="danger" onClick={handleCancel} isLoading={actionLoading}>
              <XCircle size={16} /> Cancel
            </Button>
          )}
          {canRetry && (
            <Button variant="secondary" onClick={handleRetry} isLoading={actionLoading}>
              <RotateCcw size={16} /> Retry
            </Button>
          )}
          <Button variant="ghost" onClick={refresh}>
            <RefreshCw size={16} /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Recipients" value={stats?.total_recipients ?? campaign.recipient_count ?? 0} />
        <StatCard label="Delivered" value={stats?.delivered ?? campaign.delivered_count ?? 0} />
        <StatCard label="Failed" value={stats?.failed ?? campaign.failed_count ?? 0} />
        <StatCard label="Opened" value={stats?.opened ?? campaign.opened_count ?? 0} />
        <StatCard label="Clicked" value={stats?.clicked ?? campaign.clicked_count ?? 0} />
        <StatCard label="Open rate" value={stats ? `${stats.open_rate}%` : '—'} />
      </div>

      {/* Campaign meta */}
      <Card>
        <CardHeader>
          <h3 className="font-bold text-gray-900">Campaign details</h3>
        </CardHeader>
        <CardBody className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</p>
            <p className="mt-1 font-medium text-gray-900">{campaign.subject}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preview text</p>
            <p className="mt-1 text-gray-700">{campaign.preview_text || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sent by</p>
            <p className="mt-1 text-gray-700">
              {campaign.sent_by ? `${campaign.sent_by.first_name} ${campaign.sent_by.last_name}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Scheduled at</p>
            <p className="mt-1 text-gray-700">{campaign.scheduled_at ? formatDate(campaign.scheduled_at) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sent at</p>
            <p className="mt-1 text-gray-700">{campaign.sent_at ? formatDate(campaign.sent_at) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Completed at</p>
            <p className="mt-1 text-gray-700">{campaign.completed_at ? formatDate(campaign.completed_at) : '—'}</p>
          </div>
        </CardBody>
      </Card>

      {/* Recipients */}
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="font-bold text-gray-900">Recipients</h3>
        </CardHeader>
        {recipients.length === 0 ? (
          <CardBody className="p-10 text-center text-sm text-gray-500">
            No recipient log available yet.
            {isDraft && ' Recipients are snapshotted when the campaign is sent.'}
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Sent at</th>
                  <th className="px-6 py-3 font-semibold">Delivered at</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((recipient) => (
                  <tr key={recipient.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-900">{recipient.email}</td>
                    <td className="px-6 py-3 capitalize text-gray-600">{recipient.status}</td>
                    <td className="px-6 py-3 text-gray-600">{recipient.sent_at ? formatDate(recipient.sent_at) : '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{recipient.delivered_at ? formatDate(recipient.delivered_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {recipientsTotalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <span className="text-sm text-gray-500">Page {recipientsPage} of {recipientsTotalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={recipientsPage <= 1} onClick={() => loadRecipients(recipientsPage - 1)}>
                Prev
              </Button>
              <Button variant="secondary" size="sm" disabled={recipientsPage >= recipientsTotalPages} onClick={() => loadRecipients(recipientsPage + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Preview modal */}
      <Modal
        isOpen={Boolean(previewHtml)}
        onClose={() => setPreviewHtml('')}
        title="Email Preview"
        size="xl"
        closeButton
      >
        {/* Render the email at ~600px width for a true WYSIWYG preview */}
        <div className="overflow-auto rounded-lg border border-gray-200 bg-gray-100 p-3 sm:p-4">
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            className="mx-auto block h-[70vh] w-full max-w-[600px] rounded-md border border-gray-200 bg-white"
          />
        </div>
      </Modal>

      {/* Test modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Send Test Email"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTestModalOpen(false)} disabled={testLoading}>
              Close
            </Button>
            <Button onClick={handleTest} isLoading={testLoading} disabled={!testEmail.trim()}>
              Send Test
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Send a live test of this campaign to an internal email address.
          </p>
          <Input
            label="Recipient email"
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="manager@example.com"
          />
        </div>
      </Modal>

      {/* Schedule modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Send"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleModalOpen(false)} disabled={scheduleLoading}>
              Close
            </Button>
            <Button onClick={handleSchedule} isLoading={scheduleLoading} disabled={!scheduleDate}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Schedule this campaign to be sent automatically at a future time.
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-600">Send at</span>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
            />
          </label>
        </div>
      </Modal>

      {/* Send confirm */}
      <ConfirmActionModal
        isOpen={confirmSend}
        onClose={() => setConfirmSend(false)}
        onConfirm={handleSend}
        title="Send Newsletter"
        message={`Send "${campaign.subject}" to ${campaign.recipient_count ?? 0} recipients now? Sending is queued and runs in the background.`}
        confirmLabel="Send Now"
        loading={actionLoading}
      />
    </div>
  );
}
