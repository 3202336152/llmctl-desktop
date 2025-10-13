package com.llmctl.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 更新Token轮询策略请求DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-10-13
 */
@Data
public class UpdateTokenStrategyRequest {

    /**
     * Token轮询策略类型
     */
    @NotBlank(message = "Token策略类型不能为空")
    @Pattern(regexp = "^(round-robin|weighted|random|least-used)$",
             message = "Token策略必须是：round-robin, weighted, random, least-used 之一")
    private String type;

    /**
     * 错误时是否故障切换
     */
    @NotNull(message = "故障切换标志不能为空")
    private Boolean fallbackOnError;
}