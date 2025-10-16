package com.llmctl.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;



/**
 * 更新个人信息请求DTO
 *
 * @author Liu Yifan
 * @version 2.1.5
 * @since 2025-10-16
 */
@Data
public class UpdateProfileRequest {

    /**
     * 昵称
     */
    @NotBlank(message = "昵称不能为空")
    private String displayName;

    /**
     * 邮箱（可选）
     */
    @Email(message = "邮箱格式不正确")
    private String email;
}
