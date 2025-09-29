package com.llmctl.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 配置验证响应DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class ConfigValidationResponse {

    /**
     * 是否有效
     */
    private Boolean isValid;

    /**
     * 错误列表
     */
    private List<String> errors;

    /**
     * 警告列表
     */
    private List<String> warnings;

    /**
     * 验证详情
     */
    private Map<String, Object> details;
}