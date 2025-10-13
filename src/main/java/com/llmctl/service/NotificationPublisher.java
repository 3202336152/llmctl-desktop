package com.llmctl.service;

import com.llmctl.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 通知发布服务
 * 用于在业务逻辑中发布各种类型的通知
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPublisher {

    private final NotificationService notificationService;
    private final SseConnectionManager sseConnectionManager;

    /**
     * 发布系统通知
     */
    @Async
    public void publishSystemNotification(Long userId, String title, String content) {
        try {
            com.llmctl.entity.Notification notification = notificationService.createSystemNotification(userId, title, content);

            // 转换为响应DTO
            NotificationResponse response = convertToResponse(notification);

            // 通过SSE推送
            sseConnectionManager.pushNotificationToUser(userId.toString(), response);

            log.info("发布系统通知成功: userId={}, title={}", userId, title);
        } catch (Exception e) {
            log.error("发布系统通知失败: userId={}, title={}", userId, title, e);
        }
    }

    /**
     * 发布会话通知
     */
    @Async
    public void publishSessionNotification(Long userId, String sessionId, String title, String content, String actionUrl) {
        try {
            com.llmctl.entity.Notification notification = notificationService.createSessionNotification(userId, sessionId, title, content, actionUrl);

            NotificationResponse response = convertToResponse(notification);
            sseConnectionManager.pushNotificationToUser(userId.toString(), response);

            log.info("发布会话通知成功: userId={}, sessionId={}, title={}", userId, sessionId, title);
        } catch (Exception e) {
            log.error("发布会话通知失败: userId={}, sessionId={}, title={}", userId, sessionId, title, e);
        }
    }

    /**
     * 发布警告通知
     */
    @Async
    public void publishWarningNotification(Long userId, String title, String content, String actionUrl) {
        try {
            com.llmctl.entity.Notification notification = notificationService.createWarningNotification(userId, title, content, actionUrl);

            NotificationResponse response = convertToResponse(notification);
            sseConnectionManager.pushNotificationToUser(userId.toString(), response);

            log.info("发布警告通知成功: userId={}, title={}", userId, title);
        } catch (Exception e) {
            log.error("发布警告通知失败: userId={}, title={}", userId, title, e);
        }
    }

    /**
     * 发布错误通知
     */
    @Async
    public void publishErrorNotification(Long userId, String title, String content, String actionUrl) {
        try {
            com.llmctl.entity.Notification notification = notificationService.createErrorNotification(userId, title, content, actionUrl);

            NotificationResponse response = convertToResponse(notification);
            sseConnectionManager.pushNotificationToUser(userId.toString(), response);

            log.info("发布错误通知成功: userId={}, title={}", userId, title);
        } catch (Exception e) {
            log.error("发布错误通知失败: userId={}, title={}", userId, title, e);
        }
    }

    /**
     * 发布成功通知
     */
    @Async
    public void publishSuccessNotification(Long userId, String title, String content) {
        try {
            com.llmctl.entity.Notification notification = notificationService.createSuccessNotification(userId, title, content);

            NotificationResponse response = convertToResponse(notification);
            sseConnectionManager.pushNotificationToUser(userId.toString(), response);

            log.info("发布成功通知成功: userId={}, title={}", userId, title);
        } catch (Exception e) {
            log.error("发布成功通知失败: userId={}, title={}", userId, title, e);
        }
    }

    /**
     * 广播系统通知（给所有在线用户）
     */
    @Async
    public void broadcastSystemNotification(String title, String content) {
        try {
            // 这里需要获取所有在线用户ID，目前先跳过
            log.info("广播系统通知: title={}", title);
            // TODO: 实现广播逻辑
        } catch (Exception e) {
            log.error("广播系统通知失败: title={}", title, e);
        }
    }

    /**
     * 转换为响应DTO
     */
    private NotificationResponse convertToResponse(com.llmctl.entity.Notification notification) {
        NotificationResponse response = new NotificationResponse();
        org.springframework.beans.BeanUtils.copyProperties(notification, response);

        // 设置额外属性
        response.setExpired(notification.isExpired());
        response.setHasAction(notification.hasAction());

        return response;
    }
}