import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BlogPaginationProps {
  currentPage: number;
  lastPage: number;
  /** Function to build the href for a given page. */
  buildHref: (page: number) => string;
  className?: string;
}

function pageList(current: number, last: number): (number | '…')[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < last - 1) pages.push('…');
  pages.push(last);
  return pages;
}

export function BlogPagination({ currentPage, lastPage, buildHref, className = '' }: BlogPaginationProps) {
  if (lastPage <= 1) return null;

  const base =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition';

  return (
    <nav className={`flex items-center justify-center gap-2 ${className}`} aria-label="Pagination">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1)}
          className={`${base} border-gray-200 bg-white text-gray-600 hover:border-[#d71927] hover:text-[#d71927]`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </Link>
      )}

      {pageList(currentPage, lastPage).map((page, index) =>
        page === '…' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`${base} ${
              page === currentPage
                ? 'border-[#d71927] bg-[#d71927] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-[#d71927] hover:text-[#d71927]'
            }`}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < lastPage && (
        <Link
          href={buildHref(currentPage + 1)}
          className={`${base} border-gray-200 bg-white text-gray-600 hover:border-[#d71927] hover:text-[#d71927]`}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  );
}
