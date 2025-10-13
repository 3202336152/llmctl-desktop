package com.llmctl.dto;

import com.llmctl.entity.Notification.NotificationPriority;
import com.llmctl.entity.Notification.NotificationType;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * 通知创建请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {

    /**
     * 用户ID
     */
    @NotNull(message = "用户ID不能为空")
    private Long userId;

    /**
     * 通知类型
     */
    @NotNull(message = "通知类型不能为空")
    private NotificationType type;

    /**
     * 通知标题
     */
    @NotBlank(message = "通知标题不能为空")
    private String title;

    /**
     * 通知内容（可选）
     */
    private String content;

    /**
     * 额外数据
     */
    private Map<String, Object> data;

    /**
     * 优先级（默认为NORMAL）
     */
    private NotificationPriority priority = NotificationPriority.NORMAL;

    /**
     * 过期时间（可选）
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
     * 批量创建时的用户ID列表
     */
    private java.util.List<Long> userIds;
}