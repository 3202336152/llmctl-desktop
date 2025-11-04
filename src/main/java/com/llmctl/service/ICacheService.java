package com.llmctl.service;

import java.time.Duration;
import java.util.List;

/**
 * Redis 缓存服务接口
 * 统一管理所有 Redis 缓存操作，避免代码重复
 *
 * @author Liu Yifan
 * @version 2.3.1
 * @since 2025-11-04
 */
public interface ICacheService {

    /**
     * 获取 Token 可用列表缓存
     *
     * @param providerId Provider ID
     * @return Token 列表，缓存未命中则返回 null
     */
    <T> List<T> getTokenAvailableList(String providerId);

    /**
     * 设置 Token 可用列表缓存
     *
     * @param providerId Provider ID
     * @param tokens Token 列表
     * @param ttl 缓存过期时间
     */
    <T> void setTokenAvailableList(String providerId, List<T> tokens, Duration ttl);

    /**
     * 清除 Token 可用列表缓存
     *
     * @param providerId Provider ID
     */
    void evictTokenAvailableList(String providerId);

    /**
     * 通用缓存读取方法
     *
     * @param key 缓存 Key
     * @return 缓存值，缓存未命中则返回 null
     */
    <T> T get(String key);

    /**
     * 通用缓存写入方法
     *
     * @param key 缓存 Key
     * @param value 缓存值
     * @param ttl 缓存过期时间
     */
    <T> void set(String key, T value, Duration ttl);

    /**
     * 通用缓存删除方法
     *
     * @param key 缓存 Key
     */
    void evict(String key);

    /**
     * 批量删除缓存（支持通配符）
     *
     * @param pattern 缓存 Key 模式（例如：token:available:*）
     * @return 删除的缓存数量
     */
    long evictByPattern(String pattern);
}
