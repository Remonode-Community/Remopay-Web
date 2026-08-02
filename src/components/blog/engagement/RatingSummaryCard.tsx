'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { blogService } from '@/services/blog.service';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';
import type { BlogEngagementSummary, BlogRatingValue } from '@/types/blog-engagement.types';
import { RatingStars } from './RatingStars';

interface RatingSummaryCardProps {
  slug: string;
}

const DISTRIBUTION_LABELS: { value: number; label: string }[] = [
  { value: 5, label: '5 star' },
  { value: 4, label: '4 star' },
  { value: 3, label: '3 star' },
  { value: 2, label: '2 star' },
  { value: 1, label: '1 star' },
];

export function RatingSummaryCard({ slug }: RatingSummaryCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useUIStore();

  const [summary, setSummary] = useState<BlogEngagementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlogRatingValue | null>(null);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogService.getEngagement(slug);
      if (res.success && res.data) {
        setSummary(res.data);
        setSelected((res.data.user_rating as BlogRatingValue) || null);
      } else {
        setSummary(null);
      }
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const submitRating = async () => {
    if (!selected) {
      addToast({ type: 'error', message: 'Please select a star rating first.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await blogService.createRating(slug, {
        rating: selected,
        title: title.trim() || undefined,
        review: review.trim() || undefined,
      });
      if (res.success) {
        addToast({ type: 'success', message: 'Thanks for your rating!' });
        setTitle('');
        setReview('');
        await load();
      } else {
        addToast({ type: 'error', message: res.message || 'Failed to submit rating.' });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err?.message || 'Failed to submit rating.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const ratingCount = summary?.rating_count ?? 0;
  const average = summary?.average_rating ?? 0;
  const distribution = summary?.rating_distribution ?? {};

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-gray-900">Ratings & Reviews</h3>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="h-6 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
        </div>
      ) : (
        <div className="mt-4">
          {/* Average */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-gray-900">
              {ratingCount > 0 ? average.toFixed(1) : '—'}
            </span>
            <div>
              <RatingStars value={average} size={16} />
              <p className="mt-1 text-xs text-gray-500">
                {ratingCount} rating{ratingCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Distribution */}
          {ratingCount > 0 && (
            <div className="mt-4 space-y-1.5">
              {DISTRIBUTION_LABELS.map(({ value, label }) => {
                const count = Number(distribution[value]) || 0;
                const pct = ratingCount > 0 ? Math.round((count / ratingCount) * 100) : 0;
                return (
                  <div key={value} className="flex items-center gap-2 text-xs">
                    <span className="w-14 shrink-0 text-gray-500">{label}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {ratingCount === 0 && (
            <p className="mt-3 text-sm text-gray-500">
              Be the first to rate this article.
            </p>
          )}

          {/* Submit */}
          <div className="mt-5 border-t border-gray-100 pt-4">
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Your rating</span>
                  <RatingStars
                    value={selected ?? 0}
                    interactive
                    onChange={setSelected}
                    disabled={submitting}
                  />
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={191}
                  placeholder="Review title (optional)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
                />
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  maxLength={5000}
                  placeholder="Share a short review (optional)…"
                  className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#d71927] focus:outline-none focus:ring-2 focus:ring-[#d71927]/20"
                />
                <button
                  type="button"
                  onClick={submitRating}
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#d71927] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b91420] disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit Rating'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                <Link href="/auth/login" className="font-semibold text-[#d71927] hover:underline">
                  Sign in
                </Link>{' '}
                to rate and review this article.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
