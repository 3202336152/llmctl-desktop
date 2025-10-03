package com.llmctl.dto;

import jakarta.validation.constraints.*;
import lombok.Data;


/**
 * 更新Token请求DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-10-03
 */
@Data
public class UpdateTokenRequest {

    /**
     * Token值 (可选，不提供则保持原值)
     */
    @Size(max = 500, message = "Token值长度不能超过500字符")
    private String value;

    /**
     * Token别名 (可选，不提供则保持原值)
     */
    @Size(max = 100, message = "Token别名长度不能超过100字符")
    private String alias;

    /**
     * 权重 (可选，不提供则保持原值)
     */
    @Min(value = 1, message = "权重必须大于0")
    @Max(value = 100, message = "权重不能超过100")
    private Integer weight;

    /**
     * 是否启用 (可选，不提供则保持原值)
     */
    private Boolean enabled;

    /**
     * 健康状态 (可选，不提供则保持原值)
     */
    private Boolean healthy;
}
