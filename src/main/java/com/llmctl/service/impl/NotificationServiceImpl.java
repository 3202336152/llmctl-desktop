package com.llmctl.service.impl;

import com.llmctl.dto.NotificationRequest;
import com.llmctl.dto.NotificationResponse;
import com.llmctl.entity.Notification;
import com.llmctl.mapper.NotificationMapper;
import com.llmctl.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 通知服务实现类
 */
@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;

    public NotificationServiceImpl(NotificationMapper notificationMapper) {
        this.notificationMapper = notificationMapper;
    }

    @Override
    @Transactional
    public Notification createNotification(NotificationRequest request) {
        Notification notification = new Notification();
        BeanUtils.copyProperties(request, notification);
        notification.setIsRead(false);

        // 设置默认值
        if (notification.getPriority() == null) {
            notification.setPriority(Notification.NotificationPriority.NORMAL);
        }

        notificationMapper.insert(notification);
        log.info("创建通知成功: userId={}, type={}, title={}",
                request.getUserId(), request.getType(), request.getTitle());

        return notification;
    }

    @Override
    @Transactional
    public List<Notification> batchCreateNotifications(List<NotificationRequest> requests) {
        List<Notification> notifications = new ArrayList<>();

        for (NotificationRequest request : requests) {
            Notification notification = new Notification();
            BeanUtils.copyProperties(request, notification);
            notification.setIsRead(false);

            if (notification.getPriority() == null) {
                notification.setPriority(Notification.NotificationPriority.NORMAL);
            }

            notifications.add(notification);
        }

        notificationMapper.batchInsert(notifications);
        log.info("批量创建通知成功: {} 条", notifications.size());

        return notifications;
    }

    @Override
    public List<NotificationResponse> getNotifications(Long userId,
                                                       Notification.NotificationType type,
                                                       Boolean unreadOnly,
                                                       String sortBy,
                                                       String sortOrder,
                                                       Integer page,
                                                       Integer size) {
        // 计算偏移量
        int offset = (page - 1) * size;

        // 默认排序字段
        String sortColumn = "created_at";
        if (sortBy != null && !sortBy.trim().isEmpty()) {
            sortColumn = sortBy;
        }

        // 默认排序顺序
        String sort = "DESC";
        if (sortOrder != null && !sortOrder.trim().isEmpty()) {
            sort = sortOrder.toUpperCase();
        }

        List<Notification> notifications = notificationMapper.selectByUserId(
                userId, type, unreadOnly, sortColumn, sort, offset, size);

        return notifications.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationResponse getNotificationById(Long id, Long userId) {
        Notification notification = notificationMapper.selectById(id);
        if (notification == null || !notification.getUserId().equals(userId)) {
            return null;
        }
        return convertToResponse(notification);
    }

    @Override
    @Transactional
    public void markAsRead(Long id, Long userId) {
        Notification notification = notificationMapper.selectById(id);
        if (notification != null && notification.getUserId().equals(userId)) {
            notificationMapper.markAsRead(id);
            log.debug("标记通知已读: id={}, userId={}", id, userId);
        }
    }

    @Override
    @Transactional
    public void batchMarkAsRead(List<Long> ids, Long userId) {
        if (ids != null && !ids.isEmpty()) {
            notificationMapper.batchMarkAsRead(ids);
            log.debug("批量标记通知已读: {} 条, userId={}", ids.size(), userId);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        int updated = notificationMapper.markAllAsReadByUserId(userId);
        log.debug("标记用户所有通知已读: userId={}, 更新数量={}", userId, updated);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id, Long userId) {
        Notification notification = notificationMapper.selectById(id);
        if (notification != null && notification.getUserId().equals(userId)) {
            notificationMapper.deleteById(id);
            log.debug("删除通知: id={}, userId={}", id, userId);
        }
    }

    @Override
    @Transactional
    public void batchDeleteNotifications(List<Long> ids, Long userId) {
        if (ids != null && !ids.isEmpty()) {
            notificationMapper.batchDelete(ids);
            log.debug("批量删除通知: {} 条, userId={}", ids.size(), userId);
        }
    }

    @Override
    public Long getUnreadCount(Long userId) {
        return notificationMapper.countUnreadByUserId(userId);
    }

    @Override
    @Transactional
    public void cleanupExpiredNotifications() {
        int deleted = notificationMapper.deleteExpired();
        if (deleted > 0) {
            log.info("清理过期通知: {} 条", deleted);
        }
    }

    // 便捷方法实现

    @Override
    @Transactional
    public Notification createSystemNotification(Long userId, String title, String content) {
        NotificationRequest request = new NotificationRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.SYSTEM);
        request.setTitle(title);
        request.setContent(content);
        request.setPriority(Notification.NotificationPriority.NORMAL);

        return createNotification(request);
    }

    @Override
    @Transactional
    public Notification createSessionNotification(Long userId, String sessionId, String title, String content, String actionUrl) {
        NotificationRequest request = new NotificationRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.SESSION);
        request.setTitle(title);
        request.setContent(content);
        request.setActionUrl(actionUrl);
        request.setActionText("查看会话");
        request.setPriority(Notification.NotificationPriority.NORMAL);

        // 添加会话ID到额外数据
        request.setData(java.util.Map.of("sessionId", sessionId));

        return createNotification(request);
    }

    @Override
    @Transactional
    public Notification createWarningNotification(Long userId, String title, String content, String actionUrl) {
        NotificationRequest request = new NotificationRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.WARNING);
        request.setTitle(title);
        request.setContent(content);
        request.setActionUrl(actionUrl);
        request.setActionText("查看详情");
        request.setPriority(Notification.NotificationPriority.HIGH);

        return createNotification(request);
    }

    @Override
    @Transactional
    public Notification createErrorNotification(Long userId, String title, String content, String actionUrl) {
        NotificationRequest request = new NotificationRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.ERROR);
        request.setTitle(title);
        request.setContent(content);
        request.setActionUrl(actionUrl);
        request.setActionText("查看详情");
        request.setPriority(Notification.NotificationPriority.URGENT);

        return createNotification(request);
    }

    @Override
    @Transactional
    public Notification createSuccessNotification(Long userId, String title, String content) {
        NotificationRequest request = new NotificationRequest();
        request.setUserId(userId);
        request.setType(Notification.NotificationType.SUCCESS);
        request.setTitle(title);
        request.setContent(content);
        request.setPriority(Notification.NotificationPriority.NORMAL);

        return createNotification(request);
    }

    /**
     * 转换为响应DTO
     */
    private NotificationResponse convertToResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        BeanUtils.copyProperties(notification, response);

        // 设置额外属性
        response.setExpired(notification.isExpired());
        response.setHasAction(notification.hasAction());

        return response;
    }
}