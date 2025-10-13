package com.llmctl.task;

import com.llmctl.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 通知清理定时任务
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationCleanupTask {

    private final NotificationService notificationService;

    /**
     * 每天凌晨2点清理过期通知
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredNotifications() {
        try {
            log.info("开始清理过期通知");
            notificationService.cleanupExpiredNotifications();
            log.info("过期通知清理完成");
        } catch (Exception e) {
            log.error("清理过期通知失败", e);
        }
    }

    /**
     * 每周日凌晨3点清理超过30天的已读通知
     */
    @Scheduled(cron = "0 0 3 ? * SUN")
    public void cleanupOldReadNotifications() {
        try {
            log.info("开始清理超过30天的已读通知");
            // TODO: 实现清理超过30天的已读通知逻辑
            log.info("超过30天的已读通知清理完成");
        } catch (Exception e) {
            log.error("清理超过30天的已读通知失败", e);
        }
    }
}