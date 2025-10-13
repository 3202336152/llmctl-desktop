package com.llmctl.service;

import com.llmctl.dto.NotificationRequest;
import com.llmctl.dto.NotificationResponse;
import com.llmctl.entity.Notification;

import java.util.List;

/**
 * 通知服务接口
 */
public interface NotificationService {

    /**
     * 创建通知
     */
    Notification createNotification(NotificationRequest request);

    /**
     * 批量创建通知
     */
    List<Notification> batchCreateNotifications(List<NotificationRequest> requests);

    /**
     * 获取通知列表（分页）
     */
    List<NotificationResponse> getNotifications(Long userId,
                                                 Notification.NotificationType type,
                                                 Boolean unreadOnly,
                                                 String sortBy,
                                                 String sortOrder,
                                                 Integer page,
                                                 Integer size);

    /**
     * 获取通知详情
     */
    NotificationResponse getNotificationById(Long id, Long userId);

    /**
     * 标记通知为已读
     */
    void markAsRead(Long id, Long userId);

    /**
     * 批量标记为已读
     */
    void batchMarkAsRead(List<Long> ids, Long userId);

    /**
     * 标记所有通知为已读
     */
    void markAllAsRead(Long userId);

    /**
     * 删除通知
     */
    void deleteNotification(Long id, Long userId);

    /**
     * 批量删除通知
     */
    void batchDeleteNotifications(List<Long> ids, Long userId);

    /**
     * 获取未读通知数量
     */
    Long getUnreadCount(Long userId);

    /**
     * 清理过期通知
     */
    void cleanupExpiredNotifications();

    // 便捷方法：创建不同类型的通知

    /**
     * 创建系统通知
     */
    Notification createSystemNotification(Long userId, String title, String content);

    /**
     * 创建会话通知
     */
    Notification createSessionNotification(Long userId, String sessionId, String title, String content, String actionUrl);

    /**
     * 创建警告通知
     */
    Notification createWarningNotification(Long userId, String title, String content, String actionUrl);

    /**
     * 创建错误通知
     */
    Notification createErrorNotification(Long userId, String title, String content, String actionUrl);

    /**
     * 创建成功通知
     */
    Notification createSuccessNotification(Long userId, String title, String content);
}