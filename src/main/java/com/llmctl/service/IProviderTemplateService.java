package com.llmctl.service;

import com.llmctl.dto.ProviderTemplateDTO;

import java.util.List;
import java.util.Map;

/**
 * Provider模板服务接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public interface IProviderTemplateService {

    /**
     * 获取所有模板
     *
     * @return 模板DTO列表
     */
    List<ProviderTemplateDTO> getAllTemplates();

    /**
     * 获取活跃的模板
     *
     * @return 活跃模板DTO列表
     */
    List<ProviderTemplateDTO> getActiveTemplates();

    /**
     * 根据类型获取模板
     *
     * @param type Provider类型
     * @return 模板DTO列表
     */
    List<ProviderTemplateDTO> getTemplatesByType(String type);

    /**
     * 根据ID获取模板详情
     *
     * @param id 模板ID
     * @return 模板DTO
     * @throws IllegalArgumentException 如果模板不存在
     */
    ProviderTemplateDTO getTemplateById(String id);

    /**
     * 创建新模板
     *
     * @param request 创建模板请求
     * @return 创建的模板DTO
     */
    ProviderTemplateDTO createTemplate(CreateTemplateRequest request);

    /**
     * 更新模板
     *
     * @param id 模板ID
     * @param request 更新模板请求
     * @return 更新后的模板DTO
     * @throws IllegalArgumentException 如果模板不存在
     */
    ProviderTemplateDTO updateTemplate(String id, UpdateTemplateRequest request);

    /**
     * 删除模板
     *
     * @param id 模板ID
     * @throws IllegalArgumentException 如果模板不存在
     */
    void deleteTemplate(String id);

    /**
     * 根据模板生成Provider配置
     *
     * @param templateId 模板ID
     * @param customValues 自定义值
     * @return Provider配置
     */
    ProviderConfigFromTemplate generateProviderConfig(String templateId, Map<String, Object> customValues);

    /**
     * 获取支持的Provider类型
     *
     * @return 支持的Provider类型列表
     */
    List<String> getSupportedProviderTypes();

    /**
     * 创建模板请求DTO
     */
    class CreateTemplateRequest {
        private String name;
        private String description;
        private String type;
        private String defaultBaseUrl;
        private String defaultModelName;
        private Map<String, Object> envVarsTemplate;
        private Map<String, Object> setupPrompts;
        private Boolean isActive;

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getDefaultBaseUrl() { return defaultBaseUrl; }
        public void setDefaultBaseUrl(String defaultBaseUrl) { this.defaultBaseUrl = defaultBaseUrl; }

        public String getDefaultModelName() { return defaultModelName; }
        public void setDefaultModelName(String defaultModelName) { this.defaultModelName = defaultModelName; }

        public Map<String, Object> getEnvVarsTemplate() { return envVarsTemplate; }
        public void setEnvVarsTemplate(Map<String, Object> envVarsTemplate) { this.envVarsTemplate = envVarsTemplate; }

        public Map<String, Object> getSetupPrompts() { return setupPrompts; }
        public void setSetupPrompts(Map<String, Object> setupPrompts) { this.setupPrompts = setupPrompts; }

        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }

    /**
     * 更新模板请求DTO
     */
    class UpdateTemplateRequest {
        private String name;
        private String description;
        private String defaultBaseUrl;
        private String defaultModelName;
        private Map<String, Object> envVarsTemplate;
        private Map<String, Object> setupPrompts;
        private Boolean isActive;

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getDefaultBaseUrl() { return defaultBaseUrl; }
        public void setDefaultBaseUrl(String defaultBaseUrl) { this.defaultBaseUrl = defaultBaseUrl; }

        public String getDefaultModelName() { return defaultModelName; }
        public void setDefaultModelName(String defaultModelName) { this.defaultModelName = defaultModelName; }

        public Map<String, Object> getEnvVarsTemplate() { return envVarsTemplate; }
        public void setEnvVarsTemplate(Map<String, Object> envVarsTemplate) { this.envVarsTemplate = envVarsTemplate; }

        public Map<String, Object> getSetupPrompts() { return setupPrompts; }
        public void setSetupPrompts(Map<String, Object> setupPrompts) { this.setupPrompts = setupPrompts; }

        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }

    /**
     * 从模板生成的Provider配置
     */
    class ProviderConfigFromTemplate {
        private String name;
        private String description;
        private String type;
        private String baseUrl;
        private String modelName;
        private String token;
        private Map<String, String> environmentVariables;

        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getBaseUrl() { return baseUrl; }
        public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

        public String getModelName() { return modelName; }
        public void setModelName(String modelName) { this.modelName = modelName; }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public Map<String, String> getEnvironmentVariables() { return environmentVariables; }
        public void setEnvironmentVariables(Map<String, String> environmentVariables) { this.environmentVariables = environmentVariables; }
    }
}