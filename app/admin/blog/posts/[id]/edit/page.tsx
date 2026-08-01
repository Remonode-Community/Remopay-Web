'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { blogService } from '@/services/blog.service';
import type { BlogPost } from '@/types/blog.types';
import { BlogPostForm } from '@/components/admin/blog/BlogPostForm';
import { Spinner } from '@/components/shared/Spinner';

function EditPostView() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await blogService.getPostById(postId);
        if (!cancelled) setPost(res.data?.post || null);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load post.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (postId) load();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-semibold text-red-700">{error || 'Post not found.'}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-5 text-xl font-black text-gray-900">Edit Post</h2>
      <BlogPostForm mode="edit" postId={postId} initial={post} />
    </div>
  );
}

export default function EditPostPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center"><Spinner /></div>}>
      <EditPostView />
    </Suspense>
  );
}
