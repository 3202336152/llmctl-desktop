package com.llmctl.service.impl;

import com.llmctl.dto.*;
import com.llmctl.entity.Provider;
import com.llmctl.entity.Token;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.ProviderService;
import com.llmctl.service.TokenService;
import com.llmctl.exception.ServiceException;
import com.llmctl.exception.ResourceNotFoundException;
import com.llmctl.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Provider业务服务实现类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderServiceImpl implements ProviderService {

    private final ProviderMapper providerMapper;
    private final TokenMapper tokenMapper;
    private final TokenService tokenService;

    @Override
    public List<ProviderDTO> getAllProviders() {
        log.debug("获取所有Provider列表");

        List<Provider> providers = providerMapper.findAll();
        return providers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProviderDTO getProviderById(String id) {
        log.debug("根据ID获取Provider详情: {}", id);

        Provider provider = providerMapper.findById(id);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在: " + id);
        }

        return convertToDTO(provider);
    }

    @Override
    public List<ProviderDTO> getProvidersByType(String type) {
        log.debug("根据类型获取Provider列表: {}", type);

        List<Provider> providers = providerMapper.findByType(type);
        return providers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProviderDTO createProvider(CreateProviderRequest request) {
        log.info("创建新的Provider: {}", request.getName());

        // 检查名称是否已存在
        if (providerMapper.existsByName(request.getName())) {
            throw new IllegalArgumentException("Provider名称已存在: " + request.getName());
        }

        // 创建Provider实体
        Provider provider = new Provider();
        provider.setId(generateProviderId());
        provider.setName(request.getName());
        provider.setDescription(request.getDescription());
        provider.setType(request.getType());
        provider.setBaseUrl(request.getBaseUrl());
        provider.setModelName(request.getModelName());
        provider.setMaxTokens(request.getMaxTokens());
        provider.setMaxOutputTokens(request.getMaxOutputTokens());
        provider.setTemperature(request.getTemperature());
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

        // 创建初始Token
        if (StringUtils.hasText(request.getToken())) {
            CreateTokenRequest tokenRequest = new CreateTokenRequest();
            tokenRequest.setValue(request.getToken());
            tokenRequest.setAlias(StringUtils.hasText(request.getTokenAlias()) ? request.getTokenAlias() : "默认Token");
            tokenRequest.setWeight(1);
            tokenRequest.setEnabled(true);

            tokenService.createToken(provider.getId(), tokenRequest);
        }

        log.info("成功创建Provider: {} (ID: {})", provider.getName(), provider.getId());
        return convertToDTO(provider);
    }

    @Override
    @Transactional
    public ProviderDTO updateProvider(String id, UpdateProviderRequest request) {
        log.info("更新Provider: {} (ID: {})", request.getName(), id);

        // 检查Provider是否存在
        Provider existingProvider = providerMapper.findById(id);
        if (existingProvider == null) {
            throw new IllegalArgumentException("Provider不存在: " + id);
        }

        // 检查名称是否冲突
        if (StringUtils.hasText(request.getName()) &&
            !request.getName().equals(existingProvider.getName()) &&
            providerMapper.existsByNameAndIdNot(request.getName(), id)) {
            throw new IllegalArgumentException("Provider名称已存在: " + request.getName());
        }

        // 更新字段
        if (StringUtils.hasText(request.getName())) {
            existingProvider.setName(request.getName());
        }
        if (request.getDescription() != null) {
            existingProvider.setDescription(request.getDescription());
        }
        if (StringUtils.hasText(request.getBaseUrl())) {
            existingProvider.setBaseUrl(request.getBaseUrl());
        }
        if (StringUtils.hasText(request.getModelName())) {
            existingProvider.setModelName(request.getModelName());
        }
        if (request.getMaxTokens() != null) {
            existingProvider.setMaxTokens(request.getMaxTokens());
        }
        if (request.getMaxOutputTokens() != null) {
            existingProvider.setMaxOutputTokens(request.getMaxOutputTokens());
        }
        if (request.getTemperature() != null) {
            existingProvider.setTemperature(request.getTemperature());
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

        // 保存更新
        int result = providerMapper.update(existingProvider);
        if (result <= 0) {
            throw new ServiceException("更新Provider", "数据库更新失败");
        }

        log.info("成功更新Provider: {} (ID: {})", existingProvider.getName(), id);
        return convertToDTO(existingProvider);
    }

    @Override
    @Transactional
    public void deleteProvider(String id) {
        log.info("删除Provider: {}", id);

        // 检查Provider是否存在
        Provider provider = providerMapper.findById(id);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在: " + id);
        }

        // 删除关联的Token（通过外键约束自动删除）
        // 删除Provider
        int result = providerMapper.deleteById(id);
        if (result <= 0) {
            throw new ServiceException("删除Provider", "数据库删除失败");
        }

        log.info("成功删除Provider: {} (ID: {})", provider.getName(), id);
    }

    @Override
    public boolean isProviderNameAvailable(String name, String excludeId) {
        if (excludeId != null) {
            return !providerMapper.existsByNameAndIdNot(name, excludeId);
        } else {
            return !providerMapper.existsByName(name);
        }
    }

    @Override
    public long countProviders() {
        return providerMapper.count();
    }

    @Override
    public long countProvidersByType(String type) {
        return providerMapper.countByType(type);
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
        dto.setType(provider.getType());
        dto.setBaseUrl(provider.getBaseUrl());
        dto.setModelName(provider.getModelName());
        dto.setMaxTokens(provider.getMaxTokens());
        dto.setMaxOutputTokens(provider.getMaxOutputTokens());
        dto.setTemperature(provider.getTemperature());
        dto.setExtraHeaders(provider.getExtraHeaders());
        dto.setIsActive(provider.getIsActive());
        dto.setCreatedAt(provider.getCreatedAt());
        dto.setUpdatedAt(provider.getUpdatedAt());

        // 设置Token策略
        ProviderDTO.TokenStrategyDTO tokenStrategy = new ProviderDTO.TokenStrategyDTO();
        tokenStrategy.setType(provider.getTokenStrategyType() != null ? provider.getTokenStrategyType().getValue() : "round-robin");
        tokenStrategy.setFallbackOnError(provider.getTokenFallbackOnError());
        dto.setTokenStrategy(tokenStrategy);

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
     * 生成Provider ID
     *
     * @return 新的Provider ID
     */
    private String generateProviderId() {
        return "provider_" + UUID.randomUUID().toString().replace("-", "");
    }
}