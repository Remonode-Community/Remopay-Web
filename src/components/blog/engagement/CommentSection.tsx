'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare, Send } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import type { BlogComment } from '@/types/blog-engagement.types';
import { formatDate } from '@/utils/format.utils';

interface CommentSectionProps {
  slug: string;
}

function CommentItem({ comment, depth = 0 }: { comment: BlogComment; depth?: number }) {
  const author = comment.author;
  const initials = author
    ? `${author.first_name?.[0] || ''}${author.last_name?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <div className={depth > 0 ? 'ml-5 border-l-2 border-gray-100 pl-4' : ''}>
      <div className="flex items-start gap-3">
        {author?.profile_photo_url ? (
          <img
            src={author.profile_photo_url}
            alt={`${author.first_name} ${author.last_name}`}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d71927]/10 text-xs font-bold text-[#d71927]">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold text-gray-900">
              {author ? `${author.first_name} ${author.last_name}` : 'Anonymous'}
            </span>
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
          </div>
          <p className="mt-1 text-sm leading-6 text-gray-700">{comment.body}</p>
        </div>
      </div>

      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ slug }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useUIStore();

  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogService.getComments(slug);
      setComments(res.data?.items || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const submitComment = async () => {
    if (!body.trim()) {
      addToast({ type: 'error', message: 'Please write a comment first.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await blogService.createComment(slug, { body: body.trim() });
      if (res.success) {
        addToast({ type: 'success', message: 'Comment posted!' });
        setBody('');
        await load();
      } else {
        addToast({ type: 'error', message: res.message || 'Failed to post comment.' });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err?.message || 'Failed to post comment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-[#d71927]" />
        <h3 className="text-sm font-bold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Post a comment */}
      <div className="mt-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Join the discussion…"
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={submitComment}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#d71927] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b91420] disabled:opacity-50"
              >
                <Send size={14} />
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
            <Link href="/auth/login" className="font-semibold text-[#d71927] hover:underline">
              Sign in
            </Link>{' '}
            to join the discussion.
          </p>
        )}
      </div>

      {/* Comments list */}
      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
        )}
      </div>
    </div>
  );
}
