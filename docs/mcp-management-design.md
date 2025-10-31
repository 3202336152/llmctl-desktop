# MCP 管理功能设计方案

## 📋 目录
- [功能概述](#功能概述)
- [数据库设计](#数据库设计)
- [后端架构](#后端架构)
- [前端架构](#前端架构)
- [用户体验设计](#用户体验设计)
- [技术实现细节](#技术实现细节)
- [实施步骤](#实施步骤)

---

## 功能概述

### 🎯 核心目标
为 LLMctl 添加 **MCP (Model Context Protocol) 管理功能**，让用户能够：
- 可视化管理 MCP 服务器配置
- 为不同的 Provider/CLI 工具关联 MCP 服务器
- 使用内置模板快速配置常用 MCP 服务器
- 自动生成并注入 MCP 配置到 CLI 工具

### 🌟 核心功能模块

1. **MCP 服务器管理** - 增删改查 MCP 服务器配置
2. **MCP 模板库** - 内置常用 MCP 服务器模板（filesystem、github、database 等）
3. **Provider-MCP 关联** - 为每个 Provider 的 CLI 配置关联 MCP 服务器
4. **配置生成器** - 根据 CLI 类型自动生成正确格式的 MCP 配置
5. **连接测试** - 测试 MCP 服务器连接状态
6. **批量操作** - 批量启用/禁用、导入导出

---

## 数据库设计

### 表结构设计

#### 1. `mcp_servers` 表 - MCP 服务器配置

```sql
CREATE TABLE `mcp_servers` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'MCP服务器ID',
  `name` VARCHAR(100) NOT NULL COMMENT 'MCP服务器名称',
  `description` VARCHAR(500) COMMENT '描述',
  `type` ENUM('stdio', 'sse') NOT NULL DEFAULT 'stdio' COMMENT 'MCP服务器类型',
  `command` VARCHAR(500) NOT NULL COMMENT '启动命令（如 node, python, npx等）',
  `args` JSON COMMENT '命令参数数组（JSON格式）',
  `env` JSON COMMENT '环境变量（JSON对象）',
  `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `is_template` TINYINT(1) DEFAULT 0 COMMENT '是否为模板',
  `template_category` VARCHAR(50) COMMENT '模板分类（filesystem, database, api, dev-tools等）',
  `icon` VARCHAR(50) COMMENT '图标名称（用于UI展示）',
  `config_hints` JSON COMMENT '配置提示信息（帮助用户填写参数）',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  INDEX `idx_enabled` (`enabled`),
  INDEX `idx_template` (`is_template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MCP服务器配置表';
```

#### 2. `provider_mcp_mappings` 表 - Provider与MCP的关联关系

```sql
CREATE TABLE `provider_mcp_mappings` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '映射ID',
  `provider_id` BIGINT NOT NULL COMMENT 'Provider ID',
  `mcp_server_id` BIGINT NOT NULL COMMENT 'MCP服务器ID',
  `cli_type` ENUM('claude code', 'codex', 'gemini', 'qoder') NOT NULL COMMENT 'CLI类型',
  `enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `priority` INT DEFAULT 0 COMMENT '优先级（数字越大优先级越高）',
  `custom_config` JSON COMMENT '自定义配置覆盖',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_provider_mcp_cli` (`provider_id`, `mcp_server_id`, `cli_type`),
  INDEX `idx_provider_id` (`provider_id`),
  INDEX `idx_mcp_server_id` (`mcp_server_id`),
  FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_servers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Provider与MCP服务器关联表';
```

### 数据示例

#### MCP 服务器模板示例

```json
// Filesystem MCP Server
{
  "name": "filesystem",
  "description": "访问本地文件系统，读写文件和目录",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/allowed-path"],
  "env": null,
  "is_template": true,
  "template_category": "filesystem",
  "icon": "folder",
  "config_hints": {
    "args[2]": "设置允许访问的根目录路径"
  }
}

// GitHub MCP Server
{
  "name": "github",
  "description": "访问GitHub仓库、Issues、PR等",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
  },
  "is_template": true,
  "template_category": "api",
  "icon": "github",
  "config_hints": {
    "env.GITHUB_PERSONAL_ACCESS_TOKEN": "从GitHub生成的Personal Access Token"
  }
}

// PostgreSQL MCP Server
{
  "name": "postgres",
  "description": "连接PostgreSQL数据库，执行查询",
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
  "env": null,
  "is_template": true,
  "template_category": "database",
  "icon": "database",
  "config_hints": {
    "args[2]": "PostgreSQL连接字符串，格式：postgresql://user:pass@host:port/dbname"
  }
}
```

---

## 后端架构

### 1. Entity 实体类

#### `McpServer.java`
```java
package com.llmctl.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

@Data
public class McpServer {
    private Long id;
    private String name;
    private String description;
    private String type; // stdio, sse
    private String command;
    private List<String> args;
    private Map<String, String> env;
    private Boolean enabled;
    private Boolean isTemplate;
    private String templateCategory;
    private String icon;
    private Map<String, String> configHints;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### `ProviderMcpMapping.java`
```java
package com.llmctl.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class ProviderMcpMapping {
    private Long id;
    private Long providerId;
    private Long mcpServerId;
    private String cliType;
    private Boolean enabled;
    private Integer priority;
    private Map<String, Object> customConfig;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 关联的MCP服务器对象（用于查询时JOIN）
    private McpServer mcpServer;
}
```

### 2. DTO 数据传输对象

#### `McpServerDTO.java`
```java
package com.llmctl.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class McpServerDTO {
    private Long id;
    private String name;
    private String description;
    private String type;
    private String command;
    private List<String> args;
    private Map<String, String> env;
    private Boolean enabled;
    private Boolean isTemplate;
    private String templateCategory;
    private String icon;
    private Map<String, String> configHints;
}
```

#### `ProviderMcpConfigDTO.java`
```java
package com.llmctl.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProviderMcpConfigDTO {
    private Long providerId;
    private String cliType;
    private List<McpMappingDTO> mcpServers;

    @Data
    public static class McpMappingDTO {
        private Long mcpServerId;
        private String mcpServerName;
        private Boolean enabled;
        private Integer priority;
        private Map<String, Object> customConfig;
    }
}
```

### 3. Mapper 数据访问层

#### `McpServerMapper.java`
```java
package com.llmctl.mapper;

import com.llmctl.entity.McpServer;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface McpServerMapper {

    @Select("SELECT * FROM mcp_servers WHERE id = #{id}")
    McpServer findById(Long id);

    @Select("SELECT * FROM mcp_servers ORDER BY created_at DESC")
    List<McpServer> findAll();

    @Select("SELECT * FROM mcp_servers WHERE is_template = 1 ORDER BY template_category, name")
    List<McpServer> findAllTemplates();

    @Select("SELECT * FROM mcp_servers WHERE name LIKE CONCAT('%', #{keyword}, '%') OR description LIKE CONCAT('%', #{keyword}, '%')")
    List<McpServer> searchByKeyword(String keyword);

    @Insert("INSERT INTO mcp_servers (name, description, type, command, args, env, enabled, is_template, template_category, icon, config_hints) " +
            "VALUES (#{name}, #{description}, #{type}, #{command}, #{args, typeHandler=com.llmctl.config.JsonTypeHandler}, " +
            "#{env, typeHandler=com.llmctl.config.JsonTypeHandler}, #{enabled}, #{isTemplate}, #{templateCategory}, #{icon}, " +
            "#{configHints, typeHandler=com.llmctl.config.JsonTypeHandler})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(McpServer mcpServer);

    @Update("UPDATE mcp_servers SET name=#{name}, description=#{description}, type=#{type}, command=#{command}, " +
            "args=#{args, typeHandler=com.llmctl.config.JsonTypeHandler}, env=#{env, typeHandler=com.llmctl.config.JsonTypeHandler}, " +
            "enabled=#{enabled}, template_category=#{templateCategory}, icon=#{icon}, " +
            "config_hints=#{configHints, typeHandler=com.llmctl.config.JsonTypeHandler} WHERE id=#{id}")
    int update(McpServer mcpServer);

    @Delete("DELETE FROM mcp_servers WHERE id = #{id} AND is_template = 0")
    int deleteById(Long id);

    @Update("UPDATE mcp_servers SET enabled = #{enabled} WHERE id = #{id}")
    int updateEnabled(@Param("id") Long id, @Param("enabled") Boolean enabled);
}
```

#### `ProviderMcpMappingMapper.java`
```java
package com.llmctl.mapper;

import com.llmctl.entity.ProviderMcpMapping;
import org.apache.ibatis.annotations.*;
import java.util.List;

@Mapper
public interface ProviderMcpMappingMapper {

    @Select("SELECT m.*, s.name as mcpServerName FROM provider_mcp_mappings m " +
            "LEFT JOIN mcp_servers s ON m.mcp_server_id = s.id " +
            "WHERE m.provider_id = #{providerId} AND m.cli_type = #{cliType} " +
            "ORDER BY m.priority DESC, m.created_at")
    @Results({
        @Result(property = "mcpServer", column = "mcp_server_id",
                one = @One(select = "com.llmctl.mapper.McpServerMapper.findById"))
    })
    List<ProviderMcpMapping> findByProviderAndCli(@Param("providerId") Long providerId, @Param("cliType") String cliType);

    @Select("SELECT * FROM provider_mcp_mappings WHERE provider_id = #{providerId}")
    List<ProviderMcpMapping> findByProviderId(Long providerId);

    @Insert("INSERT INTO provider_mcp_mappings (provider_id, mcp_server_id, cli_type, enabled, priority, custom_config) " +
            "VALUES (#{providerId}, #{mcpServerId}, #{cliType}, #{enabled}, #{priority}, " +
            "#{customConfig, typeHandler=com.llmctl.config.JsonTypeHandler})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(ProviderMcpMapping mapping);

    @Update("UPDATE provider_mcp_mappings SET enabled=#{enabled}, priority=#{priority}, " +
            "custom_config=#{customConfig, typeHandler=com.llmctl.config.JsonTypeHandler} WHERE id=#{id}")
    int update(ProviderMcpMapping mapping);

    @Delete("DELETE FROM provider_mcp_mappings WHERE id = #{id}")
    int deleteById(Long id);

    @Delete("DELETE FROM provider_mcp_mappings WHERE provider_id = #{providerId} AND cli_type = #{cliType}")
    int deleteByProviderAndCli(@Param("providerId") Long providerId, @Param("cliType") String cliType);
}
```

### 4. Service 业务逻辑层

#### `McpServerService.java` (接口)
```java
package com.llmctl.service;

import com.llmctl.entity.McpServer;
import java.util.List;
import java.util.Map;

public interface McpServerService {
    List<McpServer> getAllServers();
    List<McpServer> getAllTemplates();
    List<McpServer> searchServers(String keyword);
    McpServer getServerById(Long id);
    McpServer createServer(McpServer mcpServer);
    McpServer createFromTemplate(Long templateId, Map<String, Object> customConfig);
    McpServer updateServer(McpServer mcpServer);
    void deleteServer(Long id);
    void toggleEnabled(Long id, Boolean enabled);
    void batchToggleEnabled(List<Long> ids, Boolean enabled);
    Map<String, Object> generateMcpConfig(Long providerId, String cliType);
}
```

#### `McpServerServiceImpl.java` (实现)
```java
package com.llmctl.service.impl;

import com.llmctl.entity.McpServer;
import com.llmctl.entity.ProviderMcpMapping;
import com.llmctl.mapper.McpServerMapper;
import com.llmctl.mapper.ProviderMcpMappingMapper;
import com.llmctl.service.McpServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class McpServerServiceImpl implements McpServerService {

    private final McpServerMapper mcpServerMapper;
    private final ProviderMcpMappingMapper mappingMapper;

    @Override
    public List<McpServer> getAllServers() {
        return mcpServerMapper.findAll();
    }

    @Override
    public List<McpServer> getAllTemplates() {
        return mcpServerMapper.findAllTemplates();
    }

    @Override
    public List<McpServer> searchServers(String keyword) {
        return mcpServerMapper.searchByKeyword(keyword);
    }

    @Override
    public McpServer getServerById(Long id) {
        return mcpServerMapper.findById(id);
    }

    @Override
    @Transactional
    public McpServer createServer(McpServer mcpServer) {
        mcpServer.setIsTemplate(false);
        mcpServerMapper.insert(mcpServer);
        return mcpServer;
    }

    @Override
    @Transactional
    public McpServer createFromTemplate(Long templateId, Map<String, Object> customConfig) {
        McpServer template = mcpServerMapper.findById(templateId);
        if (template == null || !template.getIsTemplate()) {
            throw new IllegalArgumentException("Invalid template ID");
        }

        // 克隆模板并应用自定义配置
        McpServer newServer = new McpServer();
        newServer.setName((String) customConfig.getOrDefault("name", template.getName()));
        newServer.setDescription(template.getDescription());
        newServer.setType(template.getType());
        newServer.setCommand(template.getCommand());
        newServer.setArgs((List<String>) customConfig.getOrDefault("args", template.getArgs()));
        newServer.setEnv((Map<String, String>) customConfig.getOrDefault("env", template.getEnv()));
        newServer.setEnabled(true);
        newServer.setIsTemplate(false);
        newServer.setIcon(template.getIcon());

        mcpServerMapper.insert(newServer);
        return newServer;
    }

    @Override
    @Transactional
    public McpServer updateServer(McpServer mcpServer) {
        mcpServerMapper.update(mcpServer);
        return mcpServer;
    }

    @Override
    @Transactional
    public void deleteServer(Long id) {
        mcpServerMapper.deleteById(id);
    }

    @Override
    public void toggleEnabled(Long id, Boolean enabled) {
        mcpServerMapper.updateEnabled(id, enabled);
    }

    @Override
    @Transactional
    public void batchToggleEnabled(List<Long> ids, Boolean enabled) {
        ids.forEach(id -> mcpServerMapper.updateEnabled(id, enabled));
    }

    @Override
    public Map<String, Object> generateMcpConfig(Long providerId, String cliType) {
        List<ProviderMcpMapping> mappings = mappingMapper.findByProviderAndCli(providerId, cliType);

        Map<String, Object> mcpConfig = new HashMap<>();

        for (ProviderMcpMapping mapping : mappings) {
            if (!mapping.getEnabled()) continue;

            McpServer server = mapping.getMcpServer();
            if (server == null || !server.getEnabled()) continue;

            Map<String, Object> serverConfig = new HashMap<>();
            serverConfig.put("command", server.getCommand());
            serverConfig.put("args", server.getArgs());
            if (server.getEnv() != null && !server.getEnv().isEmpty()) {
                serverConfig.put("env", server.getEnv());
            }

            // 应用自定义配置覆盖
            if (mapping.getCustomConfig() != null) {
                serverConfig.putAll(mapping.getCustomConfig());
            }

            mcpConfig.put(server.getName(), serverConfig);
        }

        return mcpConfig;
    }
}
```

### 5. Controller 控制器层

#### `McpServerController.java`
```java
package com.llmctl.controller;

import com.llmctl.entity.McpServer;
import com.llmctl.service.McpServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/mcp-servers")
@RequiredArgsConstructor
public class McpServerController {

    private final McpServerService mcpServerService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllServers() {
        List<McpServer> servers = mcpServerService.getAllServers();
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "Success",
            "data", servers
        ));
    }

    @GetMapping("/templates")
    public ResponseEntity<Map<String, Object>> getAllTemplates() {
        List<McpServer> templates = mcpServerService.getAllTemplates();
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "Success",
            "data", templates
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchServers(@RequestParam String keyword) {
        List<McpServer> servers = mcpServerService.searchServers(keyword);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "Success",
            "data", servers
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getServerById(@PathVariable Long id) {
        McpServer server = mcpServerService.getServerById(id);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "Success",
            "data", server
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createServer(@RequestBody McpServer mcpServer) {
        McpServer created = mcpServerService.createServer(mcpServer);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "MCP Server created successfully",
            "data", created
        ));
    }

    @PostMapping("/from-template")
    public ResponseEntity<Map<String, Object>> createFromTemplate(
            @RequestParam Long templateId,
            @RequestBody Map<String, Object> customConfig) {
        McpServer created = mcpServerService.createFromTemplate(templateId, customConfig);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "MCP Server created from template",
            "data", created
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateServer(
            @PathVariable Long id,
            @RequestBody McpServer mcpServer) {
        mcpServer.setId(id);
        McpServer updated = mcpServerService.updateServer(mcpServer);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "MCP Server updated successfully",
            "data", updated
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteServer(@PathVariable Long id) {
        mcpServerService.deleteServer(id);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "MCP Server deleted successfully"
        ));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Map<String, Object>> toggleEnabled(
            @PathVariable Long id,
            @RequestParam Boolean enabled) {
        mcpServerService.toggleEnabled(id, enabled);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "MCP Server status updated"
        ));
    }

    @PostMapping("/batch-toggle")
    public ResponseEntity<Map<String, Object>> batchToggleEnabled(
            @RequestBody Map<String, Object> request) {
        List<Long> ids = (List<Long>) request.get("ids");
        Boolean enabled = (Boolean) request.get("enabled");
        mcpServerService.batchToggleEnabled(ids, enabled);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "Batch operation completed"
        ));
    }

    @GetMapping("/provider/{providerId}/cli/{cliType}/config")
    public ResponseEntity<Map<String, Object>> generateMcpConfig(
            @PathVariable Long providerId,
            @PathVariable String cliType) {
        Map<String, Object> config = mcpServerService.generateMcpConfig(providerId, cliType);
        return ResponseEntity.ok(Map.of(
            "code", 200,
            "message", "Success",
            "data", config
        ));
    }
}
```

---

## 前端架构

### 1. TypeScript 类型定义

#### `types/mcp.ts`
```typescript
export interface McpServer {
  id?: number;
  name: string;
  description?: string;
  type: 'stdio' | 'sse';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
  isTemplate?: boolean;
  templateCategory?: string;
  icon?: string;
  configHints?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderMcpMapping {
  id?: number;
  providerId: number;
  mcpServerId: number;
  cliType: 'claude code' | 'codex' | 'gemini' | 'qoder';
  enabled: boolean;
  priority: number;
  customConfig?: Record<string, any>;
  mcpServer?: McpServer;
}

export interface McpTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  configHints: Record<string, string>;
}
```

### 2. Redux Store - mcpSlice.ts

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { McpServer, ProviderMcpMapping } from '../types/mcp';
import { mcpAPI } from '../services/mcpAPI';

interface McpState {
  servers: McpServer[];
  templates: McpServer[];
  mappings: ProviderMcpMapping[];
  loading: boolean;
  error: string | null;
}

const initialState: McpState = {
  servers: [],
  templates: [],
  mappings: [],
  loading: false,
  error: null,
};

export const fetchMcpServers = createAsyncThunk(
  'mcp/fetchServers',
  async () => {
    const response = await mcpAPI.getAllServers();
    return response.data;
  }
);

export const fetchMcpTemplates = createAsyncThunk(
  'mcp/fetchTemplates',
  async () => {
    const response = await mcpAPI.getAllTemplates();
    return response.data;
  }
);

export const createMcpServer = createAsyncThunk(
  'mcp/createServer',
  async (server: McpServer) => {
    const response = await mcpAPI.createServer(server);
    return response.data;
  }
);

export const updateMcpServer = createAsyncThunk(
  'mcp/updateServer',
  async ({ id, server }: { id: number; server: McpServer }) => {
    const response = await mcpAPI.updateServer(id, server);
    return response.data;
  }
);

export const deleteMcpServer = createAsyncThunk(
  'mcp/deleteServer',
  async (id: number) => {
    await mcpAPI.deleteServer(id);
    return id;
  }
);

const mcpSlice = createSlice({
  name: 'mcp',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMcpServers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMcpServers.fulfilled, (state, action) => {
        state.loading = false;
        state.servers = action.payload;
      })
      .addCase(fetchMcpServers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch MCP servers';
      })
      .addCase(fetchMcpTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      })
      .addCase(createMcpServer.fulfilled, (state, action) => {
        state.servers.push(action.payload);
      })
      .addCase(updateMcpServer.fulfilled, (state, action) => {
        const index = state.servers.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.servers[index] = action.payload;
        }
      })
      .addCase(deleteMcpServer.fulfilled, (state, action) => {
        state.servers = state.servers.filter(s => s.id !== action.payload);
      });
  },
});

export const { clearError } = mcpSlice.actions;
export default mcpSlice.reducer;
```

### 3. API Service - mcpAPI.ts

```typescript
import axios from 'axios';
import { McpServer, ProviderMcpMapping } from '../types/mcp';

const API_BASE = 'http://localhost:8080/llmctl';

export const mcpAPI = {
  // MCP Server APIs
  getAllServers: () => axios.get(`${API_BASE}/mcp-servers`),

  getAllTemplates: () => axios.get(`${API_BASE}/mcp-servers/templates`),

  searchServers: (keyword: string) =>
    axios.get(`${API_BASE}/mcp-servers/search`, { params: { keyword } }),

  getServerById: (id: number) => axios.get(`${API_BASE}/mcp-servers/${id}`),

  createServer: (server: McpServer) =>
    axios.post(`${API_BASE}/mcp-servers`, server),

  createFromTemplate: (templateId: number, customConfig: Record<string, any>) =>
    axios.post(`${API_BASE}/mcp-servers/from-template`, customConfig, {
      params: { templateId }
    }),

  updateServer: (id: number, server: McpServer) =>
    axios.put(`${API_BASE}/mcp-servers/${id}`, server),

  deleteServer: (id: number) => axios.delete(`${API_BASE}/mcp-servers/${id}`),

  toggleEnabled: (id: number, enabled: boolean) =>
    axios.patch(`${API_BASE}/mcp-servers/${id}/toggle`, null, { params: { enabled } }),

  batchToggleEnabled: (ids: number[], enabled: boolean) =>
    axios.post(`${API_BASE}/mcp-servers/batch-toggle`, { ids, enabled }),

  // Provider-MCP Mapping APIs
  getProviderMcpMappings: (providerId: number, cliType: string) =>
    axios.get(`${API_BASE}/provider-mcp-mappings`, { params: { providerId, cliType } }),

  createMapping: (mapping: ProviderMcpMapping) =>
    axios.post(`${API_BASE}/provider-mcp-mappings`, mapping),

  updateMapping: (id: number, mapping: ProviderMcpMapping) =>
    axios.put(`${API_BASE}/provider-mcp-mappings/${id}`, mapping),

  deleteMapping: (id: number) =>
    axios.delete(`${API_BASE}/provider-mcp-mappings/${id}`),

  // Config Generation
  generateMcpConfig: (providerId: number, cliType: string) =>
    axios.get(`${API_BASE}/mcp-servers/provider/${providerId}/cli/${cliType}/config`),
};
```

### 4. 主要 React 组件

#### 组件结构
```
components/
├── Mcp/
│   ├── McpServerManager.tsx       # MCP服务器管理主页面
│   ├── McpServerForm.tsx          # MCP服务器表单（新增/编辑）
│   ├── McpTemplateLibrary.tsx     # MCP模板库
│   ├── McpTemplateCard.tsx        # 模板卡片
│   ├── ProviderMcpConfig.tsx      # Provider的MCP配置（Tab页）
│   ├── McpConfigPreview.tsx       # 配置预览组件
│   └── styles/
│       ├── McpServerManager.css
│       └── McpTemplateLibrary.css
```

#### `McpServerManager.tsx` (主要功能)
- MCP服务器列表（Table）
- 搜索过滤
- 批量操作（启用/禁用/删除）
- 打开模板库
- 打开新增/编辑表单

#### `McpTemplateLibrary.tsx` (模板库)
- 按分类展示模板（filesystem、database、api、dev-tools）
- 卡片式展示
- 快速预览模板配置
- 一键使用模板（弹出配置表单）

#### `ProviderMcpConfig.tsx` (Provider配置集成)
- 在 `ProviderManager.tsx` 的 Modal 中新增 "MCP 配置" Tab
- 展示当前 Provider 关联的 MCP 服务器
- 支持添加/删除关联
- 支持调整优先级
- 实时预览生成的 MCP 配置

---

## 用户体验设计

### 🎨 UI/UX 核心原则

1. **一键式操作** - 常用操作一键完成，减少用户操作步骤
2. **可视化配置** - 将复杂的 JSON 配置转换为表单界面
3. **实时预览** - 修改配置时实时预览生成的 CLI 配置
4. **智能提示** - 提供配置提示和示例
5. **模板化** - 内置常用 MCP 服务器模板，快速上手

### 📱 界面设计

#### 1. MCP 服务器管理页面

**布局**：
```
┌─────────────────────────────────────────────────┐
│  MCP Servers                        [+ New] [📚]│
├─────────────────────────────────────────────────┤
│  🔍 Search: [____________]  [✓ Batch Enable]    │
├─────────────────────────────────────────────────┤
│  Name          Type    Command    Status  Action│
│  ─────────────────────────────────────────────  │
│  📁 filesystem stdio   npx        ✅      [Edit]│
│  🐙 github     stdio   npx        ✅      [Edit]│
│  🗄️ postgres   stdio   npx        ❌      [Edit]│
└─────────────────────────────────────────────────┘
```

**功能按钮**：
- `[+ New]` - 新建 MCP 服务器
- `[📚]` - 打开模板库
- `[✓ Batch Enable]` - 批量启用选中的服务器
- `[Edit]` - 编辑/删除/启用/禁用

#### 2. MCP 模板库

**布局**：
```
┌─────────────────────────────────────────────────┐
│  MCP Template Library                    [Close]│
├─────────────────────────────────────────────────┤
│  📁 Filesystem                                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│  │📁         │ │📄         │ │💾         │     │
│  │filesystem │ │memory     │ │everything │     │
│  │访问本地   │ │内存存储   │ │全能助手   │     │
│  │文件系统   │ │           │ │           │     │
│  │[Use]      │ │[Use]      │ │[Use]      │     │
│  └───────────┘ └───────────┘ └───────────┘     │
│                                                  │
│  🐙 API & Services                               │
│  ┌───────────┐ ┌───────────┐                    │
│  │🐙         │ │☁️         │                    │
│  │github     │ │google-...│                    │
│  │访问GitHub │ │搜索引擎   │                    │
│  │[Use]      │ │[Use]      │                    │
│  └───────────┘ └───────────┘                    │
└─────────────────────────────────────────────────┘
```

#### 3. Provider MCP 配置 Tab

在 `ProviderManager` 的编辑 Modal 中新增 Tab：
```
┌─────────────────────────────────────────────────┐
│  Edit Provider: MyProvider                      │
├─────────────────────────────────────────────────┤
│  [Basic Info] [CLI Config] [MCP Config]         │
├─────────────────────────────────────────────────┤
│  MCP Servers for Claude Code CLI:               │
│                                                  │
│  ✅ 📁 filesystem    Priority: 1   [↑][↓][✕]   │
│  ✅ 🐙 github        Priority: 2   [↑][↓][✕]   │
│  ❌ 🗄️ postgres     Priority: 3   [↑][↓][✕]   │
│                                                  │
│  [+ Add MCP Server]                             │
│                                                  │
│  ───────────────────────────────────────────    │
│  📄 Generated Config Preview:                   │
│  {                                               │
│    "mcpServers": {                              │
│      "filesystem": {                            │
│        "command": "npx",                        │
│        "args": ["-y", "@model.../filesystem"]  │
│      }                                          │
│    }                                            │
│  }                                              │
└─────────────────────────────────────────────────┘
```

### 🔄 用户操作流程

#### 流程 1：从模板创建 MCP 服务器

1. 点击 `[📚 Template Library]`
2. 浏览模板分类，选择合适的模板（如 `filesystem`）
3. 点击 `[Use]` 按钮
4. 弹出配置表单，预填充模板默认值
5. 根据提示填写必填参数（如文件路径）
6. 点击 `[Create]`，完成创建

#### 流程 2：为 Provider 关联 MCP 服务器

1. 进入 `Providers` 页面
2. 编辑某个 Provider
3. 切换到 `[MCP Config]` Tab
4. 选择 CLI 类型（claude code / codex）
5. 点击 `[+ Add MCP Server]`
6. 选择已创建的 MCP 服务器
7. 调整优先级（拖拽排序）
8. 查看右侧的配置预览
9. 点击 `[Save]`

#### 流程 3：启动 Session 时自动注入 MCP 配置

1. 用户在 `Sessions` 页面创建新会话
2. 选择 Provider 和 CLI 类型
3. **后端自动生成 MCP 配置**，写入临时配置文件
4. 启动 CLI 进程时，通过环境变量或配置文件注入 MCP 配置
5. 用户在终端中可以直接使用 MCP 功能

---

## 技术实现细节

### 🔧 配置生成逻辑

不同 CLI 工具的 MCP 配置格式不同，需要适配：

#### Claude Code 配置格式
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/allowed-path"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    }
  }
}
```

#### Codex 配置格式
需要调研 Codex 的 MCP 配置方式，可能需要写入 `.codex/config.toml` 或其他配置文件。

### 📁 配置文件注入

在 `SessionServiceImpl.java` 的 `createSession` 方法中：

```java
// 1. 生成 MCP 配置
Map<String, Object> mcpConfig = mcpServerService.generateMcpConfig(providerId, cliType);

// 2. 根据 CLI 类型写入配置文件
if ("claude code".equals(cliType)) {
    // 写入 Claude Code 配置文件
    Path configPath = Paths.get(workingDirectory, ".claude", "config.json");
    Files.createDirectories(configPath.getParent());

    // 读取现有配置（如果存在）
    Map<String, Object> existingConfig = new HashMap<>();
    if (Files.exists(configPath)) {
        String content = Files.readString(configPath);
        existingConfig = objectMapper.readValue(content, Map.class);
    }

    // 合并 MCP 配置
    existingConfig.put("mcpServers", mcpConfig);

    // 写入配置文件
    String configJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(existingConfig);
    Files.writeString(configPath, configJson);
} else if ("codex".equals(cliType)) {
    // Codex 配置注入逻辑
    // TODO: 调研 Codex 的 MCP 配置方式
}
```

### 🔍 MyBatis JSON TypeHandler

由于 `args`、`env`、`custom_config` 等字段使用 JSON 类型存储，需要自定义 TypeHandler：

#### `JsonTypeHandler.java`
```java
package com.llmctl.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class JsonTypeHandler extends BaseTypeHandler<Object> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, Object parameter, JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, objectMapper.writeValueAsString(parameter));
        } catch (JsonProcessingException e) {
            throw new SQLException("Error converting object to JSON", e);
        }
    }

    @Override
    public Object getNullableResult(ResultSet rs, String columnName) throws SQLException {
        String json = rs.getString(columnName);
        return parseJson(json);
    }

    @Override
    public Object getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        String json = rs.getString(columnIndex);
        return parseJson(json);
    }

    @Override
    public Object getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        String json = cs.getString(columnIndex);
        return parseJson(json);
    }

    private Object parseJson(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
```

在 `application.yml` 中注册：
```yaml
mybatis:
  type-handlers-package: com.llmctl.config
```

---

## 实施步骤

### Phase 1: 数据库和后端基础 (2-3天)

1. ✅ 创建数据库表（`mcp_servers`, `provider_mcp_mappings`）
2. ✅ 插入内置模板数据
3. ✅ 实现 Entity、DTO、Mapper
4. ✅ 实现 Service 层业务逻辑
5. ✅ 实现 Controller REST API
6. ✅ 测试后端 API

### Phase 2: 前端基础组件 (2-3天)

1. ✅ 定义 TypeScript 类型
2. ✅ 实现 Redux mcpSlice
3. ✅ 实现 mcpAPI 服务
4. ✅ 实现 McpServerManager 主页面
5. ✅ 实现 McpServerForm 表单组件
6. ✅ 在主菜单中添加 "MCP Servers" 入口

### Phase 3: 模板库和 Provider 集成 (2-3天)

1. ✅ 实现 McpTemplateLibrary 组件
2. ✅ 实现模板卡片和分类展示
3. ✅ 在 ProviderManager 中添加 MCP Config Tab
4. ✅ 实现 Provider-MCP 关联配置界面
5. ✅ 实现配置预览组件

### Phase 4: 配置生成和注入 (2-3天)

1. ✅ 实现 MCP 配置生成逻辑
2. ✅ 修改 SessionServiceImpl，启动时注入 MCP 配置
3. ✅ 测试不同 CLI 类型的配置生成
4. ✅ 处理配置文件合并和覆盖逻辑

### Phase 5: 优化和测试 (1-2天)

1. ✅ 国际化支持（中英文翻译）
2. ✅ UI/UX 优化和样式调整
3. ✅ 批量操作功能
4. ✅ 错误处理和用户提示
5. ✅ 端到端测试
6. ✅ 文档更新

**预计总开发时间**: 9-14 天

---

## 附录

### A. 内置 MCP 模板列表

#### Filesystem Category
1. **filesystem** - 访问本地文件系统
2. **memory** - 内存中的键值存储
3. **everything** - Windows Everything 搜索集成

#### Database Category
4. **postgres** - PostgreSQL 数据库
5. **mysql** - MySQL 数据库
6. **sqlite** - SQLite 数据库

#### API & Services Category
7. **github** - GitHub API 集成
8. **google-maps** - Google Maps API
9. **brave-search** - Brave 搜索引擎
10. **fetch** - HTTP 请求工具

#### Development Tools Category
11. **git** - Git 版本控制
12. **puppeteer** - 浏览器自动化
13. **sequential-thinking** - 结构化思考工具

### B. 数据库迁移脚本模板

```sql
-- migration_v2.3.0_add_mcp.sql

-- 创建 mcp_servers 表
CREATE TABLE IF NOT EXISTS `mcp_servers` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(500),
  `type` ENUM('stdio', 'sse') NOT NULL DEFAULT 'stdio',
  `command` VARCHAR(500) NOT NULL,
  `args` JSON,
  `env` JSON,
  `enabled` TINYINT(1) DEFAULT 1,
  `is_template` TINYINT(1) DEFAULT 0,
  `template_category` VARCHAR(50),
  `icon` VARCHAR(50),
  `config_hints` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_name` (`name`),
  INDEX `idx_enabled` (`enabled`),
  INDEX `idx_template` (`is_template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建 provider_mcp_mappings 表
CREATE TABLE IF NOT EXISTS `provider_mcp_mappings` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `provider_id` BIGINT NOT NULL,
  `mcp_server_id` BIGINT NOT NULL,
  `cli_type` ENUM('claude code', 'codex', 'gemini', 'qoder') NOT NULL,
  `enabled` TINYINT(1) DEFAULT 1,
  `priority` INT DEFAULT 0,
  `custom_config` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_provider_mcp_cli` (`provider_id`, `mcp_server_id`, `cli_type`),
  INDEX `idx_provider_id` (`provider_id`),
  INDEX `idx_mcp_server_id` (`mcp_server_id`),
  FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mcp_server_id`) REFERENCES `mcp_servers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入内置模板数据
INSERT INTO `mcp_servers` (`name`, `description`, `type`, `command`, `args`, `is_template`, `template_category`, `icon`, `config_hints`) VALUES
('filesystem', '访问本地文件系统，读写文件和目录', 'stdio', 'npx', '[\"-y\", \"@modelcontextprotocol/server-filesystem\", \"C:/allowed-path\"]', 1, 'filesystem', 'folder', '{\"args[2]\": \"设置允许访问的根目录路径\"}'),
('github', '访问GitHub仓库、Issues、PR等', 'stdio', 'npx', '[\"-y\", \"@modelcontextprotocol/server-github\"]', 1, 'api', 'github', '{\"env.GITHUB_PERSONAL_ACCESS_TOKEN\": \"从GitHub生成的Personal Access Token\"}'),
('postgres', '连接PostgreSQL数据库，执行查询', 'stdio', 'npx', '[\"-y\", \"@modelcontextprotocol/server-postgres\", \"postgresql://localhost/mydb\"]', 1, 'database', 'database', '{\"args[2]\": \"PostgreSQL连接字符串，格式：postgresql://user:pass@host:port/dbname\"}');
```

---

## 总结

此设计方案提供了完整的 MCP 管理功能，核心优势：

✅ **用户友好** - 可视化配置，无需手写 JSON
✅ **模板化** - 内置常用 MCP 服务器模板，快速上手
✅ **灵活扩展** - 支持自定义 MCP 服务器
✅ **无缝集成** - 与 Provider、Session 深度集成
✅ **自动化** - 启动会话时自动注入 MCP 配置
✅ **跨 CLI 支持** - 适配不同 CLI 工具的配置格式

预计开发周期：**9-14 天**，即可为用户带来显著的效率提升！