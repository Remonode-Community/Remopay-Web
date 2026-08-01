/**
 * Newsletter Service
 * Handles admin/manager newsletter campaign operations
 * Base URL: /api/v1/admin/blog/newsletter
 */

import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  CalculateTargetsData,
  CalculateTargetsRequest,
  CreateNewsletterRequest,
  NewsletterCreatedData,
  NewsletterFilters,
  NewsletterListData,
  NewsletterPreviewData,
  NewsletterRecipientsData,
  NewsletterSendData,
  NewsletterSingleData,
  NewsletterStatsData,
  ScheduleNewsletterRequest,
  TestNewsletterRequest,
} from '@/types/newsletter.types';

const BASE_URL = '/admin/blog/newsletter';

/** Build query string from a params object, skipping empty values. */
function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

class NewsletterService {
  /**
   * Campaign history (paginated)
   * GET /admin/blog/newsletter
   */
  listNewsletters(
    filters: NewsletterFilters = {},
    page: number = 1,
    perPage: number = 15
  ): Promise<ApiResponse<NewsletterListData>> {
    const qs = buildQuery({
      status: filters.status,
      blog_post_id: filters.blog_post_id,
      search: filters.search,
      sort: filters.sort,
      page,
      per_page: Math.min(perPage, 100),
    });
    return apiClient.get<NewsletterListData>(`${BASE_URL}${qs}`);
  }

  /**
   * Create a campaign (draft)
   * POST /admin/blog/newsletter
   */
  createNewsletter(
    payload: CreateNewsletterRequest
  ): Promise<ApiResponse<NewsletterCreatedData>> {
    return apiClient.post<NewsletterCreatedData>(BASE_URL, payload);
  }

  /**
   * Preview audience size
   * POST /admin/blog/newsletter/calculate-targets
   */
  calculateTargets(
    payload: CalculateTargetsRequest
  ): Promise<ApiResponse<CalculateTargetsData>> {
    return apiClient.post<CalculateTargetsData>(
      `${BASE_URL}/calculate-targets`,
      payload
    );
  }

  /**
   * Campaign detail
   * GET /admin/blog/newsletter/{id}
   */
  getNewsletter(id: number): Promise<ApiResponse<NewsletterSingleData>> {
    return apiClient.get<NewsletterSingleData>(`${BASE_URL}/${id}`);
  }

  /**
   * Send immediately (async/queued)
   * POST /admin/blog/newsletter/{id}/send
   */
  sendNewsletter(id: number): Promise<ApiResponse<NewsletterSendData>> {
    return apiClient.post<NewsletterSendData>(`${BASE_URL}/${id}/send`);
  }

  /**
   * Schedule a send
   * POST /admin/blog/newsletter/{id}/schedule
   */
  scheduleNewsletter(
    id: number,
    scheduledAt: string
  ): Promise<ApiResponse<NewsletterSendData>> {
    const payload: ScheduleNewsletterRequest = { scheduled_at: scheduledAt };
    return apiClient.post<NewsletterSendData>(
      `${BASE_URL}/${id}/schedule`,
      payload
    );
  }

  /**
   * Cancel a scheduled send
   * POST /admin/blog/newsletter/{id}/cancel
   */
  cancelNewsletter(id: number): Promise<ApiResponse<NewsletterSendData>> {
    return apiClient.post<NewsletterSendData>(`${BASE_URL}/${id}/cancel`);
  }

  /**
   * Rendered HTML preview
   * POST /admin/blog/newsletter/{id}/preview
   */
  previewNewsletter(id: number): Promise<ApiResponse<NewsletterPreviewData>> {
    return apiClient.post<NewsletterPreviewData>(`${BASE_URL}/${id}/preview`);
  }

  /**
   * Send a test email
   * POST /admin/blog/newsletter/{id}/test
   */
  testNewsletter(
    id: number,
    email: string
  ): Promise<ApiResponse<NewsletterSendData>> {
    const payload: TestNewsletterRequest = { email };
    return apiClient.post<NewsletterSendData>(`${BASE_URL}/${id}/test`, payload);
  }

  /**
   * Paginated recipient delivery log
   * GET /admin/blog/newsletter/{id}/recipients
   */
  getRecipients(
    id: number,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiResponse<NewsletterRecipientsData>> {
    const qs = buildQuery({ page, per_page: Math.min(perPage, 100) });
    return apiClient.get<NewsletterRecipientsData>(
      `${BASE_URL}/${id}/recipients${qs}`
    );
  }

  /**
   * Delivery statistics
   * GET /admin/blog/newsletter/{id}/stats
   */
  getStats(id: number): Promise<ApiResponse<NewsletterStatsData>> {
    return apiClient.get<NewsletterStatsData>(`${BASE_URL}/${id}/stats`);
  }
}

export const newsletterService = new NewsletterService();
export default newsletterService;
