package com.llmctl.mapper;

import com.llmctl.entity.McpServer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * MCP 服务器 Mapper 接口
 * 数据访问层，负责 MCP 服务器的 CRUD 操作
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Mapper
public interface McpServerMapper {

    /**
     * 根据 ID 查询 MCP 服务器
     *
     * @param id MCP 服务器 ID
     * @return MCP 服务器对象
     */
    McpServer findById(@Param("id") Long id);

    /**
     * 查询所有 MCP 服务器
     *
     * @return MCP 服务器列表
     */
    List<McpServer> findAll();

    /**
     * 根据用户 ID 查询 MCP 服务器（不包括模板）
     *
     * @param userId 用户 ID
     * @return MCP 服务器列表
     */
    List<McpServer> findByUserId(@Param("userId") Long userId);

    /**
     * 查询所有模板
     *
     * @return 模板列表
     */
    List<McpServer> findAllTemplates();

    /**
     * 根据模板分类查询模板
     *
     * @param category 模板分类
     * @return 模板列表
     */
    List<McpServer> findTemplatesByCategory(@Param("category") String category);

    /**
     * 根据关键词搜索 MCP 服务器
     *
     * @param keyword 搜索关键词
     * @return MCP 服务器列表
     */
    List<McpServer> searchByKeyword(@Param("keyword") String keyword);

    /**
     * 根据名称查询 MCP 服务器
     *
     * @param name MCP 服务器名称
     * @return MCP 服务器对象
     */
    McpServer findByName(@Param("name") String name);

    /**
     * 根据用户ID和名称查询 MCP 服务器
     *
     * @param userId 用户 ID
     * @param name MCP 服务器名称
     * @return MCP 服务器对象
     */
    McpServer findByUserIdAndName(@Param("userId") Long userId, @Param("name") String name);

    /**
     * 插入 MCP 服务器
     *
     * @param mcpServer MCP 服务器对象
     * @return 影响的行数
     */
    int insert(McpServer mcpServer);

    /**
     * 更新 MCP 服务器
     *
     * @param mcpServer MCP 服务器对象
     * @return 影响的行数
     */
    int update(McpServer mcpServer);

    /**
     * 删除 MCP 服务器（仅删除非模板）
     *
     * @param id MCP 服务器 ID
     * @return 影响的行数
     */
    int deleteById(@Param("id") Long id);

    /**
     * 更新启用状态
     *
     * @param id      MCP 服务器 ID
     * @param enabled 是否启用
     * @return 影响的行数
     */
    int updateEnabled(@Param("id") Long id, @Param("enabled") Boolean enabled);
}
