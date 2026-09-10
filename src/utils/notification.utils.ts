/**
 * Notification Utilities
 * Helper functions for notification handling
 */

import { NotificationType, PriorityLevel } from '@/types/notification.types';

/**
 * Get color classes for notification type
 */
export const getNotificationTypeColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    transaction: 'blue',
    system: 'gray',
    promotion: 'amber',
    update: 'cyan',
    alert: 'red',
    support_ticket: 'purple',
  };
  return colors[type] || 'gray';
};

/**
 * Get readable label for notification type
 */
export const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    transaction: 'Transaction',
    system: 'System',
    promotion: 'Promotion',
    update: 'Update',
    alert: 'Alert',
    support_ticket: 'Support',
  };
  return labels[type] || type;
};

/**
 * Get color classes for priority level
 */
export const getPriorityColor = (priority: PriorityLevel): string => {
  const colors: Record<PriorityLevel, string> = {
    high: 'red',
    normal: 'gray',
    low: 'blue',
  };
  return colors[priority] || 'gray';
};

/**
 * Get readable label for priority level
 */
export const getPriorityLabel = (priority: PriorityLevel): string => {
  const labels: Record<PriorityLevel, string> = {
    high: 'High Priority',
    normal: 'Normal',
    low: 'Low Priority',
  };
  return labels[priority] || priority;
};

/**
 * Format notification date for display
 */
export const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }

  // Less than 1 day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  // Less than 1 week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }

  // Otherwise, show the date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Group notifications by date
 */
export interface GroupedNotifications {
  today: any[];
  yesterday: any[];
  thisWeek: any[];
  older: any[];
}

export const groupNotificationsByDate = (notifications: any[]): GroupedNotifications => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 604800000);

  const grouped: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const notifDate = new Date(notification.created_at);
    const notifDateOnly = new Date(
      notifDate.getFullYear(),
      notifDate.getMonth(),
      notifDate.getDate()
    );

    if (notifDateOnly.getTime() === today.getTime()) {
      grouped.today.push(notification);
    } else if (notifDateOnly.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(notification);
    } else if (notifDateOnly.getTime() > weekAgo.getTime()) {
      grouped.thisWeek.push(notification);
    } else {
      grouped.older.push(notification);
    }
  });

  return grouped;
};

/**
 * Build notification action URL if available
 */
export const getNotificationActionUrl = (notification: any): string | null => {
  if (!notification.data) {
    return null;
  }

  const { data } = notification;

  // Transaction notifications
  if (notification.type === 'transaction' && data.transaction_id) {
    return `/dashboard/history/${data.transaction_id}`;
  }

  // Support ticket notifications
  if (notification.type === 'support_ticket' && data.ticket_id) {
    return `/dashboard/support/${data.ticket_id}`;
  }

  // Custom action URL
  if (data.action_url) {
    return data.action_url;
  }

  // Referral notifications
  if (data.referral_id) {
    return `/dashboard/referral/${data.referral_id}`;
  }

  return null;
};

/**
 * Check if notification is recent (within last hour)
 */
export const isRecentNotification = (createdAt: string): boolean => {
  const date = new Date(createdAt);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
  return diffInMinutes < 60;
};

/**
 * Build notification summary for badge/counter
 */
export const buildNotificationSummary = (stats: any): string => {
  if (!stats || stats.unread === 0) {
    return 'All caught up';
  }

  const summaryParts: string[] = [];

  if (stats.by_type?.transaction > 0) {
    summaryParts.push(`${stats.by_type.transaction} transaction${stats.by_type.transaction > 1 ? 's' : ''}`);
  }
  if (stats.by_type?.alert > 0) {
    summaryParts.push(`${stats.by_type.alert} alert${stats.by_type.alert > 1 ? 's' : ''}`);
  }
  if (stats.by_type?.promotion > 0) {
    summaryParts.push(`${stats.by_type.promotion} promo${stats.by_type.promotion > 1 ? 's' : ''}`);
  }

  if (summaryParts.length === 0) {
    return `${stats.unread} notification${stats.unread > 1 ? 's' : ''}`;
  }

  return summaryParts.join(', ');
};
