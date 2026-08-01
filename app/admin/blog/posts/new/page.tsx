'use client';

import { BlogPostForm } from '@/components/admin/blog/BlogPostForm';

export default function NewPostPage() {
  return (
    <div>
      <h2 className="mb-5 text-xl font-black text-gray-900">Create New Post</h2>
      <BlogPostForm mode="create" />
    </div>
  );
}
