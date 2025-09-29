# LLMctl Desktop 前端开发指南

## 项目结构

```
electron-app/
├── src/
│   ├── main/                # Electron 主进程
│   │   ├── main.ts         # 主入口文件
│   │   └── menu.ts         # 应用菜单
│   ├── renderer/           # 渲染进程 (React)
│   │   ├── components/     # React 组件
│   │   │   ├── Provider/   # Provider管理
│   │   │   ├── Token/      # Token管理
│   │   │   ├── Session/    # 会话管理
│   │   │   ├── Settings/   # 系统设置
│   │   │   └── Common/     # 通用组件
│   │   ├── services/       # API服务层
│   │   ├── store/          # Redux状态管理
│   │   ├── types/          # TypeScript类型定义
│   │   └── App.tsx         # 主应用组件
│   └── preload/            # 预加载脚本
├── package.json
├── tsconfig.json
├── webpack.main.config.js  # 主进程Webpack配置
└── webpack.renderer.config.js # 渲染进程Webpack配置
```

## 技术栈

- **Electron**: 桌面应用框架
- **React 18**: UI框架
- **TypeScript**: 类型安全
- **Ant Design**: UI组件库
- **Redux Toolkit**: 状态管理
- **Axios**: HTTP客户端

## 开发命令

### 安装依赖
```bash
cd electron-app
npm install
```

### 开发模式
```bash
# 启动开发服务器 (主进程 + 渲染进程)
npm run dev

# 启动Electron应用 (需要先运行 npm run dev)
npm run electron:dev
```

### 构建生产版本
```bash
# 构建所有代码
npm run build

# 打包Electron应用
npm run dist

# 特定平台打包
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

## 开发注意事项

### 1. 后端服务依赖
前端应用依赖Spring Boot后端服务，请确保后端服务已启动：
- 后端地址: `http://localhost:8080/llmctl`
- 如果后端服务未启动，前端将显示连接错误

### 2. 数据库配置
虽然数据库连接可能失败，但Spring Boot应用仍可启动，前端可以测试API连接。

### 3. 开发流程
1. 启动后端Spring Boot服务: `mvn spring-boot:run`
2. 安装前端依赖: `cd electron-app && npm install`
3. 启动前端开发服务器: `npm run dev`
4. 在新终端启动Electron: `npm run electron:dev`

### 4. API接口
前端使用以下API接口与后端通信：
- `/providers` - Provider管理
- `/tokens` - Token管理
- `/sessions` - 会话管理
- `/config` - 配置管理
- `/statistics` - 使用统计

### 5. 错误处理
- 全局错误边界捕获React组件错误
- HTTP客户端自动处理网络错误和API错误
- 通知系统提供用户反馈

## 项目特性

- ✅ 响应式UI设计
- ✅ 类型安全的TypeScript开发
- ✅ 完整的状态管理
- ✅ 统一的错误处理
- ✅ 国际化支持
- ✅ 主题切换
- ✅ 跨平台支持

## 调试

### Electron 主进程调试
```bash
npm run electron:dev
# 主进程调试端口: 5858
```

### React 渲染进程调试
- 在Electron应用中按 `F12` 打开开发者工具
- 或在开发模式下自动打开开发者工具

## 生产部署

1. 构建应用: `npm run build`
2. 打包应用: `npm run dist`
3. 生成的安装包位于 `release/` 目录