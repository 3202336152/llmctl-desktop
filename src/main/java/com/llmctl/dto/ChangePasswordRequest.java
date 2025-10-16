package com.llmctl.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;


/**
 * 修改密码请求DTO
 *
 * @author Liu Yifan
 * @version 2.1.5
 * @since 2025-10-16
 */
@Data
public class ChangePasswordRequest {

    /**
     * 邮箱（用于发送验证码）
     */
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    /**
     * 邮箱验证码
     */
    @NotBlank(message = "验证码不能为空")
    @Size(min = 6, max = 6, message = "验证码必须为6位")
    private String verificationCode;

    /**
     * 新密码
     */
    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度必须在6-32位之间")
    private String newPassword;
}
