package com.llmctl.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 创建Provider请求DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
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
     * Provider类型
     */
    @NotBlank(message = "Provider类型不能为空")
    @Pattern(regexp = "^(anthropic|openai|qwen|gemini)$",
             message = "Provider类型必须是：anthropic, openai, qwen, gemini 之一")
    private String type;

    /**
     * API基础URL
     */
    @Size(max = 500, message = "Base URL长度不能超过500字符")
    private String baseUrl;

    /**
     * 模型名称
     */
    @Size(max = 100, message = "模型名称长度不能超过100字符")
    private String modelName;

    /**
     * Token值 (创建Provider时至少需要一个Token)
     */
    @NotBlank(message = "Token不能为空")
    @Size(max = 500, message = "Token长度不能超过500字符")
    private String token;

    /**
     * Token别名
     */
    @Size(max = 100, message = "Token别名长度不能超过100字符")
    private String tokenAlias;

    /**
     * 最大Token数
     */
    @Min(value = 1, message = "最大Token数必须大于0")
    @Max(value = 100000, message = "最大Token数不能超过100000")
    private Integer maxTokens;

    /**
     * 最大输出Token数
     */
    @Min(value = 1, message = "最大输出Token数必须大于0")
    @Max(value = 50000, message = "最大输出Token数不能超过50000")
    private Integer maxOutputTokens;

    /**
     * 温度参数
     */
    @DecimalMin(value = "0.0", message = "温度参数必须大于等于0.0")
    @DecimalMax(value = "2.0", message = "温度参数必须小于等于2.0")
    private BigDecimal temperature;

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
}