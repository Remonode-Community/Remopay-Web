/**
 * Blog & Newsletter Management Types
 * Based on the Remopay Blog & Newsletter Management System API (v1.0)
 *
 * NOTE: Response types below represent the inner `data` payload of the
 * standard envelope ({ success, message, data }). The envelope itself is
 * applied by `ApiResponse<T>` from `./api.types`.
 */

// ─── Content Blocks ──────────────────────────────────────────────────
// Article `content` is a JSON array of typed blocks. Every block has a
// valid `type` and a `data` object.

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type ListStyle = 'ordered' | 'unordered';
export type CalloutType = 'info' | 'warning' | 'success' | 'danger';

export interface HeadingBlockData {
  level: HeadingLevel;
  text: string;
}

export interface ParagraphBlockData {
  text: string;
}

export interface ListBlockData {
  style: ListStyle;
  items: string[];
}

export interface QuoteBlockData {
  text: string;
  caption?: string;
}

export interface CodeBlockData {
  code: string;
  language?: string;
}

export interface TableBlockData {
  columns: string[];
  rows: string[][];
}

export interface ImageBlockData {
  url: string;
  alt?: string;
  caption?: string;
}

export interface VideoBlockData {
  url: string;
  caption?: string;
}

export interface CalloutBlockData {
  type: CalloutType;
  text: string;
}

export interface LinkBlockData {
  text: string;
  url: string;
}

export interface DividerBlockData {
  // No required fields
  [key: string]: unknown;
}

export type ContentBlockData =
  | HeadingBlockData
  | ParagraphBlockData
  | ListBlockData
  | QuoteBlockData
  | CodeBlockData
  | TableBlockData
  | ImageBlockData
  | VideoBlockData
  | CalloutBlockData
  | LinkBlockData
  | DividerBlockData;

export type ContentBlockType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'quote'
  | 'code'
  | 'table'
  | 'image'
  | 'video'
  | 'callout'
  | 'link'
  | 'divider';

export interface ContentBlock {
  type: ContentBlockType;
  data: ContentBlockData;
}

// ─── Enums / Status ──────────────────────────────────────────────────

export type ArticleStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export type BlogSort =
  | 'newest'
  | 'oldest'
  | 'title_asc'
  | 'title_desc'
  | 'views'
  | 'updated';

// ─── Entities ────────────────────────────────────────────────────────

export interface BlogAuthor {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  profile_photo_url?: string | null;
}

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  seo?: Record<string, unknown> | null;
  is_active: boolean;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPostMetaTag {
  name: string;
  content: string;
}

export interface BlogSeo {
  title: string | null;
  description: string | null;
  /** Backend may return keywords as a comma-separated string OR an array. */
  keywords: string | string[] | null;
  canonical_url: string | null;
  og_meta: Record<string, unknown> | null;
  twitter_meta: Record<string, unknown> | null;
}

export interface BlogPostJsonLd {
  article?: Record<string, unknown>;
  breadcrumbs?: Record<string, unknown>;
}

/** List item shape (excludes `content` for performance). */
export interface BlogPostListItem {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  cover_image: string | null;
  featured_image: string | null;
  is_featured: boolean;
  status: ArticleStatus;
  published_at: string | null;
  read_time: number;
  view_count: number;
  like_count?: number;
  categories?: BlogCategory[];
  tags?: BlogTag[];
  author?: BlogAuthor | null;
}

/** Full article shape (includes `content`, `content_html`, `seo`, `url`, `meta_tags`, `json_ld`). */
export interface BlogPost extends BlogPostListItem {
  /**
   * Article body — sanitized WYSIWYG HTML (new model). Legacy JSON-block
   * articles are auto-converted by the backend, but we keep the union for
   * defensive handling of any cached/older payloads.
   */
  content: string | ContentBlock[];
  /**
   * Server-rendered, sanitized HTML for the article body (wrapped in
   * `<div class="blog-content">`). Preferred for SSR/SEO injection.
   */
  content_html?: string | null;
  seo?: BlogSeo | null;
  url?: string | null;
  meta_tags?: BlogPostMetaTag[];
  json_ld?: BlogPostJsonLd | null;
  newsletter_eligible?: boolean;
  newsletter_sent_at?: string | null;
  scheduled_for?: string | null;
  category_ids?: number[];
  tag_ids?: number[];
  related_post_ids?: number[];
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  canonical_url?: string | null;
  og_meta?: Record<string, unknown> | null;
  twitter_meta?: Record<string, unknown> | null;
  created_by?: number | null;
  updated_by?: number | null;
  published_by?: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Pagination ──────────────────────────────────────────────────────

export interface BlogPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedItems<T> {
  items: T[];
  pagination: BlogPagination;
}

// ─── API Response Payloads (the `data` inside ApiResponse) ───────────

export interface BlogListData {
  items: BlogPostListItem[];
  pagination: BlogPagination;
}

export interface BlogItemsData {
  items: BlogPostListItem[];
}

export interface BlogPostData {
  post: BlogPost;
  related_posts: BlogPostListItem[];
}

export interface BlogRelatedData {
  items: BlogPostListItem[];
}

export interface BlogCategoriesData {
  items: BlogCategory[];
}

export interface BlogCategoryPostsData {
  category: BlogCategory;
  items: BlogPostListItem[];
  pagination: BlogPagination;
}

export interface BlogTagsData {
  items: BlogTag[];
}

export interface BlogTagPostsData {
  tag: BlogTag;
  items: BlogPostListItem[];
  pagination: BlogPagination;
}

export interface AdminCategoriesData {
  items: BlogCategory[];
  pagination: BlogPagination;
}

export interface AdminCategoryData {
  item: BlogCategory;
}

export interface AdminTagsData {
  items: BlogTag[];
  pagination: BlogPagination;
}

export interface AdminTagData {
  item: BlogTag;
}

export interface AdminPostsData {
  items: BlogPost[];
  pagination: BlogPagination;
}

export interface AdminPostData {
  post: BlogPost;
}

// ─── Public Newsletter ───────────────────────────────────────────────

export interface NewsletterSubscribeRequest {
  email: string;
  first_name?: string;
  source?: string;
}

export interface NewsletterSubscribeData {
  already_subscribed?: boolean;
  email?: string;
}

// ─── Admin Payloads ──────────────────────────────────────────────────

export interface AdminCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  is_active?: boolean;
}

export interface AdminTagPayload {
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
}

export interface AdminPostPayload {
  title: string;
  slug?: string;
  summary?: string | null;
  /** WYSIWYG HTML string (new model). */
  content: string;
  cover_image?: string | null;
  featured_image?: string | null;
  is_featured?: boolean;
  status?: ArticleStatus;
  scheduled_for?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string[] | null;
  canonical_url?: string | null;
  og_meta?: Record<string, unknown> | null;
  twitter_meta?: Record<string, unknown> | null;
  newsletter_eligible?: boolean;
  category_ids?: number[];
  tag_ids?: number[];
  related_post_ids?: number[];
}

export interface ImageUploadData {
  image_url: string;
  public_id: string;
  width: number;
  height: number;
  size: number;
  type: 'cover' | 'inline';
}

// ─── Admin Dashboard ─────────────────────────────────────────────────

export interface BlogDashboardOverview {
  posts?: {
    total?: number;
    published?: number;
    drafts?: number;
    scheduled?: number;
    archived?: number;
    featured?: number;
  };
  counts?: {
    total_posts?: number;
    published?: number;
    drafts?: number;
    scheduled?: number;
    archived?: number;
    featured?: number;
    total_views?: number;
    total_comments?: number;
    total_ratings?: number;
    total_likes?: number;
    avg_rating?: number;
    categories?: number;
    tags?: number;
    subscribers?: number;
    newsletters_sent?: number;
  };
  categories?: number;
  tags?: number;
  newsletter_subscribers?: number;
  newsletters?: {
    total?: number;
    sent?: number;
    scheduled?: number;
    drafts?: number;
  };
  recent_posts?: BlogPostListItem[];
  popular_posts?: BlogPostListItem[];
  recent_campaigns?: unknown[];
  total_views?: number;
}

export interface BlogAnalyticsSeriesPoint {
  month?: string;
  date?: string;
  label?: string;
  published?: number;
  views?: number;
  [key: string]: unknown;
}

export interface BlogAnalyticsTopPost {
  id?: number;
  title?: string;
  slug?: string;
  view_count?: number;
  [key: string]: unknown;
}

export interface BlogAnalytics {
  months?: number;
  publication_series?: BlogAnalyticsSeriesPoint[];
  views_series?: BlogAnalyticsSeriesPoint[];
  top_posts?: BlogAnalyticsTopPost[];
  newsletter?: {
    total_campaigns?: number;
    total_recipients?: number;
    total_delivered?: number;
    total_opened?: number;
    total_clicked?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ─── Filters ─────────────────────────────────────────────────────────

export interface PublicPostFilters {
  search?: string;
  category?: string; // slug
  tag?: string; // slug
  featured?: boolean;
  sort?: BlogSort;
}

export interface AdminPostFilters {
  search?: string;
  category_id?: number;
  tag_id?: number;
  author_id?: number;
  status?: ArticleStatus;
  is_featured?: boolean;
  sort?: BlogSort;
}

export interface AdminTaxonomyFilters {
  search?: string;
  is_active?: boolean;
  sort?: 'newest' | 'oldest';
}
