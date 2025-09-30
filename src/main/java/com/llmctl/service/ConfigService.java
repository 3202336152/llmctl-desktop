package com.llmctl.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llmctl.dto.*;
import com.llmctl.entity.Provider;
import com.llmctl.entity.Token;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.utils.DataUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 配置管理业务服务类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConfigService {

    private final GlobalConfigService globalConfigService;
    private final ProviderService providerService;
    private final ProviderMapper providerMapper;
    private final TokenMapper tokenMapper;
    private final ObjectMapper objectMapper;

    /**
     * 获取当前活跃Provider配置
     *
     * @return 活跃Provider配置
     */
    public ActiveProviderConfigDTO getActiveProviderConfig() {
        log.debug("获取当前活跃Provider配置");

        ActiveProviderConfigDTO config = new ActiveProviderConfigDTO();
        String activeProviderId = globalConfigService.getActiveProviderId();
        config.setActiveProviderId(activeProviderId);

        if (activeProviderId != null) {
            try {
                ProviderDTO activeProvider = providerService.getProviderById(activeProviderId);
                config.setActiveProvider(activeProvider);
            } catch (Exception e) {
                log.warn("获取活跃Provider详情失败: {}", activeProviderId, e);
            }
        }

        return config;
    }

    /**
     * 设置活跃Provider
     *
     * @param providerId Provider ID
     * @throws IllegalArgumentException 如果Provider不存在
     */
    @Transactional
    public void setActiveProvider(String providerId) {
        log.info("设置活跃Provider: {}", providerId);

        // 验证Provider是否存在
        Provider provider = providerMapper.findById(providerId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在: " + providerId);
        }

        // 验证Provider是否有可用Token
        long availableTokenCount = tokenMapper.countAvailableByProviderId(providerId);
        if (availableTokenCount == 0) {
            log.warn("Provider没有可用Token: {}", providerId);
        }

        globalConfigService.setActiveProviderId(providerId);
        log.info("成功设置活跃Provider: {} ({})", provider.getName(), providerId);
    }

    /**
     * 导出配置
     *
     * @param format 导出格式 (bash, powershell, cmd, json)
     * @return 配置导出响应
     * @throws IllegalArgumentException 如果格式不支持
     */
    public ConfigExportResponse exportConfig(String format) {
        log.info("导出配置，格式: {}", format);

        ConfigExportResponse response = new ConfigExportResponse();
        response.setFormat(format);

        switch (format.toLowerCase()) {
            case "bash":
                response.setContent(exportToBash());
                response.setSuggestedFilename("llmctl_config.sh");
                break;

            case "powershell":
                response.setContent(exportToPowerShell());
                response.setSuggestedFilename("llmctl_config.ps1");
                break;

            case "cmd":
                response.setContent(exportToCmd());
                response.setSuggestedFilename("llmctl_config.bat");
                break;

            case "json":
                response.setContent(exportToJson());
                response.setSuggestedFilename("llmctl_config.json");
                break;

            default:
                throw new IllegalArgumentException("不支持的导出格式: " + format);
        }

        return response;
    }

    /**
     * 导入配置
     *
     * @param request 导入请求
     * @return 导入结果
     */
    @Transactional
    public ConfigImportResult importConfig(ConfigImportRequest request) {
        log.info("导入配置，格式: {}", request.getFormat());

        ConfigImportResult result = new ConfigImportResult();
        result.setSuccess(true);
        result.setImportedCount(0);
        result.setSkippedCount(0);
        result.setErrors(new ArrayList<>());

        try {
            switch (request.getFormat().toLowerCase()) {
                case "json":
                    importFromJson(request.getData(), request.getOverwrite(), result);
                    break;

                case "env":
                    importFromEnv(request.getData(), request.getOverwrite(), result);
                    break;

                default:
                    throw new IllegalArgumentException("不支持的导入格式: " + request.getFormat());
            }

        } catch (Exception e) {
            log.error("导入配置失败: ", e);
            result.setSuccess(false);
            result.getErrors().add("导入失败: " + e.getMessage());
        }

        log.info("配置导入完成: 成功{}, 跳过{}, 错误{}",
                result.getImportedCount(), result.getSkippedCount(), result.getErrors().size());

        return result;
    }

    /**
     * 验证配置
     *
     * @param providerId Provider ID (可选)
     * @return 验证结果
     */
    public ConfigValidationResponse validateConfig(String providerId) {
        log.info("验证配置: {}", providerId != null ? providerId : "全部");

        ConfigValidationResponse response = new ConfigValidationResponse();
        response.setIsValid(true);
        response.setErrors(new ArrayList<>());
        response.setWarnings(new ArrayList<>());
        response.setDetails(new HashMap<>());

        if (providerId != null) {
            // 验证特定Provider
            validateSingleProvider(providerId, response);
        } else {
            // 验证所有配置
            validateAllProviders(response);
            validateGlobalConfig(response);
        }

        response.setIsValid(response.getErrors().isEmpty());
        return response;
    }

    /**
     * 导出为Bash格式
     */
    private String exportToBash() {
        StringBuilder sb = new StringBuilder();
        sb.append("#!/bin/bash\n");
        sb.append("# LLMctl Configuration Export\n");
        sb.append("# Generated at: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");

        String activeProviderId = globalConfigService.getActiveProviderId();
        if (activeProviderId != null) {
            Provider provider = providerMapper.findById(activeProviderId);
            if (provider != null) {
                List<Token> tokens = tokenMapper.findAvailableByProviderId(activeProviderId);
                if (!tokens.isEmpty()) {
                    Token firstToken = tokens.get(0);
                    Map<String, String> envVars = buildEnvironmentVariables(provider, firstToken);

                    for (Map.Entry<String, String> entry : envVars.entrySet()) {
                        sb.append("export ").append(entry.getKey()).append("=\"").append(entry.getValue()).append("\"\n");
                    }
                }
            }
        }

        sb.append("\necho \"LLMctl environment configured\"\n");
        return sb.toString();
    }

    /**
     * 导出为PowerShell格式
     */
    private String exportToPowerShell() {
        StringBuilder sb = new StringBuilder();
        sb.append("# LLMctl Configuration Export\n");
        sb.append("# Generated at: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");

        String activeProviderId = globalConfigService.getActiveProviderId();
        if (activeProviderId != null) {
            Provider provider = providerMapper.findById(activeProviderId);
            if (provider != null) {
                List<Token> tokens = tokenMapper.findAvailableByProviderId(activeProviderId);
                if (!tokens.isEmpty()) {
                    Token firstToken = tokens.get(0);
                    Map<String, String> envVars = buildEnvironmentVariables(provider, firstToken);

                    for (Map.Entry<String, String> entry : envVars.entrySet()) {
                        sb.append("$env:").append(entry.getKey()).append(" = \"").append(entry.getValue()).append("\"\n");
                    }
                }
            }
        }

        sb.append("\nWrite-Host \"LLMctl environment configured\"\n");
        return sb.toString();
    }

    /**
     * 导出为CMD格式
     */
    private String exportToCmd() {
        StringBuilder sb = new StringBuilder();
        sb.append("@echo off\n");
        sb.append("REM LLMctl Configuration Export\n");
        sb.append("REM Generated at: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");

        String activeProviderId = globalConfigService.getActiveProviderId();
        if (activeProviderId != null) {
            Provider provider = providerMapper.findById(activeProviderId);
            if (provider != null) {
                List<Token> tokens = tokenMapper.findAvailableByProviderId(activeProviderId);
                if (!tokens.isEmpty()) {
                    Token firstToken = tokens.get(0);
                    Map<String, String> envVars = buildEnvironmentVariables(provider, firstToken);

                    for (Map.Entry<String, String> entry : envVars.entrySet()) {
                        sb.append("set ").append(entry.getKey()).append("=").append(entry.getValue()).append("\n");
                    }
                }
            }
        }

        sb.append("\necho LLMctl environment configured\n");
        return sb.toString();
    }

    /**
     * 导出为JSON格式
     */
    private String exportToJson() {
        Map<String, Object> config = new HashMap<>();

        // 导出基本信息
        config.put("exportTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        config.put("version", globalConfigService.getAppVersion());
        config.put("activeProviderId", globalConfigService.getActiveProviderId());

        // 导出所有Provider
        List<Provider> providers = providerMapper.findAll();
        List<Map<String, Object>> providerConfigs = new ArrayList<>();

        for (Provider provider : providers) {
            Map<String, Object> providerConfig = new HashMap<>();
            providerConfig.put("id", provider.getId());
            providerConfig.put("name", provider.getName());
            providerConfig.put("description", provider.getDescription());
            providerConfig.put("type", provider.getType());
            providerConfig.put("baseUrl", provider.getBaseUrl());
            providerConfig.put("modelName", provider.getModelName());
            providerConfig.put("maxTokens", provider.getMaxTokens());
            providerConfig.put("temperature", provider.getTemperature());
            providerConfig.put("tokenStrategyType", provider.getTokenStrategyType());

            // 导出Token（隐藏实际值）
            List<Token> tokens = tokenMapper.findByProviderId(provider.getId());
            List<Map<String, Object>> tokenConfigs = tokens.stream()
                    .map(token -> {
                        Map<String, Object> tokenConfig = new HashMap<>();
                        tokenConfig.put("alias", token.getAlias());
                        tokenConfig.put("weight", token.getWeight());
                        tokenConfig.put("enabled", token.getEnabled());
                        // 不导出实际Token值，仅导出配置
                        return tokenConfig;
                    })
                    .collect(Collectors.toList());

            providerConfig.put("tokens", tokenConfigs);
            providerConfigs.add(providerConfig);
        }

        config.put("providers", providerConfigs);

        return DataUtils.toJson(config);
    }

    /**
     * 从JSON导入配置
     */
    private void importFromJson(String jsonData, Boolean overwrite, ConfigImportResult result) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> config = objectMapper.readValue(jsonData, Map.class);

            // 导入活跃Provider设置
            if (config.containsKey("activeProviderId")) {
                String activeProviderId = (String) config.get("activeProviderId");
                if (activeProviderId != null && providerMapper.findById(activeProviderId) != null) {
                    globalConfigService.setActiveProviderId(activeProviderId);
                    result.setImportedCount(result.getImportedCount() + 1);
                }
            }

            // TODO: 导入Provider配置需要更复杂的逻辑
            // 这里只是示例，实际实现需要处理Token安全问题

        } catch (Exception e) {
            result.getErrors().add("JSON解析失败: " + e.getMessage());
        }
    }

    /**
     * 从环境变量格式导入配置
     */
    private void importFromEnv(String envData, Boolean overwrite, ConfigImportResult result) {
        String[] lines = envData.split("\n");

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }

            try {
                // 解析环境变量格式: KEY=VALUE
                String[] parts = line.split("=", 2);
                if (parts.length == 2) {
                    String key = parts[0].trim();
                    String value = parts[1].trim().replaceAll("^[\"']|[\"']$", ""); // 移除引号

                    // 根据环境变量类型进行处理
                    if (processEnvironmentVariable(key, value, overwrite)) {
                        result.setImportedCount(result.getImportedCount() + 1);
                    } else {
                        result.setSkippedCount(result.getSkippedCount() + 1);
                    }
                }
            } catch (Exception e) {
                result.getErrors().add("处理环境变量失败: " + line + " - " + e.getMessage());
            }
        }
    }

    /**
     * 处理单个环境变量
     */
    private boolean processEnvironmentVariable(String key, String value, Boolean overwrite) {
        // 这里需要根据具体的环境变量类型进行处理
        // 示例实现，实际需要根据业务需求完善

        if ("LLMCTL_ACTIVE_PROVIDER".equals(key)) {
            if (providerMapper.findById(value) != null) {
                globalConfigService.setActiveProviderId(value);
                return true;
            }
        }

        return false;
    }

    /**
     * 验证单个Provider
     */
    private void validateSingleProvider(String providerId, ConfigValidationResponse response) {
        Provider provider = providerMapper.findById(providerId);
        if (provider == null) {
            response.getErrors().add("Provider不存在: " + providerId);
            return;
        }

        // 验证Provider基本信息
        if (DataUtils.isEmpty(provider.getName())) {
            response.getErrors().add("Provider名称不能为空");
        }

        if (DataUtils.isEmpty(provider.getType())) {
            response.getErrors().add("Provider类型不能为空");
        }

        // 验证Token
        List<Token> tokens = tokenMapper.findByProviderId(providerId);
        if (tokens.isEmpty()) {
            response.getWarnings().add("Provider没有配置Token");
        } else {
            long availableTokens = tokens.stream().filter(Token::isAvailable).count();
            if (availableTokens == 0) {
                response.getErrors().add("Provider没有可用的Token");
            }
        }

        response.getDetails().put("tokenCount", tokens.size());
        response.getDetails().put("availableTokenCount",
                tokens.stream().filter(Token::isAvailable).count());
    }

    /**
     * 验证所有Provider
     */
    private void validateAllProviders(ConfigValidationResponse response) {
        List<Provider> providers = providerMapper.findAll();

        if (providers.isEmpty()) {
            response.getWarnings().add("没有配置任何Provider");
        }

        for (Provider provider : providers) {
            validateSingleProvider(provider.getId(), response);
        }
    }

    /**
     * 验证全局配置
     */
    private void validateGlobalConfig(ConfigValidationResponse response) {
        String activeProviderId = globalConfigService.getActiveProviderId();
        if (activeProviderId == null) {
            response.getWarnings().add("没有设置活跃Provider");
        } else if (providerMapper.findById(activeProviderId) == null) {
            response.getErrors().add("活跃Provider不存在: " + activeProviderId);
        }
    }

    /**
     * 构建环境变量
     */
    private Map<String, String> buildEnvironmentVariables(Provider provider, Token token) {
        Map<String, String> envVars = new HashMap<>();
        String tokenValue = token.getValue(); // 这里应该解密Token值

        switch (provider.getType().toLowerCase()) {
            case "anthropic":
                envVars.put("ANTHROPIC_AUTH_TOKEN", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("ANTHROPIC_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("ANTHROPIC_MODEL", provider.getModelName());
                }
                break;

            case "openai":
                envVars.put("OPENAI_API_KEY", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("OPENAI_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("OPENAI_MODEL", provider.getModelName());
                }
                break;

            case "qwen":
                envVars.put("DASHSCOPE_API_KEY", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("DASHSCOPE_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("QWEN_MODEL", provider.getModelName());
                }
                break;

            case "gemini":
                envVars.put("GOOGLE_API_KEY", tokenValue);
                if (provider.getBaseUrl() != null) {
                    envVars.put("GOOGLE_BASE_URL", provider.getBaseUrl());
                }
                if (provider.getModelName() != null) {
                    envVars.put("GEMINI_MODEL", provider.getModelName());
                }
                break;
        }

        return envVars;
    }

    /**
     * 配置导入结果
     */
    public static class ConfigImportResult {
        private Boolean success;
        private Integer importedCount;
        private Integer skippedCount;
        private List<String> errors;

        public ConfigImportResult() {
            this.success = true;
            this.importedCount = 0;
            this.skippedCount = 0;
            this.errors = new ArrayList<>();
        }

        // Getters and Setters
        public Boolean getSuccess() { return success; }
        public void setSuccess(Boolean success) { this.success = success; }

        public Integer getImportedCount() { return importedCount; }
        public void setImportedCount(Integer importedCount) { this.importedCount = importedCount; }

        public Integer getSkippedCount() { return skippedCount; }
        public void setSkippedCount(Integer skippedCount) { this.skippedCount = skippedCount; }

        public List<String> getErrors() { return errors; }
        public void setErrors(List<String> errors) { this.errors = errors; }
    }
}