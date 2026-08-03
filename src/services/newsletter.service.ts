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

/**
 * Normalize a single-campaign response into the `{ campaign }` shape.
 * The backend may return the campaign object directly in `data` OR wrapped as
 * `{ campaign: {...} }`. Ensures `res.data.campaign` is always available.
 */
function normalizeCampaignData<T extends { campaign?: unknown }>(
  res: ApiResponse<T>
): ApiResponse<T> {
  const data = res?.data as unknown;
  if (
    data &&
    typeof data === 'object' &&
    !('campaign' in (data as Record<string, unknown>)) &&
    ('id' in (data as Record<string, unknown>) ||
      'subject' in (data as Record<string, unknown>))
  ) {
    return { ...res, data: { campaign: data } as T };
  }
  return res;
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
  async createNewsletter(
    payload: CreateNewsletterRequest
  ): Promise<ApiResponse<NewsletterCreatedData>> {
    const res = await apiClient.post<NewsletterCreatedData>(BASE_URL, payload);
    return normalizeCampaignData(res);
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
  async getNewsletter(id: number): Promise<ApiResponse<NewsletterSingleData>> {
    const res = await apiClient.get<NewsletterSingleData>(`${BASE_URL}/${id}`);
    return normalizeCampaignData(res);
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
   * Retry a failed / partially-failed send — resets failed recipients and
   * re-queues them. No body.
   * POST /admin/blog/newsletter/{id}/retry
   * Success: campaign with status "sending" (or "sent" once the queue drains).
   * Error 422: `data.message` e.g. "Only failed or partially failed campaigns
   * can be retried." / "No failed recipients to retry."
   */
  async retryNewsletter(id: number): Promise<ApiResponse<NewsletterSingleData>> {
    const res = await apiClient.post<NewsletterSingleData>(`${BASE_URL}/${id}/retry`);
    return normalizeCampaignData(res);
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
  async getStats(id: number): Promise<ApiResponse<NewsletterStatsData>> {
    const res = await apiClient.get<NewsletterStatsData>(`${BASE_URL}/${id}/stats`);
    return normalizeCampaignData(res);
  }
}

export const newsletterService = new NewsletterService();
export default newsletterService;
