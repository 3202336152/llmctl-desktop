package com.llmctl.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Provider 与 MCP 服务器关联关系实体类
 * 对应数据库表：provider_mcp_mappings
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Data
public class ProviderMcpMapping {

    /**
     * 映射 ID（主键）
     */
    private Long id;

    /**
     * Provider ID（关联 providers 表）
     */
    private String providerId;

    /**
     * MCP 服务器 ID（关联 mcp_servers 表）
     */
    private Long mcpServerId;

    /**
     * CLI 类型
     * claude code: Claude Code CLI
     * codex: Codex CLI
     * gemini: Gemini CLI
     * qoder: Qoder CLI
     */
    private String cliType;

    /**
     * 是否启用该关联
     * true: 启用
     * false: 禁用
     */
    private Boolean enabled;

    /**
     * 优先级（数字越大优先级越高）
     * 影响配置生成顺序
     */
    private Integer priority;

    /**
     * 自定义配置覆盖（JSON 对象）
     * 用于覆盖 MCP 服务器的默认配置
     * 例如：{"args": ["custom-arg1", "custom-arg2"]}
     */
    private Map<String, Object> customConfig;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 关联的 MCP 服务器对象（用于查询时 JOIN）
     * 非数据库字段，仅用于数据传输
     */
    private McpServer mcpServer;
}
