package com.llmctl.service.impl;

import com.llmctl.context.UserContext;
import com.llmctl.dto.CreateTokenRequest;
import com.llmctl.dto.UpdateTokenRequest;
import com.llmctl.dto.TokenDTO;
import com.llmctl.entity.Provider;
import com.llmctl.entity.Token;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.TokenService;
import com.llmctl.service.ITokenEncryptionService;
import com.llmctl.service.ICacheService;
import com.llmctl.exception.ServiceException;
import com.llmctl.exception.ResourceNotFoundException;
import com.llmctl.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Token业务服务实现类
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements TokenService {

    private final TokenMapper tokenMapper;
    private final ProviderMapper providerMapper;
    private final ITokenEncryptionService encryptionService;
    private final ICacheService cacheService;  // ✅ 注入缓存服务
    private final Random random = new Random();

    /**
     * ✅ Redis 缓存优化：Token 列表缓存
     * 缓存策略：5分钟 TTL，前端主要调用此接口获取 Token 列表
     * 缓存 Key：provider-tokens-{providerId}
     * 清除时机：创建、更新、删除 Token 时自动清除
     */
    @Override
    @Cacheable(value = "provider:tokens", key = "#providerId", unless = "#result == null || #result.isEmpty()")
    public List<TokenDTO> getTokensByProviderId(String providerId) {
        Long userId = UserContext.getUserId();
        log.debug("根据Provider ID获取Token列表: {}, 用户ID: {}", providerId, userId);

        // 使用优化的JOIN查询，同时验证Provider权限和获取Token列表，避免两次数据库查询
        List<Token> tokens = tokenMapper.findByProviderIdWithPermissionCheck(providerId, userId);

        // 如果返回空列表，可能是Provider不存在或该Provider下无Token
        // 为了提供更好的错误信息，需要额外验证
        if (tokens.isEmpty()) {
            // 额外查询：区分"Provider不存在"和"该Provider下无Token"两种情况
            Provider provider = providerMapper.findById(providerId, userId);
            if (provider == null) {
                throw new IllegalArgumentException("Provider不存在或无权访问: " + providerId);
            }
            // Provider存在但没有Token，返回空列表
        }

        log.info("✅ [Token缓存] 查询数据库获取Token列表，Provider: {}, 数量: {}", providerId, tokens.size());
        return tokens.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TokenDTO> getAvailableTokensByProviderId(String providerId) {
        Long userId = UserContext.getUserId();
        log.debug("根据Provider ID获取可用Token列表: {}, 用户ID: {}", providerId, userId);

        // 验证Provider是否属于当前用户
        Provider provider = providerMapper.findById(providerId, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + providerId);
        }

        List<Token> tokens = tokenMapper.findAvailableByProviderId(providerId);
        return tokens.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TokenDTO getTokenById(String id) {
        Long userId = UserContext.getUserId();
        log.debug("根据ID获取Token详情: {}, 用户ID: {}", id, userId);

        Token token = tokenMapper.findById(id);
        if (token == null) {
            throw new IllegalArgumentException("Token不存在: " + id);
        }

        // 验证Token关联的Provider是否属于当前用户
        Provider provider = providerMapper.findById(token.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该Token");
        }

        return convertToDTO(token);
    }

    /**
     * ✅ 清除 Token 列表缓存和可用列表缓存（创建时）
     */
    @Override
    @Transactional
    @CacheEvict(value = "provider:tokens", key = "#providerId")
    public TokenDTO createToken(String providerId, CreateTokenRequest request) {
        Long userId = UserContext.getUserId();
        log.info("为Provider创建新Token: {} (Provider ID: {}), 用户ID: {}", request.getAlias(), providerId, userId);

        // ✅ 清除 Token 可用列表缓存
        cacheService.evictTokenAvailableList(providerId);

        // 检查Provider是否存在且属于当前用户
        Provider provider = providerMapper.findById(providerId, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + providerId);
        }

        // 检查Token别名是否冲突（如果提供了别名）
        if (StringUtils.hasText(request.getAlias()) &&
            tokenMapper.existsByProviderIdAndAlias(providerId, request.getAlias())) {
            throw new IllegalArgumentException("Token别名已存在: " + request.getAlias());
        }

        // 检查Token值是否重复（同一用户下不能有相同的Token值）
        String tokenValueHash = generateTokenHash(request.getValue());
        if (tokenMapper.existsByUserIdAndValueHash(userId, tokenValueHash)) {
            throw new IllegalArgumentException("该Token已存在，同一用户不能添加重复的Token");
        }

        // 创建Token实体
        Token token = new Token();
        token.setId(generateTokenId());
        token.setUserId(userId);
        token.setProviderId(providerId);
        token.setValue(encryptTokenValue(request.getValue())); // AES-256-GCM加密存储
        token.setValueHash(tokenValueHash); // 存储Hash用于唯一性检查
        token.setAlias(StringUtils.hasText(request.getAlias()) ? request.getAlias() : "Token-" + System.currentTimeMillis());
        token.setWeight(request.getWeight() != null ? request.getWeight() : 1);
        token.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        token.setHealthy(true);
        token.setEncryptionVersion("v1"); // 标记为加密存储

        // 设置时间戳
        LocalDateTime now = LocalDateTime.now();
        token.setCreatedAt(now);
        token.setUpdatedAt(now);

        // 保存Token
        int result = tokenMapper.insert(token);
        if (result <= 0) {
            throw new ServiceException("创建Token", "数据库插入失败");
        }

        log.info("成功创建Token: {} (ID: {})", token.getAlias(), token.getId());
        return convertToDTO(token);
    }

    /**
     * ✅ 清除 Token 列表缓存和可用列表缓存（更新时）
     */
    @Override
    @Transactional
    @CacheEvict(value = "provider:tokens", key = "#providerId")
    public TokenDTO updateToken(String providerId, String tokenId, UpdateTokenRequest request) {
        Long userId = UserContext.getUserId();
        log.info("更新Token: {} (ID: {}), 用户ID: {}", request.getAlias(), tokenId, userId);

        // ✅ 清除 Token 可用列表缓存
        cacheService.evictTokenAvailableList(providerId);

        // 验证Provider是否属于当前用户
        Provider provider = providerMapper.findById(providerId, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + providerId);
        }

        // 检查Token是否存在且属于指定Provider
        Token existingToken = tokenMapper.findById(tokenId);
        if (existingToken == null || !providerId.equals(existingToken.getProviderId())) {
            throw new IllegalArgumentException("Token不存在或不属于指定Provider: " + tokenId);
        }

        // 检查别名是否冲突（只有在提供了新别名且与原别名不同时才检查）
        if (StringUtils.hasText(request.getAlias()) &&
            !request.getAlias().equals(existingToken.getAlias()) &&
            tokenMapper.existsByProviderIdAndAliasAndIdNot(providerId, request.getAlias(), tokenId)) {
            throw new IllegalArgumentException("Token别名已存在: " + request.getAlias());
        }

        // 检查Token值是否重复（只有在提供了新Token值时才检查）
        if (StringUtils.hasText(request.getValue())) {
            String tokenValueHash = generateTokenHash(request.getValue());
            // 检查Hash是否与现有值不同
            if (!tokenValueHash.equals(existingToken.getValueHash()) &&
                tokenMapper.existsByUserIdAndValueHashAndIdNot(userId, tokenValueHash, tokenId)) {
                throw new IllegalArgumentException("该Token已存在，同一用户不能添加重复的Token");
            }
        }

        // 只更新提供的字段
        if (StringUtils.hasText(request.getValue())) {
            String encryptedTokenValue = encryptTokenValue(request.getValue());
            String tokenValueHash = generateTokenHash(request.getValue());
            existingToken.setValue(encryptedTokenValue);
            existingToken.setValueHash(tokenValueHash);
            existingToken.setEncryptionVersion("v1"); // 更新加密版本
        }
        if (StringUtils.hasText(request.getAlias())) {
            existingToken.setAlias(request.getAlias());
        }
        if (request.getWeight() != null) {
            existingToken.setWeight(request.getWeight());
        }
        if (request.getEnabled() != null) {
            existingToken.setEnabled(request.getEnabled());
        }
        if (request.getHealthy() != null) {
            existingToken.setHealthy(request.getHealthy());
        }

        existingToken.setUpdatedAt(LocalDateTime.now());

        // 保存更新
        int result = tokenMapper.update(existingToken);
        if (result <= 0) {
            throw new ServiceException("更新Token", "数据库更新失败");
        }

        log.info("成功更新Token: {} (ID: {})", existingToken.getAlias(), tokenId);
        return convertToDTO(existingToken);
    }

    /**
     * ✅ 清除 Token 列表缓存和可用列表缓存（删除时）
     */
    @Override
    @Transactional
    @CacheEvict(value = "provider:tokens", key = "#providerId")
    public void deleteToken(String providerId, String tokenId) {
        Long userId = UserContext.getUserId();
        log.info("删除Token: {} (Provider ID: {}), 用户ID: {}", tokenId, providerId, userId);

        // ✅ 清除 Token 可用列表缓存
        cacheService.evictTokenAvailableList(providerId);

        // 验证Provider是否属于当前用户
        Provider provider = providerMapper.findById(providerId, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + providerId);
        }

        // 检查Token是否存在且属于指定Provider
        Token token = tokenMapper.findById(tokenId);
        if (token == null || !providerId.equals(token.getProviderId())) {
            throw new IllegalArgumentException("Token不存在或不属于指定Provider: " + tokenId);
        }

        // 删除Token
        int result = tokenMapper.deleteById(tokenId);
        if (result <= 0) {
            throw new ServiceException("删除Token", "数据库删除失败");
        }

        log.info("成功删除Token: {} (ID: {})", token.getAlias(), tokenId);
    }

    @Override
    public Token selectToken(String providerId) {
        // 注意：这个方法可能在Session启动时被调用，此时需要验证Provider权限
        // 但由于调用方已经验证过Provider，这里可以保持现状或添加额外验证
        log.debug("为Provider选择Token: {}", providerId);

        // 获取Provider信息（不需要userId，因为此方法通常在内部被已验证过的方法调用）
        Provider provider = providerMapper.findById(providerId, UserContext.getUserId());
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + providerId);
        }

        // ✅ 使用缓存服务读取 Token 可用列表
        List<Token> availableTokens = cacheService.getTokenAvailableList(providerId);

        // 缓存未命中，查询数据库
        if (availableTokens == null) {
            availableTokens = tokenMapper.findAvailableByProviderId(providerId);
            log.info("✅ [Token可用列表缓存] 查询数据库获取可用Token，Provider: {}, 数量: {}", providerId, availableTokens.size());

            // 写入缓存（15分钟TTL）
            if (!availableTokens.isEmpty()) {
                cacheService.setTokenAvailableList(providerId, availableTokens, java.time.Duration.ofMinutes(720));
            }
        }

        if (availableTokens.isEmpty()) {
            log.warn("Provider {} 没有可用的Token", providerId);
            return null;
        }

        log.info("📋 [可用Token] Provider: {} | 总数: {} | Token列表: {}",
                providerId, availableTokens.size(),
                availableTokens.stream()
                        .map(t -> String.format("%s(权重:%d,健康:%s)",
                                t.getAlias() != null ? t.getAlias() : "未命名",
                                t.getWeight(),
                                t.getHealthy()))
                        .collect(Collectors.joining(", ")));

        // 根据策略选择Token
        Token selectedToken = null;
        Provider.TokenStrategyType strategy = provider.getTokenStrategyType();
        if (strategy == null) {
            strategy = Provider.TokenStrategyType.ROUND_ROBIN;
        }

        switch (strategy) {
            case ROUND_ROBIN:
                selectedToken = selectByRoundRobin(availableTokens);
                break;
            case WEIGHTED:
                selectedToken = selectByWeight(availableTokens);
                break;
            case RANDOM:
                selectedToken = selectByRandom(availableTokens);
                break;
            case LEAST_USED:
                selectedToken = selectByLeastUsed(availableTokens);
                break;
            default:
                selectedToken = availableTokens.get(0);
        }

        if (selectedToken != null) {
            // TODO: 异步更新最后使用时间（暂时禁用以避免事务锁冲突）
            // 注意：由于自调用AOP不生效，且会导致数据库锁等待，暂时禁用此功能
            // updateTokenLastUsedAsync(selectedToken.getId());
            log.info("✅ [Token选择] Provider: {} | 策略: {} | 选中Token: {} (ID: {}) | 权重: {} | 健康: {}",
                    providerId, strategy,
                    selectedToken.getAlias() != null ? selectedToken.getAlias() : "未命名",
                    selectedToken.getId().substring(0, 8) + "...",
                    selectedToken.getWeight(),
                    selectedToken.getHealthy());
        }

        return selectedToken;
    }


    /**
     * 在新事务中异步更新Token最后使用时间
     * 使用REQUIRES_NEW避免与外层事务冲突
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateTokenLastUsedAsync(String tokenId) {
        try {
            tokenMapper.updateLastUsed(tokenId);
        } catch (Exception e) {
            // 忽略更新失败，不影响主流程
            log.warn("更新Token最后使用时间失败: {}", tokenId, e);
        }
    }

    @Override
    public void updateTokenHealth(String tokenId, boolean healthy) {
        Long userId = UserContext.getUserId();
        log.info("📝 [更新Token健康状态] Token ID: {} | 健康状态: {} -> {}, 用户ID: {}", tokenId, "?", healthy, userId);

        // 查询当前状态
        Token token = tokenMapper.findById(tokenId);
        if (token == null) {
            log.error("❌ [更新Token健康状态失败] Token不存在: {}", tokenId);
            throw new ResourceNotFoundException("Token", tokenId);
        }

        // 验证Token关联的Provider是否属于当前用户
        Provider provider = providerMapper.findById(token.getProviderId(), userId);
        if (provider == null) {
            throw new IllegalArgumentException("无权访问该Token");
        }

        log.info("📝 [更新前状态] Token: {} | 当前健康: {} | 目标健康: {}",
                token.getAlias(), token.getHealthy(), healthy);

        int result = tokenMapper.updateHealthStatus(tokenId, healthy);

        if (result > 0) {
            log.info("✅ [更新Token健康状态成功] Token: {} | 新状态: {} | 影响行数: {}",
                    token.getAlias(), healthy, result);

            // 再次查询验证
            Token updatedToken = tokenMapper.findById(tokenId);
            if (updatedToken != null) {
                log.info("🔍 [验证更新结果] Token: {} | 数据库实际状态: healthy={}, enabled={}",
                        updatedToken.getAlias(), updatedToken.getHealthy(), updatedToken.getEnabled());
            }
        } else {
            log.error("❌ [更新Token健康状态失败] Token: {} | 影响行数: 0", token.getAlias());
        }
    }

    @Override
    @Transactional
    public int recoverAllUnhealthyTokens(String providerId) {
        Long userId = UserContext.getUserId();
        log.info("🔧 [批量恢复Token健康状态] Provider ID: {}, 用户ID: {}", providerId, userId);

        // 检查Provider是否存在且属于当前用户
        Provider provider = providerMapper.findById(providerId, userId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在或无权访问: " + providerId);
        }

        // 批量恢复不健康的Token
        int affectedRows = tokenMapper.recoverAllUnhealthyTokens(providerId);

        if (affectedRows > 0) {
            log.info("✅ [批量恢复成功] Provider: {} | 已恢复 {} 个Token的健康状态",
                    provider.getName(), affectedRows);
        } else {
            log.info("ℹ️ [无需恢复] Provider: {} | 所有Token均为健康状态", provider.getName());
        }

        return affectedRows;
    }

    @Override
    public TokenDTO convertToDTO(Token token) {
        if (token == null) {
            return null;
        }

        TokenDTO dto = new TokenDTO();
        dto.setId(token.getId());
        dto.setProviderId(token.getProviderId());
        dto.setAlias(token.getAlias());
        dto.setWeight(token.getWeight());
        dto.setEnabled(token.getEnabled());
        dto.setHealthy(token.getHealthy());
        dto.setLastUsed(token.getLastUsed());
        dto.setCreatedAt(token.getCreatedAt());
        dto.setUpdatedAt(token.getUpdatedAt());

        // 解密Token值并遮掩显示（只显示前4位和后4位）
        String decryptedValue = decryptTokenValue(token.getValue());
        dto.setMaskedValue(maskTokenValue(decryptedValue));

        return dto;
    }

    /**
     * 遮掩Token值，只显示前4位和后4位
     */
    private String maskTokenValue(String value) {
        if (value == null || value.length() <= 8) {
            return "****";
        }
        String prefix = value.substring(0, 4);
        String suffix = value.substring(value.length() - 4);
        return prefix + "****" + suffix;
    }

    /**
     * 轮询策略选择Token
     */
    private Token selectByRoundRobin(List<Token> tokens) {
        // 简单实现：选择最少使用的Token
        return tokens.stream()
                .min((t1, t2) -> {
                    LocalDateTime lastUsed1 = t1.getLastUsed();
                    LocalDateTime lastUsed2 = t2.getLastUsed();
                    if (lastUsed1 == null && lastUsed2 == null) return 0;
                    if (lastUsed1 == null) return -1;
                    if (lastUsed2 == null) return 1;
                    return lastUsed1.compareTo(lastUsed2);
                })
                .orElse(null);
    }

    /**
     * 加权策略选择Token
     */
    private Token selectByWeight(List<Token> tokens) {
        int totalWeight = tokens.stream().mapToInt(Token::getWeight).sum();
        int randomWeight = random.nextInt(totalWeight);

        int currentWeight = 0;
        for (Token token : tokens) {
            currentWeight += token.getWeight();
            if (randomWeight < currentWeight) {
                return token;
            }
        }

        return tokens.get(0); // 兜底
    }

    /**
     * 随机策略选择Token
     */
    private Token selectByRandom(List<Token> tokens) {
        return tokens.get(random.nextInt(tokens.size()));
    }

    /**
     * 最少使用策略选择Token
     */
    private Token selectByLeastUsed(List<Token> tokens) {
        return tokens.stream()
                .min((t1, t2) -> {
                    LocalDateTime lastUsed1 = t1.getLastUsed();
                    LocalDateTime lastUsed2 = t2.getLastUsed();
                    if (lastUsed1 == null && lastUsed2 == null) return 0;
                    if (lastUsed1 == null) return -1;
                    if (lastUsed2 == null) return 1;
                    return lastUsed1.compareTo(lastUsed2);
                })
                .orElse(null);
    }

    /**
     * 生成Token ID
     */
    private String generateTokenId() {
        return "token_" + UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * 生成Token值的SHA-256 Hash
     * 用于唯一性检查，确保相同的Token值产生相同的Hash
     *
     * @param tokenValue Token明文值
     * @return SHA-256 Hex字符串
     */
    private String generateTokenHash(String tokenValue) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(tokenValue.getBytes(StandardCharsets.UTF_8));

            // 转换为十六进制字符串
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("生成Token Hash失败", e);
            throw new ServiceException("Token Hash生成", "Hash生成失败: " + e.getMessage());
        }
    }

    /**
     * 加密Token值
     * 使用AES-256-GCM算法加密
     */
    private String encryptTokenValue(String value) {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException("Token值不能为空");
        }
        try {
            return encryptionService.encrypt(value);
        } catch (Exception e) {
            log.error("Token加密失败", e);
            throw new ServiceException("Token加密", "加密失败: " + e.getMessage());
        }
    }

    /**
     * 解密Token值
     * 使用AES-256-GCM算法解密
     * 兼容明文Token（用于数据迁移）
     */
    private String decryptTokenValue(String encryptedValue) {
        if (encryptedValue == null || encryptedValue.isEmpty()) {
            return "";
        }
        try {
            return encryptionService.decrypt(encryptedValue);
        } catch (Exception e) {
            log.error("Token解密失败", e);
            throw new ServiceException("Token解密", "解密失败: " + e.getMessage());
        }
    }
}