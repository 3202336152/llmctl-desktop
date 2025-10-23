package com.llmctl.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 创建Provider请求DTO（配置分离版）
 *
 * @author Liu Yifan
 * @version 2.3.0
 * @since 2025-01-15
 */
@Data
public class CreateProviderRequest {

    /**
     * Provider名称
     */
    @NotBlank(message = "Provider名称不能为空")
    @Size(max = 100, message = "Provider名称长度不能超过100字符")
    private String name;

    /**
     * Provider描述
     */
    @Size(max = 1000, message = "Provider描述长度不能超过1000字符")
    private String description;

    /**
     * Provider支持的CLI类型列表（多选）
     * 示例：["claude code", "codex"]
     */
    @NotNull(message = "Provider类型列表不能为空")
    @Size(min = 1, message = "至少选择一个Provider类型")
    private List<@Pattern(regexp = "^(claude code|codex|gemini|qoder)$",
                          message = "Provider类型必须是：claude code, codex, gemini, qoder 之一") String> types;

    // ========== CLI 配置（Map 结构） ==========

    /**
     * Claude Code 配置
     * 示例：{"baseUrl": "...", "modelName": "...", "maxTokens": 8192, "temperature": 0.7}
     */
    private Map<String, Object> claudeConfig;

    /**
     * Codex 配置
     * 示例：{"configToml": "...", "authTemplate": "..."}
     */
    private Map<String, Object> codexConfig;

    /**
     * Gemini 配置（未来）
     */
    private Map<String, Object> geminiConfig;

    /**
     * Qoder 配置（未来）
     */
    private Map<String, Object> qoderConfig;

    // ========== 通用字段 ==========

    /**
     * 额外HTTP头 (JSON格式)
     */
    private String extraHeaders;

    /**
     * Token轮询策略类型
     */
    @Pattern(regexp = "^(round-robin|weighted|random|least-used)$",
             message = "Token策略必须是：round-robin, weighted, random, least-used 之一")
    private String tokenStrategyType;

    /**
     * 错误时是否故障切换
     */
    private Boolean tokenFallbackOnError;

    // ========== Token 字段 ==========

    /**
     * API Token（创建Provider时必填）
     */
    @NotBlank(message = "API Token不能为空")
    private String token;

    /**
     * Token 别名（可选）
     */
    private String tokenAlias;
}
