interface BlogSkeletonCardProps {
  featured?: boolean;
}

export function BlogSkeletonCard({ featured = false }: BlogSkeletonCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className={`animate-pulse ${featured ? 'aspect-[16/8]' : 'aspect-[16/9]'} bg-gray-200`} />
      <div className="p-5">
        <div className="mb-3 flex gap-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="mb-4 h-4 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

export function BlogGridSkeleton({
  count = 6,
  featured = false,
  className = '',
}: {
  count?: number;
  featured?: boolean;
  className?: string;
}) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <BlogSkeletonCard key={i} featured={featured} />
      ))}
    </div>
  );
}
