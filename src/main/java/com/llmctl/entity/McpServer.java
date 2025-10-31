package com.llmctl.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * MCP 服务器实体类
 * 对应数据库表：mcp_servers
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Data
public class McpServer {

    /**
     * MCP 服务器 ID（主键）
     */
    private Long id;

    /**
     * 用户 ID（关联 users 表）
     * NULL: 全局模板（所有用户可见）
     * 非NULL: 用户专属 MCP 服务器
     */
    private Long userId;

    /**
     * MCP 服务器名称（唯一标识）
     * 例如：filesystem, github, postgres
     */
    private String name;

    /**
     * 服务器描述
     * 例如：访问本地文件系统，允许 AI 读写指定目录下的文件和文件夹
     */
    private String description;

    /**
     * MCP 服务器类型
     * stdio: 标准输入输出
     * sse: Server-Sent Events
     */
    private String type;

    /**
     * 启动命令
     * 例如：npx, node, python, uvx
     */
    private String command;

    /**
     * 命令参数数组（JSON 格式）
     * 例如：["-y", "@modelcontextprotocol/server-filesystem", "C:/allowed-path"]
     */
    private List<String> args;

    /**
     * 环境变量（JSON 对象）
     * 例如：{"GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"}
     */
    private Map<String, String> env;

    /**
     * 是否启用
     * true: 启用
     * false: 禁用
     */
    private Boolean enabled;

    /**
     * 是否为模板
     * true: 内置模板（不可删除）
     * false: 用户创建
     */
    private Boolean isTemplate;

    /**
     * 模板分类
     * 例如：filesystem, database, api, dev-tools
     */
    private String templateCategory;

    /**
     * 图标名称（用于 UI 展示）
     * 例如：folder, github, database
     */
    private String icon;

    /**
     * 配置提示信息（帮助用户填写参数）
     * 例如：{"args[2]": "设置允许访问的根目录路径"}
     */
    private Map<String, String> configHints;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
