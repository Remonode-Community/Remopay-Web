'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  User,
  Shield,
  Clock,
  ChevronDown,
  StickyNote,
  UserPlus,
  AlertTriangle,
  Paperclip,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Card } from '@/components/shared/Card';
import { Spinner } from '@/components/shared/Spinner';
import { Modal } from '@/components/shared/Modal';
import { supportService } from '@/services/support.service';
import { formatDateTime, formatRelativeTime } from '@/utils/format.utils';
import type { SupportTicket, SupportMessage, SupportStatus, SupportPriority, SupportAgent } from '@/types/api.types';

const STATUS_OPTIONS: { value: SupportStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_user_response', label: 'Awaiting User' },
  { value: 'awaiting_agent_response', label: 'Awaiting Agent' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: { value: SupportPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_CONFIG: Record<SupportStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  open: { label: 'Open', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  awaiting_user_response: { label: 'Awaiting User', variant: 'danger' },
  awaiting_agent_response: { label: 'Awaiting Agent', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'default' },
};

const PRIORITY_CONFIG: Record<SupportPriority, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  low: { label: 'Low', variant: 'default' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
};

export default function AdminSupportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params?.id);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [agents, setAgents] = useState<SupportAgent[]>([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const [messageAttachments, setMessageAttachments] = useState<{ url: string; type: string; name: string }[]>([]);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const [chatUploading, setChatUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicket = async () => {
    try {
      const response = await supportService.adminGetTicket(ticketId);
      setTicket(response?.data?.ticket ?? null);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await supportService.adminGetAgents();
      setAgents(response?.data?.agents ?? []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchAgents();
    }
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendMessage = async () => {
    if ((!message.trim() && messageAttachments.length === 0) || sending) return;
    try {
      setSending(true);
      const payload: { message: string; is_internal_note: boolean; attachment_url?: string } = {
        message: message.trim(),
        is_internal_note: isInternalNote,
      };
      if (messageAttachments.length > 0) {
        payload.attachment_url = messageAttachments[0].url;
      }
      await supportService.adminSendMessage(ticketId, payload);
      setMessage('');
      setIsInternalNote(false);
      setMessageAttachments([]);
      await fetchTicket();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await supportService.adminUpdateStatus(ticketId, status);
      await fetchTicket();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlePriorityChange = async (priority: string) => {
    try {
      await supportService.adminUpdatePriority(ticketId, priority);
      await fetchTicket();
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgent) return;
    try {
      setAssignLoading(true);
      await supportService.adminAssignTicket(ticketId, selectedAgent);
      setShowAssignModal(false);
      setSelectedAgent(null);
      await fetchTicket();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    } finally {
      setAssignLoading(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f8f8]">
        <p className="text-[#6b7280]">Ticket not found</p>
        <Button onClick={() => router.push('/admin/support')} className="mt-4 rounded-xl bg-[#d71927] text-white">
          Back to Tickets
        </Button>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
  const isUserMessage = (msg: SupportMessage) => msg.user_id === ticket.user_id;

  return (
    <div className="flex h-screen flex-col bg-[#f8f8f8]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/support')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-[#6b7280] transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#6b7280]">{ticket.ticket_number}</span>
              <Badge variant={statusConf.variant} size="sm">{statusConf.label}</Badge>
              <Badge variant={(PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium).variant} size="sm">
                {(PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium).label}
              </Badge>
            </div>
            <h1 className="mt-0.5 truncate text-lg font-bold text-[#111827]">{ticket.subject}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {/* Ticket Info */}
          <Card className="mb-6 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[#111827]">
                    {ticket.user?.first_name} {ticket.user?.last_name}
                  </p>
                  <span className="text-xs text-[#9ca3af]">{ticket.user?.email}</span>
                </div>
                <p className="mt-0.5 text-xs text-[#9ca3af]">{formatDateTime(ticket.created_at)}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#374151] whitespace-pre-wrap">{ticket.description}</p>
                {ticket.related_transaction_reference && (
                  <p className="mt-2 rounded-lg bg-gray-50 px-3 py-1.5 font-mono text-xs text-[#6b7280]">
                    Ref: {ticket.related_transaction_reference}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Messages */}
          <div className="space-y-4">
            {ticket.messages?.map((msg) => {
              const own = isUserMessage(msg);
              const isNote = msg.is_internal_note;
              return (
                <div key={msg.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isNote
                      ? 'border border-dashed border-amber-300 bg-amber-50'
                      : own
                        ? 'bg-[#d71927] text-white'
                        : 'bg-white border border-[#e5e7eb] text-[#111827]'
                  }`}>
                    {!own && !isNote && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-[#d71927]" />
                        <span className="text-xs font-semibold text-[#d71927]">
                          {msg.user.first_name} {msg.user.last_name}
                        </span>
                      </div>
                    )}
                    {isNote && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700">Internal Note</span>
                      </div>
                    )}
                    <p className={`text-sm whitespace-pre-wrap ${isNote ? 'text-amber-900' : ''}`}>{msg.message}</p>
                    {msg.attachment_url && (
                      <div className="mt-2">
                        <img
                          src={msg.attachment_url}
                          alt="Attachment"
                          className="max-h-48 w-auto rounded-lg border border-black/5 object-contain"
                          onClick={() => window.open(msg.attachment_url!, '_blank')}
                        />
                      </div>
                    )}
                    <p className={`mt-1.5 text-right text-[10px] ${
                      isNote ? 'text-amber-500' : own ? 'text-white/70' : 'text-[#9ca3af]'
                    }`}>
                      {formatRelativeTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden w-80 shrink-0 border-l border-[#e5e7eb] bg-white p-5 lg:block">
          <h3 className="text-sm font-semibold text-[#111827]">Ticket Management</h3>
          <div className="mt-5 space-y-5">
            {/* Status */}
            <div>
              <p className="text-xs font-medium text-[#9ca3af] mb-2">Status</p>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[#111] focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]"
              >
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-medium text-[#9ca3af] mb-2">Priority</p>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-[#111] focus:border-[#d71927] focus:outline-none focus:ring-1 focus:ring-[#d71927]"
              >
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[#9ca3af]">Assigned To</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#4a5ff7] hover:underline"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {ticket.assignee ? 'Reassign' : 'Assign'}
                </button>
              </div>
              {ticket.assignee ? (
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-xs font-bold text-[#4a5ff7]">
                    {ticket.assignee.first_name.charAt(0)}{ticket.assignee.last_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{ticket.assignee.first_name} {ticket.assignee.last_name}</p>
                    <p className="text-xs text-[#9ca3af]">{ticket.assignee.email}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#9ca3af]">Unassigned</p>
              )}
            </div>

            {/* Details */}
            <div className="border-t border-[#f1f5f9] pt-4">
              <p className="text-xs font-medium text-[#9ca3af]">Details</p>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9ca3af]">Category</span>
                  <span className="font-medium text-[#111827]">{ticket.category_label}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#9ca3af]">Messages</span>
                  <span className="font-medium text-[#111827]">{ticket.messages_count}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#9ca3af]">Created</span>
                  <span className="font-medium text-[#111827]">{formatDateTime(ticket.created_at)}</span>
                </div>
                {ticket.last_replied_at && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#9ca3af]">Last Reply</span>
                    <span className="font-medium text-[#111827]">{formatRelativeTime(ticket.last_replied_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Input */}
      {ticket.status !== 'closed' && (
        <div className="border-t border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
          <div className="mb-2 flex items-center gap-3">
            <button
              onClick={() => setIsInternalNote(false)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                !isInternalNote ? 'bg-[#d71927] text-white' : 'text-[#6b7280] hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Reply
            </button>
            <button
              onClick={() => setIsInternalNote(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                isInternalNote ? 'bg-amber-100 text-amber-700' : 'text-[#6b7280] hover:bg-gray-100'
              }`}
            >
              <StickyNote className="h-3.5 w-3.5" />
              Internal Note
            </button>
          </div>
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
          <div className="flex items-end gap-3">
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
              placeholder={isInternalNote ? 'Add an internal note (visible only to agents)...' : 'Type your reply...'}
              rows={2}
              className={`flex-1 resize-none rounded-xl border bg-[#f8f8f8] px-4 py-3 text-sm text-[#111] placeholder-gray-400 focus:outline-none focus:ring-1 ${
                isInternalNote
                  ? 'border-amber-200 focus:border-amber-400 focus:ring-amber-400'
                  : 'border-black/10 focus:border-[#d71927] focus:ring-[#d71927]'
              }`}
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!message.trim() && messageAttachments.length === 0) || sending}
              className={`h-11 w-11 shrink-0 rounded-xl p-0 text-white shadow-lg transition disabled:opacity-50 ${
                isInternalNote
                  ? 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600'
                  : 'bg-[#d71927] shadow-[#d71927]/20 hover:bg-[#b91521]'
              }`}
            >
              {sending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Ticket">
        <div className="space-y-4">
          <p className="text-sm text-[#6b7280]">Select an agent to assign this ticket to.</p>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selectedAgent === agent.id
                    ? 'border-[#d71927] bg-red-50'
                    : 'border-black/10 hover:bg-gray-50'
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-bold text-[#4a5ff7]">
                  {agent.first_name.charAt(0)}{agent.last_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">{agent.first_name} {agent.last_name}</p>
                  <p className="text-xs text-[#9ca3af]">{agent.email}</p>
                </div>
              </button>
            ))}
            {agents.length === 0 && (
              <p className="py-4 text-center text-sm text-[#9ca3af]">No agents available</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button onClick={() => setShowAssignModal(false)} variant="outline" className="h-10 rounded-xl px-4">Cancel</Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedAgent || assignLoading}
              className="h-10 rounded-xl bg-[#d71927] px-4 text-white hover:bg-[#b91521] disabled:opacity-50"
            >
              {assignLoading ? <Spinner size="sm" className="mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
