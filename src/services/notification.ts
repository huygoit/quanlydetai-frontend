/**
 * Mock Service - Notification
 * Theo specs/scientific-profile.md.md Section 7
 * Frontend-only, localStorage
 */

// ========== TYPES ==========

export type NotificationType =
  | 'PROFILE_SUBMITTED'      // NCV gửi cập nhật
  | 'PROFILE_VERIFIED'       // Phòng KH xác thực
  | 'PROFILE_NEED_INFO'      // Yêu cầu bổ sung
  | 'PUBLICATION_SYNC'       // Có công bố gợi ý mới
  | 'IDEA_STATUS_CHANGED'    // Ý tưởng thay đổi trạng thái
  | 'PROJECT_UPDATE'         // Cập nhật đề tài
  | 'SYSTEM';                // Thông báo hệ thống

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ========== CONSTANTS ==========
// Version 2: Updated with profile module v2
const NOTIFICATIONS_KEY = 'khcn-notifications-v2';

export const NOTIFICATION_TYPE_MAP: Record<NotificationType, { icon: string; color: string }> = {
  PROFILE_SUBMITTED: { icon: 'UserOutlined', color: '#1890ff' },
  PROFILE_VERIFIED: { icon: 'CheckCircleOutlined', color: '#52c41a' },
  PROFILE_NEED_INFO: { icon: 'ExclamationCircleOutlined', color: '#faad14' },
  PUBLICATION_SYNC: { icon: 'FileSearchOutlined', color: '#722ed1' },
  IDEA_STATUS_CHANGED: { icon: 'BulbOutlined', color: '#eb2f96' },
  PROJECT_UPDATE: { icon: 'ProjectOutlined', color: '#13c2c2' },
  SYSTEM: { icon: 'BellOutlined', color: '#8c8c8c' },
};

// ========== MOCK DATA ==========

const defaultNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'PUBLICATION_SYNC',
    title: 'Công bố gợi ý mới',
    message: 'Có 2 công bố gợi ý mới từ Google Scholar. Vui lòng xác nhận hoặc bỏ qua.',
    link: '/profile/me?tab=publications',
    read: false,
    createdAt: '2024-03-15T08:00:00Z',
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'PROFILE_VERIFIED',
    title: 'Hồ sơ đã được xác thực',
    message: 'Hồ sơ khoa học của bạn đã được Phòng KH xác thực thành công.',
    link: '/profile/me',
    read: true,
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'notif-3',
    userId: 'user-2',
    type: 'PROFILE_NEED_INFO',
    title: 'Yêu cầu bổ sung hồ sơ',
    message: 'Hồ sơ khoa học cần bổ sung: Cần bổ sung thông tin về học vị và chứng chỉ ngoại ngữ.',
    link: '/profile/me',
    read: false,
    createdAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'notif-4',
    userId: 'PHONG_KH',
    type: 'PROFILE_SUBMITTED',
    title: 'Hồ sơ mới cập nhật',
    message: 'Hồ sơ khoa học của ThS. Trần Thị B đã gửi cập nhật. Vui lòng xem xét.',
    link: '/profile/profile-2',
    read: false,
    createdAt: '2024-03-15T14:30:00Z',
  },
  {
    id: 'notif-5',
    userId: 'user-3',
    type: 'PUBLICATION_SYNC',
    title: 'Công bố gợi ý mới',
    message: 'Có 1 công bố gợi ý mới từ Google Scholar.',
    link: '/profile/me?tab=publications',
    read: false,
    createdAt: '2024-03-10T12:00:00Z',
  },
  {
    id: 'notif-6',
    userId: 'user-4',
    type: 'PROFILE_NEED_INFO',
    title: 'Yêu cầu bổ sung hồ sơ',
    message: 'Cần bổ sung thông tin về học vị và chứng chỉ ngoại ngữ.',
    link: '/profile/me',
    read: false,
    createdAt: '2024-03-10T09:00:00Z',
  },
];

// ========== HELPER FUNCTIONS ==========

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const loadNotifications = (): Notification[] => {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultNotifications;
    }
  }
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(defaultNotifications));
  return defaultNotifications;
};

const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

// ========== API FUNCTIONS ==========

/**
 * Query notifications for user
 */
export async function queryNotifications(userId: string): Promise<{
  data: Notification[];
  unreadCount: number;
  success: boolean;
}> {
  await delay(200);
  const notifications = loadNotifications();

  // Filter by userId or role-based notifications (PHONG_KH receives all PROFILE_SUBMITTED)
  const filtered = notifications
    .filter(n => n.userId === userId || n.userId === 'PHONG_KH' || n.userId === 'ADMIN')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = filtered.filter(n => !n.read).length;

  return { data: filtered, unreadCount, success: true };
}

/**
 * Get unread count only
 */
export async function getUnreadCount(userId: string): Promise<{
  count: number;
  success: boolean;
}> {
  await delay(100);
  const notifications = loadNotifications();
  const count = notifications.filter(
    n => (n.userId === userId || n.userId === 'PHONG_KH' || n.userId === 'ADMIN') && !n.read
  ).length;
  return { count, success: true };
}

/**
 * Mark notification as read
 */
export async function markRead(notificationId: string): Promise<{
  success: boolean;
}> {
  await delay(100);
  const notifications = loadNotifications();
  const index = notifications.findIndex(n => n.id === notificationId);

  if (index === -1) {
    return { success: false };
  }

  notifications[index] = {
    ...notifications[index],
    read: true,
  };
  saveNotifications(notifications);

  return { success: true };
}

/**
 * Mark all as read
 */
export async function markAllRead(userId: string): Promise<{
  success: boolean;
}> {
  await delay(200);
  const notifications = loadNotifications();

  const updated = notifications.map(n => {
    if (n.userId === userId || n.userId === 'PHONG_KH' || n.userId === 'ADMIN') {
      return { ...n, read: true };
    }
    return n;
  });

  saveNotifications(updated);
  return { success: true };
}

/**
 * Push new notification
 */
export async function pushNotification(payload: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<{
  data: Notification;
  success: boolean;
}> {
  await delay(100);
  const notifications = loadNotifications();

  const newNotification: Notification = {
    id: generateId(),
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link,
    read: false,
    createdAt: new Date().toISOString(),
  };

  notifications.unshift(newNotification);
  saveNotifications(notifications);

  return { data: newNotification, success: true };
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<{
  success: boolean;
}> {
  await delay(100);
  const notifications = loadNotifications();
  const filtered = notifications.filter(n => n.id !== notificationId);
  saveNotifications(filtered);
  return { success: true };
}

/**
 * Clear all notifications for user
 */
export async function clearAllNotifications(userId: string): Promise<{
  success: boolean;
}> {
  await delay(200);
  const notifications = loadNotifications();
  const filtered = notifications.filter(
    n => n.userId !== userId && n.userId !== 'PHONG_KH' && n.userId !== 'ADMIN'
  );
  saveNotifications(filtered);
  return { success: true };
}

// ========== NOTIFICATION TRIGGERS ==========

/**
 * Trigger: NCV submitted profile update
 */
export async function notifyProfileSubmitted(
  profileId: string,
  profileName: string
): Promise<void> {
  await pushNotification({
    userId: 'PHONG_KH', // Phòng KH receives this
    type: 'PROFILE_SUBMITTED',
    title: 'Hồ sơ mới cập nhật',
    message: `Hồ sơ khoa học của ${profileName} đã gửi cập nhật. Vui lòng xem xét.`,
    link: `/profile/${profileId}`,
  });
}

/**
 * Trigger: Profile verified
 */
export async function notifyProfileVerified(
  userId: string,
  profileName: string
): Promise<void> {
  await pushNotification({
    userId,
    type: 'PROFILE_VERIFIED',
    title: 'Hồ sơ đã được xác thực',
    message: 'Hồ sơ khoa học của bạn đã được Phòng KH xác thực thành công.',
    link: '/profile/me',
  });
}

/**
 * Trigger: Need more info
 */
export async function notifyNeedMoreInfo(
  userId: string,
  reason: string
): Promise<void> {
  await pushNotification({
    userId,
    type: 'PROFILE_NEED_INFO',
    title: 'Yêu cầu bổ sung hồ sơ',
    message: `Hồ sơ khoa học cần bổ sung: ${reason}`,
    link: '/profile/me',
  });
}

/**
 * Trigger: Publication suggestions synced
 */
export async function notifyPublicationSync(
  userId: string,
  count: number,
  source: string
): Promise<void> {
  if (count > 0) {
    await pushNotification({
      userId,
      type: 'PUBLICATION_SYNC',
      title: 'Công bố gợi ý mới',
      message: `Có ${count} công bố gợi ý mới từ ${source}. Vui lòng xác nhận hoặc bỏ qua.`,
      link: '/profile/me?tab=publications',
    });
  }
}

