import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

interface BlogBreadcrumbsProps {
  crumbs: Crumb[];
}

export function BlogBreadcrumbs({ crumbs }: BlogBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight size={14} className="text-gray-400" />}
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="font-medium hover:text-[#d71927]">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-gray-900' : ''}>{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
