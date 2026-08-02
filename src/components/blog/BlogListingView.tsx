'use client';

import type { BlogCategory, BlogPostListItem, BlogSort } from '@/types/blog.types';
import { BlogSearchBar } from '@/components/blog/BlogSearchBar';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import { CategoryPill } from '@/components/blog/CategoryPill';
import { NewsletterSubscribeForm } from '@/components/blog/NewsletterSubscribeForm';
import { BlogPagination } from '@/components/blog/BlogPagination';
import { Select } from '@/components/shared/Select';
import { Flame, TrendingUp, Newspaper } from 'lucide-react';

const SORT_OPTIONS: { value: BlogSort | ''; label: string }[] = [
  { value: '', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title_asc', label: 'Title (A–Z)' },
  { value: 'title_desc', label: 'Title (Z–A)' },
  { value: 'views', label: 'Most viewed' },
  { value: 'updated', label: 'Recently updated' },
];

export interface BlogListingViewProps {
  search: string;
  category: string;
  tag: string;
  sort: BlogSort | '';
  page: number;
  posts: BlogPostListItem[];
  totalPages: number;
  featured: BlogPostListItem[];
  latest: BlogPostListItem[];
  popular: BlogPostListItem[];
  categories: BlogCategory[];
  activeCategory?: BlogCategory;
  hasActiveFilter: boolean;
}

/**
 * Presentational listing view. All filtering/search/sorting/pagination is
 * done via real URL navigation so the server component re-renders with the
 * correct metadata — this view only receives server-rendered data as props.
 */
export function BlogListingView({
  search,
  category,
  tag,
  sort,
  page,
  posts,
  totalPages,
  featured,
  latest,
  popular,
  categories,
  activeCategory,
  hasActiveFilter,
}: BlogListingViewProps) {
  const buildQuery = (
    opts: { search?: string; category?: string; tag?: string; sort?: string; page?: number } = {}
  ) => {
    const params = new URLSearchParams();
    const s = opts.search ?? search;
    const c = opts.category ?? category;
    const t = opts.tag ?? tag;
    const so = opts.sort !== undefined ? opts.sort : sort;
    const p = opts.page ?? page;
    if (s) params.set('search', s);
    if (c) params.set('category', c);
    if (t) params.set('tag', t);
    if (so) params.set('sort', so);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/blog?${qs}` : '/blog';
  };

  const buildHref = (nextPage: number) => buildQuery({ page: nextPage });

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
      {!hasActiveFilter && featured.length > 0 && (
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
                {activeCategory
                  ? `Category: ${activeCategory.name}`
                  : search
                    ? `Results for "${search}"`
                    : 'Latest Articles'}
              </h2>
              <div className="w-44">
                <Select
                  value={sort}
                  onChange={(e) => {
                    const value = e.target.value as BlogSort | '';
                    window.location.href = buildQuery({ sort: value });
                  }}
                  options={SORT_OPTIONS}
                  aria-label="Sort articles"
                />
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
                <p className="font-semibold text-gray-700">No articles found.</p>
                <p className="mt-1 text-sm text-gray-500">
                  Try a different search or clear your filters.
                </p>
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
                      <a
                        href={`/blog/${post.slug}`}
                        className="text-sm font-semibold text-gray-700 hover:text-[#d71927]"
                      >
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
      {!hasActiveFilter && latest.length > 0 && (
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
