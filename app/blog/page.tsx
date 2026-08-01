'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame, TrendingUp, Newspaper } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import type {
  BlogCategory,
  BlogPostListItem,
  BlogSort,
} from '@/types/blog.types';
import { BlogSearchBar } from '@/components/blog/BlogSearchBar';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { CategoryPill } from '@/components/blog/CategoryPill';
import { NewsletterSubscribeForm } from '@/components/blog/NewsletterSubscribeForm';
import { BlogGridSkeleton } from '@/components/blog/BlogSkeletons';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { Select } from '@/components/shared/Select';

const SORT_OPTIONS: { value: BlogSort | ''; label: string }[] = [
  { value: '', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title_asc', label: 'Title (A–Z)' },
  { value: 'title_desc', label: 'Title (Z–A)' },
  { value: 'views', label: 'Most viewed' },
  { value: 'updated', label: 'Recently updated' },
];

function BlogListing() {
  const searchParams = useSearchParams();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const sort = (searchParams.get('sort') as BlogSort | null) || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [featured, setFeatured] = useState<BlogPostListItem[]>([]);
  const [latest, setLatest] = useState<BlogPostListItem[]>([]);
  const [popular, setPopular] = useState<BlogPostListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilter = Boolean(search || category || tag || sort);

  const buildHref = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (tag) params.set('tag', tag);
      if (sort) params.set('sort', sort);
      if (nextPage > 1) params.set('page', String(nextPage));
      const qs = params.toString();
      return qs ? `/blog?${qs}` : '/blog';
    },
    [search, category, tag, sort]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [listRes, featuredRes, latestRes, popularRes, catRes] = await Promise.all([
          blogService.getPosts(
            { search: search || undefined, category: category || undefined, tag: tag || undefined, sort: sort || undefined },
            page
          ),
          blogService.getFeatured(),
          blogService.getLatest(),
          blogService.getPopular(),
          blogService.getCategories(),
        ]);

        if (cancelled) return;

        setPosts(listRes.data?.items || []);
        setTotalPages(listRes.data?.pagination?.last_page || 1);
        setFeatured(featuredRes.data?.items || []);
        setLatest(latestRes.data?.items || []);
        setPopular(popularRes.data?.items || []);
        setCategories(catRes.data?.items || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load articles.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [search, category, tag, sort, page]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[#d71927]">Remopay Blog</p>
          <h1 className="max-w-2xl text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Insights & Updates
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Guides, product updates and money tips from the Remopay team.
          </p>
          <BlogSearchBar initialValue={search} className="mt-6 max-w-xl" />
        </div>
      </section>

      {/* Featured (only when no active filter) */}
      {!hasActiveFilter && !loading && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="mb-6 flex items-center gap-2">
            <Flame className="h-5 w-5 text-[#d71927]" />
            <h2 className="text-lg font-bold text-gray-900">Featured</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {featured.slice(0, 2).map((post, index) => (
              <BlogPostCard key={post.id} post={post} featured={index === 0} />
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Main list */}
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Newspaper className="h-5 w-5 text-[#d71927]" />
                {activeCategory ? `Category: ${activeCategory.name}` : search ? `Results for "${search}"` : 'Latest Articles'}
              </h2>
              <div className="w-44">
                <Select
                  value={sort}
                  onChange={(e) => {
                    const value = e.target.value as BlogSort | '';
                    const params = new URLSearchParams(searchParams.toString());
                    if (value) params.set('sort', value);
                    else params.delete('sort');
                    params.delete('page');
                    window.location.href = `/blog${params.toString() ? `?${params.toString()}` : ''}`;
                  }}
                  options={SORT_OPTIONS}
                  aria-label="Sort articles"
                />
              </div>
            </div>

            {loading ? (
              <BlogGridSkeleton count={6} />
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
                <p className="font-semibold text-red-700">{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
                <p className="font-semibold text-gray-700">No articles found.</p>
                <p className="mt-1 text-sm text-gray-500">Try a different search or clear your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
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
          </section>

          {/* Sidebar */}
          <aside className="space-y-8">
            {!hasActiveFilter && popular.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-gray-900">
                  <TrendingUp className="h-4 w-4 text-[#d71927]" /> Popular
                </h3>
                <ul className="space-y-4">
                  {popular.slice(0, 5).map((post, i) => (
                    <li key={post.id} className="flex gap-3">
                      <span className="text-lg font-black text-gray-300">{i + 1}</span>
                      <a href={`/blog/${post.slug}`} className="text-sm font-semibold text-gray-700 hover:text-[#d71927]">
                        {post.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {categories.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-bold text-gray-900">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/blog"
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      !category && !tag
                        ? 'bg-[#d71927] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </a>
                  {categories.map((c) => (
                    <CategoryPill key={c.id} category={c} />
                  ))}
                </div>
              </div>
            )}

            <NewsletterSubscribeForm source="blog-sidebar" />
          </aside>
        </div>
      </div>

      {/* Latest strip (only when no active filter) */}
      {!hasActiveFilter && !loading && latest.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50/50 px-5 py-14 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-xl font-black text-gray-900">
                <Newspaper className="h-5 w-5 text-[#d71927]" /> Fresh off the press
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latest.slice(0, 4).map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogGridSkeleton count={6} />}>
      <BlogListing />
    </Suspense>
  );
}
