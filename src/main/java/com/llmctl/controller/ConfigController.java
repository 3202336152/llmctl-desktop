package com.llmctl.controller;

import com.llmctl.dto.*;
import com.llmctl.entity.GlobalConfig;
import com.llmctl.service.IConfigService;
import com.llmctl.service.IGlobalConfigService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 配置管理REST控制器
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
@RestController
@RequestMapping("/config")
@RequiredArgsConstructor
@Validated
public class ConfigController {

    private final IConfigService configService;
    private final IGlobalConfigService globalConfigService;

    /**
     * 获取当前活跃Provider配置
     *
     * @return 活跃Provider配置
     */
    @GetMapping("/active-provider")
    public ResponseEntity<ApiResponse<ActiveProviderConfigDTO>> getActiveProviderConfig() {
        log.info("获取当前活跃Provider配置");

        ActiveProviderConfigDTO config = configService.getActiveProviderConfig();
        ApiResponse<ActiveProviderConfigDTO> response = ApiResponse.success(config);

        return ResponseEntity.ok(response);
    }

    /**
     * 设置活跃Provider
     *
     * @param request 设置活跃Provider请求
     * @return 设置结果
     */
    @PutMapping("/active-provider")
    public ResponseEntity<ApiResponse<Object>> setActiveProvider(
            @Valid @RequestBody SetActiveProviderRequest request) {
        log.info("设置活跃Provider: {}", request.getProviderId());

        configService.setActiveProvider(request.getProviderId());
        ApiResponse<Object> response = ApiResponse.success("活跃Provider设置成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 导出配置
     *
     * @param format 导出格式 (bash, powershell, cmd, json)
     * @return 配置导出响应
     */
    @GetMapping("/export")
    public ResponseEntity<ApiResponse<ConfigExportResponse>> exportConfig(
            @RequestParam @NotBlank(message = "导出格式不能为空") String format) {
        log.info("导出配置，格式: {}", format);

        ConfigExportResponse exportResponse = configService.exportConfig(format);
        ApiResponse<ConfigExportResponse> response = ApiResponse.success(exportResponse);

        return ResponseEntity.ok(response);
    }

    /**
     * 导入配置
     *
     * @param request 导入配置请求
     * @return 导入结果
     */
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<IConfigService.ConfigImportResult>> importConfig(
            @Valid @RequestBody ConfigImportRequest request) {
        log.info("导入配置，格式: {}", request.getFormat());

        IConfigService.ConfigImportResult result = configService.importConfig(request);

        if (result.getSuccess()) {
            ApiResponse<IConfigService.ConfigImportResult> response =
                    ApiResponse.success(result, "配置导入成功");
            return ResponseEntity.ok(response);
        } else {
            ApiResponse<IConfigService.ConfigImportResult> response =
                    ApiResponse.error(400, "配置导入失败", result.getErrors().toString());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 验证配置
     *
     * @param providerId Provider ID (可选)
     * @return 验证结果
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<ConfigValidationResponse>> validateConfig(
            @RequestParam(required = false) String providerId) {
        log.info("验证配置: {}", providerId != null ? providerId : "全部");

        ConfigValidationResponse validationResponse = configService.validateConfig(providerId);

        if (validationResponse.getIsValid()) {
            ApiResponse<ConfigValidationResponse> response =
                    ApiResponse.success(validationResponse, "配置验证通过");
            return ResponseEntity.ok(response);
        } else {
            ApiResponse<ConfigValidationResponse> response =
                    ApiResponse.success(validationResponse, "配置验证发现问题");
            return ResponseEntity.ok(response);
        }
    }

    /**
     * 获取所有全局配置
     *
     * @return 全局配置列表
     */
    @GetMapping("/global")
    public ResponseEntity<ApiResponse<List<GlobalConfigDTO>>> getGlobalConfigs() {
        log.info("获取所有全局配置");

        List<GlobalConfig> configs = globalConfigService.getAllConfigs();
        List<GlobalConfigDTO> configDTOs = configs.stream()
                .map(config -> {
                    GlobalConfigDTO dto = new GlobalConfigDTO();
                    dto.setConfigKey(config.getConfigKey());
                    dto.setConfigValue(config.getConfigValue());
                    dto.setDescription(config.getDescription());
                    return dto;
                })
                .collect(Collectors.toList());

        ApiResponse<List<GlobalConfigDTO>> response = ApiResponse.success(configDTOs);
        return ResponseEntity.ok(response);
    }

    /**
     * 设置全局配置
     *
     * @param request 设置配置请求
     * @return 设置结果
     */
    @PostMapping("/global")
    public ResponseEntity<ApiResponse<Object>> setGlobalConfig(
            @Valid @RequestBody SetGlobalConfigRequest request) {
        log.info("设置全局配置: {} = {}", request.getConfigKey(), request.getConfigValue());

        globalConfigService.setConfig(request.getConfigKey(), request.getConfigValue());

        ApiResponse<Object> response = ApiResponse.success("全局配置设置成功");
        return ResponseEntity.ok(response);
    }

    /**
     * 批量设置全局配置
     *
     * @param configs 配置列表
     * @return 设置结果
     */
    @PostMapping("/global/batch")
    public ResponseEntity<ApiResponse<Object>> setBatchGlobalConfigs(
            @Valid @RequestBody List<SetGlobalConfigRequest> configs) {
        log.info("批量设置全局配置，共 {} 项", configs.size());

        for (SetGlobalConfigRequest request : configs) {
            globalConfigService.setConfig(request.getConfigKey(), request.getConfigValue());
        }

        ApiResponse<Object> response = ApiResponse.success("批量配置设置成功");
        return ResponseEntity.ok(response);
    }

    /**
     * 全局配置DTO
     */
    public static class GlobalConfigDTO {
        private String configKey;
        private String configValue;
        private String description;

        // Getters and Setters
        public String getConfigKey() { return configKey; }
        public void setConfigKey(String configKey) { this.configKey = configKey; }

        public String getConfigValue() { return configValue; }
        public void setConfigValue(String configValue) { this.configValue = configValue; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    /**
     * 设置全局配置请求DTO
     */
    public static class SetGlobalConfigRequest {
        @NotBlank(message = "配置键不能为空")
        private String configKey;

        private String configValue;
        private String description;

        // Getters and Setters
        public String getConfigKey() { return configKey; }
        public void setConfigKey(String configKey) { this.configKey = configKey; }

        public String getConfigValue() { return configValue; }
        public void setConfigValue(String configValue) { this.configValue = configValue; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}