package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * Token管理实体类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class Token {

    /**
     * Token唯一标识
     */
    private String id;

    /**
     * 用户ID（所有者）
     */
    private Long userId;

    /**
     * 关联的Provider ID
     */
    private String providerId;

    /**
     * Token值 (加密存储)
     */
    private String value;

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
     * 加密版本
     * - null 或 "plaintext": 明文存储（旧数据，待迁移）
     * - "v1": AES-256-GCM加密
     */
    private String encryptionVersion;

    /**
     * 关联的Provider对象 (多对一关系)
     */
    private Provider provider;

    /**
     * 检查Token是否可用
     *
     * @return true如果Token启用且健康
     */
    public boolean isAvailable() {
        return Boolean.TRUE.equals(enabled) && Boolean.TRUE.equals(healthy);
    }

    /**
     * 更新最后使用时间
     */
    public void updateLastUsed() {
        this.lastUsed = LocalDateTime.now();
    }
}