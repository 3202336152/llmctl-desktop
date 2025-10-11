# LLMctl 前端快速打包指南

## 📦 打包流程

### Windows 用户（推荐使用批处理脚本）

```cmd
cd electron-app

# 1. 配置 API 地址
copy .env.example .env
notepad .env  # 修改 REACT_APP_API_BASE_URL

# 2. 运行打包脚本
scripts\build-windows.bat
```

### Linux/macOS 用户

```bash
cd electron-app

# 1. 配置 API 地址
cp .env .env
vi .env  # 修改 REACT_APP_API_BASE_URL

# 2. 赋予执行权限
chmod +x scripts/*.sh

# 3. 运行打包脚本（Windows）
./scripts/build-windows.sh

# 或打包所有平台
./scripts/build-all.sh
```

---

## 📂 输出文件

打包完成后，安装包位于 `release/` 目录：

- **Windows**: `LLMctl Setup 1.0.0.exe`
- **macOS**: `LLMctl-1.0.0.dmg`
- **Linux**: `LLMctl-1.0.0.AppImage`

---

## 🚀 分发给用户

1. 上传安装包到文件服务器或云存储
2. 提供下载链接给用户
3. 用户下载并安装

---

详细文档请查看: [FRONTEND_DEPLOY.md](../deploy/FRONTEND_DEPLOY.md)
