/**
 * Blog Engagement Types — Comments, Ratings & Reviews, Likes
 * Date: September 15, 2026
 */

import type { BlogPagination } from './blog.types';
import type { ApiResponse } from './api.types';

// ─── Comment ─────────────────────────────────────────────────────────

export type BlogCommentStatus = 'approved' | 'pending' | 'rejected';

export interface BlogCommentAuthor {
  id: number;
  first_name: string;
  last_name: string;
  profile_photo_url?: string | null;
}

/** Single comment (may include nested replies for threading). */
export interface BlogComment {
  id: number;
  body: string;
  user: BlogCommentAuthor | null;
  parent_id?: number | null;
  status?: BlogCommentStatus;
  is_guest: boolean;
  guest_name?: string | null;
  author_name: string;
  like_count: number;
  dislike_count: number;
  replies?: BlogComment[];
  created_at: string;
  updated_at?: string;
  edited_at?: string | null;
}

export interface BlogCommentListData {
  items: BlogComment[];
  pagination: BlogPagination;
}

export interface CreateBlogCommentRequest {
  body: string;
  parent_id?: number;
  guest_name?: string;
  guest_email?: string;
}

// ─── Rating / Review ─────────────────────────────────────────────────

export type BlogRatingValue = 1 | 2 | 3 | 4 | 5;

export interface BlogRating {
  id: number;
  rating: BlogRatingValue;
  review?: string | null;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    profile_photo_url?: string | null;
  } | null;
  created_at: string;
}

/** Per-article aggregates returned by the public engagement endpoint. */
export interface BlogEngagementSummary {
  post_id?: number;
  rating_count: number;
  average_rating: number;
  comment_count: number;
  like_count: number;
  liked: boolean;
  /** star distribution: key = 1..5, value = number of ratings */
  rating_distribution?: Record<string | number, number>;
  /** current authenticated user's rating for this post, if any */
  user_rating?: number | null;
  /** optional latest review snippet */
  latest_review?: string | null;
}

export interface CreateBlogRatingRequest {
  rating: BlogRatingValue;
  /** Optional short headline (max 191 chars). */
  title?: string;
  /** Optional review body (max 5000 chars). */
  review?: string;
}

// ─── Likes ───────────────────────────────────────────────────────────

export interface BlogLikeToggleResponse {
  liked: boolean;
  like_count: number;
}

export interface BlogLikeStatusResponse {
  liked: boolean;
  like_count: number;
}

export interface BlogCommentReactResponse {
  reaction: 'like' | 'dislike' | null;
  like_count: number;
  dislike_count: number;
}

export interface BlogCommentReactStatusResponse {
  reaction: 'like' | 'dislike' | null;
  like_count: number;
  dislike_count: number;
}

// ─── Response Envelopes ──────────────────────────────────────────────

export interface BlogEngagementResponse extends ApiResponse<BlogEngagementSummary> {}
export interface BlogCommentsResponse extends ApiResponse<BlogCommentListData> {}
export interface BlogCommentCreateResponse
  extends ApiResponse<{ comment: BlogComment } | BlogComment> {}
export interface BlogRatingCreateResponse
  extends ApiResponse<{ rating: BlogRating } | BlogRating | { summary: BlogEngagementSummary }> {}
export interface BlogPostLikeToggleResponse extends ApiResponse<BlogLikeToggleResponse> {}
export interface BlogPostLikeStatusResponse extends ApiResponse<BlogLikeStatusResponse> {}
export interface BlogCommentReactToggleResponse extends ApiResponse<BlogCommentReactResponse> {}
export interface BlogCommentReactStatusResponse extends ApiResponse<BlogCommentReactStatusResponse> {}
