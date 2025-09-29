package com.llmctl.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;


/**
 * 设置活跃Provider请求DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class SetActiveProviderRequest {

    /**
     * Provider ID
     */
    @NotBlank(message = "Provider ID不能为空")
    private String providerId;
}