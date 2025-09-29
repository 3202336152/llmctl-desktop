package com.llmctl.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Provider模板展示用DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class ProviderTemplateDTO {

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
     * 环境变量模板
     */
    private Map<String, Object> envVarsTemplate;

    /**
     * 设置提示配置
     */
    private Map<String, Object> setupPrompts;

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
}