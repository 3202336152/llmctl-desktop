package com.llmctl.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * Provider MCP 配置数据传输对象
 * 用于传输 Provider 关联的 MCP 服务器配置
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Data
public class ProviderMcpConfigDTO {

    /**
     * Provider ID
     */
    private Long providerId;

    /**
     * CLI 类型
     */
    private String cliType;

    /**
     * 关联的 MCP 服务器列表
     */
    private List<McpMappingDTO> mcpServers;

    /**
     * MCP 映射数据传输对象
     */
    @Data
    public static class McpMappingDTO {

        /**
         * 映射 ID
         */
        private Long id;

        /**
         * MCP 服务器 ID
         */
        private Long mcpServerId;

        /**
         * MCP 服务器名称
         */
        private String mcpServerName;

        /**
         * MCP 服务器描述
         */
        private String mcpServerDescription;

        /**
         * MCP 服务器图标
         */
        private String mcpServerIcon;

        /**
         * 是否启用
         */
        private Boolean enabled;

        /**
         * 优先级
         */
        private Integer priority;

        /**
         * 自定义配置覆盖
         */
        private Map<String, Object> customConfig;

        /**
         * 完整的 MCP 服务器对象（用于详细信息展示）
         */
        private McpServerDTO mcpServer;
    }
}
