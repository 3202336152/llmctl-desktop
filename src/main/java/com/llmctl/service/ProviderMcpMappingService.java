package com.llmctl.service;

import com.llmctl.entity.ProviderMcpMapping;

import java.util.List;

/**
 * Provider MCP 映射服务接口
 * 业务逻辑层，负责 Provider 与 MCP 服务器关联关系的业务处理
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
public interface ProviderMcpMappingService {

    /**
     * 根据 Provider ID 和 CLI 类型查询关联的 MCP 服务器
     *
     * @param providerId Provider ID
     * @param cliType    CLI 类型
     * @return MCP 映射列表
     */
    List<ProviderMcpMapping> getMappingsByProviderAndCli(String providerId, String cliType);

    /**
     * 根据 Provider ID 查询所有关联
     *
     * @param providerId Provider ID
     * @return MCP 映射列表
     */
    List<ProviderMcpMapping> getMappingsByProviderId(String providerId);

    /**
     * 根据 ID 查询映射
     *
     * @param id 映射 ID
     * @return MCP 映射对象
     */
    ProviderMcpMapping getMappingById(Long id);

    /**
     * 创建 Provider MCP 映射
     *
     * @param mapping MCP 映射对象
     * @return 创建后的 MCP 映射对象
     */
    ProviderMcpMapping createMapping(ProviderMcpMapping mapping);

    /**
     * 更新 Provider MCP 映射
     *
     * @param mapping MCP 映射对象
     * @return 更新后的 MCP 映射对象
     */
    ProviderMcpMapping updateMapping(ProviderMcpMapping mapping);

    /**
     * 删除 Provider MCP 映射
     *
     * @param id 映射 ID
     */
    void deleteMapping(Long id);

    /**
     * 批量保存 Provider MCP 映射
     * 删除旧的映射,创建新的映射
     *
     * @param providerId Provider ID
     * @param cliType    CLI 类型
     * @param mappings   MCP 映射列表
     */
    void batchSaveMappings(String providerId, String cliType, List<ProviderMcpMapping> mappings);

    /**
     * 更新映射优先级
     *
     * @param id       映射 ID
     * @param priority 优先级
     */
    void updatePriority(Long id, Integer priority);

    /**
     * 批量更新优先级
     *
     * @param mappings 包含 ID 和优先级的映射列表
     */
    void batchUpdatePriority(List<ProviderMcpMapping> mappings);

    /**
     * 批量关联 MCP 服务器到 Provider
     *
     * @param providerId   Provider ID
     * @param cliType      CLI 类型
     * @param mcpServerIds MCP 服务器 ID 列表
     */
    void batchAssociateMcpServers(String providerId, String cliType, List<Long> mcpServerIds);
}
