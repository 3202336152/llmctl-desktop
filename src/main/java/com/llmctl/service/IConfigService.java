package com.llmctl.service;

import com.llmctl.dto.ActiveProviderConfigDTO;
import com.llmctl.dto.ConfigExportResponse;
import com.llmctl.dto.ConfigImportRequest;
import com.llmctl.dto.ConfigValidationResponse;

/**
 * 配置服务接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public interface IConfigService {

    /**
     * 获取当前活跃Provider配置
     *
     * @return 活跃Provider配置
     */
    ActiveProviderConfigDTO getActiveProviderConfig();

    /**
     * 设置活跃Provider
     *
     * @param providerId Provider ID
     * @throws IllegalArgumentException 如果Provider不存在
     */
    void setActiveProvider(String providerId);

    /**
     * 导出配置
     *
     * @param format 导出格式 (bash, powershell, cmd, json)
     * @return 配置导出响应
     * @throws IllegalArgumentException 如果格式不支持
     */
    ConfigExportResponse exportConfig(String format);

    /**
     * 导入配置
     *
     * @param request 导入请求
     * @return 导入结果
     */
    ConfigImportResult importConfig(ConfigImportRequest request);

    /**
     * 验证配置
     *
     * @param providerId Provider ID (可选)
     * @return 验证结果
     */
    ConfigValidationResponse validateConfig(String providerId);

    /**
     * 配置导入结果
     */
    class ConfigImportResult {
        private Boolean success;
        private Integer importedCount;
        private Integer skippedCount;
        private java.util.List<String> errors;

        public ConfigImportResult() {
            this.success = true;
            this.importedCount = 0;
            this.skippedCount = 0;
            this.errors = new java.util.ArrayList<>();
        }

        // Getters and Setters
        public Boolean getSuccess() { return success; }
        public void setSuccess(Boolean success) { this.success = success; }

        public Integer getImportedCount() { return importedCount; }
        public void setImportedCount(Integer importedCount) { this.importedCount = importedCount; }

        public Integer getSkippedCount() { return skippedCount; }
        public void setSkippedCount(Integer skippedCount) { this.skippedCount = skippedCount; }

        public java.util.List<String> getErrors() { return errors; }
        public void setErrors(java.util.List<String> errors) { this.errors = errors; }
    }
}