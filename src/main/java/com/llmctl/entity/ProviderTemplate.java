package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * Provider模板实体类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ProviderTemplate {

    /**
     * 模板唯一标识
     */
    private String id;

    /**
     * 模板名称
     */
    private String name;

    /**
     * 模板描述
     */
    private String description;

    /**
     * Provider类型
     */
    private String type;

    /**
     * 默认基础URL
     */
    private String defaultBaseUrl;

    /**
     * 默认模型名称
     */
    private String defaultModelName;

    /**
     * 环境变量模板 (JSON格式)
     */
    private String envVarsTemplate;

    /**
     * 设置提示配置 (JSON格式)
     */
    private String setupPrompts;

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
     * 支持的Provider类型常量
     */
    public static class ProviderTypes {
        /**
         * Anthropic Claude
         */
        public static final String ANTHROPIC = "anthropic";

        /**
         * OpenAI GPT
         */
        public static final String OPENAI = "openai";

        /**
         * 阿里云 Qwen
         */
        public static final String QWEN = "qwen";

        /**
         * Google Gemini
         */
        public static final String GEMINI = "gemini";
    }

    /**
     * 检查模板是否可用
     *
     * @return true如果模板启用
     */
    public boolean isAvailable() {
        return Boolean.TRUE.equals(this.isActive);
    }

    /**
     * 检查是否为指定类型的模板
     *
     * @param providerType Provider类型
     * @return true如果类型匹配
     */
    public boolean isTypeOf(String providerType) {
        return this.type != null && this.type.equalsIgnoreCase(providerType);
    }

    /**
     * 获取格式化的模板名称
     *
     * @return 包含类型的格式化名称
     */
    public String getFormattedName() {
        return String.format("[%s] %s", this.type.toUpperCase(), this.name);
    }
}