package com.llmctl.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 发送验证码请求DTO
 *
 * @author Liu Yifan
 * @version 2.1.0
 * @since 2025-10-14
 */
@Data
public class SendVerificationCodeRequest {
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Pattern(regexp = "^[a-zA-Z0-9_-]+@(qq\\.com|163\\.com)$",
             message = "只支持QQ邮箱和163邮箱")
    private String email;

    @NotBlank(message = "验证码用途不能为空")
    @Pattern(regexp = "REGISTER|LOGIN|RESET_PASSWORD|CHANGE_PASSWORD", message = "无效的验证码用途")
    private String purpose;
}
