'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  RotateCcw,
  CheckCircle,
  MessageSquare,
  Clock,
  User,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
  Paperclip,
  X,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/shared/Badge';
import { Spinner } from '@/components/shared/Spinner';
import { supportService } from '@/services/support.service';
import { useAuthStore } from '@/store/auth.store';
import { formatDateTime, formatRelativeTime } from '@/utils/format.utils';
import type { SupportTicket, SupportMessage, SupportStatus } from '@/types/api.types';

const STATUS_CONFIG: Record<SupportStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  open: { label: 'Open', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  awaiting_user_response: { label: 'Awaiting You', variant: 'danger' },
  awaiting_agent_response: { label: 'Awaiting Agent', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'default' },
};

export default function SupportTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params?.id);
  const { user } = useAuthStore();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageAttachments, setMessageAttachments] = useState<{ url: string; type: string; name?: string }[]>([]);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const [chatUploading, setChatUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const response = await supportService.getTicket(ticketId);
      const data = response?.data?.data ?? response?.data;
      setTicket(data?.ticket ?? null);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendMessage = async () => {
    if ((!message.trim() && messageAttachments.length === 0) || sending) return;

    try {
      setSending(true);
      const payload: { message: string; attachment_url?: string } = {
        message: message.trim() || 'Sent an attachment',
      };
      if (messageAttachments.length > 0) {
        payload.attachment_url = messageAttachments[0].url;
      }
      await supportService.sendMessage(ticketId, payload);
      setMessage('');
      setMessageAttachments([]);
      await fetchTicket();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setChatUploading(true);
    try {
      const res = await supportService.uploadAttachment(file);
      if (res.success && res.data?.attachment_url) {
        setMessageAttachments((prev) => [
          ...prev,
          { url: res.data!.attachment_url, type: res.data!.attachment_type, name: file.name },
        ]);
      }
    } catch {
      // error handled by service
    } finally {
      setChatUploading(false);
      if (chatFileRef.current) chatFileRef.current.value = '';
    }
  };

  const handleResolve = async () => {
    try {
      await supportService.resolveTicket(ticketId);
      await fetchTicket();
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) return;
    try {
      setReopenLoading(true);
      await supportService.reopenTicket(ticketId, reopenReason.trim());
      setShowReopenModal(false);
      setReopenReason('');
      await fetchTicket();
    } catch (error) {
      console.error('Failed to reopen ticket:', error);
    } finally {
      setReopenLoading(false);
    }
  };

  const canReply = ticket && !['closed', 'resolved'].includes(ticket.status);
  const canResolve = ticket && !['resolved', 'closed'].includes(ticket.status);
  const canReopen = ticket && ['resolved', 'closed'].includes(ticket.status);
  const statusConf = ticket ? (STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open) : null;
  const isUserMessage = (msg: SupportMessage) => ticket && msg.user_id === ticket.user_id;

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-white py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-white py-20">
        <MessageSquare className="h-12 w-12 text-gray-200" />
        <p className="mt-4 text-base font-semibold text-gray-900">Ticket not found</p>
        <button
          onClick={() => router.push('/dashboard/support')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#d71927] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b91420]"
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-white sm:h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/support')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">{ticket.ticket_number}</span>
              {statusConf && <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>}
            </div>
            <h1 className="mt-0.5 truncate text-base font-bold text-gray-900 sm:text-lg">{ticket.subject}</h1>
          </div>
          <div className="flex items-center gap-2">
            {canResolve && (
              <button
                onClick={handleResolve}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Resolve
              </button>
            )}
            {canReopen && (
              <button
                onClick={() => setShowReopenModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reopen
              </button>
            )}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 lg:hidden"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages — Main */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {/* Ticket Info Card */}
          <div className="mb-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {ticket.user?.first_name} {ticket.user?.last_name}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(ticket.created_at)}</p>
                <p className="mt-2.5 text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
                {ticket.related_transaction_reference && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1">
                    <span className="text-xs text-gray-500">Ref:</span>
                    <span className="font-mono text-xs font-medium text-gray-700">{ticket.related_transaction_reference}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="space-y-3">
            {ticket.messages?.map((msg) => {
              const isOwn = isUserMessage(msg);
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                    isOwn
                      ? 'bg-[#d71927] text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}>
                    {!isOwn && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d71927]/10">
                          <Shield className="h-3 w-3 text-[#d71927]" />
                        </div>
                        <span className="text-xs font-semibold text-[#d71927]">
                          {msg.user.first_name} {msg.user.last_name}
                        </span>
                      </div>
                    )}
                    {msg.message && !msg.message.startsWith('{') && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    )}
                    {msg.attachment_url && (
                      <div className="mt-2 overflow-hidden rounded-lg">
                        <img
                          src={msg.attachment_url}
                          alt="Attachment"
                          className="max-h-64 w-auto rounded-lg object-contain"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <p className={`mt-1.5 text-right text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                      {formatRelativeTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {ticket.messages?.length === 0 && (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm text-gray-500">No messages yet</p>
              <p className="mt-1 text-xs text-gray-400">Send a message to start the conversation</p>
            </div>
          )}
        </div>

        {/* Sidebar — Desktop */}
        <div className="hidden w-72 shrink-0 border-l border-gray-100 bg-white p-5 lg:block">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ticket Details</h3>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              {statusConf && <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Category</span>
              <span className="text-sm font-medium text-gray-900">{ticket.category_label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Priority</span>
              <span className="text-sm font-medium text-gray-900">{ticket.priority_label}</span>
            </div>
            {ticket.assignee && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Assigned To</span>
                <span className="text-sm font-medium text-gray-900">
                  {ticket.assignee.first_name} {ticket.assignee.last_name}
                </span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm text-gray-900">{formatDateTime(ticket.created_at)}</span>
              </div>
              {ticket.last_replied_at && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Last Reply</span>
                  <span className="text-sm text-gray-900">{formatRelativeTime(ticket.last_replied_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="mt-6 border-t border-gray-100 pt-5 space-y-2">
            {canResolve && (
              <button
                onClick={handleResolve}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Resolved
              </button>
            )}
            {canReopen && (
              <button
                onClick={() => setShowReopenModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <RotateCcw className="h-4 w-4" />
                Reopen Ticket
              </button>
            )}
          </div>
        </div>

        {/* Sidebar — Mobile (Slide-in) */}
        <div className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[85vw] border-l border-gray-100 bg-white p-5 shadow-xl transition-transform duration-300 lg:hidden ${
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Ticket Details</h3>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Status</span>
              {statusConf && <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Category</span>
              <span className="text-sm font-medium text-gray-900">{ticket.category_label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Priority</span>
              <span className="text-sm font-medium text-gray-900">{ticket.priority_label}</span>
            </div>
            {ticket.assignee && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Assigned To</span>
                <span className="text-sm font-medium text-gray-900">
                  {ticket.assignee.first_name} {ticket.assignee.last_name}
                </span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm text-gray-900">{formatDateTime(ticket.created_at)}</span>
              </div>
              {ticket.last_replied_at && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Last Reply</span>
                  <span className="text-sm text-gray-900">{formatRelativeTime(ticket.last_replied_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="absolute bottom-6 left-5 right-5 space-y-2">
            {canResolve && (
              <button
                onClick={() => { handleResolve(); setMobileSidebarOpen(false); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Resolved
              </button>
            )}
            {canReopen && (
              <button
                onClick={() => { setShowReopenModal(true); setMobileSidebarOpen(false); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <RotateCcw className="h-4 w-4" />
                Reopen Ticket
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Input */}
      {canReply && (
        <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-6">
          {/* Attachment preview */}
          {messageAttachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {messageAttachments.map((att, i) => (
                <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img src={att.url} alt="Attachment" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setMessageAttachments(messageAttachments.filter((_, idx) => idx !== i))}
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={chatFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChatFileUpload}
            />
            <button
              onClick={() => chatFileRef.current?.click()}
              disabled={chatUploading || messageAttachments.length >= 3}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-[#d71927] disabled:opacity-40"
              title="Attach screenshot"
            >
              {chatUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </button>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#d71927] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d71927]/10"
            />
            <button
              onClick={handleSendMessage}
              disabled={(!message.trim() && messageAttachments.length === 0) || sending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d71927] text-white shadow-sm transition hover:bg-[#b91420] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {sending ? <Spinner size="sm" className="border-white/30 border-t-white" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {showReopenModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowReopenModal(false)} />
          <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
            <h3 className="text-lg font-bold text-gray-900">Reopen Ticket</h3>
            <p className="mt-1 text-sm text-gray-500">Please provide a reason for reopening this ticket.</p>
            <textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Why are you reopening this ticket?"
              rows={4}
              className="mt-4 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-[#d71927] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d71927]/10"
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowReopenModal(false)}
                className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReopen}
                disabled={!reopenReason.trim() || reopenLoading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#d71927] px-4 text-sm font-semibold text-white transition hover:bg-[#b91420] disabled:opacity-50"
              >
                {reopenLoading ? <Spinner size="sm" className="border-white/30 border-t-white" /> : <RotateCcw className="h-4 w-4" />}
                Reopen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
