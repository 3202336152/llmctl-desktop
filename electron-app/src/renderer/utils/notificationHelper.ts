import { NotificationAPI } from '../components/Notifications/notificationAPI';
import { NotificationType, NotificationPriority } from '../components/Notifications/types';

/**
 * 通知辅助工具
 * 用于在业务场景中快速创建和发送通知
 */
export class NotificationHelper {
  /**
   * 创建系统通知
   */
  static async createSystemNotification(
    title: string,
    content?: string,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    actionUrl?: string,
    actionText?: string
  ) {
    try {
      // 这里可以调用后端API创建通知
      // 暂时使用console.log模拟
      console.log('[NotificationHelper] 创建系统通知:', {
        title,
        content,
        type: NotificationType.SYSTEM,
        priority,
        actionUrl,
        actionText
      });
    } catch (error) {
      console.error('创建系统通知失败:', error);
    }
  }

  /**
   * 创建会话通知
   */
  static async createSessionNotification(
    title: string,
    content?: string,
    sessionId?: string,
    priority: NotificationPriority = NotificationPriority.NORMAL
  ) {
    try {
      const actionUrl = sessionId ? `/sessions` : undefined;
      const actionText = sessionId ? '查看会话' : undefined;

      console.log('[NotificationHelper] 创建会话通知:', {
        title,
        content,
        type: NotificationType.SESSION,
        priority,
        actionUrl,
        actionText,
        sessionId
      });
    } catch (error) {
      console.error('创建会话通知失败:', error);
    }
  }

  /**
   * 创建Token通知
   */
  static async createTokenNotification(
    title: string,
    content?: string,
    tokenId?: string,
    priority: NotificationPriority = NotificationPriority.HIGH
  ) {
    try {
      const actionUrl = tokenId ? `/tokens` : undefined;
      const actionText = tokenId ? '管理Token' : undefined;

      console.log('[NotificationHelper] 创建Token通知:', {
        title,
        content,
        type: NotificationType.ERROR,
        priority,
        actionUrl,
        actionText,
        tokenId
      });
    } catch (error) {
      console.error('创建Token通知失败:', error);
    }
  }

  /**
   * 创建成功通知
   */
  static async createSuccessNotification(
    title: string,
    content?: string,
    actionUrl?: string,
    actionText?: string
  ) {
    try {
      console.log('[NotificationHelper] 创建成功通知:', {
        title,
        content,
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.NORMAL,
        actionUrl,
        actionText
      });
    } catch (error) {
      console.error('创建成功通知失败:', error);
    }
  }

  /**
   * 创建错误通知
   */
  static async createErrorNotification(
    title: string,
    content?: string,
    actionUrl?: string,
    actionText?: string
  ) {
    try {
      console.log('[NotificationHelper] 创建错误通知:', {
        title,
        content,
        type: NotificationType.ERROR,
        priority: NotificationPriority.HIGH,
        actionUrl,
        actionText
      });
    } catch (error) {
      console.error('创建错误通知失败:', error);
    }
  }

  /**
   * 创建统计报告通知
   */
  static async createStatisticsNotification(
    title: string,
    content?: string,
    actionUrl?: string,
    actionText?: string
  ) {
    try {
      console.log('[NotificationHelper] 创建统计通知:', {
        title,
        content,
        type: NotificationType.STATISTICS,
        priority: NotificationPriority.LOW,
        actionUrl,
        actionText
      });
    } catch (error) {
      console.error('创建统计通知失败:', error);
    }
  }
}

/**
 * 常用通知模板
 */
export const NotificationTemplates = {
  // 会话相关模板
  SESSION_STARTED: (sessionName: string, sessionId: string) => ({
    title: '会话已启动',
    content: `会话 "${sessionName}" 已成功启动并开始运行。`,
    actionUrl: '/sessions',
    actionText: '查看会话'
  }),

  SESSION_TERMINATED: (sessionName: string) => ({
    title: '会话已终止',
    content: `会话 "${sessionName}" 已被终止。`,
    actionUrl: '/sessions',
    actionText: '查看详情'
  }),

  SESSION_ERROR: (sessionName: string, error: string) => ({
    title: '会话执行错误',
    content: `会话 "${sessionName}" 执行时发生错误: ${error}`,
    actionUrl: '/sessions',
    actionText: '查看详情'
  }),

  // Token相关模板
  TOKEN_EXPIRED: (tokenAlias: string) => ({
    title: 'Token已失效',
    content: `Token "${tokenAlias}" 已失效，请更新配置。`,
    actionUrl: '/tokens',
    actionText: '管理Token'
  }),

  TOKEN_ERROR: (tokenAlias: string, error: string) => ({
    title: 'Token错误',
    content: `Token "${tokenAlias}" 使用时发生错误: ${error}`,
    actionUrl: '/tokens',
    actionText: '查看Token'
  }),

  TOKEN_HEALTH_WARNING: (tokenAlias: string) => ({
    title: 'Token健康状态警告',
    content: `Token "${tokenAlias}" 健康检查失败，建议检查配置。`,
    actionUrl: '/tokens',
    actionText: '检查Token'
  }),

  // Provider相关模板
  PROVIDER_ADDED: (providerName: string) => ({
    title: 'Provider已添加',
    content: `Provider "${providerName}" 已成功添加并启用。`,
    actionUrl: '/providers',
    actionText: '查看Provider'
  }),

  PROVIDER_UPDATED: (providerName: string) => ({
    title: 'Provider已更新',
    content: `Provider "${providerName}" 配置已更新。`,
    actionUrl: '/providers',
    actionText: '查看配置'
  }),

  PROVIDER_DISABLED: (providerName: string) => ({
    title: 'Provider已禁用',
    content: `Provider "${providerName}" 已被禁用。`,
    actionUrl: '/providers',
    actionText: '查看状态'
  }),

  // 系统相关模板
  SYSTEM_STARTUP: () => ({
    title: '系统启动完成',
    content: 'LLMctl系统已成功启动，所有服务运行正常。',
    actionUrl: '/',
    actionText: '开始使用'
  }),

  SYSTEM_ERROR: (error: string) => ({
    title: '系统错误',
    content: `系统运行时发生错误: ${error}`,
    actionUrl: '/settings',
    actionText: '查看设置'
  }),

  CONFIGURATION_IMPORTED: (providerCount: number, tokenCount: number) => ({
    title: '配置导入成功',
    content: `成功导入 ${providerCount} 个Provider和 ${tokenCount} 个Token。`,
    actionUrl: '/providers',
    actionText: '查看配置'
  }),

  CONFIGURATION_EXPORTED: () => ({
    title: '配置导出成功',
    content: '当前配置已成功导出，请注意备份文件安全。',
    actionUrl: '/settings',
    actionText: '查看设置'
  })
};