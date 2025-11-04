package com.llmctl.service.impl;

import com.llmctl.service.ICacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;

/**
 * Redis 缓存服务实现类
 * 统一管理所有 Redis 缓存操作，提供故障容错和日志记录
 *
 * 设计原则：
 * 1. 所有 Redis 操作都包含 try-catch，失败时降级而非抛异常
 * 2. 详细的日志记录，便于排查问题
 * 3. 缓存 Key 命名规范：{业务模块}:{数据类型}:{唯一标识}
 *
 * @author Liu Yifan
 * @version 2.3.1
 * @since 2025-11-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheServiceImpl implements ICacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 缓存 Key 前缀常量
     */
    private static final String TOKEN_AVAILABLE_PREFIX = "token:available:";

    @Override
    @SuppressWarnings("unchecked")
    public <T> List<T> getTokenAvailableList(String providerId) {
        String cacheKey = TOKEN_AVAILABLE_PREFIX + providerId;
        try {
            List<T> cached = (List<T>) redisTemplate.opsForValue().get(cacheKey);
            if (cached != null && !cached.isEmpty()) {
                log.info("✅ [Token可用列表缓存] 命中Redis缓存，Provider: {}, 数量: {}", providerId, cached.size());
                return cached;
            }
            log.debug("⚠️ [Token可用列表缓存] 缓存未命中，Provider: {}", providerId);
            return null;
        } catch (Exception e) {
            log.warn("⚠️ [Token可用列表缓存] Redis读取失败，降级到数据库查询: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public <T> void setTokenAvailableList(String providerId, List<T> tokens, Duration ttl) {
        String cacheKey = TOKEN_AVAILABLE_PREFIX + providerId;
        if (tokens == null || tokens.isEmpty()) {
            log.debug("⚠️ [Token可用列表缓存] Token列表为空，跳过缓存写入，Provider: {}", providerId);
            return;
        }
        try {
            redisTemplate.opsForValue().set(cacheKey, tokens, ttl);
            log.info("✅ [Token可用列表缓存] 写入Redis成功，Provider: {}, TTL: {}", providerId, ttl);
        } catch (Exception e) {
            log.warn("⚠️ [Token可用列表缓存] Redis写入失败: {}", e.getMessage());
        }
    }

    @Override
    public void evictTokenAvailableList(String providerId) {
        String cacheKey = TOKEN_AVAILABLE_PREFIX + providerId;
        try {
            Boolean deleted = redisTemplate.delete(cacheKey);
            if (Boolean.TRUE.equals(deleted)) {
                log.info("✅ [缓存清除] Token可用列表缓存已清除，Provider: {}", providerId);
            } else {
                log.debug("⚠️ [缓存清除] Token可用列表缓存不存在或已过期，Provider: {}", providerId);
            }
        } catch (Exception e) {
            log.warn("⚠️ [缓存清除] Redis删除失败: {}", e.getMessage());
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        try {
            T value = (T) redisTemplate.opsForValue().get(key);
            if (value != null) {
                log.debug("✅ [缓存命中] Key: {}", key);
            } else {
                log.debug("⚠️ [缓存未命中] Key: {}", key);
            }
            return value;
        } catch (Exception e) {
            log.warn("⚠️ [缓存读取失败] Key: {}, 错误: {}", key, e.getMessage());
            return null;
        }
    }

    @Override
    public <T> void set(String key, T value, Duration ttl) {
        if (value == null) {
            log.debug("⚠️ [缓存写入跳过] 值为 null，Key: {}", key);
            return;
        }
        try {
            redisTemplate.opsForValue().set(key, value, ttl);
            log.info("✅ [缓存写入成功] Key: {}, TTL: {}", key, ttl);
        } catch (Exception e) {
            log.warn("⚠️ [缓存写入失败] Key: {}, 错误: {}", key, e.getMessage());
        }
    }

    @Override
    public void evict(String key) {
        try {
            Boolean deleted = redisTemplate.delete(key);
            if (Boolean.TRUE.equals(deleted)) {
                log.info("✅ [缓存清除成功] Key: {}", key);
            } else {
                log.debug("⚠️ [缓存清除跳过] Key 不存在或已过期: {}", key);
            }
        } catch (Exception e) {
            log.warn("⚠️ [缓存清除失败] Key: {}, 错误: {}", key, e.getMessage());
        }
    }

    @Override
    public long evictByPattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys.isEmpty()) {
                log.debug("⚠️ [批量缓存清除] 未找到匹配的Key，Pattern: {}", pattern);
                return 0;
            }
            long count = redisTemplate.delete(keys);
            log.info("✅ [批量缓存清除成功] Pattern: {}, 清除数量: {}", pattern, count);
            return count;
        } catch (Exception e) {
            log.warn("⚠️ [批量缓存清除失败] Pattern: {}, 错误: {}", pattern, e.getMessage());
            return 0;
        }
    }
}
