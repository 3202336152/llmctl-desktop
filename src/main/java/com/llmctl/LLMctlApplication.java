package com.llmctl;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * @Author: Liu Yifan
 * @Date: Created in 14:19 2025/9/28
 */
@SpringBootApplication
@MapperScan("com.llmctl.mapper")
@EnableAsync
@EnableScheduling
public class LLMctlApplication {

    public static void main(String[] args) {
        SpringApplication.run(LLMctlApplication.class, args);
    }
}