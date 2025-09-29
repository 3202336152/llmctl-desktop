# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

LLMctl是一个LLM控制系统，正在从CLI工具重构为Electron + SpringBoot桌面应用。项目使用Spring Boot 3.x作为后端，MyBatis作为ORM框架，MySQL作为数据库。

## 开发环境要求

- Java 17+
- Maven 3.8+
- MySQL 8.x
- Node.js 18+ (前端Electron应用)

## 核心技术栈

### 后端技术栈
- Spring Boot 3.1.5
- MyBatis 3.0.2
- MySQL 8.x
- Spring Security Crypto
- Lombok

### 项目架构
```
src/main/java/com/llmctl/
├── LLMctlApplication.java    # SpringBoot启动类
├── controller/               # REST控制器层
├── service/                  # 业务服务层
├── mapper/                   # MyBatis数据访问层
├── entity/                   # 数据库实体类
├── dto/                      # 数据传输对象
├── config/                   # 配置类
└── utils/                    # 工具类
```

## 常用开发命令

### 构建和运行
```bash
# 编译项目
mvn clean compile

# 运行测试
mvn test

# 启动应用 (开发模式)
mvn spring-boot:run

# 打包JAR
mvn clean package

# 跳过测试打包
mvn clean package -DskipTests
```

### 数据库操作
```bash
# 创建数据库 (MySQL命令)
CREATE DATABASE llmctl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户
CREATE USER 'llmctl'@'localhost' IDENTIFIED BY 'llmctl123';
GRANT ALL PRIVILEGES ON llmctl.* TO 'llmctl'@'localhost';
```

## 核心功能模块

### 1. Provider管理
- 支持多种LLM Provider (Claude, OpenAI, Qwen, Gemini等)
- Provider配置的增删改查
- 模板化配置向导
- 配置验证机制

### 2. Token管理
- 多Token支持和轮询策略
- 4种轮询策略：round-robin, weighted, random, least-used
- 健康状态监控和故障自动切换
- Token使用统计

### 3. 会话管理
- CLI进程监控和生命周期管理
- 工作目录记录
- 实时状态更新
- 智能Token切换

### 4. 配置管理
- 导入导出功能 (支持bash, powershell, cmd, json格式)
- 环境变量生成
- 配置验证和备份恢复

## 数据库配置

项目使用MyBatis作为ORM框架：

- **Mapper位置**: `src/main/resources/mapper/*.xml`
- **实体包**: `com.llmctl.entity`
- **数据库URL**: `jdbc:mysql://localhost:3306/jfdev_db`
- **字段映射**: 自动下划线转驼峰命名

## API接口规范

- **Base URL**: `http://localhost:8080/llmctl`
- **响应格式**: 统一的JSON格式，包含code、message、data字段
- **主要接口模块**:
  - `/providers` - Provider管理
  - `/tokens` - Token管理
  - `/sessions` - 会话管理
  - `/config` - 配置管理
  - `/statistics` - 统计信息

## 关键配置文件

### application.yml
- 服务器端口: 8080
- 上下文路径: `/llmctl`
- 数据库连接配置
- MyBatis配置
- 日志配置

### pom.xml 关键依赖
- spring-boot-starter-web
- mybatis-spring-boot-starter
- mysql-connector-j
- spring-boot-starter-validation
- jasypt-spring-boot-starter (密码加密)
- lombok

## 开发注意事项

### 代码规范
- 使用Lombok简化代码
- 实体类放在entity包，DTO放在dto包
- Mapper接口放在mapper包，XML文件放在resources/mapper目录
- 业务逻辑在service层，控制器只做参数验证和调用

### 架构约束
- 单个Java文件不超过400行
- 每层文件夹中的文件不超过8个
- 避免循环依赖和数据泥团
- 保持代码简洁，避免过度设计

### 项目重构状态
项目正在从CLI工具重构为桌面应用：
- 当前处于后端SpringBoot开发阶段
- 前端将使用Electron + React + TypeScript
- 参考docs目录下的重构文档进行开发

## 文档资源

项目文档位于 `docs/` 目录：
- `refactor-architecture.md` - 架构设计文档
- `api-documentation.md` - API接口文档
- `database-schema.md` - 数据库设计文档
- `implementation-guide.md` - 实施指南文档

开发时请参考这些文档了解项目的整体设计和实施计划。