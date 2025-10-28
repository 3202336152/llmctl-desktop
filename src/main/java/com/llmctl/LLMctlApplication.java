package com.llmctl;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * LLMctl 应用启动类
 *
 * @author Liu Yifan
 * @date 2025/9/28 14:19
 * @version 2.2.0
 */
@SpringBootApplication
@MapperScan("com.llmctl.mapper")
@EnableAsync  // 保留异步任务支持（用于异步通知发送）
// @EnableScheduling  // 已移除，改用 XXL-Job 进行任务调度
public class LLMctlApplication {

    public static void main(String[] args) {
        SpringApplication.run(LLMctlApplication.class, args);
    }
}
