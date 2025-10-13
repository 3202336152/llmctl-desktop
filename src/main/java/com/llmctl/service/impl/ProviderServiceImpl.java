package com.llmctl.service.impl;

import com.llmctl.context.UserContext;
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
        Long userId = UserContext.getUserId();
        log.debug("获取所有Provider列表, 用户ID: {}", userId);

        List<Provider> providers = providerMapper.findAll(userId);
        return providers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProviderDTO getProviderById(String id) {
        Long userId = UserContext.getUserId();
        log.debug("根据ID获取Provider详情: {}, 用户ID: {}", id, userId);

        Provider provider = providerMapper.findById(id, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + id);
        }

        return convertToDTO(provider);
    }

    @Override
    public List<ProviderDTO> getProvidersByType(String type) {
        Long userId = UserContext.getUserId();
        log.debug("根据类型获取Provider列表: {}, 用户ID: {}", type, userId);

        List<Provider> providers = providerMapper.findByType(type, userId);
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

        // 创建Provider实体
        Provider provider = new Provider();
        provider.setId(generateProviderId());
        provider.setUserId(userId);
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
        Long userId = UserContext.getUserId();
        log.info("删除Provider: {}, 用户ID: {}", id, userId);

        // 检查Provider是否存在且属于当前用户
        Provider provider = providerMapper.findById(id, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + id);
        }

        // 删除关联的Token（通过外键约束自动删除）
        // 删除Provider
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