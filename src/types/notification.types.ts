/**
 * Notification Types & Interfaces
 * Aligned with backend notification system
 */

import { PaginationMeta } from './api.types';

// ============= Notification Type Definitions =============
export type NotificationType = 'transaction' | 'system' | 'promotion' | 'update' | 'alert' | 'support_ticket';
export type PriorityLevel = 'low' | 'normal' | 'high';

// ============= Notification Object =============
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: NotificationType;
  priority: PriorityLevel;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============= Notification Preferences =============
export interface NotificationPreference {
  id: number;
  user_id: number;
  enabled: boolean;
  transaction_notifications: boolean;
  system_notifications: boolean;
  promotion_notifications: boolean;
  update_notifications: boolean;
  alert_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationPreferencesRequest {
  enabled?: boolean;
  transaction_notifications?: boolean;
  system_notifications?: boolean;
  promotion_notifications?: boolean;
  update_notifications?: boolean;
  alert_notifications?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
}

// ============= Notification Filters =============
export interface NotificationFilter {
  page?: number;
  per_page?: number;
  type?: NotificationType;
  priority?: PriorityLevel;
  unread_only?: boolean;
}

// ============= API Responses =============
export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  pagination: PaginationMeta;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
}

export interface PreferenceResponse {
  success: boolean;
  data: NotificationPreference;
}

export interface NotificationStatsResponse {
  success: boolean;
  data: {
    total: number;
    unread: number;
    by_type: {
      transaction: number;
      system: number;
      promotion: number;
      update: number;
      alert: number;
    };
    by_priority: {
      low: number;
      normal: number;
      high: number;
    };
  };
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
  data?: {
    affected?: number;
  };
}

// ============= Push Token Management =============
export interface PushTokenRequest {
  expo_push_token: string;
  device_info?: {
    device_id?: string;
    platform?: 'ios' | 'android' | 'web';
    app_version?: string;
    os_version?: string;
  };
}

// ============= Display Helper Types =============
export interface NotificationDisplayItem extends Notification {
  isUnread: boolean;
  displayTime: string;
}
