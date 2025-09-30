package com.llmctl.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 更新Provider请求DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class UpdateProviderRequest {

    /**
     * Provider名称
     */
    @Size(max = 100, message = "Provider名称长度不能超过100字符")
    private String name;

    /**
     * Provider描述
     */
    @Size(max = 1000, message = "Provider描述长度不能超过1000字符")
    private String description;

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

    /**
     * 是否启用
     */
    private Boolean isActive;
}