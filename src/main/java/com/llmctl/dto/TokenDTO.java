package com.llmctl.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Token展示用DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class TokenDTO {

    /**
     * Token唯一标识
     */
    private String id;

    /**
     * 关联的Provider ID
     */
    private String providerId;

    /**
     * Token别名
     */
    private String alias;

    /**
     * 权重 (用于加权轮询)
     */
    private Integer weight;

    /**
     * 是否启用
     */
    private Boolean enabled;

    /**
     * 健康状态
     */
    private Boolean healthy;

    /**
     * 最后使用时间
     */
    private LocalDateTime lastUsed;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * Token值的遮掩显示 (出于安全考虑，只显示前几位和后几位)
     */
    private String maskedValue;

    /**
     * 设置遮掩的Token值
     *
     * @param tokenValue 完整的Token值
     */
    public void setMaskedValue(String tokenValue) {
        if (tokenValue == null || tokenValue.length() <= 8) {
            this.maskedValue = "****";
            return;
        }

        String prefix = tokenValue.substring(0, 4);
        String suffix = tokenValue.substring(tokenValue.length() - 4);
        this.maskedValue = prefix + "****" + suffix;
    }
}