package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * Provider CLI 配置实体类
 *
 * @author Liu Yifan
 * @version 2.3.0
 * @since 2025-01-15
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ProviderConfig {

    /**
     * 配置ID
     */
    private Long id;

    /**
     * Provider ID（外键）
     */
    private String providerId;

    /**
     * CLI 类型
     */
    private CliType cliType;

    /**
     * CLI 配置数据（JSON格式）
     *
     * Claude Code: {"baseUrl": "...", "modelName": "...", "maxTokens": 8192, "temperature": 0.7}
     * Codex: {"configToml": "...", "authTemplate": "..."}
     * Gemini: {...}
     * Qoder: {...}
     */
    private String configData;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * CLI 类型枚举
     */
    public enum CliType {
        /**
         * Claude Code (Anthropic)
         */
        CLAUDE("claude code"),

        /**
         * Codex (OpenAI Compatible)
         */
        CODEX("codex"),

        /**
         * Google Gemini
         */
        GEMINI("gemini"),

        /**
         * Qoder
         */
        QODER("qoder");

        private final String value;

        CliType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        /**
         * 根据字符串值获取枚举
         */
        public static CliType fromValue(String value) {
            for (CliType type : values()) {
                if (type.value.equalsIgnoreCase(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Invalid CliType: " + value);
        }

        /**
         * 从 types 列表中的值转换（"claude code" → CLAUDE）
         */
        public static CliType fromTypeString(String typeString) {
            String normalized = typeString.toLowerCase();
            for (CliType type : values()) {
                if (type.value.equals(normalized)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Invalid type string: " + typeString);
        }
    }
}
