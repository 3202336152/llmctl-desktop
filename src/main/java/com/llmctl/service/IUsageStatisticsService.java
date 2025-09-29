package com.llmctl.service;

import com.llmctl.dto.UsageStatisticsDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 使用统计服务接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public interface IUsageStatisticsService {

    /**
     * 获取使用统计
     *
     * @param providerId Provider ID (可选)
     * @param days 统计天数 (默认7天)
     * @return 使用统计DTO
     */
    UsageStatisticsDTO getUsageStatistics(String providerId, Integer days);

    /**
     * 记录使用统计
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @param requestCount 请求数量
     * @param tokenConsumed 消耗的Token数量
     */
    void recordUsage(String providerId, String tokenId, Integer requestCount, Integer tokenConsumed);

    /**
     * 批量记录使用统计
     *
     * @param usageRecords 使用记录列表
     */
    void batchRecordUsage(List<UsageRecord> usageRecords);

    /**
     * 获取Provider使用统计
     *
     * @param providerId Provider ID
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 使用统计列表
     */
    List<UsageStatisticsDTO> getProviderUsageStats(String providerId, LocalDate startDate, LocalDate endDate);

    /**
     * 获取Token使用统计
     *
     * @param tokenId Token ID
     * @param days 统计天数
     * @return 使用统计列表
     */
    List<UsageStatisticsDTO> getTokenUsageStats(String tokenId, Integer days);

    /**
     * 获取总体使用统计
     *
     * @param days 统计天数
     * @return 总体统计信息
     */
    OverallStatistics getOverallStatistics(Integer days);

    /**
     * 清理过期的统计数据
     *
     * @param daysToKeep 保留天数
     */
    void cleanupOldStatistics(Integer daysToKeep);

    /**
     * 获取指定Provider的Token使用统计
     *
     * @param providerId Provider ID
     * @param days 统计天数
     * @return Token使用统计列表
     */
    List<UsageStatisticsDTO.TokenStatistics> getTokenStatistics(String providerId, Integer days);

    /**
     * 获取统计概览
     *
     * @return 统计概览信息
     */
    StatisticsOverview getStatisticsOverview();

    /**
     * 记录使用统计的简化方法
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @param success 是否成功
     * @param tokensUsed 使用的Token数量
     */
    void recordUsage(String providerId, String tokenId, boolean success, int tokensUsed);

    /**
     * 统计概览信息
     */
    class StatisticsOverview {
        private Long totalRequests;
        private Long totalTokensConsumed;
        private Long activeProviders;
        private Long activeTokens;
        private Map<String, Object> topProviders;
        private Map<String, Object> dailyTrends;

        // Getters and Setters
        public Long getTotalRequests() { return totalRequests; }
        public void setTotalRequests(Long totalRequests) { this.totalRequests = totalRequests; }

        public Long getTotalTokensConsumed() { return totalTokensConsumed; }
        public void setTotalTokensConsumed(Long totalTokensConsumed) { this.totalTokensConsumed = totalTokensConsumed; }

        public Long getActiveProviders() { return activeProviders; }
        public void setActiveProviders(Long activeProviders) { this.activeProviders = activeProviders; }

        public Long getActiveTokens() { return activeTokens; }
        public void setActiveTokens(Long activeTokens) { this.activeTokens = activeTokens; }

        public Map<String, Object> getTopProviders() { return topProviders; }
        public void setTopProviders(Map<String, Object> topProviders) { this.topProviders = topProviders; }

        public Map<String, Object> getDailyTrends() { return dailyTrends; }
        public void setDailyTrends(Map<String, Object> dailyTrends) { this.dailyTrends = dailyTrends; }
    }

    /**
     * 使用记录
     */
    class UsageRecord {
        private String providerId;
        private String tokenId;
        private Integer requestCount;
        private Integer tokenConsumed;
        private LocalDateTime usageTime;

        // Constructors
        public UsageRecord() {}

        public UsageRecord(String providerId, String tokenId, Integer requestCount, Integer tokenConsumed) {
            this.providerId = providerId;
            this.tokenId = tokenId;
            this.requestCount = requestCount;
            this.tokenConsumed = tokenConsumed;
            this.usageTime = LocalDateTime.now();
        }

        // Getters and Setters
        public String getProviderId() { return providerId; }
        public void setProviderId(String providerId) { this.providerId = providerId; }

        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }

        public Integer getRequestCount() { return requestCount; }
        public void setRequestCount(Integer requestCount) { this.requestCount = requestCount; }

        public Integer getTokenConsumed() { return tokenConsumed; }
        public void setTokenConsumed(Integer tokenConsumed) { this.tokenConsumed = tokenConsumed; }

        public LocalDateTime getUsageTime() { return usageTime; }
        public void setUsageTime(LocalDateTime usageTime) { this.usageTime = usageTime; }
    }

    /**
     * 总体统计信息
     */
    class OverallStatistics {
        private Long totalRequests;
        private Long totalTokensConsumed;
        private Long activeProviders;
        private Long activeTokens;
        private Map<String, Object> topProviders;
        private Map<String, Object> dailyTrends;

        // Getters and Setters
        public Long getTotalRequests() { return totalRequests; }
        public void setTotalRequests(Long totalRequests) { this.totalRequests = totalRequests; }

        public Long getTotalTokensConsumed() { return totalTokensConsumed; }
        public void setTotalTokensConsumed(Long totalTokensConsumed) { this.totalTokensConsumed = totalTokensConsumed; }

        public Long getActiveProviders() { return activeProviders; }
        public void setActiveProviders(Long activeProviders) { this.activeProviders = activeProviders; }

        public Long getActiveTokens() { return activeTokens; }
        public void setActiveTokens(Long activeTokens) { this.activeTokens = activeTokens; }

        public Map<String, Object> getTopProviders() { return topProviders; }
        public void setTopProviders(Map<String, Object> topProviders) { this.topProviders = topProviders; }

        public Map<String, Object> getDailyTrends() { return dailyTrends; }
        public void setDailyTrends(Map<String, Object> dailyTrends) { this.dailyTrends = dailyTrends; }
    }
}