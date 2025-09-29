package com.llmctl.entity;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 使用统计实体类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class UsageStatistics {

    /**
     * 统计记录ID
     */
    private Long id;

    /**
     * 关联的Provider ID
     */
    private String providerId;

    /**
     * 关联的Token ID
     */
    private String tokenId;

    /**
     * 请求次数
     */
    private Integer requestCount;

    /**
     * 成功次数
     */
    private Integer successCount;

    /**
     * 错误次数
     */
    private Integer errorCount;

    /**
     * 总Token消耗
     */
    private Integer totalTokens;

    /**
     * 统计日期
     */
    private LocalDate date;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 关联的Provider对象 (多对一关系)
     */
    private Provider provider;

    /**
     * 关联的Token对象 (多对一关系)
     */
    private Token token;

    /**
     * 计算成功率
     *
     * @return 成功率百分比 (0-100)
     */
    public BigDecimal getSuccessRate() {
        if (requestCount == null || requestCount == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal successCountDecimal = new BigDecimal(successCount != null ? successCount : 0);
        BigDecimal requestCountDecimal = new BigDecimal(requestCount);

        return successCountDecimal.multiply(new BigDecimal("100"))
                .divide(requestCountDecimal, 2, RoundingMode.HALF_UP);
    }

    /**
     * 计算错误率
     *
     * @return 错误率百分比 (0-100)
     */
    public BigDecimal getErrorRate() {
        if (requestCount == null || requestCount == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal errorCountDecimal = new BigDecimal(errorCount != null ? errorCount : 0);
        BigDecimal requestCountDecimal = new BigDecimal(requestCount);

        return errorCountDecimal.multiply(new BigDecimal("100"))
                .divide(requestCountDecimal, 2, RoundingMode.HALF_UP);
    }

    /**
     * 计算平均每次请求的Token消耗
     *
     * @return 平均Token消耗
     */
    public BigDecimal getAverageTokensPerRequest() {
        if (requestCount == null || requestCount == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal totalTokensDecimal = new BigDecimal(totalTokens != null ? totalTokens : 0);
        BigDecimal requestCountDecimal = new BigDecimal(requestCount);

        return totalTokensDecimal.divide(requestCountDecimal, 2, RoundingMode.HALF_UP);
    }

    /**
     * 增加请求统计
     *
     * @param isSuccess 是否成功
     * @param tokensUsed 使用的Token数量
     */
    public void addRequest(boolean isSuccess, int tokensUsed) {
        // 增加请求总数
        this.requestCount = (this.requestCount != null ? this.requestCount : 0) + 1;

        // 增加成功或错误数
        if (isSuccess) {
            this.successCount = (this.successCount != null ? this.successCount : 0) + 1;
        } else {
            this.errorCount = (this.errorCount != null ? this.errorCount : 0) + 1;
        }

        // 累加Token消耗
        this.totalTokens = (this.totalTokens != null ? this.totalTokens : 0) + tokensUsed;

        // 更新时间
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 检查是否为今日统计
     *
     * @return true如果统计日期为今天
     */
    public boolean isToday() {
        return this.date != null && this.date.equals(LocalDate.now());
    }

    /**
     * 重置统计数据
     */
    public void reset() {
        this.requestCount = 0;
        this.successCount = 0;
        this.errorCount = 0;
        this.totalTokens = 0;
        this.updatedAt = LocalDateTime.now();
    }
}