package com.llmctl.service.impl;

import com.llmctl.dto.UsageStatisticsDTO;
import com.llmctl.entity.Provider;
import com.llmctl.entity.Token;
import com.llmctl.entity.UsageStatistics;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.mapper.UsageStatisticsMapper;
import com.llmctl.service.IUsageStatisticsService;
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
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 使用统计业务服务实现类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UsageStatisticsServiceImpl implements IUsageStatisticsService {

    private final UsageStatisticsMapper usageStatisticsMapper;
    private final ProviderMapper providerMapper;
    private final TokenMapper tokenMapper;

    @Override
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

    @Override
    @Transactional
    public void recordUsage(String providerId, String tokenId, Integer requestCount, Integer tokenConsumed) {
        log.debug("记录使用统计: Provider={}, Token={}, Requests={}, Tokens={}",
                providerId, tokenId, requestCount, tokenConsumed);

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
            todayStats.setId(System.currentTimeMillis());
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
        if (requestCount != null && requestCount > 0) {
            todayStats.setRequestCount(todayStats.getRequestCount() + requestCount);
            // 假设大部分请求都成功，实际应该根据具体结果调整
            todayStats.setSuccessCount(todayStats.getSuccessCount() + requestCount);
        }

        if (tokenConsumed != null && tokenConsumed > 0) {
            todayStats.setTotalTokens(todayStats.getTotalTokens() + tokenConsumed);
        }

        todayStats.setUpdatedAt(LocalDateTime.now());

        // 保存或更新记录
        if (todayStats.getId() == null || existingStats.isEmpty()) {
            usageStatisticsMapper.insert(todayStats);
        } else {
            usageStatisticsMapper.update(todayStats);
        }
    }

    @Override
    @Transactional
    public void batchRecordUsage(List<UsageRecord> usageRecords) {
        log.debug("批量记录使用统计: {} 条记录", usageRecords.size());

        for (UsageRecord record : usageRecords) {
            try {
                recordUsage(record.getProviderId(), record.getTokenId(),
                        record.getRequestCount(), record.getTokenConsumed());
            } catch (Exception e) {
                log.error("记录使用统计失败: {}", record, e);
            }
        }
    }

    @Override
    public List<UsageStatisticsDTO> getProviderUsageStats(String providerId, LocalDate startDate, LocalDate endDate) {
        log.debug("获取Provider使用统计: Provider={}, 日期范围={} 到 {}", providerId, startDate, endDate);

        // 验证Provider是否存在
        Provider provider = providerMapper.findById(providerId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在: " + providerId);
        }

        // 简化实现，返回空列表
        return List.of();
    }

    @Override
    public List<UsageStatisticsDTO> getTokenUsageStats(String tokenId, Integer days) {
        if (days == null || days <= 0) {
            days = 7;
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        log.debug("获取Token使用统计: Token={}, 日期范围={} 到 {}", tokenId, startDate, endDate);

        // 简化实现，返回空列表
        return List.of();
    }

    @Override
    public OverallStatistics getOverallStatistics(Integer days) {
        if (days == null || days <= 0) {
            days = 30;
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        log.debug("获取总体统计信息: 日期范围={} 到 {}", startDate, endDate);

        OverallStatistics stats = new OverallStatistics();

        // 计算总请求数和Token消耗
        long totalRequests = usageStatisticsMapper.getTotalRequests(startDate, endDate);
        long totalTokensConsumed = usageStatisticsMapper.getTotalTokensUsed(startDate, endDate);

        stats.setTotalRequests(totalRequests);
        stats.setTotalTokensConsumed(totalTokensConsumed);

        // 计算活跃Provider和Token数量 - 简化实现
        stats.setActiveProviders(0L);
        stats.setActiveTokens(0L);

        // 获取顶级Provider - 简化实现
        List<UsageStatistics> topProviderStats = List.of();
        Map<String, Object> topProviders = new HashMap<>();
        for (UsageStatistics providerStat : topProviderStats) {
            try {
                Provider provider = providerMapper.findById(providerStat.getProviderId());
                if (provider != null) {
                    Map<String, Object> providerInfo = new HashMap<>();
                    providerInfo.put("name", provider.getName());
                    providerInfo.put("type", provider.getType());
                    providerInfo.put("requests", providerStat.getRequestCount());
                    providerInfo.put("tokens", providerStat.getTotalTokens());
                    topProviders.put(providerStat.getProviderId(), providerInfo);
                }
            } catch (Exception e) {
                log.warn("获取Provider信息失败: {}", providerStat.getProviderId(), e);
            }
        }
        stats.setTopProviders(topProviders);

        // 获取每日趋势（简化实现）
        Map<String, Object> dailyTrends = new HashMap<>();
        for (int i = Math.min(days, 7); i > 0; i--) {
            LocalDate date = endDate.minusDays(i - 1);
            long dayRequests = usageStatisticsMapper.getTotalRequests(date, date);
            dailyTrends.put(date.toString(), dayRequests);
        }
        stats.setDailyTrends(dailyTrends);

        return stats;
    }

    @Override
    @Transactional
    public void cleanupOldStatistics(Integer daysToKeep) {
        if (daysToKeep == null || daysToKeep <= 0) {
            daysToKeep = 90; // 默认保留90天
        }

        LocalDate cutoffDate = LocalDate.now().minusDays(daysToKeep);
        log.info("清理{}天前的统计数据: {}", daysToKeep, cutoffDate);

        int deletedCount = usageStatisticsMapper.deleteBefore(cutoffDate);
        log.info("清理了{}条过期统计记录", deletedCount);
    }

    @Override
    public List<UsageStatisticsDTO.TokenStatistics> getTokenStatistics(String providerId, Integer days) {
        if (days == null || days <= 0) {
            days = 7;
        }

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        log.debug("获取Token使用统计: Provider={}, 日期范围={} 到 {}", providerId, startDate, endDate);

        // 简化实现，返回空列表或根据实际需求实现
        return List.of();
    }

    @Override
    public StatisticsOverview getStatisticsOverview() {
        log.debug("获取统计概览");

        // 使用现有的总体统计方法
        OverallStatistics overallStats = getOverallStatistics(30);

        StatisticsOverview overview = new StatisticsOverview();
        overview.setTotalRequests(overallStats.getTotalRequests());
        overview.setTotalTokensConsumed(overallStats.getTotalTokensConsumed());
        overview.setActiveProviders(overallStats.getActiveProviders());
        overview.setActiveTokens(overallStats.getActiveTokens());
        overview.setTopProviders(overallStats.getTopProviders());
        overview.setDailyTrends(overallStats.getDailyTrends());

        return overview;
    }

    @Override
    public void recordUsage(String providerId, String tokenId, boolean success, int tokensUsed) {
        log.debug("记录使用统计: Provider={}, Token={}, Success={}, Tokens={}",
                providerId, tokenId, success, tokensUsed);

        // 转换为现有的recordUsage方法调用
        Integer requestCount = success ? 1 : 0;
        Integer tokenConsumed = tokensUsed > 0 ? tokensUsed : null;

        recordUsage(providerId, tokenId, requestCount, tokenConsumed);
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
     * 转换为通用统计DTO
     */
    private UsageStatisticsDTO convertToDTO(UsageStatistics statistics) {
        UsageStatisticsDTO dto = new UsageStatisticsDTO();
        dto.setTotalRequests(statistics.getRequestCount());
        dto.setSuccessRate(statistics.getSuccessRate());

        // 创建并设置每日统计
        UsageStatisticsDTO.DailyStatistics dailyStats = new UsageStatisticsDTO.DailyStatistics();
        dailyStats.setDate(statistics.getDate());
        dailyStats.setRequests(statistics.getRequestCount());
        dailyStats.setSuccesses(statistics.getSuccessCount());
        dailyStats.setErrors(statistics.getErrorCount());
        dailyStats.setTotalTokens(statistics.getTotalTokens());

        dto.setDailyStats(List.of(dailyStats));
        return dto;
    }
}