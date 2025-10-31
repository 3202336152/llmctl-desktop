# MCP 管理功能 - Phase 2-5 完整实施指南

## ✅ 已完成的内容 (Phase 1-2 部分)

### Phase 1: 数据库和后端基础 ✅
- [x] 数据库迁移脚本（13个内置模板）
- [x] Entity 类（McpServer, ProviderMcpMapping）
- [x] DTO 类
- [x] JsonMapTypeHandler
- [x] Mapper 接口和 XML（McpServerMapper, ProviderMcpMappingMapper）
- [x] Service 层（McpServerService, ProviderMcpMappingService）
- [x] Controller 层（22个REST API）

### Phase 2: 前端基础组件（部分完成）
- [x] TypeScript 类型定义（`types/mcp.ts`）
- [x] mcpAPI 服务（`services/mcpAPI.ts`）
- [x] Redux mcpSlice（`store/slices/mcpSlice.ts`）
- [x] Redux store 集成

---

## 🚧 待实施内容 (Phase 2-5)

### Phase 2: 前端基础组件（剩余部分）

#### 1. McpServerManager 主页面

**文件**: `electron-app/src/renderer/components/Mcp/McpServerManager.tsx`

**核心功能**:
- 展示 MCP 服务器列表（Table）
- 搜索和过滤
- 批量操作（启用/禁用）
- 打开模板库
- 新增/编辑/删除服务器

**关键代码框架**:
```tsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Space, Tag, Popconfirm, Checkbox } from 'antd';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchMcpServers,
  deleteMcpServer,
  toggleMcpServerEnabled,
  batchToggleMcpServersEnabled
} from '../../store/slices/mcpSlice';
import McpServerForm from './McpServerForm';
import McpTemplateLibrary from './McpTemplateLibrary';
import { McpServer } from '../../types/mcp';

const McpServerManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { servers, loading } = useAppSelector((state) => state.mcp);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [templateLibVisible, setTemplateLibVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);

  useEffect(() => {
    dispatch(fetchMcpServers());
  }, [dispatch]);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: McpServer) => (
        <Space>
          {record.icon && <span>{record.icon}</span>}
          <span>{text}</span>
          {record.isTemplate && <Tag color="blue">模板</Tag>}
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type.toUpperCase()}</Tag>
    },
    {
      title: '命令',
      dataIndex: 'command',
      key: 'command'
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: McpServer) => (
        <Checkbox
          checked={enabled}
          onChange={(e) =>
            dispatch(toggleMcpServerEnabled({ id: record.id!, enabled: e.target.checked }))
          }
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: McpServer) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingServer(record);
              setFormVisible(true);
            }}
          >
            编辑
          </Button>
          {!record.isTemplate && (
            <Popconfirm
              title="确定删除吗？"
              onConfirm={() => dispatch(deleteMcpServer(record.id!))}
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchText.toLowerCase()) ||
      server.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search
              placeholder="搜索 MCP 服务器"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() =>
                dispatch(
                  batchToggleMcpServersEnabled({
                    ids: selectedRowKeys as number[],
                    enabled: true
                  })
                )
              }
            >
              批量启用
            </Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() =>
                dispatch(
                  batchToggleMcpServersEnabled({
                    ids: selectedRowKeys as number[],
                    enabled: false
                  })
                )
              }
            >
              批量禁用
            </Button>
          </Space>
          <Space>
            <Button onClick={() => setTemplateLibVisible(true)}>📚 模板库</Button>
            <Button type="primary" onClick={() => setFormVisible(true)}>
              + 新建
            </Button>
          </Space>
        </div>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys
          }}
          columns={columns}
          dataSource={filteredServers}
          rowKey="id"
          loading={loading}
        />
      </Space>

      <McpServerForm
        visible={formVisible}
        server={editingServer}
        onClose={() => {
          setFormVisible(false);
          setEditingServer(null);
        }}
      />

      <McpTemplateLibrary
        visible={templateLibVisible}
        onClose={() => setTemplateLibVisible(false)}
      />
    </div>
  );
};

export default McpServerManager;
```

#### 2. McpServerForm 表单组件

**文件**: `electron-app/src/renderer/components/Mcp/McpServerForm.tsx`

**核心功能**:
- 新增/编辑 MCP 服务器
- 表单验证
- 动态 args 和 env 输入

**关键代码框架**:
```tsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Space, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../../store';
import { createMcpServer, updateMcpServer } from '../../store/slices/mcpSlice';
import { McpServer } from '../../types/mcp';

interface Props {
  visible: boolean;
  server: McpServer | null;
  onClose: () => void;
}

const McpServerForm: React.FC<Props> = ({ visible, server, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (visible && server) {
      form.setFieldsValue(server);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, server, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (server) {
        await dispatch(updateMcpServer({ id: server.id!, server: values })).unwrap();
      } else {
        await dispatch(createMcpServer(values)).unwrap();
      }
      onClose();
    } catch (error) {
      console.error('表单提交失败:', error);
    }
  };

  return (
    <Modal
      title={server ? '编辑 MCP 服务器' : '新建 MCP 服务器'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入服务器名称' }]}
        >
          <Input placeholder="例如: my-filesystem" />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <Input.TextArea rows={2} placeholder="描述该 MCP 服务器的功能" />
        </Form.Item>

        <Form.Item name="type" label="类型" initialValue="stdio">
          <Select>
            <Select.Option value="stdio">stdio</Select.Option>
            <Select.Option value="sse">sse</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="command"
          label="启动命令"
          rules={[{ required: true, message: '请输入启动命令' }]}
        >
          <Input placeholder="例如: npx" />
        </Form.Item>

        <Form.List name="args">
          {(fields, { add, remove }) => (
            <>
              <div style={{ marginBottom: 8 }}>
                <label>命令参数</label>
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  添加参数
                </Button>
              </div>
              {fields.map((field, index) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item {...field} noStyle>
                    <Input placeholder={`参数 ${index + 1}`} style={{ width: 600 }}/>
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
            </>
          )}
        </Form.List>

        <Form.Item
          name="enabled"
          label="启用"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default McpServerForm;
```

---

### Phase 3: 模板库和 Provider 集成

#### 3. McpTemplateLibrary 模板库组件

**文件**: `electron-app/src/renderer/components/Mcp/McpTemplateLibrary.tsx`

**核心功能**:
- 按分类展示模板（filesystem, database, api, dev-tools）
- 卡片式布局
- 一键使用模板

**UI布局**:
```
┌─────────────────────────────────────────────┐
│  📁 Filesystem                              │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │📁    │ │📄    │ │💾    │                │
│  │file  │ │mem   │ │every │                │
│  │[Use] │ │[Use] │ │[Use] │                │
│  └──────┘ └──────┘ └──────┘                │
│                                             │
│  🐙 API & Services                          │
│  ┌──────┐ ┌──────┐                         │
│  │🐙    │ │☁️    │                         │
│  │github│ │maps  │                         │
│  │[Use] │ │[Use] │                         │
│  └──────┘ └──────┘                         │
└─────────────────────────────────────────────┘
```

#### 4. Provider MCP Config Tab

**集成位置**: `ProviderManager.tsx` Modal 中新增 Tab

**功能**:
- 展示当前 Provider 关联的 MCP 服务器
- 拖拽排序优先级
- 添加/删除关联
- 实时预览生成的配置

---

### Phase 4: 配置生成和注入

#### 修改 `SessionServiceImpl.java`

在创建 Session 时自动注入 MCP 配置：

```java
public Session createSession(CreateSessionRequest request) {
    // ... 原有逻辑 ...

    // 生成 MCP 配置
    Map<String, Object> mcpConfig = mcpServerService.generateMcpConfig(
        request.getProviderId(),
        request.getCliType()
    );

    // 根据 CLI 类型注入配置
    if ("claude code".equals(request.getCliType())) {
        injectClaudeCodeMcpConfig(workingDirectory, mcpConfig);
    } else if ("codex".equals(request.getCliType())) {
        injectCodexMcpConfig(workingDirectory, mcpConfig);
    }

    // ... 继续创建会话 ...
}

private void injectClaudeCodeMcpConfig(String workingDir, Map<String, Object> mcpConfig) {
    try {
        Path configPath = Paths.get(workingDir, ".claude", "config.json");
        Files.createDirectories(configPath.getParent());

        Map<String, Object> existingConfig = new HashMap<>();
        if (Files.exists(configPath)) {
            String content = Files.readString(configPath);
            existingConfig = objectMapper.readValue(content, Map.class);
        }

        existingConfig.put("mcpServers", mcpConfig);

        String configJson = objectMapper.writerWithDefaultPrettyPrinter()
            .writeValueAsString(existingConfig);
        Files.writeString(configPath, configJson);

        log.info("Claude Code MCP 配置注入成功: {}", configPath);
    } catch (Exception e) {
        log.error("Claude Code MCP 配置注入失败", e);
    }
}
```

---

### Phase 5: 国际化和优化

#### 国际化文件

**文件**: `electron-app/src/renderer/i18n/locales/zh.json`

添加 MCP 相关翻译:
```json
{
  "mcp": {
    "title": "MCP 服务器",
    "createServer": "新建服务器",
    "templateLibrary": "模板库",
    "serverName": "服务器名称",
    "description": "描述",
    "type": "类型",
    "command": "启动命令",
    "args": "命令参数",
    "enabled": "启用",
    "categories": {
      "filesystem": "文件系统",
      "database": "数据库",
      "api": "API & 服务",
      "dev-tools": "开发工具"
    }
  }
}
```

---

## 🎯 快速实施步骤

### Step 1: 完成前端组件
1. 创建 `McpServerManager.tsx`（主页面）
2. 创建 `McpServerForm.tsx`（表单）
3. 创建 `McpTemplateLibrary.tsx`（模板库）
4. 在 `App.tsx` 中添加路由

### Step 2: 集成到 Provider
1. 修改 `ProviderManager.tsx`
2. 添加 "MCP Config" Tab
3. 实现 Provider-MCP 关联界面

### Step 3: 后端配置注入
1. 修改 `SessionServiceImpl.java`
2. 添加 `injectClaudeCodeMcpConfig()` 方法
3. 添加 `injectCodexMcpConfig()` 方法（如需要）

### Step 4: 测试
1. 测试模板库
2. 测试创建/编辑/删除
3. 测试 Provider 关联
4. 测试配置生成
5. 测试 Session 启动时的配置注入

---

## 📊 预期效果

完成后，用户可以：
1. 从模板库一键创建常用 MCP 服务器（filesystem, github, postgres 等）
2. 为每个 Provider 的不同 CLI 配置专属的 MCP 服务器
3. 启动 Session 时自动注入 MCP 配置到 `.claude/config.json`
4. 在终端中直接使用 MCP 功能，无需手动配置

---

## 🔗 相关文档

- 设计文档: `docs/mcp-management-design.md`
- 测试指南: `docs/mcp-backend-testing-guide.md`
- API 文档: Postman 集合或 Swagger

---

## ✅ 检查清单

### 后端
- [x] 数据库表创建
- [x] 13 个内置模板
- [x] Mapper + XML
- [x] Service 层
- [x] Controller 层
- [ ] SessionServiceImpl 配置注入

### 前端
- [x] TypeScript 类型
- [x] mcpAPI 服务
- [x] mcpSlice
- [ ] McpServerManager
- [ ] McpServerForm
- [ ] McpTemplateLibrary
- [ ] Provider MCP Tab
- [ ] 国际化翻译

### 集成测试
- [ ] 端到端流程测试
- [ ] 不同 CLI 类型测试
- [ ] 配置合并测试

---

**预计剩余时间**: 6-9 天（Phase 2-5）
