package com.llmctl.mapper;

import com.llmctl.entity.ProviderMcpMapping;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * Provider MCP 映射 Mapper 接口
 * 数据访问层，负责 Provider 与 MCP 服务器关联关系的 CRUD 操作
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Mapper
public interface ProviderMcpMappingMapper {

    /**
     * 根据 Provider ID 和 CLI 类型查询关联的 MCP 服务器
     *
     * @param providerId Provider ID
     * @param cliType    CLI 类型
     * @return MCP 映射列表
     */
    List<ProviderMcpMapping> findByProviderAndCli(@Param("providerId") String providerId, @Param("cliType") String cliType);

    /**
     * 根据 Provider ID 查询所有关联
     *
     * @param providerId Provider ID
     * @return MCP 映射列表
     */
    List<ProviderMcpMapping> findByProviderId(@Param("providerId") String providerId);

    /**
     * 根据 ID 查询映射
     *
     * @param id 映射 ID
     * @return MCP 映射对象
     */
    ProviderMcpMapping findById(@Param("id") Long id);

    /**
     * 插入 Provider MCP 映射
     *
     * @param mapping MCP 映射对象
     * @return 影响的行数
     */
    int insert(ProviderMcpMapping mapping);

    /**
     * 更新 Provider MCP 映射
     *
     * @param mapping MCP 映射对象
     * @return 影响的行数
     */
    int update(ProviderMcpMapping mapping);

    /**
     * 删除 Provider MCP 映射
     *
     * @param id 映射 ID
     * @return 影响的行数
     */
    int deleteById(@Param("id") Long id);

    /**
     * 删除 Provider 的某个 CLI 类型的所有映射
     *
     * @param providerId Provider ID
     * @param cliType    CLI 类型
     * @return 影响的行数
     */
    int deleteByProviderAndCli(@Param("providerId") String providerId, @Param("cliType") String cliType);

    /**
     * 更新优先级
     *
     * @param id       映射 ID
     * @param priority 优先级
     * @return 影响的行数
     */
    int updatePriority(@Param("id") Long id, @Param("priority") Integer priority);
}
