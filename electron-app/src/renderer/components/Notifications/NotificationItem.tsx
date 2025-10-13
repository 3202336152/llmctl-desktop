import React from 'react';
import { Card, Button, Typography, Tag, Space, Divider } from 'antd';
import {
  DesktopOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RightOutlined,
  DeleteOutlined,
  SettingOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { Notification, NotificationType, NotificationPriority } from './types';
import { useAppDispatch } from '../../store';
import { markAsRead, deleteNotification } from '../../store/slices/notificationSlice';
import './NotificationItem.css';

const { Text, Paragraph } = Typography;

interface NotificationItemProps {
  notification: Notification;
  showActions?: boolean;
  onActionClick?: (actionUrl: string) => void;
}

/**
 * 单个通知项组件
 */
const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  showActions = true,
  onActionClick
}) => {
  const dispatch = useAppDispatch();

  // 获取通知类型图标
  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return <SettingOutlined />;
      case NotificationType.SESSION:
        return <DesktopOutlined />;
      case NotificationType.STATISTICS:
        return <BarChartOutlined />;
      case NotificationType.WARNING:
        return <ExclamationCircleOutlined />;
      case NotificationType.SUCCESS:
        return <CheckCircleOutlined />;
      case NotificationType.ERROR:
        return <CloseCircleOutlined />;
      default:
        return <SettingOutlined />;
    }
  };

  // 获取通知类型颜色
  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SYSTEM:
        return 'blue';
      case NotificationType.SESSION:
        return 'green';
      case NotificationType.STATISTICS:
        return 'purple';
      case NotificationType.WARNING:
        return 'orange';
      case NotificationType.SUCCESS:
        return 'green';
      case NotificationType.ERROR:
        return 'red';
      default:
        return 'default';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.LOW:
        return 'default';
      case NotificationPriority.NORMAL:
        return 'blue';
      case NotificationPriority.HIGH:
        return 'orange';
      case NotificationPriority.URGENT:
        return 'red';
      default:
        return 'default';
    }
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return '刚刚';
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}小时前`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days}天前`;
    }
  };

  // 处理标记已读
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }
  };

  // 处理删除通知
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteNotification(notification.id));
  };

  // 处理操作按钮点击
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.actionUrl && onActionClick) {
      onActionClick(notification.actionUrl);
    }
  };

  // 处理卡片点击
  const handleCardClick = () => {
    if (!notification.isRead) {
      dispatch(markAsRead(notification.id));
    }
  };

  const isUnread = !notification.isRead;
  const isExpired = notification.expired;

  return (
    <Card
      className={`notification-item ${isUnread ? 'unread' : ''} ${isExpired ? 'expired' : ''}`}
      size="small"
      hoverable
      onClick={handleCardClick}
      actions={showActions ? [
        notification.hasAction && notification.actionUrl ? (
          <Button
            type="link"
            size="small"
            icon={<RightOutlined />}
            onClick={handleActionClick}
            className="action-btn-primary"
          >
            {notification.actionText || '查看'}
          </Button>
        ) : null,
        !isUnread ? null : (
          <Button
            type="link"
            size="small"
            onClick={handleMarkAsRead}
            className="action-btn-read"
          >
            <CheckOutlined /> 标记已读
          </Button>
        ),
        <Button
          type="link"
          size="small"
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          danger
          className="action-btn-delete"
        >
          删除
        </Button>
      ].filter(Boolean) : []}
    >
      <div className="notification-item-header">
        <Space align="start">
          <div className="notification-item-icon">
            {getTypeIcon(notification.type)}
          </div>
          <div className="notification-item-content" style={{ flex: 1 }}>
            <div className="notification-item-title">
              <Space>
                <Text strong={!isUnread}>{notification.title}</Text>
                <Tag color={getTypeColor(notification.type)} size="small">
                  {notification.type}
                </Tag>
                {notification.priority !== NotificationPriority.NORMAL && (
                  <Tag color={getPriorityColor(notification.priority)} size="small">
                    {notification.priority}
                  </Tag>
                )}
                {isExpired && (
                  <Tag color="default" size="small">
                    已过期
                  </Tag>
                )}
              </Space>
            </div>

            {notification.content && (
              <Paragraph
                ellipsis={{ rows: 2, expandable: false }}
                type={isUnread ? undefined : 'secondary'}
                className="notification-item-description"
              >
                {notification.content}
              </Paragraph>
            )}

            <div className="notification-item-meta">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {formatTime(notification.createdAt)}
              </Text>
            </div>
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default NotificationItem;