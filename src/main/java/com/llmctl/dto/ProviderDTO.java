package com.llmctl.dto;

import com.llmctl.entity.Provider;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Provider展示用DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class ProviderDTO {

    /**
     * Provider唯一标识
     */
    private String id;

    /**
     * Provider名称
     */
    private String name;

    /**
     * Provider描述
     */
    private String description;

    /**
     * Provider类型
     */
    private String type;

    /**
     * API基础URL
     */
    private String baseUrl;

    /**
     * 模型名称
     */
    private String modelName;

    /**
     * 最大Token数
     */
    private Integer maxTokens;

    /**
     * 最大输出Token数
     */
    private Integer maxOutputTokens;

    /**
     * 温度参数
     */
    private BigDecimal temperature;

    /**
     * 额外HTTP头
     */
    private String extraHeaders;

    /**
     * Token轮询策略
     */
    private TokenStrategyDTO tokenStrategy;

    /**
     * 是否启用
     */
    private Boolean isActive;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 关联的Token列表
     */
    private List<TokenDTO> tokens;

    /**
     * Token策略DTO
     */
    @Data
    public static class TokenStrategyDTO {
        /**
         * 策略类型
         */
        private String type;

        /**
         * 错误时是否故障切换
         */
        private Boolean fallbackOnError;
    }
}