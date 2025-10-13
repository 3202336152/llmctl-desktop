package com.llmctl.controller;

import com.llmctl.dto.NotificationRequest;
import com.llmctl.dto.NotificationResponse;
import com.llmctl.entity.Notification;
import com.llmctl.service.NotificationService;
import com.llmctl.service.SseConnectionManager;
import com.llmctl.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * SSE推送控制器
 */
@Slf4j
@RestController
@RequestMapping("/sse")
@RequiredArgsConstructor
public class SseController {

    private final SseConnectionManager sseConnectionManager;
    private final JwtUtil jwtUtil;
    private final NotificationService notificationService;
    private final ScheduledExecutorService heartbeatExecutor = Executors.newSingleThreadScheduledExecutor();

    /**
     * 订阅通知推送
     * 注意：EventSource不支持自定义header，所以token通过URL参数传递
     */
    @GetMapping(value = "/notifications", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToNotifications(
            @RequestParam String userId,
            @RequestParam String token) {

        log.info("用户 {} 请求订阅通知推送", userId);

        try {
            // 验证token
            String username = jwtUtil.getUsernameFromToken(token);
            Long tokenUserId = jwtUtil.getUserIdFromToken(token);

            // 验证token有效性和用户ID匹配
            if (!jwtUtil.validateToken(token, username)) {
                log.warn("无效的Token: userId={}", userId);
                throw new RuntimeException("无效的Token");
            }

            if (!String.valueOf(tokenUserId).equals(userId)) {
                log.warn("用户ID不匹配: 请求userId={}, Token中userId={}", userId, tokenUserId);
                throw new RuntimeException("用户ID不匹配");
            }

            // 创建SSE连接，设置超时时间为30分钟
            SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);

            // 添加连接到管理器
            sseConnectionManager.addConnection(userId, emitter);

            // 启动心跳任务
            startHeartbeatTask(userId);

            log.info("SSE连接建立成功: userId={}", userId);
            return emitter;

        } catch (Exception e) {
            log.error("SSE连接失败: userId={}", userId, e);
            SseEmitter emitter = new SseEmitter(0L);
            try {
                emitter.completeWithError(e);
            } catch (Exception ex) {
                log.error("发送错误消息失败", ex);
            }
            return emitter;
        }
    }

    /**
     * 发送测试通知（用于调试）
     */
    @PostMapping("/test-notification")
    public ResponseEntity<String> sendTestNotification(
            @RequestParam String userId,
            @RequestParam String title,
            @RequestParam(required = false) String content) {

        try {
            // 创建测试通知
            NotificationRequest request = new NotificationRequest();
            request.setUserId(Long.parseLong(userId));
            request.setType(Notification.NotificationType.SYSTEM);
            request.setTitle(title);
            request.setContent(content != null ? content : "这是一条测试通知消息");
            request.setPriority(Notification.NotificationPriority.NORMAL);

            // 保存通知到数据库
            Notification notification = notificationService.createNotification(request);

            // 转换为响应DTO
            NotificationResponse response = new NotificationResponse();
            org.springframework.beans.BeanUtils.copyProperties(notification, response);
            response.setExpired(notification.isExpired());
            response.setHasAction(notification.hasAction());

            // 通过SSE推送给用户
            sseConnectionManager.pushNotificationToUser(userId, response);

            log.info("发送测试通知成功: userId={}, title={}", userId, title);
            return ResponseEntity.ok("测试通知发送成功");
        } catch (Exception e) {
            log.error("发送测试通知失败", e);
            return ResponseEntity.internalServerError().body("发送测试通知失败: " + e.getMessage());
        }
    }

    /**
     * 获取连接统计信息
     */
    @GetMapping("/stats")
    public ResponseEntity<Object> getConnectionStats() {
        java.util.Map<String, Object> stats = java.util.Map.of(
                "activeConnections", sseConnectionManager.getConnectionCount(),
                "onlineUsers", sseConnectionManager.getOnlineUsers()
        );

        return ResponseEntity.ok(stats);
    }

    /**
     * 启动心跳任务
     */
    private void startHeartbeatTask(String userId) {
        heartbeatExecutor.scheduleAtFixedRate(() -> {
            try {
                sseConnectionManager.sendHeartbeat(userId);
            } catch (Exception e) {
                log.error("发送心跳失败: userId={}", userId, e);
            }
        }, 30, 30, TimeUnit.SECONDS); // 每30秒发送一次心跳
    }
}