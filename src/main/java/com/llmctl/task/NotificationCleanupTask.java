package com.llmctl.task;

import com.llmctl.service.NotificationService;
import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 通知清理定时任务（基于 XXL-Job）
 *
 * ✅ 条件加载：仅当 xxl.job.enabled=true 时才启用此任务
 * 默认情况下（xxl.job.enabled=false），此任务不会加载
 *
 * 任务列表：
 * 1. cleanupExpiredNotificationsJob - 清理过期通知（建议每天凌晨2点执行）
 * 2. cleanupOldReadNotificationsJob - 清理超过30天的已读通知（建议每周日凌晨3点执行）
 *
 * @author Liu Yifan
 * @since 2025-01-24
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "xxl.job.enabled", havingValue = "true", matchIfMissing = false)
public class NotificationCleanupTask {

    private final NotificationService notificationService;

    /**
     * 清理过期通知任务
     *
     * XXL-Job 配置建议：
     * - JobHandler: cleanupExpiredNotificationsJob
     * - Cron表达式: 0 0 2 * * ?  (每天凌晨2点)
     * - 运行模式: BEAN
     */
    @XxlJob("cleanupExpiredNotificationsJob")
    public void cleanupExpiredNotificationsJob() {
        XxlJobHelper.log("========== 开始清理过期通知 ==========");

        try {
            log.info("开始清理过期通知");
            notificationService.cleanupExpiredNotifications();

            String successMsg = "过期通知清理完成";
            log.info(successMsg);
            XxlJobHelper.log(successMsg);

            // 任务执行成功
            XxlJobHelper.handleSuccess(successMsg);

        } catch (Exception e) {
            String errorMsg = "清理过期通知失败: " + e.getMessage();
            log.error(errorMsg, e);
            XxlJobHelper.log(errorMsg);

            // 任务执行失败
            XxlJobHelper.handleFail(errorMsg);
        }

        XxlJobHelper.log("========== 过期通知清理任务结束 ==========");
    }

    /**
     * 清理超过30天的已读通知任务
     *
     * XXL-Job 配置建议：
     * - JobHandler: cleanupOldReadNotificationsJob
     * - Cron表达式: 0 0 3 ? * SUN  (每周日凌晨3点)
     * - 运行模式: BEAN
     */
    @XxlJob("cleanupOldReadNotificationsJob")
    public void cleanupOldReadNotificationsJob() {
        XxlJobHelper.log("========== 开始清理超过30天的已读通知 ==========");

        try {
            log.info("开始清理超过30天的已读通知");

            // 清理超过30天的已读通知
            int deletedCount = notificationService.cleanupOldReadNotifications(30);

            String successMsg = String.format("超过30天的已读通知清理完成，共清理 %d 条记录", deletedCount);
            log.info(successMsg);
            XxlJobHelper.log(successMsg);

            // 任务执行成功
            XxlJobHelper.handleSuccess(successMsg);

        } catch (Exception e) {
            String errorMsg = "清理超过30天的已读通知失败: " + e.getMessage();
            log.error(errorMsg, e);
            XxlJobHelper.log(errorMsg);

            // 任务执行失败
            XxlJobHelper.handleFail(errorMsg);
        }

        XxlJobHelper.log("========== 已读通知清理任务结束 ==========");
    }

    /**
     * 示例：带参数的任务
     *
     * XXL-Job 配置建议：
     * - JobHandler: demoJobWithParam
     * - Cron表达式: 0 0/1 * * * ?  (每5分钟执行一次)
     * - 运行模式: BEAN
     * - 任务参数示例: days=7, batchSize=100
     */
    @XxlJob("demoJobWithParam")
    public void demoJobWithParam() {
        // 获取任务参数
        String param = XxlJobHelper.getJobParam();
        XxlJobHelper.log("收到任务参数: {}", param);

        try {
            // 处理任务逻辑
            log.info("执行带参数的任务，参数: {}", param);

            // 可以获取任务ID、执行器分片等信息
            long jobId = XxlJobHelper.getJobId();
            int shardIndex = XxlJobHelper.getShardIndex();
            int shardTotal = XxlJobHelper.getShardTotal();

            XxlJobHelper.log("任务ID: {}, 分片索引: {}/{}", jobId, shardIndex, shardTotal);

            XxlJobHelper.handleSuccess("任务执行成功");

        } catch (Exception e) {
            XxlJobHelper.handleFail("任务执行失败: " + e.getMessage());
        }
    }
}
