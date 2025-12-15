/**
 * Notification Bell Component
 * Hiển thị thông báo trong header
 */
import React, { useState, useEffect, useCallback } from 'react';
import { history, useModel } from '@umijs/max';
import {
  Badge,
  Popover,
  List,
  Button,
  Empty,
  Spin,
  Typography,
  Space,
  message,
} from 'antd';
import {
  BellOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  BulbOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  queryNotifications,
  markRead,
  markAllRead,
} from '@/services/notification';
import type { Notification, NotificationType } from '@/services/notification';
import './index.less';

const { Text } = Typography;

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  PROFILE_SUBMITTED: <UserOutlined style={{ color: '#1890ff' }} />,
  PROFILE_VERIFIED: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  PROFILE_NEED_INFO: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
  PUBLICATION_SYNC: <FileSearchOutlined style={{ color: '#722ed1' }} />,
  IDEA_STATUS_CHANGED: <BulbOutlined style={{ color: '#eb2f96' }} />,
  PROJECT_UPDATE: <ProjectOutlined style={{ color: '#13c2c2' }} />,
  SYSTEM: <BellOutlined style={{ color: '#8c8c8c' }} />,
};

interface NotificationBellProps {
  userId?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const effectiveUserId = userId || currentUser?.role || 'user-1';

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await queryNotifications(effectiveUserId);
      if (result.success) {
        setNotifications(result.data.slice(0, 10)); // Show only 10 latest
        setUnreadCount(result.unreadCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Handle click notification
  const handleClick = async (notification: Notification) => {
    if (!notification.read) {
      await markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notification.link) {
      setOpen(false);
      history.push(notification.link);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    await markAllRead(effectiveUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    message.success('Đã đánh dấu tất cả đã đọc');
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const content = (
    <div className="notification-content">
      <div className="notification-header">
        <Text strong>Thông báo</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllRead}>
            Đọc tất cả
          </Button>
        )}
      </div>

      {loading ? (
        <div className="notification-loading">
          <Spin size="small" />
        </div>
      ) : notifications.length > 0 ? (
        <List
          className="notification-list"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className={`notification-item ${!item.read ? 'unread' : ''}`}
              onClick={() => handleClick(item)}
            >
              <div className="notification-icon">{ICON_MAP[item.type]}</div>
              <div className="notification-body">
                <div className="notification-title">{item.title}</div>
                <div className="notification-message">{item.message}</div>
                <div className="notification-time">
                  <ClockCircleOutlined /> {formatTime(item.createdAt)}
                </div>
              </div>
              {!item.read && <div className="unread-dot" />}
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không có thông báo"
          className="notification-empty"
        />
      )}

      <div className="notification-footer">
        <Button
          type="link"
          block
          onClick={() => {
            setOpen(false);
            // Navigate to full notifications page if exists
            message.info('Tính năng đang phát triển');
          }}
        >
          Xem tất cả thông báo
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      overlayClassName="notification-popover"
      arrow={false}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined className="notification-bell-icon" />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;

