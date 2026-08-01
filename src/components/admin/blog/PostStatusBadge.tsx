'use client';

import { Badge } from '@/components/shared/Badge';
import type { ArticleStatus } from '@/types/blog.types';

const STATUS_META: Record<ArticleStatus, { label: string; variant: 'default' | 'success' | 'danger' | 'warning' | 'info' }> = {
  draft: { label: 'Draft', variant: 'warning' },
  published: { label: 'Published', variant: 'success' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  archived: { label: 'Archived', variant: 'default' },
};

interface PostStatusBadgeProps {
  status: ArticleStatus;
}

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  const meta = STATUS_META[status] || { label: status, variant: 'default' as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
