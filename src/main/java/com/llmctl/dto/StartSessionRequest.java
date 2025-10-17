package com.llmctl.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;



/**
 * 启动Session请求DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class StartSessionRequest {

    /**
     * 关联的Provider ID
     */
    @NotBlank(message = "Provider ID不能为空")
    private String providerId;

    /**
     * 工作目录
     */
    @NotBlank(message = "工作目录不能为空")
    @Size(max = 1000, message = "工作目录长度不能超过1000字符")
    private String workingDirectory;

    /**
     * 启动命令
     */
    @NotBlank(message = "启动命令不能为空")
    @Size(max = 200, message = "启动命令长度不能超过200字符")
    private String command;

    /**
     * CLI类型（claude code, codex, gemini, qoder）
     */
    @Size(max = 20, message = "CLI类型长度不能超过20字符")
    private String type;
}