package com.llmctl.controller;

import com.llmctl.context.UserContext;
import com.llmctl.dto.ApiResponse;
import com.llmctl.dto.NotificationRequest;
import com.llmctl.dto.NotificationResponse;
import com.llmctl.entity.Notification;
import com.llmctl.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 通知控制器
 */
@Slf4j
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 获取通知列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNotifications(
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "created_at") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {

        try {
            // 获取当前用户ID（从JWT认证信息中获取）
            Long userId = getCurrentUserId();

            // 解析通知类型
            Notification.NotificationType notificationType = null;
            if (type != null && !type.trim().isEmpty()) {
                try {
                    notificationType = Notification.NotificationType.valueOf(type.toUpperCase());
                } catch (IllegalArgumentException e) {
                    // 如果类型无效，则忽略类型过滤
                    notificationType = null;
                }
            }

            List<NotificationResponse> notifications = notificationService.getNotifications(
                    userId, notificationType, unreadOnly, sortBy, sortOrder, page, size);

            // 获取总数
            Long total = notificationService.getUnreadCount(userId);

            Map<String, Object> data = new HashMap<>();
            data.put("notifications", notifications);
            data.put("unreadCount", total);
            data.put("page", page);
            data.put("size", size);

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("获取通知列表失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("获取通知列表失败: " + e.getMessage()));
        }
    }

    /**
     * 获取通知详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NotificationResponse>> getNotification(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();

            NotificationResponse notification = notificationService.getNotificationById(id, userId);
            if (notification == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(ApiResponse.success(notification));
        } catch (Exception e) {
            log.error("获取通知详情失败: id={}", id, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("获取通知详情失败: " + e.getMessage()));
        }
    }

    /**
     * 标记通知为已读
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();

            notificationService.markAsRead(id, userId);
            return ResponseEntity.ok(ApiResponse.success("操作成功"));
        } catch (Exception e) {
            log.error("标记通知已读失败: id={}", id, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("标记通知已读失败: " + e.getMessage()));
        }
    }

    /**
     * 批量标记为已读
     */
    @PutMapping("/mark-read")
    public ResponseEntity<ApiResponse<Void>> markMultipleAsRead(@RequestBody List<Long> ids) {
        try {
            Long userId = getCurrentUserId();

            notificationService.batchMarkAsRead(ids, userId);
            return ResponseEntity.ok(ApiResponse.success("操作成功"));
        } catch (Exception e) {
            log.error("批量标记通知已读失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("批量标记通知已读失败: " + e.getMessage()));
        }
    }

    /**
     * 标记全部已读
     */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        try {
            Long userId = getCurrentUserId();

            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(ApiResponse.success("操作成功"));
        } catch (Exception e) {
            log.error("标记全部通知已读失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("标记全部通知已读失败: " + e.getMessage()));
        }
    }

    /**
     * 删除通知
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();

            notificationService.deleteNotification(id, userId);
            return ResponseEntity.ok(ApiResponse.success("操作成功"));
        } catch (Exception e) {
            log.error("删除通知失败: id={}", id, e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("删除通知失败: " + e.getMessage()));
        }
    }

    /**
     * 批量删除通知
     */
    @DeleteMapping("/batch")
    public ResponseEntity<ApiResponse<Void>> deleteNotifications(@RequestBody List<Long> ids) {
        try {
            Long userId = getCurrentUserId();

            notificationService.batchDeleteNotifications(ids, userId);
            return ResponseEntity.ok(ApiResponse.success("操作成功"));
        } catch (Exception e) {
            log.error("批量删除通知失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("批量删除通知失败: " + e.getMessage()));
        }
    }

    /**
     * 获取未读数量
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getUnreadCount() {
        try {
            Long userId = getCurrentUserId();

            Long count = notificationService.getUnreadCount(userId);
            Map<String, Integer> data = Map.of("unreadCount", count.intValue());

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception e) {
            log.error("获取未读通知数量失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("获取未读通知数量失败: " + e.getMessage()));
        }
    }

    /**
     * 创建通知（内部API，用于系统调用）
     */
    @PostMapping("/internal")
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(@Valid @RequestBody NotificationRequest request) {
        try {
            // 这里需要验证调用权限，或者使用特殊的认证方式
            Notification notification = notificationService.createNotification(request);

            NotificationResponse response = new NotificationResponse();
            org.springframework.beans.BeanUtils.copyProperties(notification, response);

            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("创建通知失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("创建通知失败: " + e.getMessage()));
        }
    }

    /**
     * 获取当前用户ID
     * 从UserContext中获取当前登录用户的ID
     */
    private Long getCurrentUserId() {
        return UserContext.getUserId();
    }
}