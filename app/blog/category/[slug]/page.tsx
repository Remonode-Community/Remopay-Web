'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { blogService } from '@/services/blog.service';
import type { BlogCategory, BlogPostListItem } from '@/types/blog.types';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { BlogBreadcrumbs } from '@/components/blog/BlogBreadcrumbs';
import { NewsletterSubscribeForm } from '@/components/blog/NewsletterSubscribeForm';
import { BlogGridSkeleton } from '@/components/blog/BlogSkeletons';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { CategoryPill } from '@/components/blog/CategoryPill';

function CategoryPostsView() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [allCategories, setAllCategories] = useState<BlogCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [postsRes, catRes] = await Promise.all([
          blogService.getCategoryPosts(slug, page),
          blogService.getCategories(),
        ]);
        if (cancelled) return;
        setCategory(postsRes.data?.category || null);
        setPosts(postsRes.data?.items || []);
        setTotalPages(postsRes.data?.pagination?.last_page || 1);
        setAllCategories(catRes.data?.items || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load category.');
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
    nextPage > 1 ? `/blog/category/${slug}?page=${nextPage}` : `/blog/category/${slug}`;

  return (
    <div>
      <div className="border-b border-gray-100 bg-gray-50/50 px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <BlogBreadcrumbs
            crumbs={[
              { label: 'Blog', href: '/blog' },
              { label: category ? category.name : slug },
            ]}
          />
        </div>
      </div>

      <section className="px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            {category ? category.name : 'Category'}
          </h1>
          {category?.description && (
            <p className="mt-2 max-w-2xl text-gray-600">{category.description}</p>
          )}

          {loading ? (
            <BlogGridSkeleton count={6} className="mt-8" />
          ) : error ? (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
              <p className="font-semibold text-red-700">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
              <p className="font-semibold text-gray-700">No articles in this category yet.</p>
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

          {allCategories.length > 0 && (
            <div className="mt-16 border-t border-gray-100 pt-8">
              <h2 className="mb-4 font-bold text-gray-900">Browse all categories</h2>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((c) => (
                  <CategoryPill key={c.id} category={c} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 max-w-md">
            <NewsletterSubscribeForm source="blog-category" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<BlogGridSkeleton count={6} />}>
      <CategoryPostsView />
    </Suspense>
  );
}
