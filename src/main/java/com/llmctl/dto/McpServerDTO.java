package com.llmctl.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * MCP 服务器数据传输对象
 * 用于前后端数据交互
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Data
public class McpServerDTO {

    /**
     * MCP 服务器 ID
     */
    private Long id;

    /**
     * MCP 服务器名称（唯一标识）
     */
    private String name;

    /**
     * 服务器描述
     */
    private String description;

    /**
     * MCP 服务器类型（stdio/sse）
     */
    private String type;

    /**
     * 启动命令
     */
    private String command;

    /**
     * 命令参数数组
     */
    private List<String> args;

    /**
     * 环境变量
     */
    private Map<String, String> env;

    /**
     * 是否启用
     */
    private Boolean enabled;

    /**
     * 是否为模板
     */
    private Boolean isTemplate;

    /**
     * 模板分类
     */
    private String templateCategory;

    /**
     * 图标名称
     */
    private String icon;

    /**
     * 配置提示信息
     */
    private Map<String, String> configHints;
}
