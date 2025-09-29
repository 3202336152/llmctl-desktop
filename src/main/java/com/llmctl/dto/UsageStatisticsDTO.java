package com.llmctl.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 使用统计DTO
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
public class UsageStatisticsDTO {

    /**
     * 总请求次数
     */
    private Integer totalRequests;

    /**
     * 成功率 (百分比)
     */
    private BigDecimal successRate;

    /**
     * 平均响应时间 (毫秒)
     */
    private Integer avgResponseTime;

    /**
     * 每日统计列表
     */
    private List<DailyStatistics> dailyStats;

    /**
     * Provider统计列表
     */
    private List<ProviderStatistics> providerStats;

    /**
     * Token统计列表
     */
    private List<TokenStatistics> tokenStats;

    /**
     * 每日统计
     */
    @Data
    public static class DailyStatistics {
        /**
         * 统计日期
         */
        private LocalDate date;

        /**
         * 请求次数
         */
        private Integer requests;

        /**
         * 成功次数
         */
        private Integer successes;

        /**
         * 错误次数
         */
        private Integer errors;

        /**
         * 总Token消耗
         */
        private Integer totalTokens;

        /**
         * 成功率
         */
        private BigDecimal successRate;
    }

    /**
     * Provider统计
     */
    @Data
    public static class ProviderStatistics {
        /**
         * Provider ID
         */
        private String providerId;

        /**
         * Provider名称
         */
        private String providerName;

        /**
         * Provider类型
         */
        private String providerType;

        /**
         * 请求次数
         */
        private Integer requests;

        /**
         * 成功次数
         */
        private Integer successes;

        /**
         * 错误次数
         */
        private Integer errors;

        /**
         * 总Token消耗
         */
        private Integer totalTokens;

        /**
         * 成功率
         */
        private BigDecimal successRate;

        /**
         * 平均Token消耗
         */
        private BigDecimal avgTokensPerRequest;
    }

    /**
     * Token统计
     */
    @Data
    public static class TokenStatistics {
        /**
         * Token ID
         */
        private String tokenId;

        /**
         * Token别名
         */
        private String tokenAlias;

        /**
         * Provider名称
         */
        private String providerName;

        /**
         * 请求次数
         */
        private Integer requests;

        /**
         * 成功次数
         */
        private Integer successes;

        /**
         * 错误次数
         */
        private Integer errors;

        /**
         * 成功率
         */
        private BigDecimal successRate;

        /**
         * 健康状态
         */
        private Boolean healthy;

        /**
         * 是否启用
         */
        private Boolean enabled;
    }
}