/**
 * Blog Service
 * Handles public + admin/manager blog operations
 * Base URL: /api/v1 (via api-client)
 */

import { apiClient } from './api-client';
import type { ApiResponse } from '@/types/api.types';
import type {
  AdminCategoriesData,
  AdminCategoryData,
  AdminCategoryPayload,
  AdminPostData,
  AdminPostFilters,
  AdminPostPayload,
  AdminPostsData,
  AdminTagsData,
  AdminTagData,
  AdminTagPayload,
  AdminTaxonomyFilters,
  BlogAnalytics,
  BlogCategoriesData,
  BlogCategoryPostsData,
  BlogDashboardOverview,
  BlogItemsData,
  BlogListData,
  BlogPost,
  BlogPostData,
  BlogRelatedData,
  BlogTagsData,
  BlogTagPostsData,
  ImageUploadData,
  NewsletterSubscribeData,
  NewsletterSubscribeRequest,
  PublicPostFilters,
} from '@/types/blog.types';
import type {
  BlogCommentListData,
  BlogEngagementSummary,
  BlogLikeStatusResponse,
  BlogLikeToggleResponse,
  BlogCommentReactStatusResponse,
  BlogCommentReactResponse,
  CreateBlogCommentRequest,
  CreateBlogRatingRequest,
} from '@/types/blog-engagement.types';

const PUBLIC_BLOG = '/public/blog';
const ADMIN_BLOG = '/admin/blog';
const PUBLIC_NEWSLETTER = '/public/newsletter';

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

class BlogService {
  // ─── Public: Posts ──────────────────────────────────────────────────

  /**
   * List published posts (public)
   * GET /public/blog/posts
   */
  getPosts(
    filters: PublicPostFilters = {},
    page: number = 1,
    perPage: number = 12
  ): Promise<ApiResponse<BlogListData>> {
    const qs = buildQuery({
      search: filters.search,
      category: filters.category,
      tag: filters.tag,
      featured: filters.featured === undefined ? undefined : filters.featured,
      sort: filters.sort,
      page,
      per_page: Math.min(perPage, 100),
    });
    return apiClient.get<BlogListData>(`${PUBLIC_BLOG}/posts${qs}`);
  }

  /**
   * Search published posts (public)
   * GET /public/blog/posts/search?search=
   */
  searchPosts(
    search: string,
    page: number = 1,
    perPage: number = 12
  ): Promise<ApiResponse<BlogListData>> {
    const qs = buildQuery({ search, page, per_page: Math.min(perPage, 100) });
    return apiClient.get<BlogListData>(`${PUBLIC_BLOG}/posts/search${qs}`);
  }

  /** GET /public/blog/posts/featured */
  getFeatured(): Promise<ApiResponse<BlogItemsData>> {
    return apiClient.get<BlogItemsData>(`${PUBLIC_BLOG}/posts/featured`);
  }

  /** GET /public/blog/posts/latest */
  getLatest(): Promise<ApiResponse<BlogItemsData>> {
    return apiClient.get<BlogItemsData>(`${PUBLIC_BLOG}/posts/latest`);
  }

  /** GET /public/blog/posts/popular */
  getPopular(): Promise<ApiResponse<BlogItemsData>> {
    return apiClient.get<BlogItemsData>(`${PUBLIC_BLOG}/posts/popular`);
  }

  /**
   * Single published article (public) — increments view_count.
   * Only call on the actual article view.
   * GET /public/blog/posts/{slug}
   */
  getPostBySlug(slug: string): Promise<ApiResponse<BlogPostData>> {
    return apiClient.get<BlogPostData>(
      `${PUBLIC_BLOG}/posts/${encodeURIComponent(slug)}`
    );
  }

  /** GET /public/blog/posts/{slug}/related */
  getRelatedPosts(slug: string): Promise<ApiResponse<BlogRelatedData>> {
    return apiClient.get<BlogRelatedData>(
      `${PUBLIC_BLOG}/posts/${encodeURIComponent(slug)}/related`
    );
  }

  // ─── Public: Categories & Tags ──────────────────────────────────────

  /** GET /public/blog/categories */
  getCategories(): Promise<ApiResponse<BlogCategoriesData>> {
    return apiClient.get<BlogCategoriesData>(`${PUBLIC_BLOG}/categories`);
  }

  /** GET /public/blog/categories/{slug}/posts */
  getCategoryPosts(
    slug: string,
    page: number = 1,
    perPage: number = 12
  ): Promise<ApiResponse<BlogCategoryPostsData>> {
    const qs = buildQuery({ page, per_page: Math.min(perPage, 100) });
    return apiClient.get<BlogCategoryPostsData>(
      `${PUBLIC_BLOG}/categories/${encodeURIComponent(slug)}/posts${qs}`
    );
  }

  /** GET /public/blog/tags */
  getTags(): Promise<ApiResponse<BlogTagsData>> {
    return apiClient.get<BlogTagsData>(`${PUBLIC_BLOG}/tags`);
  }

  /** GET /public/blog/tags/{slug}/posts */
  getTagPosts(
    slug: string,
    page: number = 1,
    perPage: number = 12
  ): Promise<ApiResponse<BlogTagPostsData>> {
    const qs = buildQuery({ page, per_page: Math.min(perPage, 100) });
    return apiClient.get<BlogTagPostsData>(
      `${PUBLIC_BLOG}/tags/${encodeURIComponent(slug)}/posts${qs}`
    );
  }

  // ─── Public: Newsletter subscription ────────────────────────────────

  /** POST /public/newsletter/subscribe */
  subscribeNewsletter(
    payload: NewsletterSubscribeRequest
  ): Promise<ApiResponse<NewsletterSubscribeData>> {
    return apiClient.post<NewsletterSubscribeData>(
      `${PUBLIC_NEWSLETTER}/subscribe`,
      payload
    );
  }

  /**
   * GET /public/newsletter/unsubscribe?token=... (or ?email=...)
   */
  unsubscribeNewsletter(params: {
    token?: string;
    email?: string;
  }): Promise<ApiResponse<{ message?: string }>> {
    const qs = buildQuery(params);
    return apiClient.get<{ message?: string }>(
      `${PUBLIC_NEWSLETTER}/unsubscribe${qs}`
    );
  }

  // ─── Admin: Dashboard ───────────────────────────────────────────────

  /** GET /admin/blog/dashboard/overview */
  async getDashboardOverview(): Promise<ApiResponse<BlogDashboardOverview>> {
    const res = await apiClient.get<BlogDashboardOverview>(
      `${ADMIN_BLOG}/dashboard/overview`
    );
    return this.normalizeDashboardOverview(res);
  }

  /**
   * The backend returns all overview counts nested under `data.counts`
   * (`total_posts`, `total_views`, `categories`, `tags`, `subscribers`, ...).
   * Map them into the flattened BlogDashboardOverview the UI consumes.
   */
  private normalizeDashboardOverview(
    res: ApiResponse<BlogDashboardOverview>
  ): ApiResponse<BlogDashboardOverview> {
    const raw = res?.data as unknown;
    if (!raw || typeof raw !== 'object') return res;

    const record = raw as Record<string, unknown>;
    const counts =
      record.counts && typeof record.counts === 'object'
        ? (record.counts as Record<string, number>)
        : null;
    if (!counts) return res;

    const normalized: BlogDashboardOverview = {
      posts: {
        total: counts.total_posts,
        published: counts.published,
        drafts: counts.drafts,
        scheduled: counts.scheduled,
        archived: counts.archived,
        featured: counts.featured,
        total_comments: counts.total_comments,
        total_ratings: counts.total_ratings,
        avg_rating: counts.avg_rating,
        total_likes: counts.total_likes,
      },
      categories: counts.categories,
      tags: counts.tags,
      newsletter_subscribers: counts.subscribers,
      total_views: counts.total_views,
      recent_posts: (record.recent_posts as BlogDashboardOverview['recent_posts']) || undefined,
      recent_campaigns:
        (record.recent_campaigns as BlogDashboardOverview['recent_campaigns']) || undefined,
      popular_posts: (record.popular_posts as BlogDashboardOverview['popular_posts']) || undefined,
    };

    return { ...res, data: normalized };
  }

  /** GET /admin/blog/dashboard/analytics?months= */
  getDashboardAnalytics(months: number = 6): Promise<ApiResponse<BlogAnalytics>> {
    return apiClient.get<BlogAnalytics>(
      `${ADMIN_BLOG}/dashboard/analytics?months=${months}`
    );
  }

  // ─── Admin: Image Upload ────────────────────────────────────────────

  /**
   * POST /admin/blog/images/upload (multipart/form-data)
   * Pass a FormData body containing `image` (+ optional `type`).
   */
  uploadImage(
    file: File,
    type: 'cover' | 'inline' = 'inline'
  ): Promise<ApiResponse<ImageUploadData>> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    return apiClient.post<ImageUploadData>(
      `${ADMIN_BLOG}/images/upload`,
      formData
    );
  }

  // ─── Admin: Categories ──────────────────────────────────────────────

  /** GET /admin/blog/categories */
  listCategories(
    filters: AdminTaxonomyFilters = {},
    page: number = 1,
    perPage: number = 15
  ): Promise<ApiResponse<AdminCategoriesData>> {
    const qs = buildQuery({
      search: filters.search,
      is_active: filters.is_active === undefined ? undefined : filters.is_active,
      sort: filters.sort,
      page,
      per_page: Math.min(perPage, 100),
    });
    return apiClient.get<AdminCategoriesData>(`${ADMIN_BLOG}/categories${qs}`);
  }

  /** POST /admin/blog/categories */
  createCategory(payload: AdminCategoryPayload): Promise<ApiResponse<AdminCategoryData>> {
    return apiClient.post<AdminCategoryData>(`${ADMIN_BLOG}/categories`, payload);
  }

  /** GET /admin/blog/categories/{id} */
  getCategory(id: number): Promise<ApiResponse<AdminCategoryData>> {
    return apiClient.get<AdminCategoryData>(`${ADMIN_BLOG}/categories/${id}`);
  }

  /** PUT /admin/blog/categories/{id} */
  updateCategory(
    id: number,
    payload: AdminCategoryPayload
  ): Promise<ApiResponse<AdminCategoryData>> {
    return apiClient.put<AdminCategoryData>(`${ADMIN_BLOG}/categories/${id}`, payload);
  }

  /** DELETE /admin/blog/categories/{id} */
  deleteCategory(id: number): Promise<ApiResponse<{ message?: string }>> {
    return apiClient.delete<{ message?: string }>(`${ADMIN_BLOG}/categories/${id}`);
  }

  // ─── Admin: Tags ────────────────────────────────────────────────────

  /** GET /admin/blog/tags */
  listTags(
    filters: AdminTaxonomyFilters = {},
    page: number = 1,
    perPage: number = 15
  ): Promise<ApiResponse<AdminTagsData>> {
    const qs = buildQuery({
      search: filters.search,
      is_active: filters.is_active === undefined ? undefined : filters.is_active,
      sort: filters.sort,
      page,
      per_page: Math.min(perPage, 100),
    });
    return apiClient.get<AdminTagsData>(`${ADMIN_BLOG}/tags${qs}`);
  }

  /** POST /admin/blog/tags */
  createTag(payload: AdminTagPayload): Promise<ApiResponse<AdminTagData>> {
    return apiClient.post<AdminTagData>(`${ADMIN_BLOG}/tags`, payload);
  }

  /** GET /admin/blog/tags/{id} */
  getTag(id: number): Promise<ApiResponse<AdminTagData>> {
    return apiClient.get<AdminTagData>(`${ADMIN_BLOG}/tags/${id}`);
  }

  /** PUT /admin/blog/tags/{id} */
  updateTag(id: number, payload: AdminTagPayload): Promise<ApiResponse<AdminTagData>> {
    return apiClient.put<AdminTagData>(`${ADMIN_BLOG}/tags/${id}`, payload);
  }

  /** DELETE /admin/blog/tags/{id} */
  deleteTag(id: number): Promise<ApiResponse<{ message?: string }>> {
    return apiClient.delete<{ message?: string }>(`${ADMIN_BLOG}/tags/${id}`);
  }

  // ─── Admin: Posts ───────────────────────────────────────────────────

  /** GET /admin/blog/posts */
  listPosts(
    filters: AdminPostFilters = {},
    page: number = 1,
    perPage: number = 15
  ): Promise<ApiResponse<AdminPostsData>> {
    const qs = buildQuery({
      search: filters.search,
      category_id: filters.category_id,
      tag_id: filters.tag_id,
      author_id: filters.author_id,
      status: filters.status,
      is_featured: filters.is_featured === undefined ? undefined : filters.is_featured,
      sort: filters.sort,
      page,
      per_page: Math.min(perPage, 100),
    });
    return apiClient.get<AdminPostsData>(`${ADMIN_BLOG}/posts${qs}`);
  }

  /**
   * Normalize a single-post admin response into the `{ post }` shape.
   * The backend may return the post directly in `data` OR wrapped as
   * `{ post: {...} }`. This ensures `res.data.post` is always available.
   */
  private normalizePostResponse(res: ApiResponse<AdminPostData>): ApiResponse<AdminPostData> {
    const data = res?.data as unknown;
    if (
      data &&
      typeof data === 'object' &&
      !('post' in (data as Record<string, unknown>)) &&
      ('id' in (data as Record<string, unknown>) ||
        'slug' in (data as Record<string, unknown>))
    ) {
      return { ...res, data: { post: data as BlogPost } };
    }
    return res;
  }

  /** POST /admin/blog/posts */
  async createPost(payload: AdminPostPayload): Promise<ApiResponse<AdminPostData>> {
    const res = await apiClient.post<AdminPostData>(`${ADMIN_BLOG}/posts`, payload);
    return this.normalizePostResponse(res);
  }

  /** GET /admin/blog/posts/{id} */
  async getPostById(id: number): Promise<ApiResponse<AdminPostData>> {
    const res = await apiClient.get<AdminPostData>(`${ADMIN_BLOG}/posts/${id}`);
    return this.normalizePostResponse(res);
  }

  /** PUT /admin/blog/posts/{id} */
  async updatePost(
    id: number,
    payload: Partial<AdminPostPayload>
  ): Promise<ApiResponse<AdminPostData>> {
    const res = await apiClient.put<AdminPostData>(`${ADMIN_BLOG}/posts/${id}`, payload);
    return this.normalizePostResponse(res);
  }

  /** DELETE /admin/blog/posts/{id} (soft delete) */
  deletePost(id: number): Promise<ApiResponse<{ message?: string }>> {
    return apiClient.delete<{ message?: string }>(`${ADMIN_BLOG}/posts/${id}`);
  }

  /** POST /admin/blog/posts/{id}/publish */
  async publishPost(id: number): Promise<ApiResponse<AdminPostData>> {
    const res = await apiClient.post<AdminPostData>(`${ADMIN_BLOG}/posts/${id}/publish`);
    return this.normalizePostResponse(res);
  }

  /** POST /admin/blog/posts/{id}/schedule */
  async schedulePost(id: number, scheduledFor: string): Promise<ApiResponse<AdminPostData>> {
    const res = await apiClient.post<AdminPostData>(`${ADMIN_BLOG}/posts/${id}/schedule`, {
      scheduled_for: scheduledFor,
    });
    return this.normalizePostResponse(res);
  }

  /** POST /admin/blog/posts/{id}/archive */
  async archivePost(id: number): Promise<ApiResponse<AdminPostData>> {
    const res = await apiClient.post<AdminPostData>(`${ADMIN_BLOG}/posts/${id}/archive`);
    return this.normalizePostResponse(res);
  }

  /** POST /admin/blog/posts/{id}/feature */
  async featurePost(id: number, isFeatured: boolean): Promise<ApiResponse<AdminPostData>> {
    const res = await apiClient.post<AdminPostData>(`${ADMIN_BLOG}/posts/${id}/feature`, {
      is_featured: isFeatured,
    });
    return this.normalizePostResponse(res);
  }

  // ─── Public: Comments, Ratings & Reviews ───────────────────────────

  /**
   * Get per-article engagement aggregates (rating count, average, star
   * distribution, comment count) — public, no auth.
   * GET /public/blog/posts/{slug}/engagement
   */
  async getEngagement(slug: string): Promise<ApiResponse<BlogEngagementSummary>> {
    const res = await apiClient.get<BlogEngagementSummary>(
      `${PUBLIC_BLOG}/posts/${encodeURIComponent(slug)}/engagement`
    );
    return this.normalizeEngagementResponse(res);
  }

  /**
   * List public comments for an article (threaded) — public, no auth.
   * GET /public/blog/posts/{slug}/comments
   */
  async getComments(
    slug: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<ApiResponse<BlogCommentListData>> {
    const qs = buildQuery({ page, per_page: Math.min(perPage, 100) });
    return apiClient.get<BlogCommentListData>(
      `${PUBLIC_BLOG}/posts/${encodeURIComponent(slug)}/comments${qs}`
    );
  }

  /**
   * Post a comment on an article — requires a signed-in user's Bearer token.
   * POST /public/blog/posts/{slug}/comments
   */
  async createComment(
    slug: string,
    payload: CreateBlogCommentRequest
  ): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>(
      `${PUBLIC_BLOG}/posts/${encodeURIComponent(slug)}/comments`,
      payload
    );
  }

  /**
   * Create or update the authenticated user's rating (1–5) with an optional
   * review — requires auth. Upsert: one rating per user per post.
   * POST /public/blog/posts/{slug}/rating   (singular — plural /ratings is GET-only)
   */
  async createRating(
    slug: string,
    payload: CreateBlogRatingRequest
  ): Promise<ApiResponse<unknown>> {
    return apiClient.post<unknown>(
      `${PUBLIC_BLOG}/posts/${encodeURIComponent(slug)}/rating`,
      payload
    );
  }

  // ─── Public: Likes ────────────────────────────────────────────────

  /**
   * Toggle like on a blog post (authenticated or anonymous).
   * POST /public/blog/posts/{slug}/like
   */
  async togglePostLike(
    slug: string,
    guestToken?: string | null
  ): Promise<ApiResponse<BlogLikeToggleResponse>> {
    return apiClient.post<BlogLikeToggleResponse>(
      `${PUBLIC_BLOG}/posts/${encodeURIComponent(slug)}/like`,
      { guest_token: guestToken }
    );
  }

  /**
   * Check if the current user/guest has liked the post.
   * GET /public/blog/posts/{slug}/like/status
   */
  async getPostLikeStatus(
    slug: string,
    guestToken?: string | null
  ): Promise<ApiResponse<BlogLikeStatusResponse>> {
    const qs = guestToken ? `?guest_token=${encodeURIComponent(guestToken)}` : '';
    return apiClient.get<BlogLikeStatusResponse>(
      `${PUBLIC_BLOG}/posts/${encodeURIComponent(slug)}/like/status${qs}`
    );
  }

  /**
   * Toggle like/dislike on a comment.
   * POST /public/blog/comments/{commentId}/react
   */
  async toggleCommentReact(
    commentId: number,
    reaction: 'like' | 'dislike',
    guestToken?: string | null
  ): Promise<ApiResponse<BlogCommentReactResponse>> {
    return apiClient.post<BlogCommentReactResponse>(
      `${PUBLIC_BLOG}/comments/${commentId}/react`,
      { reaction, guest_token: guestToken }
    );
  }

  /**
   * Check the current user/guest reaction on a comment.
   * GET /public/blog/comments/{commentId}/react/status
   */
  async getCommentReactStatus(
    commentId: number,
    guestToken?: string | null
  ): Promise<ApiResponse<BlogCommentReactStatusResponse>> {
    const qs = guestToken ? `?guest_token=${encodeURIComponent(guestToken)}` : '';
    return apiClient.get<BlogCommentReactStatusResponse>(
      `${PUBLIC_BLOG}/comments/${commentId}/react/status${qs}`
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  /** Get or create a guest token for anonymous engagement tracking. */
  getGuestToken(): string {
    if (typeof window === 'undefined') return '';
    const key = 'remopay_blog_guest_token';
    let token = localStorage.getItem(key);
    if (! token) {
      token = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, token);
    }
    return token;
  }

  /**
   * Normalize the engagement summary response. The backend may return the
   * summary directly in `data`, OR wrapped as `{ engagement: {...} }` or
   * `{ summary: {...} }`, and uses slightly different field names
   * (`rating_avg`, `my_rating`) than the frontend contract (`average_rating`,
   * `user_rating`). Map everything to a single BlogEngagementSummary shape.
   */
  private normalizeEngagementResponse(
    res: ApiResponse<BlogEngagementSummary>
  ): ApiResponse<BlogEngagementSummary> {
    const raw = res?.data as unknown;
    if (!raw || typeof raw !== 'object') return res;

    const record = raw as Record<string, unknown>;

    // Backend may wrap the payload as `{ engagement: {...} }` or `{ summary: {...} }`,
    // or return the summary fields directly.
    const nested =
      record.engagement && typeof record.engagement === 'object'
        ? (record.engagement as Record<string, unknown>)
        : record.summary && typeof record.summary === 'object'
          ? (record.summary as Record<string, unknown>)
          : record;

    const myRating =
      typeof nested.my_rating === 'object' && nested.my_rating
        ? (nested.my_rating as Record<string, unknown>)
        : null;

    const summary: BlogEngagementSummary = {
      post_id: typeof nested.post_id === 'number' ? nested.post_id : undefined,
      rating_count: typeof nested.rating_count === 'number' ? nested.rating_count : 0,
      average_rating:
        typeof nested.average_rating === 'number'
          ? nested.average_rating
          : typeof nested.rating_avg === 'number'
            ? nested.rating_avg
            : 0,
      comment_count: typeof nested.comment_count === 'number' ? nested.comment_count : 0,
      like_count: typeof nested.like_count === 'number' ? nested.like_count : 0,
      liked: typeof nested.liked === 'boolean' ? nested.liked : false,
      rating_distribution:
        (nested.rating_distribution as Record<string | number, number> | undefined) ?? {},
      user_rating:
        typeof nested.user_rating === 'number'
          ? (nested.user_rating as BlogEngagementSummary['user_rating'])
          : myRating && typeof myRating.rating === 'number'
            ? (myRating.rating as BlogEngagementSummary['user_rating'])
            : null,
      latest_review:
        typeof nested.latest_review === 'string' ? nested.latest_review : null,
    };

    return { ...res, data: summary };
  }
}

export const blogService = new BlogService();
export default blogService;
