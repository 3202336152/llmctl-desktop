// 通知类型枚举
export enum NotificationType {
  SYSTEM = 'SYSTEM',
  SESSION = 'SESSION',
  STATISTICS = 'STATISTICS',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// 通知优先级枚举
export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// 通知接口
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  content?: string;
  data?: Record<string, any>;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
  expired?: boolean;
  hasAction?: boolean;
}

// 通知列表响应
export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  page: number;
  size: number;
}

// 通知创建请求
export interface CreateNotificationRequest {
  userId: number;
  type: NotificationType;
  title: string;
  content?: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
}

// 通知过滤器
export interface NotificationFilter {
  type?: NotificationType;
  unreadOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: number;
  total?: number; // 总记录数
}

// SSE事件类型
export interface SSENotificationEvent {
  type: 'notification' | 'broadcast' | 'heartbeat';
  data: Notification | { type: string; timestamp: number };
  id?: string;
  retry?: number;
}

// 通知设置
export interface NotificationSettings {
  enableDesktop: boolean;
  enableSound: boolean;
  enableSSE: boolean;
  autoRefresh: boolean;
  refreshInterval: number; // 秒
  displayCount: number; // 显示数量限制
}