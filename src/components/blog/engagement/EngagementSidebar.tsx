'use client';

import { RatingSummaryCard } from './RatingSummaryCard';
import { CommentSection } from './CommentSection';
import { NewsletterSubscribeForm } from '@/components/blog/NewsletterSubscribeForm';

interface EngagementSidebarProps {
  slug: string;
}

/**
 * Right-hand column for the article page (desktop): rating/review card,
 * comments, and newsletter signup stacked vertically.
 */
export function EngagementSidebar({ slug }: EngagementSidebarProps) {
  return (
    <div className="space-y-5">
      <RatingSummaryCard slug={slug} />
      <CommentSection slug={slug} />
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <NewsletterSubscribeForm source="blog-article-sidebar" className="text-center" />
      </div>
    </div>
  );
}
