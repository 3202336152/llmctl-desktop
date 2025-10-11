package com.llmctl.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 健康检查控制器
 * 用于 Docker 健康检查和部署验证
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-11
 */
@RestController
@RequestMapping("/health")
public class HealthController {

    /**
     * 健康检查接口
     * 不需要认证，直接返回应用状态
     *
     * @return 健康状态
     */
    @GetMapping
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("application", "LLMctl");
        result.put("version", "2.1.0");
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
}