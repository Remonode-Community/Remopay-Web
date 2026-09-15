import Link from 'next/link';
import type { BlogTag } from '@/types/blog.types';

interface TagPillProps {
  tag: Pick<BlogTag, 'name' | 'slug'>;
}

export function TagPill({ tag }: TagPillProps) {
  return (
    <Link
      href={`/blog/tag/${tag.slug}`}
      className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
    >
      {tag.name}
    </Link>
  );
}
