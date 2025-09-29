package com.llmctl.controller;

import com.llmctl.dto.*;
import com.llmctl.service.ProviderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;


import java.util.List;

/**
 * Provider管理REST控制器
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
@RestController
@RequestMapping("/providers")
@RequiredArgsConstructor
@Validated
public class ProviderController {

    private final ProviderService providerService;

    /**
     * 获取所有Provider列表
     *
     * @return Provider列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProviderDTO>>> getAllProviders() {
        log.info("获取所有Provider列表");

        List<ProviderDTO> providers = providerService.getAllProviders();
        ApiResponse<List<ProviderDTO>> response = ApiResponse.success(providers);

        return ResponseEntity.ok(response);
    }

    /**
     * 根据ID获取Provider详情
     *
     * @param id Provider ID
     * @return Provider详情
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProviderDTO>> getProviderById(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String id) {
        log.info("根据ID获取Provider详情: {}", id);

        ProviderDTO provider = providerService.getProviderById(id);
        ApiResponse<ProviderDTO> response = ApiResponse.success(provider);

        return ResponseEntity.ok(response);
    }

    /**
     * 根据类型获取Provider列表
     *
     * @param type Provider类型
     * @return Provider列表
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<ProviderDTO>>> getProvidersByType(
            @PathVariable @NotBlank(message = "Provider类型不能为空") String type) {
        log.info("根据类型获取Provider列表: {}", type);

        List<ProviderDTO> providers = providerService.getProvidersByType(type);
        ApiResponse<List<ProviderDTO>> response = ApiResponse.success(providers);

        return ResponseEntity.ok(response);
    }

    /**
     * 创建新的Provider
     *
     * @param request 创建Provider请求
     * @return 创建的Provider
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProviderDTO>> createProvider(
            @Valid @RequestBody CreateProviderRequest request) {
        log.info("创建新的Provider: {}", request.getName());

        ProviderDTO provider = providerService.createProvider(request);
        ApiResponse<ProviderDTO> response = ApiResponse.success(provider, "Provider创建成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 更新Provider
     *
     * @param id Provider ID
     * @param request 更新Provider请求
     * @return 更新后的Provider
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProviderDTO>> updateProvider(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String id,
            @Valid @RequestBody UpdateProviderRequest request) {
        log.info("更新Provider: {} (ID: {})", request.getName(), id);

        ProviderDTO provider = providerService.updateProvider(id, request);
        ApiResponse<ProviderDTO> response = ApiResponse.success(provider, "Provider更新成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 删除Provider
     *
     * @param id Provider ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteProvider(
            @PathVariable @NotBlank(message = "Provider ID不能为空") String id) {
        log.info("删除Provider: {}", id);

        providerService.deleteProvider(id);
        ApiResponse<Object> response = ApiResponse.success("Provider删除成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 检查Provider名称是否可用
     *
     * @param name Provider名称
     * @param excludeId 排除的Provider ID（可选）
     * @return 名称可用性检查结果
     */
    @GetMapping("/check-name")
    public ResponseEntity<ApiResponse<Boolean>> checkProviderName(
            @RequestParam @NotBlank(message = "Provider名称不能为空") String name,
            @RequestParam(required = false) String excludeId) {
        log.info("检查Provider名称是否可用: {} (排除ID: {})", name, excludeId);

        boolean available = providerService.isProviderNameAvailable(name, excludeId);
        ApiResponse<Boolean> response = ApiResponse.success(available);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取Provider统计信息
     *
     * @return Provider统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<ProviderStatistics>> getProviderStatistics() {
        log.info("获取Provider统计信息");

        ProviderStatistics statistics = new ProviderStatistics();
        statistics.setTotal(providerService.countProviders());
        statistics.setAnthropicCount(providerService.countProvidersByType("anthropic"));
        statistics.setOpenaiCount(providerService.countProvidersByType("openai"));
        statistics.setQwenCount(providerService.countProvidersByType("qwen"));
        statistics.setGeminiCount(providerService.countProvidersByType("gemini"));

        ApiResponse<ProviderStatistics> response = ApiResponse.success(statistics);
        return ResponseEntity.ok(response);
    }

    /**
     * Provider统计信息DTO
     */
    public static class ProviderStatistics {
        private long total;
        private long anthropicCount;
        private long openaiCount;
        private long qwenCount;
        private long geminiCount;

        // Getters and Setters
        public long getTotal() { return total; }
        public void setTotal(long total) { this.total = total; }

        public long getAnthropicCount() { return anthropicCount; }
        public void setAnthropicCount(long anthropicCount) { this.anthropicCount = anthropicCount; }

        public long getOpenaiCount() { return openaiCount; }
        public void setOpenaiCount(long openaiCount) { this.openaiCount = openaiCount; }

        public long getQwenCount() { return qwenCount; }
        public void setQwenCount(long qwenCount) { this.qwenCount = qwenCount; }

        public long getGeminiCount() { return geminiCount; }
        public void setGeminiCount(long geminiCount) { this.geminiCount = geminiCount; }
    }
}