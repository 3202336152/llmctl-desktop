package com.llmctl.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;



/**
 * 配置导入请求DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class ConfigImportRequest {

    /**
     * 导入格式
     */
    @NotBlank(message = "导入格式不能为空")
    @Pattern(regexp = "^(json|env|yaml)$", message = "导入格式必须是：json, env, yaml 之一")
    private String format;

    /**
     * 导入数据 (JSON字符串)
     */
    @NotBlank(message = "导入数据不能为空")
    private String data;

    /**
     * 是否覆盖现有配置
     */
    private Boolean overwrite;
}