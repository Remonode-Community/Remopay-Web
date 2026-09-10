'use client';

import React from 'react';
import { X, CheckCircle, Zap, Gift, Info, AlertCircle, Bell, Check, Trash2, MessageSquare } from 'lucide-react';
import { Notification, NotificationType } from '@/types/notification.types';
import { formatRelativeTime } from '@/utils/format.utils';

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const getNotificationIcon = (type: NotificationType) => {
  const iconProps = 'h-8 w-8';

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

const getPriorityLabel = (priority: string) => {
  return {
    high: 'High Priority',
    normal: 'Normal Priority',
    low: 'Low Priority',
  }[priority] || priority;
};

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !notification) return null;

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
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-start md:justify-end">
        <div
          className="w-full md:w-full md:max-w-md h-full md:h-screen bg-white shadow-lg animate-in slide-in-from-bottom md:slide-in-from-right flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 md:p-4 flex items-center justify-between shrink-0">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Notification Details</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors -mr-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:p-6 space-y-6">
            {/* Icon and Title */}
            <div className="flex gap-3 md:gap-4">
              <div className="flex-shrink-0 mt-0.5 md:mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 break-words">
                  {notification.title}
                </h3>
                {isUnread && (
                  <p className="text-xs font-medium text-blue-600 mt-1">Unread</p>
                )}
              </div>
            </div>

            {/* Body */}
            <div>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {notification.body}
              </p>
            </div>

            {/* Metadata */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-3 md:p-4">
              <div>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                  Type
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium mt-1 ${getTypeBadgeStyles(
                    notification.type
                  )}`}
                >
                  {notification.type}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                  Priority
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${getPriorityDot(
                      notification.priority
                    )}`}
                  />
                  <span className="text-xs md:text-sm text-gray-700">
                    {getPriorityLabel(notification.priority)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                  Received
                </p>
                <p className="text-xs md:text-sm text-gray-700 mt-1 break-words">
                  {new Date(notification.created_at).toLocaleString()} ({formatRelativeTime(notification.created_at)})
                </p>
              </div>

              {notification.read_at && (
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                    Read
                  </p>
                  <p className="text-xs md:text-sm text-gray-700 mt-1 break-words">
                    {new Date(notification.read_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Additional Data */}
            {notification.data && Object.keys(notification.data).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">
                  Additional Information
                </p>
                <div className="bg-gray-50 rounded-lg p-2 md:p-3 text-xs md:text-sm text-gray-700 overflow-x-auto">
                  <pre className="text-xs">
                    {JSON.stringify(notification.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 md:p-4 space-y-2 shrink-0">
            {isUnread && (
              <button
                onClick={handleMarkAsRead}
                className="w-full px-3 md:px-4 py-2 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                Mark as Read
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-3 md:px-4 py-2 md:py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 font-medium text-sm md:text-base flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              onClick={onClose}
              className="w-full px-3 md:px-4 py-2 md:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm md:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
