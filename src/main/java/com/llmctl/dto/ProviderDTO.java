package com.llmctl.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Provider展示用DTO（配置分离版）
 *
 * @author Liu Yifan
 * @version 2.3.0
 * @since 2025-01-15
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
     * Provider支持的CLI类型列表（多选）
     * 示例：["claude code", "codex"]
     */
    private List<String> types;

    /**
     * CLI配置列表
     */
    private List<CliConfigDTO> configs;

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
     * CLI配置DTO
     */
    @Data
    public static class CliConfigDTO {
        /**
         * 配置ID
         */
        private Long id;

        /**
         * CLI类型
         */
        private String cliType;  // "claude", "codex", "gemini", "qoder"

        /**
         * 配置数据（解析后的JSON）
         */
        private Map<String, Object> configData;

        /**
         * 创建时间
         */
        private LocalDateTime createdAt;

        /**
         * 更新时间
         */
        private LocalDateTime updatedAt;
    }

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
