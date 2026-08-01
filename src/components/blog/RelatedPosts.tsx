import type { BlogPostListItem } from '@/types/blog.types';
import { BlogPostCard } from './BlogPostCard';

interface RelatedPostsProps {
  posts: BlogPostListItem[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900">Related Articles</h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-[#d71927]" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
