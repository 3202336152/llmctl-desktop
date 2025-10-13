package com.llmctl.service;

import com.llmctl.dto.CreateProviderRequest;
import com.llmctl.dto.ProviderDTO;
import com.llmctl.dto.UpdateProviderRequest;
import com.llmctl.dto.UpdateTokenStrategyRequest;

import java.util.List;

/**
 * Provider服务接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public interface ProviderService {

    /**
     * 获取所有Provider列表
     *
     * @return Provider DTO列表
     */
    List<ProviderDTO> getAllProviders();

    /**
     * 根据ID获取Provider详情
     *
     * @param id Provider ID
     * @return Provider DTO
     * @throws IllegalArgumentException 如果Provider不存在
     */
    ProviderDTO getProviderById(String id);

    /**
     * 根据类型获取Provider列表
     *
     * @param type Provider类型
     * @return Provider DTO列表
     */
    List<ProviderDTO> getProvidersByType(String type);

    /**
     * 创建新的Provider
     *
     * @param request 创建Provider请求
     * @return 创建的Provider DTO
     * @throws IllegalArgumentException 如果Provider名称已存在
     */
    ProviderDTO createProvider(CreateProviderRequest request);

    /**
     * 更新Provider
     *
     * @param id Provider ID
     * @param request 更新Provider请求
     * @return 更新后的Provider DTO
     * @throws IllegalArgumentException 如果Provider不存在或名称冲突
     */
    ProviderDTO updateProvider(String id, UpdateProviderRequest request);

    /**
     * 删除Provider
     *
     * @param id Provider ID
     * @throws IllegalArgumentException 如果Provider不存在
     */
    void deleteProvider(String id);

    /**
     * 检查Provider名称是否可用
     *
     * @param name Provider名称
     * @param excludeId 排除的Provider ID（用于更新时检查）
     * @return true如果名称可用，false如果已存在
     */
    boolean isProviderNameAvailable(String name, String excludeId);

    /**
     * 统计Provider数量
     *
     * @return Provider总数
     */
    long countProviders();

    /**
     * 根据类型统计Provider数量
     *
     * @param type Provider类型
     * @return 指定类型的Provider数量
     */
    long countProvidersByType(String type);

    /**
     * 更新Provider的Token轮询策略
     *
     * @param id Provider ID
     * @param request 更新Token策略请求
     * @return 更新后的Provider DTO
     * @throws IllegalArgumentException 如果Provider不存在
     */
    ProviderDTO updateTokenStrategy(String id, UpdateTokenStrategyRequest request);
}