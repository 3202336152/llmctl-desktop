/**
 * MCP (Model Context Protocol) 相关类型定义
 *
 * @author LLMctl Team
 * @since v2.3.0
 */

/**
 * MCP 服务器类型
 */
export type McpServerType = 'stdio' | 'sse';

/**
 * MCP 模板分类
 */
export type McpTemplateCategory = 'filesystem' | 'database' | 'api' | 'dev-tools';

/**
 * CLI 类型
 */
export type CliType = 'claude code' | 'codex' | 'gemini' | 'qoder';

/**
 * MCP 服务器接口
 */
export interface McpServer {
  id?: number;
  name: string;
  description?: string;
  type: McpServerType;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
  isTemplate?: boolean;
  templateCategory?: McpTemplateCategory;
  icon?: string;
  configHints?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Provider MCP 映射接口
 */
export interface ProviderMcpMapping {
  id?: number;
  providerId: string;  // 修改为 string，与后端 Java 类型一致
  mcpServerId: number;
  cliType: CliType;
  enabled: boolean;
  priority: number;
  customConfig?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  // 关联的 MCP 服务器对象
  mcpServer?: McpServer;
}

/**
 * MCP 模板接口
 */
export interface McpTemplate extends McpServer {
  isTemplate: true;
  templateCategory: McpTemplateCategory;
}

/**
 * Provider MCP 配置 DTO
 */
export interface ProviderMcpConfigDTO {
  providerId: string;  // 修改为 string，与后端 Java 类型一致
  cliType: CliType;
  mcpServers: McpMappingDTO[];
}

/**
 * MCP 映射 DTO
 */
export interface McpMappingDTO {
  id?: number;
  mcpServerId: number;
  mcpServerName?: string;
  mcpServerDescription?: string;
  mcpServerIcon?: string;
  enabled: boolean;
  priority: number;
  customConfig?: Record<string, any>;
  mcpServer?: McpServer;
}

/**
 * MCP 配置生成结果
 */
export interface McpConfig {
  [serverName: string]: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  };
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
