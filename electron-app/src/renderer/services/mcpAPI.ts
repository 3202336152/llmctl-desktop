import httpClient from './httpClient';
import {
  McpServer,
  ProviderMcpMapping,
  McpConfig,
  ApiResponse,
  CliType
} from '../types/mcp';

/**
 * MCP 服务器 API
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
export const mcpAPI = {
  // ==================== MCP 服务器管理 ====================

  /**
   * 获取所有 MCP 服务器
   */
  getAllServers: (): Promise<ApiResponse<McpServer[]>> => {
    return httpClient.get('/mcp-servers').then(response => response.data);
  },

  /**
   * 获取所有模板
   */
  getAllTemplates: (): Promise<ApiResponse<McpServer[]>> => {
    return httpClient.get('/mcp-servers/templates').then(response => response.data);
  },

  /**
   * 根据分类获取模板
   */
  getTemplatesByCategory: (category: string): Promise<ApiResponse<McpServer[]>> => {
    return httpClient.get(`/mcp-servers/templates/category/${category}`).then(response => response.data);
  },

  /**
   * 搜索 MCP 服务器
   */
  searchServers: (keyword: string): Promise<ApiResponse<McpServer[]>> => {
    return httpClient.get('/mcp-servers/search', { params: { keyword } }).then(response => response.data);
  },

  /**
   * 根据 ID 获取 MCP 服务器
   */
  getServerById: (id: number): Promise<ApiResponse<McpServer>> => {
    return httpClient.get(`/mcp-servers/${id}`).then(response => response.data);
  },

  /**
   * 创建 MCP 服务器
   */
  createServer: (server: McpServer): Promise<ApiResponse<McpServer>> => {
    return httpClient.post('/mcp-servers', server).then(response => response.data);
  },

  /**
   * 从模板创建 MCP 服务器
   */
  createFromTemplate: (
    templateId: number,
    customConfig: Record<string, any>
  ): Promise<ApiResponse<McpServer>> => {
    return httpClient.post('/mcp-servers/from-template', customConfig, {
      params: { templateId }
    }).then(response => response.data);
  },

  /**
   * 更新 MCP 服务器
   */
  updateServer: (id: number, server: McpServer): Promise<ApiResponse<McpServer>> => {
    return httpClient.put(`/mcp-servers/${id}`, server).then(response => response.data);
  },

  /**
   * 删除 MCP 服务器
   */
  deleteServer: (id: number): Promise<ApiResponse<null>> => {
    return httpClient.delete(`/mcp-servers/${id}`).then(response => response.data);
  },

  /**
   * 切换启用状态
   */
  toggleEnabled: (id: number, enabled: boolean): Promise<ApiResponse<null>> => {
    return httpClient.patch(`/mcp-servers/${id}/toggle`, null, {
      params: { enabled }
    }).then(response => response.data);
  },

  /**
   * 批量切换启用状态
   */
  batchToggleEnabled: (ids: number[], enabled: boolean): Promise<ApiResponse<null>> => {
    return httpClient.post('/mcp-servers/batch-toggle', { ids, enabled }).then(response => response.data);
  },

  /**
   * 批量删除 MCP 服务器
   */
  batchDeleteServers: (ids: number[]): Promise<ApiResponse<null>> => {
    return httpClient.post('/mcp-servers/batch-delete', { ids }).then(response => response.data);
  },

  /**
   * 生成 MCP 配置
   */
  generateMcpConfig: (providerId: string, cliType: CliType): Promise<ApiResponse<McpConfig>> => {  // 修改为 string
    return httpClient.get(`/mcp-servers/provider/${providerId}/cli/${cliType}/config`).then(response => response.data);
  },

  // ==================== Provider MCP 映射管理 ====================

  /**
   * 根据 Provider ID 和 CLI 类型查询关联的 MCP 服务器
   */
  getMappingsByProviderAndCli: (
    providerId: string,  // 修改为 string
    cliType: CliType
  ): Promise<ApiResponse<ProviderMcpMapping[]>> => {
    return httpClient.get('/provider-mcp-mappings', {
      params: { providerId, cliType }
    }).then(response => response.data);
  },

  /**
   * 根据 Provider ID 查询所有关联
   */
  getMappingsByProviderId: (providerId: string): Promise<ApiResponse<ProviderMcpMapping[]>> => {  // 修改为 string
    return httpClient.get(`/provider-mcp-mappings/provider/${providerId}`).then(response => response.data);
  },

  /**
   * 根据 ID 查询映射
   */
  getMappingById: (id: number): Promise<ApiResponse<ProviderMcpMapping>> => {
    return httpClient.get(`/provider-mcp-mappings/${id}`).then(response => response.data);
  },

  /**
   * 创建 Provider MCP 映射
   */
  createMapping: (mapping: ProviderMcpMapping): Promise<ApiResponse<ProviderMcpMapping>> => {
    return httpClient.post('/provider-mcp-mappings', mapping).then(response => response.data);
  },

  /**
   * 更新 Provider MCP 映射
   */
  updateMapping: (
    id: number,
    mapping: ProviderMcpMapping
  ): Promise<ApiResponse<ProviderMcpMapping>> => {
    return httpClient.put(`/provider-mcp-mappings/${id}`, mapping).then(response => response.data);
  },

  /**
   * 删除 Provider MCP 映射
   */
  deleteMapping: (id: number): Promise<ApiResponse<null>> => {
    return httpClient.delete(`/provider-mcp-mappings/${id}`).then(response => response.data);
  },

  /**
   * 批量保存 Provider MCP 映射
   */
  batchSaveMappings: (
    providerId: string,  // 修改为 string
    cliType: CliType,
    mappings: Partial<ProviderMcpMapping>[]
  ): Promise<ApiResponse<null>> => {
    return httpClient.post('/provider-mcp-mappings/batch-save', {
      providerId,
      cliType,
      mappings
    }).then(response => response.data);
  },

  /**
   * 更新映射优先级
   */
  updatePriority: (id: number, priority: number): Promise<ApiResponse<null>> => {
    return httpClient.patch(`/provider-mcp-mappings/${id}/priority`, null, {
      params: { priority }
    }).then(response => response.data);
  },

  /**
   * 批量更新优先级
   */
  batchUpdatePriority: (
    mappings: Array<{ id: number; priority: number }>
  ): Promise<ApiResponse<null>> => {
    return httpClient.post('/provider-mcp-mappings/batch-update-priority', mappings).then(response => response.data);
  },

  /**
   * 批量关联 MCP 服务器到 Provider
   */
  batchAssociateMcpServers: (
    providerId: string,
    cliType: CliType,
    mcpServerIds: number[]
  ): Promise<ApiResponse<null>> => {
    return httpClient.post('/provider-mcp-mappings/batch-associate', {
      providerId,
      cliType,
      mcpServerIds
    }).then(response => response.data);
  }
};
