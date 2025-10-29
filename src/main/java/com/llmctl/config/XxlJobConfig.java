package com.llmctl.config;

import com.xxl.job.core.executor.impl.XxlJobSpringExecutor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * XXL-Job 配置类
 * 配置执行器，连接到 XXL-Job 调度中心
 *
 * ✅ 条件加载：仅当 xxl.job.enabled=true 时才启用此配置
 * 默认情况下（xxl.job.enabled=false），此配置不会加载，不会尝试连接调度中心
 *
 * @author Liu Yifan
 * @since 2025-01-24
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "xxl.job.enabled", havingValue = "true", matchIfMissing = false)
public class XxlJobConfig {

    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;

    @Value("${xxl.job.accessToken}")
    private String accessToken;

    @Value("${xxl.job.executor.appname}")
    private String appname;

    @Value("${xxl.job.executor.ip:}")
    private String ip;

    @Value("${xxl.job.executor.port}")
    private int port;

    @Value("${xxl.job.executor.logpath}")
    private String logPath;

    @Value("${xxl.job.executor.logretentiondays}")
    private int logRetentionDays;

    /**
     * 配置 XXL-Job 执行器
     */
    @Bean
    public XxlJobSpringExecutor xxlJobExecutor() {
        log.info("========== 初始化 XXL-Job 执行器 ==========");

        XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor();

        // 设置调度中心地址
        xxlJobSpringExecutor.setAdminAddresses(adminAddresses);

        // 设置执行器名称
        xxlJobSpringExecutor.setAppname(appname);

        // 设置执行器IP（可选，留空自动获取）
        if (ip != null && !ip.trim().isEmpty()) {
            xxlJobSpringExecutor.setIp(ip);
        }

        // 设置执行器端口
        xxlJobSpringExecutor.setPort(port);

        // 设置访问令牌
        xxlJobSpringExecutor.setAccessToken(accessToken);

        // 设置日志路径
        xxlJobSpringExecutor.setLogPath(logPath);

        // 设置日志保留天数
        xxlJobSpringExecutor.setLogRetentionDays(logRetentionDays);

        log.info("XXL-Job 执行器配置完成:");
        log.info("  - 调度中心地址: {}", adminAddresses);
        log.info("  - 执行器名称: {}", appname);
        log.info("  - 执行器端口: {}", port);
        log.info("  - 日志路径: {}", logPath);
        log.info("========================================");

        return xxlJobSpringExecutor;
    }
}