package com.llmctl.service;

import com.llmctl.entity.McpServer;

import java.util.List;
import java.util.Map;

/**
 * MCP 服务器服务接口
 * 业务逻辑层，负责 MCP 服务器的业务处理
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
public interface McpServerService {

    /**
     * 获取所有 MCP 服务器
     *
     * @return MCP 服务器列表
     */
    List<McpServer> getAllServers();

    /**
     * 获取用户的 MCP 服务器（不包括模板）
     *
     * @param userId 用户 ID
     * @return MCP 服务器列表
     */
    List<McpServer> getUserServers(Long userId);

    /**
     * 获取所有模板
     *
     * @return 模板列表
     */
    List<McpServer> getAllTemplates();

    /**
     * 根据分类获取模板
     *
     * @param category 模板分类
     * @return 模板列表
     */
    List<McpServer> getTemplatesByCategory(String category);

    /**
     * 搜索 MCP 服务器
     *
     * @param keyword 搜索关键词
     * @return MCP 服务器列表
     */
    List<McpServer> searchServers(String keyword);

    /**
     * 根据 ID 获取 MCP 服务器
     *
     * @param id MCP 服务器 ID
     * @return MCP 服务器对象
     */
    McpServer getServerById(Long id);

    /**
     * 根据名称获取 MCP 服务器
     *
     * @param name MCP 服务器名称
     * @return MCP 服务器对象
     */
    McpServer getServerByName(String name);

    /**
     * 创建 MCP 服务器
     *
     * @param mcpServer MCP 服务器对象
     * @return 创建后的 MCP 服务器对象
     */
    McpServer createServer(McpServer mcpServer);

    /**
     * 从模板创建 MCP 服务器
     *
     * @param templateId   模板 ID
     * @param userId       用户 ID
     * @param customConfig 自定义配置
     * @return 创建后的 MCP 服务器对象
     */
    McpServer createFromTemplate(Long templateId, Long userId, Map<String, Object> customConfig);

    /**
     * 更新 MCP 服务器
     *
     * @param mcpServer MCP 服务器对象
     * @return 更新后的 MCP 服务器对象
     */
    McpServer updateServer(McpServer mcpServer);

    /**
     * 删除 MCP 服务器
     *
     * @param id MCP 服务器 ID
     */
    void deleteServer(Long id);

    /**
     * 切换启用状态
     *
     * @param id      MCP 服务器 ID
     * @param enabled 是否启用
     */
    void toggleEnabled(Long id, Boolean enabled);

    /**
     * 批量切换启用状态
     *
     * @param ids     MCP 服务器 ID 列表
     * @param enabled 是否启用
     */
    void batchToggleEnabled(List<Long> ids, Boolean enabled);

    /**
     * 批量删除 MCP 服务器
     *
     * @param ids MCP 服务器 ID 列表
     */
    void batchDeleteServers(List<Long> ids);

    /**
     * 生成 MCP 配置
     * 根据 Provider ID 和 CLI 类型生成对应的 MCP 配置
     *
     * @param providerId Provider ID
     * @param cliType    CLI 类型
     * @param clientOs   客户端操作系统（可选）：windows, mac, linux，默认为当前服务器系统
     * @return MCP 配置 Map
     */
    Map<String, Object> generateMcpConfig(String providerId, String cliType, String clientOs);
}
