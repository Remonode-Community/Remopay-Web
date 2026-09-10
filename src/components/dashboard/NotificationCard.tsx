/**
 * NotificationCard Component
 * Displays a single notification with actions
 */

'use client';

import React, { useState } from 'react';
import { Check, AlertCircle, Bell, CheckCircle, Gift, Info, Trash2, Zap, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/utils/format.utils';
import { Notification, NotificationType } from '@/types/notification.types';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
  onView?: (notification: Notification) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  const iconProps = 'h-6 w-6';

  const typeIcons: Record<NotificationType, React.ReactNode> = {
    transaction: <CheckCircle className={`${iconProps} text-blue-500`} />,
    system: <Zap className={`${iconProps} text-yellow-500`} />,
    promotion: <Gift className={`${iconProps} text-purple-500`} />,
    update: <Info className={`${iconProps} text-cyan-500`} />,
    alert: <AlertCircle className={`${iconProps} text-red-500`} />,
    support_ticket: <MessageSquare className={`${iconProps} text-purple-500`} />,
  };

  return typeIcons[type] || <Bell className={`${iconProps} text-gray-500`} />;
};

const getTypeBadgeStyles = (type: NotificationType) => {
  const styles: Record<NotificationType, string> = {
    transaction: 'bg-blue-100 text-blue-700',
    system: 'bg-yellow-100 text-yellow-700',
    promotion: 'bg-purple-100 text-purple-700',
    update: 'bg-cyan-100 text-cyan-700',
    alert: 'bg-red-100 text-red-700',
    support_ticket: 'bg-purple-100 text-purple-700',
  };
  return styles[type] || styles.system;
};

const getPriorityDot = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'bg-red-500',
    normal: 'bg-slate-400',
    low: 'bg-gray-300',
  };
  return colors[priority] || colors.normal;
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onView,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const isUnread = !notification.read_at;

  const handleMarkAsRead = async () => {
    if (isUnread && onMarkAsRead) {
      await onMarkAsRead(notification.id);
    }
  };

  const handleDelete = async () => {
    if (onDelete && window.confirm('Are you sure you want to delete this notification?')) {
      setIsDeleting(true);
      try {
        await onDelete(notification.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div
      className="bg-white rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer hover:border-gray-300"
      onClick={() => onView?.(notification)}
    >
      <div className="flex gap-4 p-4">
        {/* Icon container */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {notification.title}
                </h3>
                {!notification.read_at && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-gray-600 text-sm mt-1 break-words">
                {notification.body}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {!notification.read_at && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getTypeBadgeStyles(
                notification.type
              )}`}
            >
              {notification.type}
            </div>

            <div className="flex items-center gap-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(notification.priority)}`}
              />
              <span className="text-xs text-gray-500 capitalize">
                {notification.priority}
              </span>
            </div>

            <span className="text-xs text-gray-400">
              {formatRelativeTime(notification.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
