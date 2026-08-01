'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Eye, Newspaper } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import type { BlogPostListItem } from '@/types/blog.types';
import { formatDate } from '@/utils/format.utils';

const MAX_POSTS = 3;

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await blogService.getLatest();
        if (!cancelled) setPosts((res.data?.items || []).slice(0, MAX_POSTS));
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="blog" className="border-t border-gray-100 bg-gray-50/50 px-5 py-14 sm:py-16 md:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10 md:mb-12">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#d71927] uppercase tracking-wider">
              <Newspaper className="h-4 w-4" />
              From the Blog
            </div>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              News, Tips & <span className="text-[#d71927]">Insights</span>
            </h2>
            <p className="mt-3 max-w-2xl text-gray-600">
              Product updates, money tips and guides to help you get the most out of Remopay.
            </p>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:border-red-200 hover:text-[#d71927] hover:bg-red-50"
          >
            View All Articles <ArrowRight size={18} />
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="h-44 animate-pulse bg-gray-200 sm:h-48" />
                <div className="space-y-3 p-5 sm:p-6">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Posts */}
        {!loading && posts.length > 0 && (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {posts.map((post) => {
              const cover = post.cover_image || post.featured_image;
              return (
                <article
                  key={post.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative block aspect-[16/9] overflow-hidden"
                  >
                    {cover ? (
                      <Image
                        src={cover}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover brightness-95 contrast-110 saturate-110 transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d71927]/10 via-gray-50 to-gray-100">
                        <span className="text-5xl font-black text-[#d71927]/30">R</span>
                      </div>
                    )}
                    {post.is_featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#d71927] px-3 py-1 text-xs font-bold text-white shadow">
                        Featured
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    {post.categories && post.categories.length > 0 && (
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#d71927]">
                        {post.categories[0].name}
                      </p>
                    )}

                    <Link href={`/blog/${post.slug}`} className="mb-2">
                      <h3 className="text-lg font-bold text-gray-900 transition group-hover:text-[#d71927] line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>

                    {post.summary && (
                      <p className="mb-4 text-sm leading-6 text-gray-600 line-clamp-2">
                        {post.summary}
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                      <span>
                        {post.author
                          ? `${post.author.first_name} ${post.author.last_name}`
                          : 'Remopay'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {post.read_time || 1} min read
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={14} /> {post.view_count?.toLocaleString?.() ?? 0}
                      </span>
                      {post.published_at && (
                        <span className="ml-auto hidden sm:inline">{formatDate(post.published_at)}</span>
                      )}
                    </div>

                    <Link
                      href={`/blog/${post.slug}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#d71927] transition group-hover:gap-3"
                    >
                      Read More <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-600">No articles published yet. Check back soon.</p>
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && posts.length > 0 && (
          <div className="mt-8 sm:mt-10 md:mt-12 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-xl bg-[#d71927] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d71927]/20 transition hover:bg-[#b91420]"
            >
              Explore the Blog <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
