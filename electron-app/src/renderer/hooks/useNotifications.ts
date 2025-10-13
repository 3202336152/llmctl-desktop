import { useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import {
  fetchNotifications,
  fetchUnreadCount,
  addNotification,
  setSseConnected
} from '../store/slices/notificationSlice';
import { NotificationType, NotificationPriority } from '../components/Notifications/types';
import { notificationSSE } from '../components/Notifications/notificationAPI';
import { authStorage } from '../utils/authStorage';

/**
 * 通知管理Hook
 */
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    settings,
    sseConnected
  } = useAppSelector(state => state.notification);

  const userIdRef = useRef<string | null>(null);

  // 初始化SSE连接
  const initializeSSE = useCallback(() => {
    const currentUser = authStorage.getCurrentUser();
    if (!currentUser?.userId) {
      console.warn('[useNotifications] 用户未登录，无法建立SSE连接');
      return;
    }

    const userId = currentUser.userId.toString();
    userIdRef.current = userId;

    // 设置SSE事件监听器
    notificationSSE.on('notification', (notification) => {
      dispatch(addNotification(notification));
    });

    notificationSSE.on('broadcast', (notification) => {
      dispatch(addNotification(notification));
    });

    notificationSSE.on('heartbeat', (data) => {
      console.debug('[useNotifications] 收到心跳:', data);
    });

    // 连接SSE
    notificationSSE.connect(userId);

    console.log('[useNotifications] SSE连接已建立:', userId);
  }, [dispatch]);

  // 断开SSE连接
  const disconnectSSE = useCallback(() => {
    notificationSSE.disconnect();
    dispatch(setSseConnected(false));
    console.log('[useNotifications] SSE连接已断开');
  }, [dispatch]);

  // 初始化和清理
  useEffect(() => {
    // 检查登录状态
    const isAuthenticated = authStorage.isLoggedIn();
    if (!isAuthenticated) {
      console.log('[useNotifications] 用户未登录，跳过通知初始化');
      return;
    }

    // 初始化SSE连接
    if (settings.enableSSE) {
      initializeSSE();
    }

    // 加载初始数据
    dispatch(fetchUnreadCount());

    // 清理函数
    return () => {
      disconnectSSE();
    };
  }, [settings.enableSSE, initializeSSE, disconnectSSE, dispatch]);

  // 监听SSE连接状态
  useEffect(() => {
    const interval = setInterval(() => {
      const isConnected = notificationSSE.isConnected;
      if (isConnected !== sseConnected) {
        dispatch(setSseConnected(isConnected));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sseConnected, dispatch]);

  // 快速创建通知的方法（用于测试或特殊情况）
  const createNotification = useCallback((
    title: string,
    content?: string,
    type: NotificationType = NotificationType.SYSTEM,
    priority: NotificationPriority = NotificationPriority.NORMAL
  ) => {
    const currentUser = authStorage.getCurrentUser();
    if (!currentUser) {
      console.warn('[useNotifications] 用户未登录，无法创建通知');
      return;
    }

    // 这里可以通过API创建通知，或者直接添加到状态中
    console.log('[useNotifications] 创建通知:', { title, content, type, priority });
  }, []);

  // 刷新通知列表
  const refreshNotifications = useCallback(() => {
    dispatch(fetchNotifications({}));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // 刷新未读数量
  const refreshUnreadCount = useCallback(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  return {
    // 状态
    notifications,
    unreadCount,
    loading,
    error,
    sseConnected,
    settings,

    // 方法
    initializeSSE,
    disconnectSSE,
    refreshNotifications,
    refreshUnreadCount,
    createNotification,

    // 连接状态
    isSSEConnected: notificationSSE.isConnected
  };
};

/**
 * 通知统计Hook
 */
export const useNotificationStats = () => {
  const { notifications, unreadCount } = useAppSelector(state => state.notification);

  // 按类型统计
  const statsByType = notifications.reduce((stats, notification) => {
    const type = notification.type;
    if (!stats[type]) {
      stats[type] = { total: 0, unread: 0 };
    }
    stats[type].total++;
    if (!notification.isRead) {
      stats[type].unread++;
    }
    return stats;
  }, {} as Record<NotificationType, { total: number; unread: number }>);

  // 按优先级统计
  const statsByPriority = notifications.reduce((stats, notification) => {
    const priority = notification.priority;
    if (!stats[priority]) {
      stats[priority] = { total: 0, unread: 0 };
    }
    stats[priority].total++;
    if (!notification.isRead) {
      stats[priority].unread++;
    }
    return stats;
  }, {} as Record<NotificationPriority, { total: number; unread: number }>);

  return {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    byType: statsByType,
    byPriority: statsByPriority
  };
};

/**
 * 通知Hook（简化版，只提供基本功能）
 */
export const useNotification = () => {
  const {
    unreadCount,
    sseConnected,
    refreshNotifications,
    refreshUnreadCount
  } = useNotifications();

  return {
    unreadCount,
    sseConnected,
    refreshNotifications,
    refreshUnreadCount
  };
};