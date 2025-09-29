package com.llmctl.service.impl;

import com.llmctl.dto.ProviderTemplateDTO;
import com.llmctl.entity.ProviderTemplate;
import com.llmctl.mapper.ProviderTemplateMapper;
import com.llmctl.service.IProviderTemplateService;
import com.llmctl.utils.DataUtils;
import com.llmctl.utils.IdGenerator;
import com.llmctl.exception.ServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Provider模板业务服务实现类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderTemplateServiceImpl implements IProviderTemplateService {

    private final ProviderTemplateMapper providerTemplateMapper;

    @Override
    public List<ProviderTemplateDTO> getAllTemplates() {
        log.debug("获取所有Provider模板");

        List<ProviderTemplate> templates = providerTemplateMapper.findAll();
        return templates.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProviderTemplateDTO> getActiveTemplates() {
        log.debug("获取活跃的Provider模板");

        List<ProviderTemplate> templates = providerTemplateMapper.findActive();
        return templates.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProviderTemplateDTO> getTemplatesByType(String type) {
        log.debug("根据类型获取Provider模板: {}", type);

        List<ProviderTemplate> templates = providerTemplateMapper.findByType(type);
        return templates.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProviderTemplateDTO getTemplateById(String id) {
        log.debug("根据ID获取Provider模板详情: {}", id);

        ProviderTemplate template = providerTemplateMapper.findById(id);
        if (template == null) {
            throw new IllegalArgumentException("Provider模板不存在: " + id);
        }

        return convertToDTO(template);
    }

    @Override
    @Transactional
    public ProviderTemplateDTO createTemplate(CreateTemplateRequest request) {
        log.info("创建新的Provider模板: {}", request.getName());

        ProviderTemplate template = new ProviderTemplate();
        template.setId(IdGenerator.generateTemplateId());
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setType(request.getType());
        template.setDefaultBaseUrl(request.getDefaultBaseUrl());
        template.setDefaultModelName(request.getDefaultModelName());

        // 设置环境变量模板
        if (request.getEnvVarsTemplate() != null) {
            template.setEnvVarsTemplate(DataUtils.toJson(request.getEnvVarsTemplate()));
        }

        // 设置配置提示
        if (request.getSetupPrompts() != null) {
            template.setSetupPrompts(DataUtils.toJson(request.getSetupPrompts()));
        }

        template.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        // 设置时间戳
        LocalDateTime now = LocalDateTime.now();
        template.setCreatedAt(now);
        template.setUpdatedAt(now);

        // 保存模板
        int result = providerTemplateMapper.insert(template);
        if (result <= 0) {
            throw new ServiceException("创建Provider模板", "数据库插入失败");
        }

        log.info("成功创建Provider模板: {} (ID: {})", template.getName(), template.getId());
        return convertToDTO(template);
    }

    @Override
    @Transactional
    public ProviderTemplateDTO updateTemplate(String id, UpdateTemplateRequest request) {
        log.info("更新Provider模板: {} (ID: {})", request.getName(), id);

        // 检查模板是否存在
        ProviderTemplate existingTemplate = providerTemplateMapper.findById(id);
        if (existingTemplate == null) {
            throw new IllegalArgumentException("Provider模板不存在: " + id);
        }

        // 更新字段
        if (DataUtils.isNotEmpty(request.getName())) {
            existingTemplate.setName(request.getName());
        }
        if (request.getDescription() != null) {
            existingTemplate.setDescription(request.getDescription());
        }
        if (DataUtils.isNotEmpty(request.getDefaultBaseUrl())) {
            existingTemplate.setDefaultBaseUrl(request.getDefaultBaseUrl());
        }
        if (DataUtils.isNotEmpty(request.getDefaultModelName())) {
            existingTemplate.setDefaultModelName(request.getDefaultModelName());
        }
        if (request.getEnvVarsTemplate() != null) {
            existingTemplate.setEnvVarsTemplate(DataUtils.toJson(request.getEnvVarsTemplate()));
        }
        if (request.getSetupPrompts() != null) {
            existingTemplate.setSetupPrompts(DataUtils.toJson(request.getSetupPrompts()));
        }
        if (request.getIsActive() != null) {
            existingTemplate.setIsActive(request.getIsActive());
        }

        existingTemplate.setUpdatedAt(LocalDateTime.now());

        // 保存更新
        int result = providerTemplateMapper.update(existingTemplate);
        if (result <= 0) {
            throw new ServiceException("更新Provider模板", "数据库更新失败");
        }

        log.info("成功更新Provider模板: {} (ID: {})", existingTemplate.getName(), id);
        return convertToDTO(existingTemplate);
    }

    @Override
    @Transactional
    public void deleteTemplate(String id) {
        log.info("删除Provider模板: {}", id);

        // 检查模板是否存在
        ProviderTemplate template = providerTemplateMapper.findById(id);
        if (template == null) {
            throw new IllegalArgumentException("Provider模板不存在: " + id);
        }

        // 删除模板
        int result = providerTemplateMapper.deleteById(id);
        if (result <= 0) {
            throw new ServiceException("删除Provider模板", "数据库删除失败");
        }

        log.info("成功删除Provider模板: {} (ID: {})", template.getName(), id);
    }

    @Override
    public ProviderConfigFromTemplate generateProviderConfig(String templateId, Map<String, Object> customValues) {
        log.info("根据模板生成Provider配置: {}", templateId);

        ProviderTemplate template = providerTemplateMapper.findById(templateId);
        if (template == null) {
            throw new IllegalArgumentException("Provider模板不存在: " + templateId);
        }

        if (!template.isAvailable()) {
            throw new IllegalArgumentException("Provider模板不可用: " + templateId);
        }

        ProviderConfigFromTemplate config = new ProviderConfigFromTemplate();
        config.setType(template.getType());
        config.setBaseUrl(template.getDefaultBaseUrl());
        config.setModelName(template.getDefaultModelName());

        // 应用自定义值
        if (customValues != null) {
            if (customValues.containsKey("name")) {
                config.setName((String) customValues.get("name"));
            }
            if (customValues.containsKey("description")) {
                config.setDescription((String) customValues.get("description"));
            }
            if (customValues.containsKey("baseUrl")) {
                config.setBaseUrl((String) customValues.get("baseUrl"));
            }
            if (customValues.containsKey("modelName")) {
                config.setModelName((String) customValues.get("modelName"));
            }
            if (customValues.containsKey("token")) {
                config.setToken((String) customValues.get("token"));
            }
        }

        // 生成环境变量
        Map<String, Object> envVarsTemplate = DataUtils.jsonToMap(template.getEnvVarsTemplate());
        if (envVarsTemplate != null && config.getToken() != null) {
            Map<String, String> envVars = envVarsTemplate.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            entry -> replaceTemplatePlaceholders((String) entry.getValue(), config)
                    ));
            config.setEnvironmentVariables(envVars);
        }

        return config;
    }

    @Override
    public List<String> getSupportedProviderTypes() {
        return List.of(
                ProviderTemplate.ProviderTypes.ANTHROPIC,
                ProviderTemplate.ProviderTypes.OPENAI,
                ProviderTemplate.ProviderTypes.QWEN,
                ProviderTemplate.ProviderTypes.GEMINI
        );
    }

    /**
     * 替换模板占位符
     */
    private String replaceTemplatePlaceholders(String template, ProviderConfigFromTemplate config) {
        String result = template;
        if (config.getToken() != null) {
            result = result.replace("{token}", config.getToken());
        }
        if (config.getBaseUrl() != null) {
            result = result.replace("{baseUrl}", config.getBaseUrl());
        }
        if (config.getModelName() != null) {
            result = result.replace("{modelName}", config.getModelName());
        }
        return result;
    }

    /**
     * 将ProviderTemplate实体转换为DTO
     */
    private ProviderTemplateDTO convertToDTO(ProviderTemplate template) {
        if (template == null) {
            return null;
        }

        ProviderTemplateDTO dto = new ProviderTemplateDTO();
        dto.setId(template.getId());
        dto.setName(template.getName());
        dto.setDescription(template.getDescription());
        dto.setType(template.getType());
        dto.setDefaultBaseUrl(template.getDefaultBaseUrl());
        dto.setDefaultModelName(template.getDefaultModelName());
        dto.setIsActive(template.getIsActive());
        dto.setCreatedAt(template.getCreatedAt());
        dto.setUpdatedAt(template.getUpdatedAt());

        // 解析JSON字段
        if (DataUtils.isNotEmpty(template.getEnvVarsTemplate())) {
            dto.setEnvVarsTemplate(DataUtils.jsonToMap(template.getEnvVarsTemplate()));
        }

        if (DataUtils.isNotEmpty(template.getSetupPrompts())) {
            dto.setSetupPrompts(DataUtils.jsonToMap(template.getSetupPrompts()));
        }

        return dto;
    }
}