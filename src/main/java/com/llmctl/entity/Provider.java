package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * LLM Provider配置实体类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class Provider {

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
     * Provider类型: anthropic, openai, qwen, gemini
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
     * 温度参数 (0.0-1.0)
     */
    private BigDecimal temperature;

    /**
     * 额外HTTP头 (JSON格式)
     */
    private String extraHeaders;

    /**
     * Token轮询策略类型
     */
    private TokenStrategyType tokenStrategyType;

    /**
     * 错误时是否故障切换
     */
    private Boolean tokenFallbackOnError;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 关联的Token列表 (一对多关系)
     */
    private List<Token> tokens;

    /**
     * Token轮询策略枚举
     */
    public enum TokenStrategyType {
        /**
         * 轮询策略
         */
        ROUND_ROBIN("round-robin"),

        /**
         * 加权轮询策略
         */
        WEIGHTED("weighted"),

        /**
         * 随机策略
         */
        RANDOM("random"),

        /**
         * 最少使用策略
         */
        LEAST_USED("least-used");

        private final String value;

        TokenStrategyType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        /**
         * 根据字符串值获取枚举
         */
        public static TokenStrategyType fromValue(String value) {
            for (TokenStrategyType type : values()) {
                if (type.value.equals(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Invalid TokenStrategyType: " + value);
        }
    }
}