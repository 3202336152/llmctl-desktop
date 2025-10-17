package com.llmctl.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Session展示用DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class SessionDTO {

    /**
     * 会话唯一标识
     */
    private String id;

    /**
     * 关联的Provider ID
     */
    private String providerId;

    /**
     * Provider名称
     */
    private String providerName;

    /**
     * 关联的Token ID
     */
    private String tokenId;

    /**
     * 进程ID
     */
    private Integer pid;

    /**
     * 工作目录
     */
    private String workingDirectory;

    /**
     * 启动命令
     */
    private String command;

    /**
     * CLI类型（claude code, codex, gemini, qoder）
     */
    private String type;

    /**
     * 会话状态
     */
    private String status;

    /**
     * 启动时间
     */
    private LocalDateTime startTime;

    /**
     * 最后活动时间
     */
    private LocalDateTime lastActivity;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 会话持续时间（分钟）
     */
    private Long durationMinutes;
}