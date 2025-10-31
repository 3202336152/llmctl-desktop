import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { McpServer, ProviderMcpMapping, ApiResponse } from '../../types/mcp';
import { mcpAPI } from '../../services/mcpAPI';
import { message } from 'antd';

/**
 * MCP 状态接口
 */
interface McpState {
  // MCP 服务器列表
  servers: McpServer[];
  // MCP 模板列表
  templates: McpServer[];
  // Provider MCP 映射列表
  mappings: ProviderMcpMapping[];
  // 加载状态
  loading: boolean;
  // 错误信息
  error: string | null;
  // 当前选中的服务器
  selectedServer: McpServer | null;
}

/**
 * 初始状态
 */
const initialState: McpState = {
  servers: [],
  templates: [],
  mappings: [],
  loading: false,
  error: null,
  selectedServer: null
};

/**
 * 排序 MCP 服务器列表
 * 规则：已启用优先，相同状态下按创建时间倒序
 */
const sortMcpServers = (servers: McpServer[]): McpServer[] => {
  return [...servers].sort((a, b) => {
    // 首先按 enabled 状态排序（已启用的在前）
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1;
    }
    // 相同状态下按创建时间倒序
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });
};

// ==================== Async Thunks ====================

/**
 * 获取所有 MCP 服务器
 */
export const fetchMcpServers = createAsyncThunk(
  'mcp/fetchServers',
  async (_, { rejectWithValue }) => {
    try {
      const response: ApiResponse<McpServer[]> = await mcpAPI.getAllServers();
      if (response.code === 200) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error: any) {
      return rejectWithValue(error.message || '获取 MCP 服务器失败');
    }
  }
);

/**
 * 获取所有 MCP 模板
 */
export const fetchMcpTemplates = createAsyncThunk(
  'mcp/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response: ApiResponse<McpServer[]> = await mcpAPI.getAllTemplates();
      if (response.code === 200) {
        return response.data;
      }
      return rejectWithValue(response.message);
    } catch (error: any) {
      return rejectWithValue(error.message || '获取 MCP 模板失败');
    }
  }
);

/**
 * 创建 MCP 服务器
 */
export const createMcpServer = createAsyncThunk(
  'mcp/createServer',
  async (server: McpServer, { rejectWithValue }) => {
    try {
      const response: ApiResponse<McpServer> = await mcpAPI.createServer(server);
      if (response.code === 200) {
        message.success('MCP 服务器创建成功');
        return response.data;
      }
      message.error(response.message);
      return rejectWithValue(response.message);
    } catch (error: any) {
      message.error(error.message || '创建 MCP 服务器失败');
      return rejectWithValue(error.message || '创建 MCP 服务器失败');
    }
  }
);

/**
 * 从模板创建 MCP 服务器
 */
export const createFromTemplate = createAsyncThunk(
  'mcp/createFromTemplate',
  async (
    { templateId, customConfig }: { templateId: number; customConfig: Record<string, any> },
    { rejectWithValue }
  ) => {
    try {
      const response: ApiResponse<McpServer> = await mcpAPI.createFromTemplate(
        templateId,
        customConfig
      );
      if (response.code === 200) {
        message.success('从模板创建 MCP 服务器成功');
        return response.data;
      }
      message.error(response.message);
      return rejectWithValue(response.message);
    } catch (error: any) {
      message.error(error.message || '从模板创建 MCP 服务器失败');
      return rejectWithValue(error.message || '从模板创建 MCP 服务器失败');
    }
  }
);

/**
 * 更新 MCP 服务器
 */
export const updateMcpServer = createAsyncThunk(
  'mcp/updateServer',
  async ({ id, server }: { id: number; server: McpServer }, { rejectWithValue }) => {
    try {
      const response: ApiResponse<McpServer> = await mcpAPI.updateServer(id, server);
      if (response.code === 200) {
        message.success('MCP 服务器更新成功');
        return response.data;
      }
      message.error(response.message);
      return rejectWithValue(response.message);
    } catch (error: any) {
      message.error(error.message || '更新 MCP 服务器失败');
      return rejectWithValue(error.message || '更新 MCP 服务器失败');
    }
  }
);

/**
 * 删除 MCP 服务器
 */
export const deleteMcpServer = createAsyncThunk(
  'mcp/deleteServer',
  async (id: number, { rejectWithValue }) => {
    try {
      const response: ApiResponse<null> = await mcpAPI.deleteServer(id);
      if (response.code === 200) {
        // message.success('MCP 服务器删除成功');
        return id;
      }
      message.error(response.message);
      return rejectWithValue(response.message);
    } catch (error: any) {
      message.error(error.message || '删除 MCP 服务器失败');
      return rejectWithValue(error.message || '删除 MCP 服务器失败');
    }
  }
);

/**
 * 切换启用状态
 */
export const toggleMcpServerEnabled = createAsyncThunk(
  'mcp/toggleEnabled',
  async ({ id, enabled }: { id: number; enabled: boolean }, { rejectWithValue }) => {
    try {
      const response: ApiResponse<null> = await mcpAPI.toggleEnabled(id, enabled);
      if (response.code === 200) {
        message.success(`MCP 服务器已${enabled ? '启用' : '禁用'}`);
        return { id, enabled };
      }
      message.error(response.message);
      return rejectWithValue(response.message);
    } catch (error: any) {
      message.error(error.message || '切换状态失败');
      return rejectWithValue(error.message || '切换状态失败');
    }
  }
);

/**
 * 批量切换启用状态
 */
export const batchToggleMcpServersEnabled = createAsyncThunk(
  'mcp/batchToggleEnabled',
  async ({ ids, enabled }: { ids: number[]; enabled: boolean }, { rejectWithValue }) => {
    try {
      const response: ApiResponse<null> = await mcpAPI.batchToggleEnabled(ids, enabled);
      if (response.code === 200) {
        message.success(`批量操作成功`);
        return { ids, enabled };
      }
      message.error(response.message);
      return rejectWithValue(response.message);
    } catch (error: any) {
      message.error(error.message || '批量操作失败');
      return rejectWithValue(error.message || '批量操作失败');
    }
  }
);

/**
 * 批量删除 MCP 服务器
 */
export const batchDeleteMcpServers = createAsyncThunk(
  'mcp/batchDelete',
  async (ids: number[], { rejectWithValue }) => {
    try {
      const response: ApiResponse<null> = await mcpAPI.batchDeleteServers(ids);
      if (response.code === 200) {
        message.success('批量删除成功');
        return ids;
      }
      message.error(response.message);
      return rejectWithValue(response.message);
    } catch (error: any) {
      message.error(error.message || '批量删除失败');
      return rejectWithValue(error.message || '批量删除失败');
    }
  }
);

// ==================== Slice ====================

const mcpSlice = createSlice({
  name: 'mcp',
  initialState,
  reducers: {
    /**
     * 清除错误
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * 设置选中的服务器
     */
    setSelectedServer: (state, action: PayloadAction<McpServer | null>) => {
      state.selectedServer = action.payload;
    },

    /**
     * 清除选中的服务器
     */
    clearSelectedServer: (state) => {
      state.selectedServer = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchMcpServers
      .addCase(fetchMcpServers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMcpServers.fulfilled, (state, action) => {
        state.loading = false;
        state.servers = sortMcpServers(action.payload);
      })
      .addCase(fetchMcpServers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchMcpTemplates
      .addCase(fetchMcpTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMcpTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchMcpTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // createMcpServer
      .addCase(createMcpServer.fulfilled, (state, action) => {
        state.servers.unshift(action.payload);
        state.servers = sortMcpServers(state.servers);
      })

      // createFromTemplate
      .addCase(createFromTemplate.fulfilled, (state, action) => {
        state.servers.unshift(action.payload);
        state.servers = sortMcpServers(state.servers);
      })

      // updateMcpServer
      .addCase(updateMcpServer.fulfilled, (state, action) => {
        const index = state.servers.findIndex((s: McpServer) => s.id === action.payload.id);
        if (index !== -1) {
          state.servers[index] = action.payload;
        }
      })

      // deleteMcpServer
      .addCase(deleteMcpServer.fulfilled, (state, action) => {
        state.servers = state.servers.filter((s: McpServer) => s.id !== action.payload);
      })

      // toggleMcpServerEnabled
      .addCase(toggleMcpServerEnabled.fulfilled, (state, action) => {
        const { id, enabled } = action.payload;
        const server = state.servers.find((s: McpServer) => s.id === id);
        if (server) {
          server.enabled = enabled;
          // 重新排序列表
          state.servers = sortMcpServers(state.servers);
        }
      })

      // batchToggleMcpServersEnabled
      .addCase(batchToggleMcpServersEnabled.fulfilled, (state, action) => {
        const { ids, enabled } = action.payload;
        state.servers.forEach((server: McpServer) => {
          if (ids.includes(server.id!)) {
            server.enabled = enabled;
          }
        });
        // 重新排序列表
        state.servers = sortMcpServers(state.servers);
      })

      // batchDeleteMcpServers
      .addCase(batchDeleteMcpServers.fulfilled, (state, action) => {
        const ids = action.payload;
        state.servers = state.servers.filter((s: McpServer) => !ids.includes(s.id!));
      });
  }
});

export const { clearError, setSelectedServer, clearSelectedServer } = mcpSlice.actions;

export default mcpSlice.reducer;
