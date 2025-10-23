package com.llmctl.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.llmctl.context.UserContext;
import com.llmctl.dto.*;
import com.llmctl.entity.Provider;
import com.llmctl.entity.ProviderConfig;
import com.llmctl.entity.Token;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.ProviderConfigMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.ProviderService;
import com.llmctl.service.TokenService;
import com.llmctl.exception.ServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Provider业务服务实现类（配置分离版）
 *
 * @author Liu Yifan
 * @version 2.3.0
 * @since 2025-01-15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderServiceImpl implements ProviderService {

    private final ProviderMapper providerMapper;
    private final ProviderConfigMapper providerConfigMapper;
    private final TokenMapper tokenMapper;
    private final TokenService tokenService;
    private final ObjectMapper objectMapper;

    @Override
    public List<ProviderDTO> getAllProviders() {
        Long userId = UserContext.getUserId();
        log.debug("获取所有Provider列表, 用户ID: {}", userId);

        // 使用关联查询一次获取完整数据
        List<Provider> providers = providerMapper.findAllWithConfigs(userId);
        return providers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProviderDTO getProviderById(String id) {
        Long userId = UserContext.getUserId();
        log.debug("根据ID获取Provider详情: {}, 用户ID: {}", id, userId);

        // 使用关联查询获取Provider及其configs
        Provider provider = providerMapper.findByIdWithConfigs(id, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + id);
        }

        return convertToDTO(provider);
    }

    @Override
    public List<ProviderDTO> getProvidersByType(String type) {
        Long userId = UserContext.getUserId();
        log.debug("根据类型获取Provider列表: {}, 用户ID: {}", type, userId);

        // 注意：findByType 只返回包含该type的Provider，但不加载configs
        // 如果需要configs，需要再查询一次或修改SQL
        List<Provider> providers = providerMapper.findByType(type, userId);

        // 为每个Provider加载configs
        for (Provider provider : providers) {
            List<ProviderConfig> configs = providerConfigMapper.selectByProviderId(provider.getId());
            provider.setConfigs(configs);
        }

        return providers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProviderDTO createProvider(CreateProviderRequest request) {
        Long userId = UserContext.getUserId();
        log.info("创建新的Provider: {}, 用户ID: {}", request.getName(), userId);

        // 检查名称是否已存在（同一用户下）
        if (providerMapper.existsByName(request.getName(), userId)) {
            throw new IllegalArgumentException("Provider名称已存在: " + request.getName());
        }

        // 1. 创建Provider实体（核心信息）
        Provider provider = new Provider();
        provider.setId(generateProviderId());
        provider.setUserId(userId);
        provider.setName(request.getName());
        provider.setDescription(request.getDescription());
        provider.setTypes(request.getTypes());
        provider.setExtraHeaders(request.getExtraHeaders());

        // 设置Token策略
        if (StringUtils.hasText(request.getTokenStrategyType())) {
            provider.setTokenStrategyType(Provider.TokenStrategyType.fromValue(request.getTokenStrategyType()));
        } else {
            provider.setTokenStrategyType(Provider.TokenStrategyType.ROUND_ROBIN);
        }
        provider.setTokenFallbackOnError(request.getTokenFallbackOnError() != null ? request.getTokenFallbackOnError() : true);

        // 设置启用状态，默认为true
        provider.setIsActive(true);

        // 设置时间戳
        LocalDateTime now = LocalDateTime.now();
        provider.setCreatedAt(now);
        provider.setUpdatedAt(now);

        // 保存Provider
        int result = providerMapper.insert(provider);
        if (result <= 0) {
            throw new ServiceException("创建Provider", "数据库插入失败");
        }

        // 2. 创建CLI配置
        List<ProviderConfig> configs = new ArrayList<>();
        for (String type : request.getTypes()) {
            ProviderConfig config = new ProviderConfig();
            config.setProviderId(provider.getId());

            // 根据类型设置配置数据
            if ("claude code".equals(type) && request.getClaudeConfig() != null) {
                config.setCliType(ProviderConfig.CliType.CLAUDE);
                config.setConfigData(toJson(request.getClaudeConfig()));
                providerConfigMapper.insert(config);
                configs.add(config);
            } else if ("codex".equals(type) && request.getCodexConfig() != null) {
                config.setCliType(ProviderConfig.CliType.CODEX);
                config.setConfigData(toJson(request.getCodexConfig()));
                providerConfigMapper.insert(config);
                configs.add(config);
            } else if ("gemini".equals(type) && request.getGeminiConfig() != null) {
                config.setCliType(ProviderConfig.CliType.GEMINI);
                config.setConfigData(toJson(request.getGeminiConfig()));
                providerConfigMapper.insert(config);
                configs.add(config);
            } else if ("qoder".equals(type) && request.getQoderConfig() != null) {
                config.setCliType(ProviderConfig.CliType.QODER);
                config.setConfigData(toJson(request.getQoderConfig()));
                providerConfigMapper.insert(config);
                configs.add(config);
            } else {
                log.warn("Provider类型 {} 未提供配置数据，跳过创建配置", type);
            }
        }
        provider.setConfigs(configs);

        // 3. 创建初始Token
        CreateTokenRequest tokenRequest = new CreateTokenRequest();
        tokenRequest.setValue(request.getToken());
        tokenRequest.setAlias(request.getTokenAlias() != null ? request.getTokenAlias() : "默认Token");
        tokenRequest.setWeight(1);
        tokenRequest.setEnabled(true);

        try {
            tokenService.createToken(provider.getId(), tokenRequest);
            log.info("成功为Provider {} 创建初始Token", provider.getId());
        } catch (Exception e) {
            log.error("为Provider {} 创建Token失败", provider.getId(), e);
            throw new ServiceException("创建Token", "Token创建失败: " + e.getMessage());
        }

        log.info("成功创建Provider: {} (ID: {}), 配置数: {}", provider.getName(), provider.getId(), configs.size());
        return convertToDTO(provider);
    }

    @Override
    @Transactional
    public ProviderDTO updateProvider(String id, UpdateProviderRequest request) {
        Long userId = UserContext.getUserId();
        log.info("更新Provider: {} (ID: {}), 用户ID: {}", request.getName(), id, userId);

        // 检查Provider是否存在且属于当前用户
        Provider existingProvider = providerMapper.findById(id, userId);
        if (existingProvider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + id);
        }

        // 检查名称是否冲突（同一用户下）
        if (StringUtils.hasText(request.getName()) &&
            !request.getName().equals(existingProvider.getName()) &&
            providerMapper.existsByNameAndIdNot(request.getName(), id, userId)) {
            throw new IllegalArgumentException("Provider名称已存在: " + request.getName());
        }

        // 1. 更新Provider核心字段
        if (StringUtils.hasText(request.getName())) {
            existingProvider.setName(request.getName());
        }
        if (request.getDescription() != null) {
            existingProvider.setDescription(request.getDescription());
        }
        if (request.getTypes() != null && !request.getTypes().isEmpty()) {
            existingProvider.setTypes(request.getTypes());
        }
        if (request.getExtraHeaders() != null) {
            existingProvider.setExtraHeaders(request.getExtraHeaders());
        }
        if (StringUtils.hasText(request.getTokenStrategyType())) {
            existingProvider.setTokenStrategyType(Provider.TokenStrategyType.fromValue(request.getTokenStrategyType()));
        }
        if (request.getTokenFallbackOnError() != null) {
            existingProvider.setTokenFallbackOnError(request.getTokenFallbackOnError());
        }
        if (request.getIsActive() != null) {
            existingProvider.setIsActive(request.getIsActive());
        }

        existingProvider.setUpdatedAt(LocalDateTime.now());

        // 保存Provider更新
        int result = providerMapper.update(existingProvider);
        if (result <= 0) {
            throw new ServiceException("更新Provider", "数据库更新失败");
        }

        // 2. 更新CLI配置
        // 方式1：删除旧配置，插入新配置（简单直接）
        if (request.getTypes() != null && !request.getTypes().isEmpty()) {
            providerConfigMapper.deleteByProviderId(id);

            List<ProviderConfig> newConfigs = new ArrayList<>();
            for (String type : request.getTypes()) {
                ProviderConfig config = new ProviderConfig();
                config.setProviderId(id);

                if ("claude code".equals(type) && request.getClaudeConfig() != null) {
                    config.setCliType(ProviderConfig.CliType.CLAUDE);
                    config.setConfigData(toJson(request.getClaudeConfig()));
                    providerConfigMapper.insert(config);
                    newConfigs.add(config);
                } else if ("codex".equals(type) && request.getCodexConfig() != null) {
                    config.setCliType(ProviderConfig.CliType.CODEX);
                    config.setConfigData(toJson(request.getCodexConfig()));
                    providerConfigMapper.insert(config);
                    newConfigs.add(config);
                } else if ("gemini".equals(type) && request.getGeminiConfig() != null) {
                    config.setCliType(ProviderConfig.CliType.GEMINI);
                    config.setConfigData(toJson(request.getGeminiConfig()));
                    providerConfigMapper.insert(config);
                    newConfigs.add(config);
                } else if ("qoder".equals(type) && request.getQoderConfig() != null) {
                    config.setCliType(ProviderConfig.CliType.QODER);
                    config.setConfigData(toJson(request.getQoderConfig()));
                    providerConfigMapper.insert(config);
                    newConfigs.add(config);
                }
            }
            existingProvider.setConfigs(newConfigs);
        }

        log.info("成功更新Provider: {} (ID: {})", existingProvider.getName(), id);
        return convertToDTO(existingProvider);
    }

    @Override
    @Transactional
    public void deleteProvider(String id) {
        Long userId = UserContext.getUserId();
        log.info("删除Provider: {}, 用户ID: {}", id, userId);

        // 检查Provider是否存在且属于当前用户
        Provider provider = providerMapper.findById(id, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + id);
        }

        // 删除Provider（provider_configs 表的记录会通过 ON DELETE CASCADE 自动删除）
        int result = providerMapper.deleteById(id, userId);
        if (result <= 0) {
            throw new ServiceException("删除Provider", "数据库删除失败");
        }

        log.info("成功删除Provider: {} (ID: {})", provider.getName(), id);
    }

    @Override
    public boolean isProviderNameAvailable(String name, String excludeId) {
        Long userId = UserContext.getUserId();
        if (excludeId != null) {
            return !providerMapper.existsByNameAndIdNot(name, excludeId, userId);
        } else {
            return !providerMapper.existsByName(name, userId);
        }
    }

    @Override
    public long countProviders() {
        Long userId = UserContext.getUserId();
        return providerMapper.count(userId);
    }

    @Override
    public long countProvidersByType(String type) {
        Long userId = UserContext.getUserId();
        return providerMapper.countByType(type, userId);
    }

    @Override
    @Transactional
    public ProviderDTO updateTokenStrategy(String id, UpdateTokenStrategyRequest request) {
        Long userId = UserContext.getUserId();
        log.info("更新Provider的Token策略: ID={}, 策略类型={}, 故障切换={}",
                 id, request.getType(), request.getFallbackOnError());

        // 检查Provider是否存在且属于当前用户
        Provider existingProvider = providerMapper.findById(id, userId);
        if (existingProvider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + id);
        }

        // 更新Token策略
        existingProvider.setTokenStrategyType(Provider.TokenStrategyType.fromValue(request.getType()));
        existingProvider.setTokenFallbackOnError(request.getFallbackOnError());
        existingProvider.setUpdatedAt(LocalDateTime.now());

        // 保存更新
        int result = providerMapper.update(existingProvider);
        if (result <= 0) {
            throw new ServiceException("更新Token策略", "数据库更新失败");
        }

        log.info("成功更新Provider的Token策略: {} (ID: {}), 策略={}, 故障切换={}",
                 existingProvider.getName(), id, request.getType(), request.getFallbackOnError());
        return convertToDTO(existingProvider);
    }

    /**
     * 将Provider实体转换为DTO
     *
     * @param provider Provider实体
     * @return Provider DTO
     */
    private ProviderDTO convertToDTO(Provider provider) {
        if (provider == null) {
            return null;
        }

        ProviderDTO dto = new ProviderDTO();
        dto.setId(provider.getId());
        dto.setName(provider.getName());
        dto.setDescription(provider.getDescription());
        dto.setTypes(provider.getTypes());
        dto.setExtraHeaders(provider.getExtraHeaders());
        dto.setIsActive(provider.getIsActive());
        dto.setCreatedAt(provider.getCreatedAt());
        dto.setUpdatedAt(provider.getUpdatedAt());

        // 设置Token策略
        ProviderDTO.TokenStrategyDTO tokenStrategy = new ProviderDTO.TokenStrategyDTO();
        tokenStrategy.setType(provider.getTokenStrategyType() != null ? provider.getTokenStrategyType().getValue() : "round-robin");
        tokenStrategy.setFallbackOnError(provider.getTokenFallbackOnError());
        dto.setTokenStrategy(tokenStrategy);

        // 转换CLI配置
        if (provider.getConfigs() != null && !provider.getConfigs().isEmpty()) {
            List<ProviderDTO.CliConfigDTO> configDTOs = provider.getConfigs().stream()
                    .map(this::convertConfigToDTO)
                    .collect(Collectors.toList());
            dto.setConfigs(configDTOs);
        }

        // 获取关联的Token列表
        List<Token> tokens = tokenMapper.findByProviderId(provider.getId());
        if (tokens != null && !tokens.isEmpty()) {
            List<TokenDTO> tokenDTOs = tokens.stream()
                    .map(tokenService::convertToDTO)
                    .collect(Collectors.toList());
            dto.setTokens(tokenDTOs);
        }

        return dto;
    }

    /**
     * 将ProviderConfig实体转换为DTO
     *
     * @param config ProviderConfig实体
     * @return CliConfigDTO
     */
    private ProviderDTO.CliConfigDTO convertConfigToDTO(ProviderConfig config) {
        if (config == null) {
            return null;
        }

        ProviderDTO.CliConfigDTO dto = new ProviderDTO.CliConfigDTO();
        dto.setId(config.getId());
        dto.setCliType(config.getCliType() != null ? config.getCliType().getValue() : null);
        dto.setConfigData(parseJson(config.getConfigData()));
        dto.setCreatedAt(config.getCreatedAt());
        dto.setUpdatedAt(config.getUpdatedAt());
        return dto;
    }

    /**
     * 将Map转换为JSON字符串
     *
     * @param map Map对象
     * @return JSON字符串
     */
    private String toJson(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(map);
        } catch (JsonProcessingException e) {
            log.error("JSON序列化失败", e);
            throw new ServiceException("JSON序列化", "将配置数据转换为JSON失败: " + e.getMessage());
        }
    }

    /**
     * 将JSON字符串解析为Map
     *
     * @param json JSON字符串
     * @return Map对象
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String json) {
        if (!StringUtils.hasText(json)) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            log.error("JSON反序列化失败", e);
            return new HashMap<>();
        }
    }

    /**
     * 生成Provider ID
     *
     * @return 新的Provider ID
     */
    private String generateProviderId() {
        return "provider_" + UUID.randomUUID().toString().replace("-", "");
    }
}
