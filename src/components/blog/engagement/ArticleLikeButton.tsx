'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';

interface ArticleLikeButtonProps {
  slug: string;
  initialLiked?: boolean;
  initialCount?: number;
}

export function ArticleLikeButton({ slug, initialLiked = false, initialCount = 0 }: ArticleLikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const { addToast } = useUIStore();

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Check like status on mount for anonymous users
  useEffect(() => {
    if (isAuthenticated) return; // engagement endpoint already provides status for auth users
    const guestToken = blogService.getGuestToken();
    blogService.getPostLikeStatus(slug, guestToken).then((res) => {
      if (res.success && res.data) {
        setLiked(res.data.liked);
        setCount(res.data.like_count);
      }
    });
  }, [slug, isAuthenticated]);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const guestToken = isAuthenticated ? null : blogService.getGuestToken();
      const res = await blogService.togglePostLike(slug, guestToken);
      if (res.success && res.data) {
        setLiked(res.data.liked);
        setCount(res.data.like_count);
      } else {
        addToast({ type: 'error', message: res.message || 'Failed to update like.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to like post.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
        liked
          ? 'border-[#d71927] bg-[#d71927]/10 text-[#d71927]'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      <span>{count}</span>
      <span className="hidden sm:inline">{liked ? 'Liked' : 'Like'}</span>
    </button>
  );
}
