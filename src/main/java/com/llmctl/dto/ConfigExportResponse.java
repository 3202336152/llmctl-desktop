package com.llmctl.dto;

import lombok.Data;

/**
 * 配置导出响应DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class ConfigExportResponse {

    /**
     * 导出格式
     */
    private String format;

    /**
     * 导出内容
     */
    private String content;

    /**
     * 文件名建议
     */
    private String suggestedFilename;
}