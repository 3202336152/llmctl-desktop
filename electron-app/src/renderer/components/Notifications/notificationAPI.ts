import apiClient from '../../services/httpClient';
import { authStorage } from '../../utils/authStorage';
import { Notification, NotificationFilter, NotificationListResponse } from './types';

// API响应接口
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 通知API服务
 */
export class NotificationAPI {
  /**
   * 获取通知列表
   */
  static async getNotifications(filter: NotificationFilter = {}): Promise<NotificationListResponse> {
    try {
      const params = new URLSearchParams();

      if (filter.type) params.append('type', filter.type);
      if (filter.unreadOnly !== undefined) params.append('unreadOnly', filter.unreadOnly.toString());
      if (filter.sortBy) params.append('sortBy', filter.sortBy);
      if (filter.sortOrder) params.append('sortOrder', filter.sortOrder);
      if (filter.page) params.append('page', filter.page.toString());
      if (filter.size) params.append('size', filter.size.toString());

      const response = await apiClient.get<ApiResponse<NotificationListResponse>>(
        `/notifications?${params.toString()}`
      );

      return response.data.data;
    } catch (error) {
      console.error('获取通知列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取通知详情
   */
  static async getNotificationById(id: number): Promise<Notification> {
    try {
      const response = await apiClient.get<ApiResponse<Notification>>(
        `/notifications/${id}`
      );

      return response.data.data;
    } catch (error) {
      console.error('获取通知详情失败:', error);
      throw error;
    }
  }

  /**
   * 标记通知为已读
   */
  static async markAsRead(id: number): Promise<void> {
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error('标记通知已读失败:', error);
      throw error;
    }
  }

  /**
   * 批量标记为已读
   */
  static async batchMarkAsRead(ids: number[]): Promise<void> {
    try {
      await apiClient.put(`/notifications/mark-read`, ids);
    } catch (error) {
      console.error('批量标记通知已读失败:', error);
      throw error;
    }
  }

  /**
   * 标记所有通知为已读
   */
  static async markAllAsRead(): Promise<void> {
    try {
      await apiClient.put(`/notifications/read-all`);
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
      throw error;
    }
  }

  /**
   * 删除通知
   */
  static async deleteNotification(id: number): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${id}`);
    } catch (error) {
      console.error('删除通知失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除通知
   */
  static async batchDeleteNotifications(ids: number[]): Promise<void> {
    try {
      await apiClient.delete(`/notifications/batch`, { data: ids });
    } catch (error) {
      console.error('批量删除通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取未读通知数量
   */
  static async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<{ unreadCount: number }>>(
        `/notifications/unread-count`
      );

      return response.data.data.unreadCount;
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      throw error;
    }
  }
}

/**
 * SSE连接管理
 */
export class NotificationSSE {
  private eventSource: EventSource | null = null;
  private userId: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private listeners: Map<string, ((data: any) => void)> = new Map();

  /**
   * 获取API基础URL
   */
  private getApiBaseUrl(): string {
    // 从apiClient获取baseURL
    return apiClient.defaults.baseURL || 'http://localhost:8080/llmctl';
  }

  /**
   * 连接SSE
   */
  connect(userId: string): void {
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      return;
    }

    this.userId = userId;
    this.isConnecting = true;

    try {
      // 获取JWT token
      const token = authStorage.getAccessToken();
      if (!token) {
        console.warn('SSE连接失败：未找到JWT token');
        this.isConnecting = false;
        return;
      }

      // 将token作为URL参数传递，因为EventSource不支持自定义header
      const apiBaseUrl = this.getApiBaseUrl();
      const sseUrl = `${apiBaseUrl}/sse/notifications?userId=${userId}&token=${encodeURIComponent(token)}`;

      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        console.log('SSE连接已建立');
        this.isConnecting = false;
        this.clearReconnectTimer();
        this.emit('connected', true);
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('解析SSE消息失败:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error);
        this.isConnecting = false;
        this.emit('connected', false);
        this.scheduleReconnect();
      };

      // 监听特定事件类型
      this.eventSource.addEventListener('notification', (event: any) => {
        try {
          const notification = JSON.parse(event.data);
          this.emit('notification', notification);
        } catch (error) {
          console.error('解析通知消息失败:', error);
        }
      });

      this.eventSource.addEventListener('broadcast', (event: any) => {
        try {
          const notification = JSON.parse(event.data);
          this.emit('broadcast', notification);
        } catch (error) {
          console.error('解析广播消息失败:', error);
        }
      });

      this.eventSource.addEventListener('heartbeat', (event: any) => {
        try {
          const heartbeat = JSON.parse(event.data);
          this.emit('heartbeat', heartbeat);
        } catch (error) {
          console.error('解析心跳消息失败:', error);
        }
      });

    } catch (error) {
      console.error('创建SSE连接失败:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.clearReconnectTimer();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.userId = null;
    this.isConnecting = false;
    this.listeners.clear();
  }

  /**
   * 添加事件监听器
   */
  on(event: string, callback: (data: any) => void): void {
    this.listeners.set(event, callback);
  }

  /**
   * 移除事件监听器
   */
  off(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const callback = this.listeners.get(event);
    if (callback) {
      callback(data);
    }
  }

  /**
   * 处理通用消息
   */
  private handleMessage(data: any): void {
    if (data.type === 'heartbeat') {
      this.emit('heartbeat', data);
    } else {
      this.emit('message', data);
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('尝试重新连接SSE...');
      if (this.userId) {
        this.connect(this.userId);
      }
    }, 5000); // 5秒后重连
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 获取连接状态
   */
  get readyState(): number {
    return this.eventSource?.readyState ?? EventSource.CLOSED;
  }

  /**
   * 是否已连接
   */
  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// 导出全局SSE实例
export const notificationSSE = new NotificationSSE();