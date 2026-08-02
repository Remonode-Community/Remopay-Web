/**
 * Server-side helpers for public blog data.
 * Uses native fetch (no axios/client token) so it can run in Server
 * Components without bundling the client API client.
 */

import type {
  BlogCategory,
  BlogPagination,
  BlogPost,
  BlogPostListItem,
  BlogTag,
} from '@/types/blog.types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gateway.remonode.com/remopay/api/v1';

export interface PublicPostData {
  post: BlogPost;
  related_posts: BlogPostListItem[];
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * GET a public API resource with native fetch + ISR revalidation.
 * Returns the `data` payload when the envelope reports success, else null.
 */
async function fetchPublic<T>(path: string, revalidate = 3600): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data?: T };
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Fetch a single published article + related posts.
 * NOTE: This endpoint increments view_count, so it must only be called on
 * the actual article view. We use `cache: 'no-store'` so every view counts.
 */
export async function fetchPublicPost(slug: string): Promise<PublicPostData | null> {
  const res = await fetch(
    `${API_BASE_URL}/public/blog/posts/${encodeURIComponent(slug)}`,
    {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load article (${res.status})`);
  }

  const json = (await res.json()) as {
    success: boolean;
    data?: PublicPostData;
  };
  return json.success && json.data ? json.data : null;
}

// ─── Listing / taxonomy fetchers (SSR + ISR) ──────────────────────────────

export interface PublicBlogListData {
  items: BlogPostListItem[];
  pagination: BlogPagination;
}

export interface PublicItemsData {
  items: BlogPostListItem[];
}

/** Paginated published posts (public). GET /public/blog/posts */
export async function fetchPublicPosts(
  filters: { search?: string; category?: string; tag?: string; sort?: string } = {},
  page = 1,
  perPage = 12
): Promise<PublicBlogListData | null> {
  const qs = buildQuery({
    search: filters.search,
    category: filters.category,
    tag: filters.tag,
    sort: filters.sort,
    page,
    per_page: Math.min(perPage, 100),
  });
  return fetchPublic<PublicBlogListData>(`/public/blog/posts${qs}`);
}

async function fetchItems(path: string): Promise<BlogPostListItem[] | null> {
  const data = await fetchPublic<PublicItemsData>(path);
  return data?.items ?? null;
}

/** GET /public/blog/posts/featured */
export function fetchFeaturedPosts(): Promise<BlogPostListItem[] | null> {
  return fetchItems('/public/blog/posts/featured');
}

/** GET /public/blog/posts/latest */
export function fetchLatestPosts(): Promise<BlogPostListItem[] | null> {
  return fetchItems('/public/blog/posts/latest');
}

/** GET /public/blog/posts/popular */
export function fetchPopularPosts(): Promise<BlogPostListItem[] | null> {
  return fetchItems('/public/blog/posts/popular');
}

/** All active categories. GET /public/blog/categories */
export async function fetchPublicCategories(): Promise<BlogCategory[] | null> {
  const data = await fetchPublic<{ items: BlogCategory[] }>('/public/blog/categories');
  return data?.items ?? null;
}

/** All active tags. GET /public/blog/tags */
export async function fetchPublicTags(): Promise<BlogTag[] | null> {
  const data = await fetchPublic<{ items: BlogTag[] }>('/public/blog/tags');
  return data?.items ?? null;
}

export interface PublicCategoryPostsData {
  category: BlogCategory;
  items: BlogPostListItem[];
  pagination: BlogPagination;
}

/** Paginated posts for a category. GET /public/blog/categories/{slug}/posts */
export async function fetchCategoryPosts(
  slug: string,
  page = 1,
  perPage = 12
): Promise<PublicCategoryPostsData | null> {
  const qs = buildQuery({ page, per_page: Math.min(perPage, 100) });
  return fetchPublic<PublicCategoryPostsData>(
    `/public/blog/categories/${encodeURIComponent(slug)}/posts${qs}`
  );
}

export interface PublicTagPostsData {
  tag: BlogTag;
  items: BlogPostListItem[];
  pagination: BlogPagination;
}

/** Paginated posts for a tag. GET /public/blog/tags/{slug}/posts */
export async function fetchTagPosts(
  slug: string,
  page = 1,
  perPage = 12
): Promise<PublicTagPostsData | null> {
  const qs = buildQuery({ page, per_page: Math.min(perPage, 100) });
  return fetchPublic<PublicTagPostsData>(
    `/public/blog/tags/${encodeURIComponent(slug)}/posts${qs}`
  );
}
