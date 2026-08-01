/**
 * Newsletter Management Types
 * Based on the Remopay Blog & Newsletter Management System API (v1.0)
 */

import type { BlogPagination, BlogPostListItem } from './blog.types';

// ─── Enums / Status ──────────────────────────────────────────────────

export type NewsletterStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'partially_failed'
  | 'failed'
  | 'cancelled';

export type NewsletterAudienceType =
  | 'all_users'
  | 'selected_users'
  | 'all_subscribers'
  | 'segment';

export type NewsletterRecipientStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'failed'
  | 'unsubscribed';

// ─── Campaign ────────────────────────────────────────────────────────

export interface NewsletterSender {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface NewsletterCampaign {
  id: number;
  blog_post_id: number;
  blog_post?: BlogPostListItem | null;
  subject: string;
  preview_text?: string | null;
  template?: string;
  audience_type: NewsletterAudienceType;
  audience_ids?: number[] | null;
  segment_criteria?: Record<string, unknown> | null;
  status: NewsletterStatus;
  sent_by?: NewsletterSender | null;
  scheduled_at?: string | null;
  sent_at?: string | null;
  completed_at?: string | null;
  recipient_count: number;
  delivered_count: number;
  failed_count: number;
  opened_count: number;
  clicked_count: number;
  error_log?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Requests ────────────────────────────────────────────────────────

export interface CreateNewsletterRequest {
  blog_post_id: number;
  subject?: string;
  preview_text?: string;
  template?: string;
  audience_type: NewsletterAudienceType;
  audience_ids?: number[];
  segment_criteria?: Record<string, unknown>;
}

export interface CalculateTargetsRequest {
  audience_type: NewsletterAudienceType;
  audience_ids?: number[];
  segment_criteria?: Record<string, unknown>;
}

export interface ScheduleNewsletterRequest {
  scheduled_at: string;
}

export interface TestNewsletterRequest {
  email: string;
}

// ─── Responses ───────────────────────────────────────────────────────

// NOTE: Response payloads below represent the inner `data` of the
// standard envelope ({ success, message, data }) applied by ApiResponse<T>.

export interface NewsletterListData {
  items: NewsletterCampaign[];
  pagination: BlogPagination;
}

export interface NewsletterSingleData {
  campaign: NewsletterCampaign;
}

export interface NewsletterCreatedData {
  campaign: NewsletterCampaign;
}

export interface CalculateTargetsData {
  audience_type: NewsletterAudienceType;
  total_recipients: number;
  preview: Array<Record<string, unknown>>;
}

export interface NewsletterPreviewData {
  subject: string;
  html: string;
  post_url: string;
}

export interface NewsletterSendData {
  [key: string]: unknown;
}

export interface NewsletterRecipient {
  id: number;
  campaign_id: number;
  user_id?: number | null;
  email: string;
  status: NewsletterRecipientStatus;
  error_message?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  opened_at?: string | null;
  clicked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterRecipientsData {
  items: NewsletterRecipient[];
  pagination: BlogPagination;
}

export interface NewsletterStats {
  total_recipients: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  success_rate: number;
  open_rate: number;
  click_rate: number;
}

export interface NewsletterStatsData {
  campaign: NewsletterCampaign;
  stats: NewsletterStats;
}

// ─── Filters ─────────────────────────────────────────────────────────

export interface NewsletterFilters {
  status?: NewsletterStatus;
  blog_post_id?: number;
  search?: string;
  sort?: 'newest' | 'oldest';
}
