package com.llmctl.service.impl;

import com.llmctl.dto.CreateTokenRequest;
import com.llmctl.dto.UpdateTokenRequest;
import com.llmctl.dto.TokenDTO;
import com.llmctl.entity.Provider;
import com.llmctl.entity.Token;
import com.llmctl.mapper.ProviderMapper;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.TokenService;
import com.llmctl.exception.ServiceException;
import com.llmctl.exception.ResourceNotFoundException;
import com.llmctl.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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
    private final Random random = new Random();

    @Override
    public List<TokenDTO> getTokensByProviderId(String providerId) {
        log.debug("根据Provider ID获取Token列表: {}", providerId);

        List<Token> tokens = tokenMapper.findByProviderId(providerId);
        return tokens.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TokenDTO> getAvailableTokensByProviderId(String providerId) {
        log.debug("根据Provider ID获取可用Token列表: {}", providerId);

        List<Token> tokens = tokenMapper.findAvailableByProviderId(providerId);
        return tokens.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TokenDTO getTokenById(String id) {
        log.debug("根据ID获取Token详情: {}", id);

        Token token = tokenMapper.findById(id);
        if (token == null) {
            throw new IllegalArgumentException("Token不存在: " + id);
        }

        return convertToDTO(token);
    }

    @Override
    @Transactional
    public TokenDTO createToken(String providerId, CreateTokenRequest request) {
        log.info("为Provider创建新Token: {} (Provider ID: {})", request.getAlias(), providerId);

        // 检查Provider是否存在
        Provider provider = providerMapper.findById(providerId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在: " + providerId);
        }

        // 检查Token别名是否冲突（如果提供了别名）
        if (StringUtils.hasText(request.getAlias()) &&
            tokenMapper.existsByProviderIdAndAlias(providerId, request.getAlias())) {
            throw new IllegalArgumentException("Token别名已存在: " + request.getAlias());
        }

        // 创建Token实体
        Token token = new Token();
        token.setId(generateTokenId());
        token.setProviderId(providerId);
        token.setValue(encryptTokenValue(request.getValue())); // 加密存储
        token.setAlias(StringUtils.hasText(request.getAlias()) ? request.getAlias() : "Token-" + System.currentTimeMillis());
        token.setWeight(request.getWeight() != null ? request.getWeight() : 1);
        token.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        token.setHealthy(true);
        token.setErrorCount(0);

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

    @Override
    @Transactional
    public TokenDTO updateToken(String providerId, String tokenId, UpdateTokenRequest request) {
        log.info("更新Token: {} (ID: {})", request.getAlias(), tokenId);

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

        // 只更新提供的字段
        if (StringUtils.hasText(request.getValue())) {
            existingToken.setValue(encryptTokenValue(request.getValue()));
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

    @Override
    @Transactional
    public void deleteToken(String providerId, String tokenId) {
        log.info("删除Token: {} (Provider ID: {})", tokenId, providerId);

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
        log.debug("为Provider选择Token: {}", providerId);

        // 获取Provider信息
        Provider provider = providerMapper.findById(providerId);
        if (provider == null) {
            throw new IllegalArgumentException("Provider不存在: " + providerId);
        }

        // 获取可用的Token列表
        List<Token> availableTokens = tokenMapper.findAvailableByProviderId(providerId);
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
        log.info("📝 [更新Token健康状态] Token ID: {} | 健康状态: {} -> {}", tokenId, "?", healthy);

        // 查询当前状态
        Token token = tokenMapper.findById(tokenId);
        if (token == null) {
            log.error("❌ [更新Token健康状态失败] Token不存在: {}", tokenId);
            throw new ResourceNotFoundException("Token", tokenId);
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
    public void incrementTokenError(String tokenId) {
        log.debug("增加Token错误计数: {}", tokenId);
        tokenMapper.incrementErrorCount(tokenId);
    }

    @Override
    public void resetTokenError(String tokenId) {
        log.debug("重置Token错误计数: {}", tokenId);
        tokenMapper.resetErrorCount(tokenId);
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
        dto.setErrorCount(token.getErrorCount());
        dto.setLastErrorTime(token.getLastErrorTime());
        dto.setCreatedAt(token.getCreatedAt());
        dto.setUpdatedAt(token.getUpdatedAt());

        // 设置遮掩的Token值
        dto.setMaskedValue(decryptTokenValue(token.getValue()));

        return dto;
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
     * 加密Token值
     * TODO: 实现真正的加密逻辑
     */
    private String encryptTokenValue(String value) {
        // 这里应该实现真正的加密逻辑
        return value;
    }

    /**
     * 解密Token值
     * TODO: 实现真正的解密逻辑
     */
    private String decryptTokenValue(String encryptedValue) {
        // 这里应该实现真正的解密逻辑
        return encryptedValue;
    }
}