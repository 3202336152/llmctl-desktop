package com.llmctl.controller;

import com.llmctl.dto.ApiResponse;
import com.llmctl.dto.UsageStatisticsDTO;
import com.llmctl.service.IUsageStatisticsService;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 统计信息REST控制器
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
@Validated
public class StatisticsController {

    private final IUsageStatisticsService usageStatisticsService;

    /**
     * 获取使用统计
     *
     * @param providerId Provider ID (可选)
     * @param days 统计天数 (默认7天)
     * @return 使用统计信息
     */
    @GetMapping("/usage")
    public ResponseEntity<ApiResponse<UsageStatisticsDTO>> getUsageStatistics(
            @RequestParam(required = false) String providerId,
            @RequestParam(defaultValue = "7") @Min(value = 1, message = "统计天数必须大于0") Integer days) {
        log.info("获取使用统计: Provider={}, Days={}", providerId, days);

        UsageStatisticsDTO statistics = usageStatisticsService.getUsageStatistics(providerId, days);
        ApiResponse<UsageStatisticsDTO> response = ApiResponse.success(statistics);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取指定Provider的Token使用统计
     *
     * @param providerId Provider ID
     * @param days 统计天数 (默认7天)
     * @return Token使用统计列表
     */
    @GetMapping("/tokens/{providerId}")
    public ResponseEntity<ApiResponse<List<UsageStatisticsDTO.TokenStatistics>>> getTokenStatistics(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String providerId,
            @RequestParam(defaultValue = "7") @Min(value = 1, message = "统计天数必须大于0") Integer days) {
        log.info("获取Token使用统计: Provider={}, Days={}", providerId, days);

        List<UsageStatisticsDTO.TokenStatistics> statistics =
                usageStatisticsService.getTokenStatistics(providerId, days);
        ApiResponse<List<UsageStatisticsDTO.TokenStatistics>> response = ApiResponse.success(statistics);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取统计概览
     *
     * @return 统计概览信息
     */
    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<IUsageStatisticsService.StatisticsOverview>> getStatisticsOverview() {
        log.info("获取统计概览");

        IUsageStatisticsService.StatisticsOverview overview = usageStatisticsService.getStatisticsOverview();
        ApiResponse<IUsageStatisticsService.StatisticsOverview> response = ApiResponse.success(overview);

        return ResponseEntity.ok(response);
    }

    /**
     * 记录使用统计 (内部API，供系统调用)
     *
     * @param request 使用记录请求
     * @return 记录结果
     */
    @PostMapping("/record")
    public ResponseEntity<ApiResponse<Object>> recordUsage(
            @RequestBody RecordUsageRequest request) {
        log.debug("记录使用统计: {}", request);

        usageStatisticsService.recordUsage(
                request.getProviderId(),
                request.getTokenId(),
                request.isSuccess(),
                request.getTokensUsed()
        );

        ApiResponse<Object> response = ApiResponse.success("使用统计记录成功");
        return ResponseEntity.ok(response);
    }

    /**
     * 批量记录使用统计 (内部API，供系统调用)
     *
     * @param request 批量使用记录请求
     * @return 批量记录结果
     */
    @PostMapping("/batch-record")
    public ResponseEntity<ApiResponse<Object>> batchRecordUsage(
            @RequestBody BatchRecordUsageRequest request) {
        log.debug("批量记录使用统计: {} 条记录", request.getUsageRecords().size());

        List<IUsageStatisticsService.UsageRecord> usageRecords = request.getUsageRecords().stream()
                .map(r -> new IUsageStatisticsService.UsageRecord(
                        r.getProviderId(), r.getTokenId(), r.isSuccess() ? 1 : 0, r.getTokensUsed()))
                .toList();

        usageStatisticsService.batchRecordUsage(usageRecords);

        ApiResponse<Object> response = ApiResponse.success("批量使用统计记录成功");
        return ResponseEntity.ok(response);
    }

    /**
     * 清理过期统计数据 (管理员API)
     *
     * @param retentionDays 保留天数
     * @return 清理结果
     */
    @DeleteMapping("/cleanup")
    public ResponseEntity<ApiResponse<CleanupResult>> cleanupOldStatistics(
            @RequestParam(defaultValue = "90") @Min(value = 1, message = "保留天数必须大于0") Integer retentionDays) {
        log.info("清理过期统计数据: 保留{}天", retentionDays);

        usageStatisticsService.cleanupOldStatistics(retentionDays);
        int deletedCount = 0; // 简化实现，实际应该从服务方法获取

        CleanupResult result = new CleanupResult();
        result.setDeletedCount(deletedCount);
        result.setRetentionDays(retentionDays);

        ApiResponse<CleanupResult> response = ApiResponse.success(result, "统计数据清理完成");
        return ResponseEntity.ok(response);
    }

    /**
     * 记录使用统计请求DTO
     */
    public static class RecordUsageRequest {
        private String providerId;
        private String tokenId;
        private boolean success;
        private int tokensUsed;

        // Getters and Setters
        public String getProviderId() { return providerId; }
        public void setProviderId(String providerId) { this.providerId = providerId; }

        public String getTokenId() { return tokenId; }
        public void setTokenId(String tokenId) { this.tokenId = tokenId; }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public int getTokensUsed() { return tokensUsed; }
        public void setTokensUsed(int tokensUsed) { this.tokensUsed = tokensUsed; }

        @Override
        public String toString() {
            return String.format("RecordUsageRequest{providerId='%s', tokenId='%s', success=%s, tokensUsed=%d}",
                    providerId, tokenId, success, tokensUsed);
        }
    }

    /**
     * 批量记录使用统计请求DTO
     */
    public static class BatchRecordUsageRequest {
        private List<RecordUsageRequest> usageRecords;

        public List<RecordUsageRequest> getUsageRecords() { return usageRecords; }
        public void setUsageRecords(List<RecordUsageRequest> usageRecords) { this.usageRecords = usageRecords; }
    }

    /**
     * 清理结果DTO
     */
    public static class CleanupResult {
        private int deletedCount;
        private int retentionDays;

        public int getDeletedCount() { return deletedCount; }
        public void setDeletedCount(int deletedCount) { this.deletedCount = deletedCount; }

        public int getRetentionDays() { return retentionDays; }
        public void setRetentionDays(int retentionDays) { this.retentionDays = retentionDays; }
    }
}