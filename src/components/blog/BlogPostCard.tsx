import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye } from 'lucide-react';
import type { BlogPostListItem } from '@/types/blog.types';
import { formatDate } from '@/utils/format.utils';
import { CategoryPill } from './CategoryPill';

interface BlogPostCardProps {
  post: BlogPostListItem;
  className?: string;
  /** Larger, horizontal layout for featured cards. */
  featured?: boolean;
}

export function BlogPostCard({ post, className = '', featured = false }: BlogPostCardProps) {
  const cover = post.cover_image || post.featured_image;

  const image = cover ? (
    <Image
      src={cover}
      alt={post.title}
      width={800}
      height={featured ? 450 : 420}
      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
        featured ? 'rounded-t-xl' : 'rounded-t-xl'
      }`}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d71927]/10 via-gray-50 to-gray-100">
      <span className="text-5xl font-black text-[#d71927]/30">R</span>
    </div>
  );

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md ${className}`}
    >
      <Link href={`/blog/${post.slug}`} className={`relative block overflow-hidden ${featured ? 'aspect-[16/8]' : 'aspect-[16/9]'}`}>
        {image}
        {post.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-[#d71927] px-3 py-1 text-xs font-bold text-white shadow">
            Featured
          </span>
        )}
      </Link>

      <div className={`flex flex-1 flex-col ${featured ? 'p-6' : 'p-5'}`}>
        {post.categories && post.categories.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.categories.slice(0, 3).map((category) => (
              <CategoryPill key={category.id} category={category} />
            ))}
          </div>
        )}

        <Link href={`/blog/${post.slug}`} className="mb-2">
          <h3
            className={`font-bold text-gray-900 transition group-hover:text-[#d71927] ${
              featured ? 'text-2xl' : 'text-lg'
            }`}
          >
            {post.title}
          </h3>
        </Link>

        {post.summary && (
          <p className="mb-4 text-sm leading-6 text-gray-600 line-clamp-3">{post.summary}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
          <span>{post.author ? `${post.author.first_name} ${post.author.last_name}` : 'Remopay'}</span>
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
      </div>
    </article>
  );
}
