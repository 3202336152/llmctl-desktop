# LLMctl 部署指南（CentOS + Docker + 外部数据库）

## 📦 部署流程

### 第一步：本地打包 JAR

在项目根目录执行：

```bash
mvn clean package -DskipTests
```

打包成功后，JAR 文件位于：`target/LLMctl-1.0-SNAPSHOT.jar`

---

### 第二步：上传文件到服务器

将以下文件上传到服务器的 `/opt/llmctl` 目录：

```bash
# 创建目录
mkdir -p /opt/llmctl

# 上传整个 deploy 目录
scp -r deploy/* root@your-server:/opt/llmctl/

# 上传 JAR 包
scp target/LLMctl-1.0-SNAPSHOT.jar root@your-server:/opt/llmctl/app.jar
```

---

### 第三步：配置环境变量

```bash
# SSH 登录服务器
ssh root@your-server

# 进入部署目录
cd /opt/llmctl

# 复制环境变量模板
cp .env.template .env

# 编辑配置
vi .env
```

**必须修改的配置项：**
- `JASYPT_PASSWORD`：Jasypt 加密密钥（用于解密 application.yml 中的数据库密码）
- `JWT_SECRET`：JWT 认证密钥

**生成密钥方法：**
```bash
openssl rand -base64 32
```

---

### 第四步：部署

```bash
# 赋予脚本执行权限
chmod +x scripts/*.sh

# 运行部署脚本
./scripts/deploy.sh
```

部署脚本会自动：
1. 检查 Docker 环境
2. 构建应用镜像
3. 启动应用容器
4. 验证服务健康状态

---

### 第五步：验证

```bash
# 检查容器状态
docker-compose ps

# 测试 API
curl http://localhost:8080/llmctl/actuator/health

# 查看日志
docker-compose logs -f app
```

---

## 📂 目录结构

```
deploy/
├── README.md              # 本文件
├── .env.template          # 环境变量模板
├── Dockerfile             # Docker 镜像配置
├── docker-compose.yml     # Docker Compose 配置
├── app.jar                # 应用 JAR 包（需要上传）
├── nginx/
│   └── llmctl.conf       # Nginx 反向代理配置（可选）
└── scripts/
    ├── deploy.sh         # 部署脚本
    ├── stop.sh           # 停止脚本
    └── restart.sh        # 重启脚本
```

---

## 🗄️ 数据库说明

**本部署方案使用外部 MySQL 数据库**

数据库连接信息已在 `application.yml` 中配置：
- **地址**: `117.72.200.2:3306`
- **数据库**: `llmctl`
- **用户**: `huanyu`
- **密码**: `ENC(P4JtACctTK7jRQERpp3ODF31VeH080Ak)` （Jasypt 加密）

**注意事项：**
1. 确保数据库服务器 `117.72.200.2` 可访问
2. 确保防火墙允许 3306 端口连接
3. `.env` 中的 `JASYPT_PASSWORD` 必须与加密密码时使用的密钥一致

---

## 🔧 常用命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f app

# 查看容器状态
docker-compose ps

# 进入容器
docker-compose exec app sh

# 清理并重新部署
docker-compose down
./scripts/deploy.sh
```

---

## 🔄 更新应用

当代码更新后，重新部署：

```bash
# 1. 本地重新打包
mvn clean package -DskipTests

# 2. 上传新的 JAR 包
scp target/LLMctl-1.0-SNAPSHOT.jar root@your-server:/opt/llmctl/app.jar

# 3. 服务器上重启
ssh root@your-server
cd /opt/llmctl
./scripts/restart.sh
```

---

## 🐛 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker-compose logs app

# 检查端口占用
netstat -tulpn | grep 8080

# 检查 JAR 包是否存在
ls -lh app.jar
```

### 数据库连接失败

```bash
# 测试数据库连接（从容器内）
docker-compose exec app sh
ping 117.72.200.2

# 检查数据库服务器防火墙
# 确保 3306 端口允许访问

# 验证 JASYPT_PASSWORD 是否正确
# 查看容器环境变量
docker-compose exec app env | grep JASYPT
```

### Jasypt 解密失败

如果看到 `Unable to decrypt` 错误：

1. 检查 `.env` 中的 `JASYPT_PASSWORD` 是否正确
2. 确保与 `application.yml` 中加密密码时使用的密钥一致
3. 重新启动容器：`./scripts/restart.sh`

### 应用启动慢

Java 应用启动需要 30-60 秒，请耐心等待。可以查看实时日志：

```bash
docker-compose logs -f app
```

---

## 🔐 安全建议

1. **修改默认密钥**：`.env` 文件中的 `JASYPT_PASSWORD` 和 `JWT_SECRET` 必须修改
2. **限制端口访问**：配置防火墙，只允许必要的端口访问
3. **使用 Nginx**：生产环境建议使用 Nginx 反向代理并配置 HTTPS
4. **定期备份**：定期备份数据库和配置文件

---

## 📞 获取帮助

- 查看容器状态：`docker-compose ps`
- 查看日志：`docker-compose logs -f app`
- 重启服务：`./scripts/restart.sh`
- 测试 API：`curl http://localhost:8080/llmctl/actuator/health`

---

**版本**: v2.0.4
**部署方式**: Docker + 外部 MySQL
**更新日期**: 2025-10-11
