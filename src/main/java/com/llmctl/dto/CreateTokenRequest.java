package com.llmctl.dto;

import jakarta.validation.constraints.*;
import lombok.Data;


/**
 * 创建Token请求DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class CreateTokenRequest {

    /**
     * Token值
     */
    @NotBlank(message = "Token值不能为空")
    @Size(max = 500, message = "Token值长度不能超过500字符")
    private String value;

    /**
     * Token别名
     */
    @Size(max = 100, message = "Token别名长度不能超过100字符")
    private String alias;

    /**
     * 权重 (用于加权轮询)
     */
    @Min(value = 1, message = "权重必须大于0")
    @Max(value = 100, message = "权重不能超过100")
    private Integer weight;

    /**
     * 是否启用
     */
    private Boolean enabled;
}