'use client';

import { Badge } from '@/components/shared/Badge';
import type { NewsletterStatus } from '@/types/newsletter.types';

const STATUS_META: Record<NewsletterStatus, { label: string; variant: 'default' | 'success' | 'danger' | 'warning' | 'info' }> = {
  draft: { label: 'Draft', variant: 'warning' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  sending: { label: 'Sending', variant: 'info' },
  sent: { label: 'Sent', variant: 'success' },
  partially_failed: { label: 'Partially Failed', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

interface NewsletterStatusBadgeProps {
  status: NewsletterStatus;
}

export function NewsletterStatusBadge({ status }: NewsletterStatusBadgeProps) {
  const meta = STATUS_META[status] || { label: status, variant: 'default' as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
