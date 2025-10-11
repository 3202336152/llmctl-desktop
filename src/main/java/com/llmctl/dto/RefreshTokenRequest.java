package com.llmctl.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;


/**
 * 刷新Token请求DTO
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-10
 */
@Data
public class RefreshTokenRequest {

    /**
     * Refresh Token
     */
    @NotBlank(message = "Refresh Token不能为空")
    private String refreshToken;
}
