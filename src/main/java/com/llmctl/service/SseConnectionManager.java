package com.llmctl.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llmctl.dto.NotificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE连接管理器
 */
@Slf4j
@Component
public class SseConnectionManager {

    private final Map<String, SseEmitter> connections = new ConcurrentHashMap<>();
    private final Map<String, Long> userLastHeartbeat = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 添加SSE连接
     */
    public void addConnection(String userId, SseEmitter emitter) {
        connections.put(userId, emitter);
        userLastHeartbeat.put(userId, System.currentTimeMillis());

        log.info("用户 {} 建立SSE连接，当前连接数: {}", userId, connections.size());

        // 设置连接超时和完成回调
        emitter.onTimeout(() -> {
            log.info("用户 {} SSE连接超时", userId);
            removeConnection(userId);
        });

        emitter.onCompletion(() -> {
            log.info("用户 {} SSE连接完成", userId);
            removeConnection(userId);
        });

        emitter.onError((throwable) -> {
            log.error("用户 {} SSE连接发生错误", userId, throwable);
            removeConnection(userId);
        });

        // 发送连接成功消息
        sendHeartbeat(userId);
    }

    /**
     * 移除SSE连接
     */
    public void removeConnection(String userId) {
        SseEmitter emitter = connections.remove(userId);
        userLastHeartbeat.remove(userId);

        if (emitter != null) {
            try {
                emitter.complete();
            } catch (Exception e) {
                log.warn("关闭SSE连接时发生异常: userId={}", userId, e);
            }
        }

        log.info("用户 {} 断开SSE连接，当前连接数: {}", userId, connections.size());
    }

    /**
     * 向指定用户推送通知
     */
    public void pushNotificationToUser(String userId, NotificationResponse notification) {
        SseEmitter emitter = connections.get(userId);
        if (emitter != null) {
            try {
                String data = objectMapper.writeValueAsString(notification);
                SseEmitter.SseEventBuilder event = SseEmitter.event()
                        .name("notification")
                        .data(data)
                        .id(String.valueOf(notification.getId()))
                        .reconnectTime(3000); // 3秒重连

                emitter.send(event);
                log.debug("向用户 {} 推送通知成功: {}", userId, notification.getTitle());
            } catch (IOException e) {
                log.error("向用户 {} 推送通知失败: {}", userId, notification.getTitle(), e);
                removeConnection(userId);
            }
        } else {
            log.debug("用户 {} 未建立SSE连接，跳过通知推送", userId);
        }
    }

    /**
     * 向所有用户广播通知
     */
    public void broadcastNotification(NotificationResponse notification) {
        log.info("向所有用户广播通知: {}", notification.getTitle());

        connections.forEach((userId, emitter) -> {
            try {
                String data = objectMapper.writeValueAsString(notification);
                SseEmitter.SseEventBuilder event = SseEmitter.event()
                        .name("broadcast")
                        .data(data)
                        .id(String.valueOf(notification.getId()))
                        .reconnectTime(3000);

                emitter.send(event);
            } catch (IOException e) {
                log.error("向用户 {} 广播通知失败", userId, e);
                removeConnection(userId);
            }
        });
    }

    /**
     * 发送心跳
     */
    public void sendHeartbeat(String userId) {
        SseEmitter emitter = connections.get(userId);
        if (emitter != null) {
            try {
                SseEmitter.SseEventBuilder event = SseEmitter.event()
                        .name("heartbeat")
                        .data("{\"type\":\"heartbeat\",\"timestamp\":" + System.currentTimeMillis() + "}")
                        .id("heartbeat-" + System.currentTimeMillis());

                emitter.send(event);
                userLastHeartbeat.put(userId, System.currentTimeMillis());
            } catch (IOException e) {
                log.error("向用户 {} 发送心跳失败", userId, e);
                removeConnection(userId);
            }
        }
    }

    /**
     * 向所有连接发送心跳
     */
    public void sendHeartbeatToAll() {
        log.debug("向所有用户发送心跳，当前连接数: {}", connections.size());

        connections.keySet().forEach(this::sendHeartbeat);
    }

    /**
     * 获取连接数量
     */
    public int getConnectionCount() {
        return connections.size();
    }

    /**
     * 检查用户是否在线
     */
    public boolean isUserOnline(String userId) {
        return connections.containsKey(userId);
    }

    /**
     * 清理长时间无响应的连接
     */
    public void cleanupStaleConnections() {
        long currentTime = System.currentTimeMillis();
        long heartbeatTimeout = 5 * 60 * 1000; // 5分钟超时

        CopyOnWriteArrayList<String> staleUsers = new CopyOnWriteArrayList<>();

        userLastHeartbeat.forEach((userId, lastHeartbeat) -> {
            if (currentTime - lastHeartbeat > heartbeatTimeout) {
                staleUsers.add(userId);
            }
        });

        staleUsers.forEach(this::removeConnection);

        if (!staleUsers.isEmpty()) {
            log.info("清理 {} 个长时间无响应的SSE连接", staleUsers.size());
        }
    }

    /**
     * 获取在线用户列表
     */
    public java.util.Set<String> getOnlineUsers() {
        return connections.keySet();
    }
}