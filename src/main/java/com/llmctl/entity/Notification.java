package com.llmctl.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 通知实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    /**
     * 通知ID
     */
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 通知类型
     */
    private NotificationType type;

    /**
     * 通知标题
     */
    private String title;

    /**
     * 通知内容（支持Markdown）
     */
    private String content;

    /**
     * 额外数据（如会话ID、Provider ID等）
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
     * 通知类型枚举
     */
    public enum NotificationType {
        SYSTEM("系统通知"),
        SESSION("会话提醒"),
        STATISTICS("统计报告"),
        WARNING("警告消息"),
        SUCCESS("成功消息"),
        ERROR("错误消息");

        private final String description;

        NotificationType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 优先级枚举
     */
    public enum NotificationPriority {
        LOW("低"),
        NORMAL("普通"),
        HIGH("高"),
        URGENT("紧急");

        private final String description;

        NotificationPriority(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * 检查通知是否已过期
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * 检查通知是否可以执行操作
     */
    public boolean hasAction() {
        return actionUrl != null && !actionUrl.trim().isEmpty();
    }
}