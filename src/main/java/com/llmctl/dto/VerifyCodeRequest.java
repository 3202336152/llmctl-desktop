package com.llmctl.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 验证验证码请求DTO
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
@Data
public class VerifyCodeRequest {
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "验证码不能为空")
    @Pattern(regexp = "^\\d{6}$", message = "验证码必须是6位数字")
    private String code;

    @NotBlank(message = "验证码用途不能为空")
    private String purpose;
}
