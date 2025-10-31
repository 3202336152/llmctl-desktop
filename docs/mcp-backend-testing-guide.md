# MCP 管理功能后端测试指南

## 📋 前置准备

### 1. 执行数据库迁移

```bash
# 连接到 MySQL 数据库
mysql -u root -p

# 选择 llmctl 数据库
USE llmctl;

# 执行迁移脚本
SOURCE D:/code/program/LLMctl/src/main/resources/db/migration_v2.3.0_add_mcp.sql;

# 验证表是否创建成功
SHOW TABLES;
DESC mcp_servers;
DESC provider_mcp_mappings;

# 验证模板数据是否插入成功
SELECT COUNT(*) FROM mcp_servers WHERE is_template = 1;
SELECT name, template_category FROM mcp_servers WHERE is_template = 1;
```

### 2. 编译和启动项目

```bash
# 进入项目目录
cd D:/code/program/LLMctl

# 清理并编译项目
mvn clean compile

# 启动应用
mvn spring-boot:run
```

应用启动后，后端 API 将在 `http://localhost:8080/llmctl` 上运行。

---

## 🧪 API 测试用例

### 1. MCP 服务器管理 API

#### 1.1 获取所有 MCP 服务器

```bash
curl -X GET http://localhost:8080/llmctl/mcp-servers
```

**预期结果**：
```json
{
  "code": 200,
  "message": "查询成功",
  "data": [...]
}
```

#### 1.2 获取所有模板

```bash
curl -X GET http://localhost:8080/llmctl/mcp-servers/templates
```

**预期结果**：返回 13 个内置模板

#### 1.3 根据分类获取模板

```bash
# 获取 filesystem 分类的模板
curl -X GET http://localhost:8080/llmctl/mcp-servers/templates/category/filesystem

# 获取 database 分类的模板
curl -X GET http://localhost:8080/llmctl/mcp-servers/templates/category/database

# 获取 api 分类的模板
curl -X GET http://localhost:8080/llmctl/mcp-servers/templates/category/api

# 获取 dev-tools 分类的模板
curl -X GET http://localhost:8080/llmctl/mcp-servers/templates/category/dev-tools
```

#### 1.4 搜索 MCP 服务器

```bash
curl -X GET "http://localhost:8080/llmctl/mcp-servers/search?keyword=github"
```

#### 1.5 创建 MCP 服务器

```bash
curl -X POST http://localhost:8080/llmctl/mcp-servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-filesystem",
    "description": "我的文件系统服务器",
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:/MyProjects"],
    "env": null,
    "enabled": true
  }'
```

**预期结果**：
```json
{
  "code": 200,
  "message": "MCP 服务器创建成功",
  "data": {
    "id": 14,
    "name": "my-filesystem",
    ...
  }
}
```

#### 1.6 从模板创建 MCP 服务器

```bash
curl -X POST "http://localhost:8080/llmctl/mcp-servers/from-template?templateId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-project-filesystem",
    "description": "项目文件系统",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:/MyProject"]
  }'
```

#### 1.7 更新 MCP 服务器

```bash
curl -X PUT http://localhost:8080/llmctl/mcp-servers/14 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-filesystem-updated",
    "description": "更新后的文件系统服务器",
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:/UpdatedPath"],
    "enabled": true
  }'
```

#### 1.8 切换启用状态

```bash
# 禁用
curl -X PATCH "http://localhost:8080/llmctl/mcp-servers/14/toggle?enabled=false"

# 启用
curl -X PATCH "http://localhost:8080/llmctl/mcp-servers/14/toggle?enabled=true"
```

#### 1.9 批量切换启用状态

```bash
curl -X POST http://localhost:8080/llmctl/mcp-servers/batch-toggle \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [14, 15, 16],
    "enabled": true
  }'
```

#### 1.10 删除 MCP 服务器

```bash
curl -X DELETE http://localhost:8080/llmctl/mcp-servers/14
```

**预期结果**：
```json
{
  "code": 200,
  "message": "MCP 服务器删除成功",
  "data": null
}
```

---

### 2. Provider MCP 映射 API

#### 2.1 查询 Provider 的 MCP 映射

```bash
# 假设 Provider ID = 1, CLI 类型 = claude code
curl -X GET "http://localhost:8080/llmctl/provider-mcp-mappings?providerId=1&cliType=claude%20code"
```

#### 2.2 创建 Provider MCP 映射

```bash
curl -X POST http://localhost:8080/llmctl/provider-mcp-mappings \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": 1,
    "mcpServerId": 1,
    "cliType": "claude code",
    "enabled": true,
    "priority": 10
  }'
```

**预期结果**：
```json
{
  "code": 200,
  "message": "Provider MCP 映射创建成功",
  "data": {
    "id": 1,
    "providerId": 1,
    "mcpServerId": 1,
    "cliType": "claude code",
    "enabled": true,
    "priority": 10,
    ...
  }
}
```

#### 2.3 批量保存 Provider MCP 映射

```bash
curl -X POST http://localhost:8080/llmctl/provider-mcp-mappings/batch-save \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": 1,
    "cliType": "claude code",
    "mappings": [
      {
        "mcpServerId": 1,
        "enabled": true,
        "priority": 10
      },
      {
        "mcpServerId": 8,
        "enabled": true,
        "priority": 5
      }
    ]
  }'
```

#### 2.4 更新映射优先级

```bash
curl -X PATCH "http://localhost:8080/llmctl/provider-mcp-mappings/1/priority?priority=20"
```

#### 2.5 批量更新优先级

```bash
curl -X POST http://localhost:8080/llmctl/provider-mcp-mappings/batch-update-priority \
  -H "Content-Type: application/json" \
  -d '[
    {"id": 1, "priority": 30},
    {"id": 2, "priority": 20},
    {"id": 3, "priority": 10}
  ]'
```

#### 2.6 删除 Provider MCP 映射

```bash
curl -X DELETE http://localhost:8080/llmctl/provider-mcp-mappings/1
```

---

### 3. MCP 配置生成 API

#### 3.1 生成 MCP 配置

```bash
# 为 Provider ID = 1 的 claude code CLI 生成 MCP 配置
curl -X GET http://localhost:8080/llmctl/mcp-servers/provider/1/cli/claude%20code/config
```

**预期结果**：
```json
{
  "code": 200,
  "message": "配置生成成功",
  "data": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "D:/MyProjects"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

---

## ✅ 测试检查清单

### 数据库层面
- [ ] `mcp_servers` 表创建成功
- [ ] `provider_mcp_mappings` 表创建成功
- [ ] 索引创建成功
- [ ] 外键约束创建成功
- [ ] 13 个内置模板插入成功

### API 层面
- [ ] 获取所有 MCP 服务器
- [ ] 获取所有模板
- [ ] 根据分类获取模板
- [ ] 搜索 MCP 服务器
- [ ] 创建 MCP 服务器
- [ ] 从模板创建 MCP 服务器
- [ ] 更新 MCP 服务器
- [ ] 切换启用状态
- [ ] 批量切换启用状态
- [ ] 删除 MCP 服务器（非模板）
- [ ] 创建 Provider MCP 映射
- [ ] 查询 Provider MCP 映射
- [ ] 批量保存 Provider MCP 映射
- [ ] 更新映射优先级
- [ ] 批量更新优先级
- [ ] 删除 Provider MCP 映射
- [ ] 生成 MCP 配置

### 业务逻辑验证
- [ ] 内置模板不能被删除
- [ ] 内置模板只能修改启用状态
- [ ] MCP 服务器名称不能重复
- [ ] 优先级排序正确（数字越大优先级越高）
- [ ] 配置生成时只包含启用的映射和服务器
- [ ] 自定义配置覆盖正确应用

---

## 🐛 常见问题

### 问题 1: 数据库连接失败

**现象**: 启动应用时报错 `Communications link failure`

**解决方案**:
1. 检查 MySQL 服务是否启动
2. 检查 `application.yml` 中的数据库连接配置
3. 检查用户名和密码是否正确

### 问题 2: JSON TypeHandler 报错

**现象**: 插入数据时报错 `No typehandler found for property`

**解决方案**:
1. 检查 `application.yml` 中是否配置了 `type-handlers-package`
2. 检查 TypeHandler 类是否添加了 `@MappedTypes` 和 `@MappedJdbcTypes` 注解

### 问题 3: 外键约束失败

**现象**: 插入映射时报错 `Cannot add or update a child row: a foreign key constraint fails`

**解决方案**:
1. 检查 `providerId` 和 `mcpServerId` 是否存在
2. 先创建 Provider 和 MCP 服务器，再创建映射

---

## 📊 性能测试

### 1. 批量操作性能

```bash
# 测试批量创建 100 个 MCP 服务器的性能
for i in {1..100}; do
  curl -X POST http://localhost:8080/llmctl/mcp-servers \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"test-server-$i\",
      \"description\": \"测试服务器 $i\",
      \"type\": \"stdio\",
      \"command\": \"npx\",
      \"args\": [\"-y\", \"@test/server\"],
      \"enabled\": true
    }"
done
```

### 2. 查询性能

```bash
# 测试查询所有服务器的性能
time curl -X GET http://localhost:8080/llmctl/mcp-servers
```

---

## 📝 测试报告模板

```
测试日期: 2025-01-30
测试人员: [您的名字]
测试环境: Windows 11 / MySQL 8.x / Java 17

| API 端点 | 状态 | 响应时间 | 备注 |
|---------|------|---------|------|
| GET /mcp-servers | ✅ | 120ms | - |
| GET /mcp-servers/templates | ✅ | 80ms | - |
| POST /mcp-servers | ✅ | 150ms | - |
| PUT /mcp-servers/{id} | ✅ | 130ms | - |
| DELETE /mcp-servers/{id} | ✅ | 90ms | - |
| POST /provider-mcp-mappings | ✅ | 140ms | - |
| GET /mcp-servers/provider/{id}/cli/{type}/config | ✅ | 200ms | - |

总体评价: [通过/失败]
```

---

## 🎯 下一步

Phase 1 后端测试通过后，继续执行：
- **Phase 2**: 前端基础组件
- **Phase 3**: 模板库和 Provider 集成
- **Phase 4**: 配置生成和注入
- **Phase 5**: 优化和测试
