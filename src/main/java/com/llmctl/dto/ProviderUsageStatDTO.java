package com.llmctl.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Provider使用统计DTO
 * 用于统计每个Provider的会话数量和成功率
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProviderUsageStatDTO {
    /**
     * Provider ID
     */
    private String providerId;

    /**
     * Provider名称
     */
    private String providerName;

    /**
     * 总会话数
     */
    private Integer totalSessions;

    /**
     * 活跃会话数
     */
    private Integer activeSessions;

    /**
     * 成功率（活跃会话占比，百分比）
     */
    private Double successRate;
}
