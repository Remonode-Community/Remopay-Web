'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { blogService } from '@/services/blog.service';
import type { BlogPostListItem, BlogTag } from '@/types/blog.types';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogBreadcrumbs } from '@/components/blog/BlogBreadcrumbs';
import { NewsletterSubscribeForm } from '@/components/blog/NewsletterSubscribeForm';
import { BlogGridSkeleton } from '@/components/blog/BlogSkeletons';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { TagPill } from '@/components/blog/TagPill';

function TagPostsView() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState<BlogTag | null>(null);
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [allTags, setAllTags] = useState<BlogTag[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postsRes, tagsRes] = await Promise.all([
          blogService.getTagPosts(slug, page),
          blogService.getTags(),
        ]);
        if (cancelled) return;
        setTag(postsRes.data?.tag || null);
        setPosts(postsRes.data?.items || []);
        setTotalPages(postsRes.data?.pagination?.last_page || 1);
        setAllTags(tagsRes.data?.items || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load tag.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, page]);

  const buildHref = (nextPage: number) =>
    nextPage > 1 ? `/blog/tag/${slug}?page=${nextPage}` : `/blog/tag/${slug}`;

  return (
    <div>
      <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <BlogBreadcrumbs
            crumbs={[
              { label: 'Blog', href: '/blog' },
              { label: `#${tag ? tag.name : slug}` },
            ]}
          />
        </div>
      </div>

      <section className="px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Articles tagged <span className="text-[#d71927]">#{tag ? tag.name : slug}</span>
          </h1>

          {loading ? (
            <BlogGridSkeleton count={6} className="mt-8" />
          ) : error ? (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
              <p className="font-semibold text-red-700">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <p className="font-semibold text-gray-700">No articles with this tag yet.</p>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
              <BlogPagination
                currentPage={page}
                lastPage={totalPages}
                buildHref={buildHref}
                className="mt-10"
              />
            </>
          )}

          {allTags.length > 0 && (
            <div className="mt-16 border-t border-gray-100 pt-8">
              <h2 className="mb-4 font-bold text-gray-900">Browse all tags</h2>
              <div className="flex flex-wrap gap-2">
                {allTags.map((t) => (
                  <TagPill key={t.id} tag={t} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 max-w-md">
            <NewsletterSubscribeForm source="blog-tag" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function TagPage() {
  return (
    <Suspense fallback={<BlogGridSkeleton count={6} />}>
      <TagPostsView />
    </Suspense>
  );
}
