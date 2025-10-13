package com.llmctl.dto;

import com.llmctl.entity.Notification.NotificationPriority;
import com.llmctl.entity.Notification.NotificationType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 通知响应DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    /**
     * 通知ID
     */
    private Long id;

    /**
     * 通知类型
     */
    private NotificationType type;

    /**
     * 通知标题
     */
    private String title;

    /**
     * 通知内容
     */
    private String content;

    /**
     * 额外数据
     */
    private Map<String, Object> data;

    /**
     * 是否已读
     */
    private Boolean isRead;

    /**
     * 优先级
     */
    private NotificationPriority priority;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 过期时间
     */
    private LocalDateTime expiresAt;

    /**
     * 点击后跳转的URL
     */
    private String actionUrl;

    /**
     * 按钮文字
     */
    private String actionText;

    /**
     * 是否已过期
     */
    private Boolean expired;

    /**
     * 是否有操作按钮
     */
    private Boolean hasAction;
}