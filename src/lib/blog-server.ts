/**
 * Server-side helpers for public blog data.
 * Uses native fetch (no axios/client token) so it can run in Server
 * Components without bundling the client API client.
 */

import type {
  BlogPost,
  BlogPostListItem,
} from '@/types/blog.types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://gateway.remonode.com/remopay/api/v1';

export interface PublicPostData {
  post: BlogPost;
  related_posts: BlogPostListItem[];
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
