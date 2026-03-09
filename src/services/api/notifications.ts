/**
 * Notifications API Service
 */
import { get, put, del, ApiResponse, PaginatedResponse } from '../request';

// Types
export type NotificationType =
  | 'PROFILE_SUBMITTED'
  | 'PROFILE_VERIFIED'
  | 'PROFILE_NEED_INFO'
  | 'PUBLICATION_SYNC'
  | 'IDEA_SUBMITTED'
  | 'IDEA_STATUS_CHANGED'
  | 'PROJECT_UPDATE'
  | 'SYSTEM';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse extends PaginatedResponse<Notification> {
  meta: PaginatedResponse<Notification>['meta'] & {
    unreadCount: number;
  };
}

// API Functions

/**
 * Lấy danh sách thông báo
 */
export async function queryNotifications(params?: {
  page?: number;
  perPage?: number;
  read?: boolean;
}): Promise<NotificationListResponse> {
  return get<NotificationListResponse>('/api/notifications', params);
}

/**
 * Đếm số thông báo chưa đọc
 */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return get<ApiResponse<{ count: number }>>('/api/notifications/unread-count');
}

/**
 * Đánh dấu 1 thông báo đã đọc
 */
export async function markRead(id: number): Promise<ApiResponse<null>> {
  return put<ApiResponse<null>>(`/api/notifications/${id}/read`);
}

/**
 * Đánh dấu tất cả đã đọc
 */
export async function markAllRead(): Promise<ApiResponse<null>> {
  return put<ApiResponse<null>>('/api/notifications/read-all');
}

/**
 * Xóa 1 thông báo
 */
export async function deleteNotification(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/notifications/${id}`);
}

/**
 * Xóa tất cả thông báo
 */
export async function clearAllNotifications(): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>('/api/notifications/clear-all');
}
