import Link from 'next/link';
import type { BlogCategory } from '@/types/blog.types';

interface CategoryPillProps {
  category: Pick<BlogCategory, 'name' | 'slug'>;
}

export function CategoryPill({ category }: CategoryPillProps) {
  return (
    <Link
      href={`/blog/category/${category.slug}`}
      className="inline-flex items-center rounded-full bg-[#d71927]/8 px-3 py-1 text-xs font-semibold text-[#b91420] transition hover:bg-[#d71927] hover:text-white"
    >
      {category.name}
    </Link>
  );
}
