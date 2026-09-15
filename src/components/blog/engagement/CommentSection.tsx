'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { MessageSquare, Send, ThumbsUp, ThumbsDown, Pencil, Trash2 } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import type { BlogComment } from '@/types/blog-engagement.types';
import { formatDate } from '@/utils/format.utils';

interface CommentSectionProps {
  slug: string;
}

function CommentItem({
  comment,
  depth = 0,
  slug,
  currentUser,
  onRefresh,
}: {
  comment: BlogComment;
  depth?: number;
  slug: string;
  currentUser: { id: number } | null;
  onRefresh: () => void;
}) {
  const { addToast } = useUIStore();
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [dislikeCount, setDislikeCount] = useState(comment.dislike_count);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = currentUser?.id && comment.user?.id === currentUser.id;

  const handleReact = async (reaction: 'like' | 'dislike') => {
    try {
      const guestToken = currentUser ? null : blogService.getGuestToken();
      const res = await blogService.toggleCommentReact(comment.id, reaction, guestToken);
      if (res.success && res.data) {
        setUserReaction(res.data.reaction);
        setLikeCount(res.data.like_count);
        setDislikeCount(res.data.dislike_count);
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to react to comment.' });
    }
  };

  const handleUpdate = async () => {
    if (!editBody.trim()) return;
    setSubmitting(true);
    try {
      const { apiClient } = await import('@/services/api-client');
      const res = await apiClient.put(`/public/blog/comments/${comment.id}`, { body: editBody.trim() });
      if (res.success) {
        addToast({ type: 'success', message: 'Comment updated.' });
        setEditing(false);
        onRefresh();
      } else {
        addToast({ type: 'error', message: res.message || 'Failed to update.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to update comment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const { apiClient } = await import('@/services/api-client');
      const res = await apiClient.delete(`/public/blog/comments/${comment.id}`);
      if (res.success) {
        addToast({ type: 'success', message: 'Comment deleted.' });
        onRefresh();
      } else {
        addToast({ type: 'error', message: res.message || 'Failed to delete.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Failed to delete comment.' });
    }
  };

  const author = comment.user;
  const displayName = comment.is_guest ? (comment.guest_name || 'Anonymous') : comment.author_name;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={depth > 0 ? 'ml-5 border-l-2 border-gray-100 pl-4' : ''}>
      <div className="flex items-start gap-3">
        {author?.profile_photo_url ? (
          <img
            src={author.profile_photo_url}
            alt={displayName}
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d71927]/10 text-xs font-bold text-[#d71927]">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold text-gray-900">{displayName}</span>
            {comment.is_guest && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Guest</span>
            )}
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
            {comment.edited_at && (
              <span className="text-[10px] text-gray-400">(edited)</span>
            )}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={2}
                maxLength={2000}
                className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
              />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">{editBody.length}/2000</span>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => { setEditing(false); setEditBody(comment.body); }}
                    className="rounded-md px-3 py-1 text-xs text-gray-500 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={submitting || !editBody.trim()}
                    className="rounded-md bg-[#d71927] px-3 py-1 text-xs font-bold text-white hover:bg-[#b91420] disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-6 text-gray-700">{comment.body}</p>
          )}

          {/* Actions: react, edit, delete */}
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => handleReact('like')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition hover:bg-gray-100 ${
                userReaction === 'like' ? 'text-[#d71927] font-bold' : 'text-gray-500'
              }`}
            >
              <ThumbsUp size={13} />
              {likeCount > 0 && <span>{likeCount}</span>}
            </button>
            <button
              onClick={() => handleReact('dislike')}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition hover:bg-gray-100 ${
                userReaction === 'dislike' ? 'text-gray-900 font-bold' : 'text-gray-500'
              }`}
            >
              <ThumbsDown size={13} />
              {dislikeCount > 0 && <span>{dislikeCount}</span>}
            </button>

            {isOwner && !editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              slug={slug}
              currentUser={currentUser}
              onRefresh={onRefresh}
            />
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
  const [guestName, setGuestName] = useState('');
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
    if (body.length > 2000) {
      addToast({ type: 'error', message: 'Comment must not exceed 2000 characters.' });
      return;
    }
    if (!isAuthenticated && !guestName.trim()) {
      addToast({ type: 'error', message: 'Please enter your name.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { body: body.trim() };
      if (!isAuthenticated) {
        payload.guest_name = guestName.trim();
      }
      const res = await blogService.createComment(slug, payload as any);
      if (res.success) {
        addToast({ type: 'success', message: 'Comment posted!' });
        setBody('');
        setGuestName('');
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
        <div className="space-y-3">
          {!isAuthenticated && (
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={100}
              placeholder="Your name *"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
            />
          )}
          <div className="relative">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={isAuthenticated ? 'Join the discussion...' : 'Join the discussion... (no account needed)'}
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">
              {body.length}/2000
            </span>
          </div>
          <div className="flex items-center justify-between">
            {!isAuthenticated && (
              <p className="text-xs text-gray-400">
                <Link href="/auth/login" className="font-semibold text-[#d71927] hover:underline">
                  Sign in
                </Link>{' '}
                for avatar &amp; edit rights
              </p>
            )}
            <button
              type="button"
              onClick={submitComment}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#d71927] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b91420] disabled:opacity-50 ml-auto"
            >
              <Send size={14} />
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
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
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              slug={slug}
              currentUser={user}
              onRefresh={load}
            />
          ))
        )}
      </div>
    </div>
  );
}
