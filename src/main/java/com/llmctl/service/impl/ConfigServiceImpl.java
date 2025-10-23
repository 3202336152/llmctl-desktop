package com.llmctl.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.llmctl.dto.*;
import com.llmctl.entity.Provider;
import com.llmctl.entity.ProviderConfig;
import com.llmctl.entity.Token;
import com.llmctl.mapper.ProviderConfigMapper;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.IConfigService;
import com.llmctl.service.IGlobalConfigService;
import com.llmctl.service.ProviderService;
import com.llmctl.service.TokenService;
import com.llmctl.utils.DataUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 配置管理业务服务实现类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConfigServiceImpl implements IConfigService {

    private final IGlobalConfigService globalConfigService;
    private final ProviderService providerService;
    private final TokenService tokenService;
    private final ProviderMapper providerMapper;
    private final ProviderConfigMapper providerConfigMapper;
    private final TokenMapper tokenMapper;
    private final ObjectMapper objectMapper;

    @Override
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

    @Override
    @Transactional
    public void setActiveProvider(String providerId) {
        Long userId = com.llmctl.context.UserContext.getUserId();
        log.info("设置活跃Provider: {}, 用户ID: {}", providerId, userId);

        // 验证Provider是否存在且属于当前用户
        Provider provider = providerMapper.findById(providerId, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + providerId);
        }

        // 验证Provider是否有可用Token
        long availableTokenCount = tokenMapper.countAvailableByProviderId(providerId);
        if (availableTokenCount == 0) {
            log.warn("Provider没有可用Token: {}", providerId);
        }

        globalConfigService.setActiveProviderId(providerId);
        log.info("成功设置活跃Provider: {} ({})", provider.getName(), providerId);
    }

    @Override
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

    @Override
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

        // 如果有错误，标记为部分成功
        if (!result.getErrors().isEmpty()) {
            result.setSuccess(false);
        }

        log.info("配置导入完成: 成功{}, 跳过{}, 错误{}",
                result.getImportedCount(), result.getSkippedCount(), result.getErrors().size());

        return result;
    }

    @Override
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
        Long userId = com.llmctl.context.UserContext.getUserId();
        StringBuilder sb = new StringBuilder();
        sb.append("#!/bin/bash\n");
        sb.append("# LLMctl Configuration Export\n");
        sb.append("# Generated at: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");

        String activeProviderId = globalConfigService.getActiveProviderId();
        if (activeProviderId != null) {
            Provider provider = providerMapper.findById(activeProviderId, userId);
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
        Long userId = com.llmctl.context.UserContext.getUserId();
        StringBuilder sb = new StringBuilder();
        sb.append("# LLMctl Configuration Export\n");
        sb.append("# Generated at: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");

        String activeProviderId = globalConfigService.getActiveProviderId();
        if (activeProviderId != null) {
            Provider provider = providerMapper.findById(activeProviderId, userId);
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
        Long userId = com.llmctl.context.UserContext.getUserId();
        StringBuilder sb = new StringBuilder();
        sb.append("@echo off\n");
        sb.append("REM LLMctl Configuration Export\n");
        sb.append("REM Generated at: ").append(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).append("\n\n");

        String activeProviderId = globalConfigService.getActiveProviderId();
        if (activeProviderId != null) {
            Provider provider = providerMapper.findById(activeProviderId, userId);
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
        Long userId = com.llmctl.context.UserContext.getUserId();
        Map<String, Object> config = new HashMap<>();

        // 导出基本信息
        config.put("exportTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        config.put("version", globalConfigService.getAppVersion());
        config.put("activeProviderId", globalConfigService.getActiveProviderId());

        // 导出所有Provider（仅属于当前用户的）
        List<Provider> providers = providerMapper.findAll(userId);
        List<Map<String, Object>> providerConfigs = new ArrayList<>();

        for (Provider provider : providers) {
            Map<String, Object> providerConfig = new HashMap<>();
            providerConfig.put("id", provider.getId());
            providerConfig.put("name", provider.getName());
            providerConfig.put("description", provider.getDescription());
            providerConfig.put("types", provider.getTypes());
            providerConfig.put("tokenStrategyType", provider.getTokenStrategyType());

            // 导出CLI配置
            List<ProviderConfig> configs = providerConfigMapper.selectByProviderId(provider.getId());
            if (configs != null && !configs.isEmpty()) {
                Map<String, Object> cliConfigs = new HashMap<>();
                for (ProviderConfig providerCliConfig : configs) {
                    Map<String, Object> configData = parseConfigData(providerCliConfig.getConfigData());
                    cliConfigs.put(providerCliConfig.getCliType().getValue() + "Config", configData);
                }
                providerConfig.put("configs", cliConfigs);
            }

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

            // 导入Providers
            if (config.containsKey("providers")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> providers = (List<Map<String, Object>>) config.get("providers");

                for (Map<String, Object> providerConfig : providers) {
                    try {
                        importProviderFromConfig(providerConfig, overwrite, result);
                    } catch (Exception e) {
                        String providerId = (String) providerConfig.get("id");
                        result.getErrors().add("导入Provider失败 [" + providerId + "]: " + e.getMessage());
                        log.error("导入Provider失败: {}", providerId, e);
                    }
                }
            }

            // 导入活跃Provider设置
            if (config.containsKey("activeProviderId")) {
                Long userId = com.llmctl.context.UserContext.getUserId();
                String activeProviderId = (String) config.get("activeProviderId");
                if (activeProviderId != null) {
                    Provider provider = providerMapper.findById(activeProviderId, userId);
                    if (provider != null) {
                        globalConfigService.setActiveProviderId(activeProviderId);
                        result.setImportedCount(result.getImportedCount() + 1);
                        log.info("成功设置活跃Provider: {}", activeProviderId);
                    } else {
                        result.getErrors().add("活跃Provider不存在或无权访问: " + activeProviderId);
                    }
                }
            }

        } catch (Exception e) {
            result.getErrors().add("JSON解析失败: " + e.getMessage());
            log.error("JSON解析失败", e);
        }
    }

    /**
     * 从配置导入单个Provider
     */
    @SuppressWarnings("unchecked")
    private void importProviderFromConfig(Map<String, Object> providerConfig, Boolean overwrite, ConfigImportResult result) {
        Long userId = com.llmctl.context.UserContext.getUserId();
        String providerId = (String) providerConfig.get("id");
        String name = (String) providerConfig.get("name");
        Object typesObj = providerConfig.get("types");

        // 兼容旧格式（单个type字段）和新格式（types数组）
        List<String> types = new ArrayList<>();
        if (typesObj instanceof List) {
            types = (List<String>) typesObj;
        } else if (typesObj instanceof String) {
            // 兼容旧版本单个type
            types.add((String) typesObj);
        }

        // 验证必需字段
        if (DataUtils.isEmpty(providerId) || DataUtils.isEmpty(name) || types.isEmpty()) {
            result.getErrors().add("Provider配置缺少必需字段: id, name, types");
            return;
        }

        Provider existingProvider = providerMapper.findById(providerId, userId);

        // 如果Provider已存在
        if (existingProvider != null) {
            if (!overwrite) {
                result.setSkippedCount(result.getSkippedCount() + 1);
                log.info("跳过已存在的Provider: {} ({})", name, providerId);
                return;
            }

            // 更新现有Provider
            UpdateProviderRequest updateRequest = new UpdateProviderRequest();
            updateRequest.setName(name);
            updateRequest.setDescription((String) providerConfig.get("description"));
            updateRequest.setTypes(types);

            // 从 configs 中提取 CLI 配置
            if (providerConfig.containsKey("configs")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> configs = (Map<String, Object>) providerConfig.get("configs");

                if (configs.containsKey("claudeConfig")) {
                    updateRequest.setClaudeConfig((Map<String, Object>) configs.get("claudeConfig"));
                }
                if (configs.containsKey("codexConfig")) {
                    updateRequest.setCodexConfig((Map<String, Object>) configs.get("codexConfig"));
                }
                if (configs.containsKey("geminiConfig")) {
                    updateRequest.setGeminiConfig((Map<String, Object>) configs.get("geminiConfig"));
                }
                if (configs.containsKey("qoderConfig")) {
                    updateRequest.setQoderConfig((Map<String, Object>) configs.get("qoderConfig"));
                }
            }

            try {
                providerService.updateProvider(providerId, updateRequest);
                result.setImportedCount(result.getImportedCount() + 1);
                log.info("成功更新Provider: {} ({})", name, providerId);
            } catch (Exception e) {
                result.getErrors().add("更新Provider失败 [" + name + "]: " + e.getMessage());
                log.error("更新Provider失败: {}", providerId, e);
            }

        } else {
            // 创建新Provider
            CreateProviderRequest createRequest = new CreateProviderRequest();
            createRequest.setName(name);
            createRequest.setDescription((String) providerConfig.get("description"));
            createRequest.setTypes(types);

            // 从 configs 中提取 CLI 配置
            if (providerConfig.containsKey("configs")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> configs = (Map<String, Object>) providerConfig.get("configs");

                if (configs.containsKey("claudeConfig")) {
                    createRequest.setClaudeConfig((Map<String, Object>) configs.get("claudeConfig"));
                }
                if (configs.containsKey("codexConfig")) {
                    createRequest.setCodexConfig((Map<String, Object>) configs.get("codexConfig"));
                }
                if (configs.containsKey("geminiConfig")) {
                    createRequest.setGeminiConfig((Map<String, Object>) configs.get("geminiConfig"));
                }
                if (configs.containsKey("qoderConfig")) {
                    createRequest.setQoderConfig((Map<String, Object>) configs.get("qoderConfig"));
                }
            }

            String tokenStrategyType = (String) providerConfig.get("tokenStrategyType");
            createRequest.setTokenStrategyType(tokenStrategyType != null ? tokenStrategyType : "round-robin");

            // 处理第一个Token（注意：新版本不再有 setToken 和 setTokenAlias 方法，这部分逻辑需要单独处理Token）
            /*
            String firstTokenValue = "PLACEHOLDER_TOKEN_PLEASE_UPDATE";
            String firstTokenAlias = "导入的占位符Token";

            if (providerConfig.containsKey("tokens")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> tokens = (List<Map<String, Object>>) providerConfig.get("tokens");
                if (!tokens.isEmpty()) {
                    Map<String, Object> firstToken = tokens.get(0);
                    String tokenValue = (String) firstToken.get("value");
                    if (tokenValue != null && !tokenValue.isEmpty()) {
                        firstTokenValue = tokenValue;
                        firstTokenAlias = (String) firstToken.getOrDefault("alias", "Token-1");
                    }
                }
            }
            */

            try {
                ProviderDTO createdProvider = providerService.createProvider(createRequest);
                result.setImportedCount(result.getImportedCount() + 1);

                log.info("成功创建Provider: {} ({})", name, createdProvider.getId());

                // 导入Token配置 - 使用实际创建的Provider ID
                if (providerConfig.containsKey("tokens")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> tokens = (List<Map<String, Object>>) providerConfig.get("tokens");

                    // 导入所有Token
                    for (Map<String, Object> tokenConfig : tokens) {
                        importTokenForProvider(createdProvider.getId(), tokenConfig, result);
                    }
                }

            } catch (Exception e) {
                result.getErrors().add("创建Provider失败 [" + name + "]: " + e.getMessage());
                log.error("创建Provider失败: {}", name, e);
            }
        }
    }

    /**
     * 为Provider导入Token配置
     */
    private void importTokenForProvider(String providerId, Map<String, Object> tokenConfig, ConfigImportResult result) {
        try {
            CreateTokenRequest tokenRequest = new CreateTokenRequest();

            // 如果配置中有真实的token值，使用真实值；否则使用占位符
            String tokenValue = (String) tokenConfig.get("value");
            if (tokenValue != null && !tokenValue.isEmpty()) {
                tokenRequest.setValue(tokenValue);
            } else {
                tokenRequest.setValue("PLACEHOLDER_TOKEN_PLEASE_UPDATE");
                result.getWarnings().add("Token [" + tokenConfig.get("alias") + "] 未提供值，使用占位符");
            }

            tokenRequest.setAlias((String) tokenConfig.get("alias"));
            tokenRequest.setWeight((Integer) tokenConfig.getOrDefault("weight", 1));
            tokenRequest.setEnabled((Boolean) tokenConfig.getOrDefault("enabled", true));

            tokenService.createToken(providerId, tokenRequest);
            log.info("为Provider {} 导入Token配置: {}", providerId, tokenRequest.getAlias());

        } catch (Exception e) {
            log.warn("为Provider {} 导入Token配置失败: {}", providerId, e.getMessage());
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
            Long userId = com.llmctl.context.UserContext.getUserId();
            if (providerMapper.findById(value, userId) != null) {
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
        Long userId = com.llmctl.context.UserContext.getUserId();
        Provider provider = providerMapper.findById(providerId, userId);
        if (provider == null) {
            response.getErrors().add("Provider不存在或无权访问: " + providerId);
            return;
        }

        // 验证Provider基本信息
        if (DataUtils.isEmpty(provider.getName())) {
            response.getErrors().add("Provider名称不能为空");
        }

        if (provider.getTypes() == null || provider.getTypes().isEmpty()) {
            response.getErrors().add("Provider类型列表不能为空");
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
        Long userId = com.llmctl.context.UserContext.getUserId();
        List<Provider> providers = providerMapper.findAll(userId);

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
        Long userId = com.llmctl.context.UserContext.getUserId();
        String activeProviderId = globalConfigService.getActiveProviderId();
        if (activeProviderId == null) {
            response.getWarnings().add("没有设置活跃Provider");
        } else if (providerMapper.findById(activeProviderId, userId) == null) {
            response.getErrors().add("活跃Provider不存在或无权访问: " + activeProviderId);
        }
    }

    /**
     * 构建环境变量（为所有支持的CLI类型设置环境变量）
     */
    private Map<String, String> buildEnvironmentVariables(Provider provider, Token token) {
        Map<String, String> envVars = new HashMap<>();
        String tokenValue = token.getValue(); // 这里应该解密Token值

        // 为所有支持的CLI类型设置环境变量
        for (String type : provider.getTypes()) {
            // 查找对应的配置
            ProviderConfig config = findConfigByType(provider, type);
            if (config == null) {
                log.warn("Provider {} 的类型 {} 没有配置数据，跳过环境变量设置", provider.getId(), type);
                continue;
            }

            Map<String, Object> configData = parseConfigData(config.getConfigData());

            switch (type.toLowerCase()) {
                case "claude code":
                    envVars.put("ANTHROPIC_AUTH_TOKEN", tokenValue);
                    if (configData.get("baseUrl") != null) {
                        envVars.put("ANTHROPIC_BASE_URL", configData.get("baseUrl").toString());
                    }
                    if (configData.get("modelName") != null) {
                        envVars.put("ANTHROPIC_MODEL", configData.get("modelName").toString());
                    }
                    if (configData.get("maxTokens") != null) {
                        envVars.put("CLAUDE_CODE_MAX_OUTPUT_TOKENS", configData.get("maxTokens").toString());
                    }
                    break;

                case "codex":
                    envVars.put("CODEX_API_KEY", tokenValue);
                    if (configData.get("baseUrl") != null) {
                        envVars.put("CODEX_BASE_URL", configData.get("baseUrl").toString());
                    }
                    if (configData.get("modelName") != null) {
                        envVars.put("CODEX_MODEL", configData.get("modelName").toString());
                    }
                    if (configData.get("maxTokens") != null) {
                        envVars.put("CODEX_MAX_TOKENS", configData.get("maxTokens").toString());
                    }
                    break;

                case "gemini":
                    envVars.put("GEMINI_API_KEY", tokenValue);
                    if (configData.get("baseUrl") != null) {
                        envVars.put("GEMINI_BASE_URL", configData.get("baseUrl").toString());
                    }
                    if (configData.get("modelName") != null) {
                        envVars.put("GEMINI_MODEL", configData.get("modelName").toString());
                    }
                    if (configData.get("maxTokens") != null) {
                        envVars.put("GEMINI_MAX_TOKENS", configData.get("maxTokens").toString());
                    }
                    break;

                case "qoder":
                    envVars.put("QODER_API_KEY", tokenValue);
                    if (configData.get("baseUrl") != null) {
                        envVars.put("QODER_BASE_URL", configData.get("baseUrl").toString());
                    }
                    if (configData.get("modelName") != null) {
                        envVars.put("QODER_MODEL", configData.get("modelName").toString());
                    }
                    if (configData.get("maxTokens") != null) {
                        envVars.put("QODER_MAX_TOKENS", configData.get("maxTokens").toString());
                    }
                    break;
            }
        }

        return envVars;
    }

    /**
     * 从Provider的configs中查找指定类型的配置
     *
     * @param provider Provider对象
     * @param type CLI类型名称
     * @return ProviderConfig对象，如果找不到则返回null
     */
    private ProviderConfig findConfigByType(Provider provider, String type) {
        if (provider.getConfigs() == null || provider.getConfigs().isEmpty()) {
            // 如果 Provider 对象中没有加载 configs，尝试从数据库查询
            List<ProviderConfig> configs = providerConfigMapper.selectByProviderId(provider.getId());
            if (configs == null || configs.isEmpty()) {
                return null;
            }
            provider.setConfigs(configs);
        }

        // 根据类型名称查找对应的配置
        String normalizedType = type.toLowerCase().replace(" ", "");
        return provider.getConfigs().stream()
                .filter(config -> {
                    String configType = config.getCliType().getValue();
                    return configType.equalsIgnoreCase(normalizedType);
                })
                .findFirst()
                .orElse(null);
    }

    /**
     * 解析配置数据JSON字符串为Map
     *
     * @param configDataJson JSON字符串
     * @return 配置数据Map
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseConfigData(String configDataJson) {
        if (configDataJson == null || configDataJson.trim().isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(configDataJson, Map.class);
        } catch (Exception e) {
            log.error("解析配置数据失败: {}", configDataJson, e);
            return new HashMap<>();
        }
    }
}