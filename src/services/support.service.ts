import { apiClient } from './api-client';
import type {
  ApiResponse,
  SupportTicket,
  SupportMessage,
  SupportTicketStats,
  SupportAgent,
  CreateSupportTicketRequest,
  SendSupportMessageRequest,
  AdminSendSupportMessageRequest,
  PaginatedResponse,
} from '@/types/api.types';

export interface SupportAttachmentUpload {
  attachment_url: string;
  attachment_type: string;
  public_id: string;
  size: number | null;
  width: number | null;
  height: number | null;
}

class SupportService {
  // ── User endpoints ─────────────────────────────────────────────────────────

  async getTickets(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<{ tickets: SupportTicket[]; stats: SupportTicketStats }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.per_page) searchParams.append('per_page', String(params.per_page));
    if (params?.status) searchParams.append('status', params.status);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return apiClient.get(`/support${query ? `?${query}` : ''}`);
  }

  async getTicket(ticketId: number): Promise<ApiResponse<{ ticket: SupportTicket }>> {
    return apiClient.get(`/support/${ticketId}`);
  }

  async createTicket(data: CreateSupportTicketRequest): Promise<ApiResponse<{ ticket: SupportTicket }>> {
    return apiClient.post('/support', data);
  }

  async sendMessage(ticketId: number, data: SendSupportMessageRequest): Promise<ApiResponse<{ message: SupportMessage }>> {
    return apiClient.post(`/support/${ticketId}/messages`, data);
  }

  async uploadAttachment(file: File): Promise<ApiResponse<SupportAttachmentUpload>> {
    const formData = new FormData();
    formData.append('attachment', file);
    return apiClient.post('/support/attachments/upload', formData);
  }

  async resolveTicket(ticketId: number): Promise<ApiResponse<{ ticket: SupportTicket }>> {
    return apiClient.post(`/support/${ticketId}/resolve`);
  }

  async reopenTicket(ticketId: number, reason: string): Promise<ApiResponse<{ ticket: SupportTicket }>> {
    return apiClient.post(`/support/${ticketId}/reopen`, { reason });
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  async adminGetTickets(params?: {
    page?: number;
    per_page?: number;
    status?: string;
    category?: string;
    priority?: string;
    assigned_to?: string;
    search?: string;
  }): Promise<ApiResponse<{ tickets: SupportTicket[]; stats: SupportTicketStats }>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.per_page) searchParams.append('per_page', String(params.per_page));
    if (params?.status) searchParams.append('status', params.status);
    if (params?.category) searchParams.append('category', params.category);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.assigned_to) searchParams.append('assigned_to', params.assigned_to);
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return apiClient.get(`/admin/support${query ? `?${query}` : ''}`);
  }

  async adminGetTicket(ticketId: number): Promise<ApiResponse<{ ticket: SupportTicket }>> {
    return apiClient.get(`/admin/support/${ticketId}`);
  }

  async adminGetAgents(): Promise<ApiResponse<{ agents: SupportAgent[] }>> {
    return apiClient.get('/admin/support/agents');
  }

  async adminAssignTicket(ticketId: number, assignedTo: number): Promise<ApiResponse<{ ticket: SupportTicket }>> {
    return apiClient.post(`/admin/support/${ticketId}/assign`, { assigned_to: assignedTo });
  }

  async adminUpdateStatus(ticketId: number, status: string): Promise<ApiResponse<{ ticket: SupportTicket }>> {
    return apiClient.patch(`/admin/support/${ticketId}/status`, { status });
  }

  async adminUpdatePriority(ticketId: number, priority: string): Promise<ApiResponse<{ ticket: SupportTicket }>> {
    return apiClient.patch(`/admin/support/${ticketId}/priority`, { priority });
  }

  async adminSendMessage(ticketId: number, data: AdminSendSupportMessageRequest): Promise<ApiResponse<{ message: SupportMessage }>> {
    return apiClient.post(`/admin/support/${ticketId}/messages`, data);
  }
}

export const supportService = new SupportService();
