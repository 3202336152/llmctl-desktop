package com.llmctl.service;

import com.llmctl.dto.UsageStatisticsDTO;
import com.llmctl.entity.Provider;
import com.llmctl.entity.Token;
import com.llmctl.entity.UsageStatistics;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.mapper.UsageStatisticsMapper;
import com.llmctl.utils.IdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 使用统计业务服务类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsageStatisticsService {

    private final UsageStatisticsMapper usageStatisticsMapper;
    private final ProviderMapper providerMapper;
    private final TokenMapper tokenMapper;

    /**
     * 获取使用统计
     *
     * @param providerId Provider ID (可选)
     * @param days 统计天数 (默认7天)
     * @return 使用统计DTO
     */
    public UsageStatisticsDTO getUsageStatistics(String providerId, Integer days) {
        if (days == null || days <= 0) {
            days = 7;
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        log.debug("获取使用统计: Provider={}, 日期范围={} 到 {}", providerId, startDate, endDate);

        UsageStatisticsDTO dto = new UsageStatisticsDTO();

        // 获取总体统计
        long totalRequests = usageStatisticsMapper.getTotalRequests(startDate, endDate);
        long totalSuccesses = usageStatisticsMapper.getTotalSuccesses(startDate, endDate);
        long totalTokensUsed = usageStatisticsMapper.getTotalTokensUsed(startDate, endDate);

        dto.setTotalRequests((int) totalRequests);
        dto.setAvgResponseTime(1200); // TODO: 实现实际的平均响应时间计算

        // 计算成功率
        if (totalRequests > 0) {
            BigDecimal successRate = BigDecimal.valueOf(totalSuccesses)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalRequests), 2, RoundingMode.HALF_UP);
            dto.setSuccessRate(successRate);
        } else {
            dto.setSuccessRate(BigDecimal.ZERO);
        }

        // 获取每日统计
        List<UsageStatistics> dailyStats = usageStatisticsMapper.getDailySummary(startDate, endDate);
        List<UsageStatisticsDTO.DailyStatistics> dailyStatsList = dailyStats.stream()
                .map(this::convertToDailyStatistics)
                .collect(Collectors.toList());
        dto.setDailyStats(dailyStatsList);

        // 获取Provider统计
        List<UsageStatistics> providerStats = usageStatisticsMapper.getProviderSummary(startDate, endDate);
        List<UsageStatisticsDTO.ProviderStatistics> providerStatsList = providerStats.stream()
                .map(this::convertToProviderStatistics)
                .collect(Collectors.toList());
        dto.setProviderStats(providerStatsList);

        return dto;
    }

    /**
     * 获取指定Provider的Token使用统计
     *
     * @param providerId Provider ID
     * @param days 统计天数 (默认7天)
     * @return Token使用统计列表
     */
    public List<UsageStatisticsDTO.TokenStatistics> getTokenStatistics(String providerId, Integer days) {
        if (days == null || days <= 0) {
            days = 7;
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        log.debug("获取Token统计: Provider={}, 日期范围={} 到 {}", providerId, startDate, endDate);

        // 验证Provider是否存在
        Provider provider = providerMapper.findById(providerId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在: " + providerId);
        }

        // 获取Provider的所有Token
        List<Token> tokens = tokenMapper.findByProviderId(providerId);

        return tokens.stream()
                .map(token -> {
                    UsageStatisticsDTO.TokenStatistics tokenStats = new UsageStatisticsDTO.TokenStatistics();
                    tokenStats.setTokenId(token.getId());
                    tokenStats.setTokenAlias(token.getAlias());
                    tokenStats.setProviderName(provider.getName());
                    tokenStats.setHealthy(token.getHealthy());
                    tokenStats.setEnabled(token.getEnabled());

                    // 获取Token的统计数据
                    List<UsageStatistics> stats = usageStatisticsMapper
                            .findByProviderIdAndDate(providerId, LocalDate.now());

                    // 计算统计值 (这里简化实现，实际需要聚合多天数据)
                    int requests = stats.stream()
                            .filter(s -> token.getId().equals(s.getTokenId()))
                            .mapToInt(s -> s.getRequestCount() != null ? s.getRequestCount() : 0)
                            .sum();

                    int successes = stats.stream()
                            .filter(s -> token.getId().equals(s.getTokenId()))
                            .mapToInt(s -> s.getSuccessCount() != null ? s.getSuccessCount() : 0)
                            .sum();

                    int errors = stats.stream()
                            .filter(s -> token.getId().equals(s.getTokenId()))
                            .mapToInt(s -> s.getErrorCount() != null ? s.getErrorCount() : 0)
                            .sum();

                    tokenStats.setRequests(requests);
                    tokenStats.setSuccesses(successes);
                    tokenStats.setErrors(errors);

                    // 计算成功率
                    if (requests > 0) {
                        BigDecimal successRate = BigDecimal.valueOf(successes)
                                .multiply(BigDecimal.valueOf(100))
                                .divide(BigDecimal.valueOf(requests), 2, RoundingMode.HALF_UP);
                        tokenStats.setSuccessRate(successRate);
                    } else {
                        tokenStats.setSuccessRate(BigDecimal.ZERO);
                    }

                    return tokenStats;
                })
                .collect(Collectors.toList());
    }

    /**
     * 记录使用统计
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @param isSuccess 是否成功
     * @param tokensUsed 使用的Token数量
     */
    @Transactional
    public void recordUsage(String providerId, String tokenId, boolean isSuccess, int tokensUsed) {
        log.debug("记录使用统计: Provider={}, Token={}, Success={}, Tokens={}",
                providerId, tokenId, isSuccess, tokensUsed);

        LocalDate today = LocalDate.now();

        // 查找今日的统计记录
        List<UsageStatistics> existingStats = usageStatisticsMapper
                .findByProviderIdAndDate(providerId, today);

        UsageStatistics todayStats = existingStats.stream()
                .filter(s -> tokenId.equals(s.getTokenId()))
                .findFirst()
                .orElse(null);

        if (todayStats == null) {
            // 创建新的统计记录
            todayStats = new UsageStatistics();
            todayStats.setProviderId(providerId);
            todayStats.setTokenId(tokenId);
            todayStats.setDate(today);
            todayStats.setRequestCount(0);
            todayStats.setSuccessCount(0);
            todayStats.setErrorCount(0);
            todayStats.setTotalTokens(0);
            todayStats.setCreatedAt(LocalDateTime.now());
            todayStats.setUpdatedAt(LocalDateTime.now());
        }

        // 更新统计数据
        todayStats.addRequest(isSuccess, tokensUsed);

        // 保存或更新记录
        if (todayStats.getId() == null) {
            usageStatisticsMapper.insert(todayStats);
        } else {
            usageStatisticsMapper.update(todayStats);
        }
    }

    /**
     * 批量记录使用统计
     *
     * @param usageRecords 使用记录列表
     */
    @Transactional
    public void batchRecordUsage(List<UsageRecord> usageRecords) {
        log.debug("批量记录使用统计: {} 条记录", usageRecords.size());

        for (UsageRecord record : usageRecords) {
            try {
                recordUsage(record.getProviderId(), record.getTokenId(),
                        record.isSuccess(), record.getTokensUsed());
            } catch (Exception e) {
                log.error("记录使用统计失败: {}", record, e);
            }
        }
    }

    /**
     * 清理过期统计数据
     *
     * @param retentionDays 保留天数
     * @return 清理的记录数
     */
    @Transactional
    public int cleanupOldStatistics(int retentionDays) {
        LocalDate cutoffDate = LocalDate.now().minusDays(retentionDays);
        log.info("清理{}天前的统计数据: {}", retentionDays, cutoffDate);

        return usageStatisticsMapper.deleteBefore(cutoffDate);
    }

    /**
     * 获取统计概览
     *
     * @return 统计概览
     */
    public StatisticsOverview getStatisticsOverview() {
        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);
        LocalDate monthAgo = today.minusDays(30);

        StatisticsOverview overview = new StatisticsOverview();

        // 今日统计
        overview.setTodayRequests((int) usageStatisticsMapper.getTotalRequests(today, today));
        overview.setTodaySuccesses((int) usageStatisticsMapper.getTotalSuccesses(today, today));

        // 本周统计
        overview.setWeekRequests((int) usageStatisticsMapper.getTotalRequests(weekAgo, today));
        overview.setWeekSuccesses((int) usageStatisticsMapper.getTotalSuccesses(weekAgo, today));

        // 本月统计
        overview.setMonthRequests((int) usageStatisticsMapper.getTotalRequests(monthAgo, today));
        overview.setMonthSuccesses((int) usageStatisticsMapper.getTotalSuccesses(monthAgo, today));

        // 总统计
        overview.setTotalTokensUsed((int) usageStatisticsMapper.getTotalTokensUsed(monthAgo, today));

        return overview;
    }

    /**
     * 转换为每日统计DTO
     */
    private UsageStatisticsDTO.DailyStatistics convertToDailyStatistics(UsageStatistics statistics) {
        UsageStatisticsDTO.DailyStatistics dailyStats = new UsageStatisticsDTO.DailyStatistics();
        dailyStats.setDate(statistics.getDate());
        dailyStats.setRequests(statistics.getRequestCount());
        dailyStats.setSuccesses(statistics.getSuccessCount());
        dailyStats.setErrors(statistics.getErrorCount());
        dailyStats.setTotalTokens(statistics.getTotalTokens());
        dailyStats.setSuccessRate(statistics.getSuccessRate());
        return dailyStats;
    }

    /**
     * 转换为Provider统计DTO
     */
    private UsageStatisticsDTO.ProviderStatistics convertToProviderStatistics(UsageStatistics statistics) {
        UsageStatisticsDTO.ProviderStatistics providerStats = new UsageStatisticsDTO.ProviderStatistics();
        providerStats.setProviderId(statistics.getProviderId());
        providerStats.setRequests(statistics.getRequestCount());
        providerStats.setSuccesses(statistics.getSuccessCount());
        providerStats.setErrors(statistics.getErrorCount());
        providerStats.setTotalTokens(statistics.getTotalTokens());
        providerStats.setSuccessRate(statistics.getSuccessRate());
        providerStats.setAvgTokensPerRequest(statistics.getAverageTokensPerRequest());

        // 获取Provider名称和类型
        try {
            Provider provider = providerMapper.findById(statistics.getProviderId());
            if (provider != null) {
                providerStats.setProviderName(provider.getName());
                providerStats.setProviderType(provider.getType());
            }
        } catch (Exception e) {
            log.warn("获取Provider信息失败: {}", statistics.getProviderId(), e);
        }

        return providerStats;
    }

    /**
     * 使用记录内部类
     */
    public static class UsageRecord {
        private String providerId;
        private String tokenId;
        private boolean success;
        private int tokensUsed;

        public UsageRecord(String providerId, String tokenId, boolean success, int tokensUsed) {
            this.providerId = providerId;
            this.tokenId = tokenId;
            this.success = success;
            this.tokensUsed = tokensUsed;
        }

        // Getters
        public String getProviderId() { return providerId; }
        public String getTokenId() { return tokenId; }
        public boolean isSuccess() { return success; }
        public int getTokensUsed() { return tokensUsed; }

        @Override
        public String toString() {
            return String.format("UsageRecord{providerId='%s', tokenId='%s', success=%s, tokensUsed=%d}",
                    providerId, tokenId, success, tokensUsed);
        }
    }

    /**
     * 统计概览
     */
    public static class StatisticsOverview {
        private int todayRequests;
        private int todaySuccesses;
        private int weekRequests;
        private int weekSuccesses;
        private int monthRequests;
        private int monthSuccesses;
        private int totalTokensUsed;

        // Getters and Setters
        public int getTodayRequests() { return todayRequests; }
        public void setTodayRequests(int todayRequests) { this.todayRequests = todayRequests; }

        public int getTodaySuccesses() { return todaySuccesses; }
        public void setTodaySuccesses(int todaySuccesses) { this.todaySuccesses = todaySuccesses; }

        public int getWeekRequests() { return weekRequests; }
        public void setWeekRequests(int weekRequests) { this.weekRequests = weekRequests; }

        public int getWeekSuccesses() { return weekSuccesses; }
        public void setWeekSuccesses(int weekSuccesses) { this.weekSuccesses = weekSuccesses; }

        public int getMonthRequests() { return monthRequests; }
        public void setMonthRequests(int monthRequests) { this.monthRequests = monthRequests; }

        public int getMonthSuccesses() { return monthSuccesses; }
        public void setMonthSuccesses(int monthSuccesses) { this.monthSuccesses = monthSuccesses; }

        public int getTotalTokensUsed() { return totalTokensUsed; }
        public void setTotalTokensUsed(int totalTokensUsed) { this.totalTokensUsed = totalTokensUsed; }
    }
}