# LLMctl 多用户架构设计方案

## 一、架构概述

### 1.1 当前单用户架构的问题

```
当前架构：
┌─────────────────────────────────┐
│  所有Token都是全局共享的          │
│  - Provider A → Token1, Token2   │
│  - Provider B → Token3, Token4   │
│  所有用户看到相同的Token          │
└─────────────────────────────────┘
```

**问题**：
- ❌ 多个用户无法隔离自己的Token
- ❌ Token使用统计无法区分用户
- ❌ 安全风险：用户A可以看到/使用用户B的Token
- ❌ 无法实现团队协作和权限管理

### 1.2 目标多用户架构

```
目标架构：
┌─────────────────────────────────────────────────────┐
│  用户A的工作空间                                      │
│  ├── Provider A → Token1, Token2 (仅用户A可见)      │
│  ├── Provider B → Token3                            │
│  └── Session1, Session2 (使用用户A的Token)          │
├─────────────────────────────────────────────────────┤
│  用户B的工作空间                                      │
│  ├── Provider A → Token4                            │
│  ├── Provider C → Token5, Token6 (仅用户B可见)      │
│  └── Session3, Session4 (使用用户B的Token)          │
└─────────────────────────────────────────────────────┘
```

**优势**：
- ✅ 每个用户有独立的Token集合
- ✅ Token完全隔离，互不可见
- ✅ 独立的使用统计和配额管理
- ✅ 支持团队共享Token（可选）
- ✅ 细粒度的权限控制

---

## 二、数据库设计

### 2.1 核心表结构

#### User表（用户主表）

```sql
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名（唯一标识）',
  `display_name` VARCHAR(100) COMMENT '显示名称',
  `email` VARCHAR(100) UNIQUE COMMENT '邮箱',
  `user_key_hash` VARCHAR(255) COMMENT '用户密钥哈希（用于加密隔离）',
  `master_key_version` VARCHAR(20) DEFAULT 'v1' COMMENT '主密钥版本',
  `quota_limit` INT DEFAULT 1000 COMMENT 'Token使用配额限制',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '账户是否激活',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

**关键设计点**：
1. `username`: 用户唯一标识（后续所有资源关联这个字段）
2. `user_key_hash`: 存储用户特定的加密密钥派生信息（可选，用于高级加密隔离）
3. `quota_limit`: 用户级别的配额控制

#### Provider表（新增user_id关联）

```sql
ALTER TABLE `providers`
ADD COLUMN `user_id` BIGINT NOT NULL COMMENT '所属用户ID',
ADD COLUMN `is_shared` BOOLEAN DEFAULT FALSE COMMENT '是否团队共享',
ADD INDEX `idx_user_id` (`user_id`),
ADD CONSTRAINT `fk_provider_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;
```

**字段说明**：
- `user_id`: 关联到users表，实现Provider隔离
- `is_shared`: 支持团队共享场景（可选功能）

#### Token表（新增user_id关联）

```sql
ALTER TABLE `tokens`
ADD COLUMN `user_id` BIGINT NOT NULL COMMENT '所属用户ID',
ADD INDEX `idx_user_id` (`user_id`),
ADD CONSTRAINT `fk_token_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;
```

**查询优化**：
```sql
-- 复合索引：快速查询用户的所有Token
CREATE INDEX `idx_user_provider` ON `tokens`(`user_id`, `provider_id`);

-- 复合索引：快速查询用户的健康Token
CREATE INDEX `idx_user_healthy` ON `tokens`(`user_id`, `healthy`, `enabled`);
```

#### Session表（新增user_id关联）

```sql
ALTER TABLE `sessions`
ADD COLUMN `user_id` BIGINT NOT NULL COMMENT '所属用户ID',
ADD INDEX `idx_user_id` (`user_id`),
ADD CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;
```

#### 统计表（用户维度统计）

```sql
CREATE TABLE `user_statistics` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `total_requests` INT DEFAULT 0 COMMENT '总请求数',
  `total_tokens_used` BIGINT DEFAULT 0 COMMENT '总Token消耗',
  `total_cost` DECIMAL(10,2) DEFAULT 0.00 COMMENT '总费用',
  `active_sessions` INT DEFAULT 0 COMMENT '活跃会话数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_user_date` (`user_id`, `stat_date`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_stat_date` (`stat_date`),
  CONSTRAINT `fk_stat_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户统计表';
```

### 2.2 数据迁移脚本

```sql
-- migration_add_multi_user_support.sql

-- 1. 创建用户表
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `display_name` VARCHAR(100),
  `email` VARCHAR(100) UNIQUE,
  `user_key_hash` VARCHAR(255),
  `master_key_version` VARCHAR(20) DEFAULT 'v1',
  `quota_limit` INT DEFAULT 1000,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 创建默认用户（用于迁移现有数据）
INSERT INTO `users` (`username`, `display_name`, `is_active`)
VALUES ('default_user', 'Default User', TRUE);

SET @default_user_id = LAST_INSERT_ID();

-- 3. 为现有表添加user_id列
ALTER TABLE `providers`
ADD COLUMN `user_id` BIGINT NOT NULL DEFAULT @default_user_id,
ADD COLUMN `is_shared` BOOLEAN DEFAULT FALSE,
ADD INDEX `idx_user_id` (`user_id`);

ALTER TABLE `tokens`
ADD COLUMN `user_id` BIGINT NOT NULL DEFAULT @default_user_id,
ADD INDEX `idx_user_id` (`user_id`);

ALTER TABLE `sessions`
ADD COLUMN `user_id` BIGINT NOT NULL DEFAULT @default_user_id,
ADD INDEX `idx_user_id` (`user_id`);

-- 4. 添加外键约束
ALTER TABLE `providers`
ADD CONSTRAINT `fk_provider_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `tokens`
ADD CONSTRAINT `fk_token_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `sessions`
ADD CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- 5. 创建复合索引
CREATE INDEX `idx_user_provider` ON `tokens`(`user_id`, `provider_id`);
CREATE INDEX `idx_user_healthy` ON `tokens`(`user_id`, `healthy`, `enabled`);

-- 6. 创建统计表
CREATE TABLE `user_statistics` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `stat_date` DATE NOT NULL,
  `total_requests` INT DEFAULT 0,
  `total_tokens_used` BIGINT DEFAULT 0,
  `total_cost` DECIMAL(10,2) DEFAULT 0.00,
  `active_sessions` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_date` (`user_id`, `stat_date`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_stat_date` (`stat_date`),
  CONSTRAINT `fk_stat_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 验证迁移
SELECT
  'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL
SELECT 'providers', COUNT(*) FROM providers WHERE user_id = @default_user_id
UNION ALL
SELECT 'tokens', COUNT(*) FROM tokens WHERE user_id = @default_user_id
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions WHERE user_id = @default_user_id;
```

---

## 三、后端实现

### 3.1 用户上下文管理（UserContext）

使用 **ThreadLocal** 存储当前请求的用户信息：

```java
package com.llmctl.context;

/**
 * 用户上下文管理器
 * 使用ThreadLocal存储当前请求的用户信息
 */
public class UserContext {

    private static final ThreadLocal<Long> USER_ID_HOLDER = new ThreadLocal<>();
    private static final ThreadLocal<String> USERNAME_HOLDER = new ThreadLocal<>();

    /**
     * 设置当前用户ID
     */
    public static void setUserId(Long userId) {
        USER_ID_HOLDER.set(userId);
    }

    /**
     * 获取当前用户ID
     */
    public static Long getUserId() {
        Long userId = USER_ID_HOLDER.get();
        if (userId == null) {
            throw new IllegalStateException("用户上下文未设置，请先识别用户");
        }
        return userId;
    }

    /**
     * 设置当前用户名
     */
    public static void setUsername(String username) {
        USERNAME_HOLDER.set(username);
    }

    /**
     * 获取当前用户名
     */
    public static String getUsername() {
        return USERNAME_HOLDER.get();
    }

    /**
     * 清除当前用户上下文
     */
    public static void clear() {
        USER_ID_HOLDER.remove();
        USERNAME_HOLDER.remove();
    }

    /**
     * 检查是否已设置用户上下文
     */
    public static boolean isUserContextSet() {
        return USER_ID_HOLDER.get() != null;
    }
}
```

### 3.2 用户识别拦截器（UserIdentificationInterceptor）

```java
package com.llmctl.interceptor;

import com.llmctl.context.UserContext;
import com.llmctl.service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 用户识别拦截器
 * 在每个请求前识别用户并设置到UserContext
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserIdentificationInterceptor implements HandlerInterceptor {

    private final IUserService userService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            // 方案1: 从HTTP Header读取用户标识
            String username = request.getHeader("X-User-ID");

            // 方案2: 从查询参数读取（备选）
            if (username == null || username.isEmpty()) {
                username = request.getParameter("userId");
            }

            // 方案3: 使用默认用户（向后兼容单用户模式）
            if (username == null || username.isEmpty()) {
                username = "default_user";
                log.debug("未提供用户标识，使用默认用户: {}", username);
            }

            // 根据用户名查询用户ID
            Long userId = userService.getUserIdByUsername(username);
            if (userId == null) {
                log.error("用户不存在: {}", username);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\": \"用户不存在\"}");
                return false;
            }

            // 设置用户上下文
            UserContext.setUserId(userId);
            UserContext.setUsername(username);

            log.debug("用户上下文已设置: userId={}, username={}", userId, username);
            return true;

        } catch (Exception e) {
            log.error("用户识别失败", e);
            try {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"用户识别失败\"}");
            } catch (Exception ignored) {}
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        // 请求完成后清除用户上下文，防止内存泄漏
        UserContext.clear();
    }
}
```

**注册拦截器**：

```java
package com.llmctl.config;

import com.llmctl.interceptor.UserIdentificationInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final UserIdentificationInterceptor userIdentificationInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(userIdentificationInterceptor)
                .addPathPatterns("/llmctl/**")  // 拦截所有业务接口
                .excludePathPatterns(
                    "/llmctl/health",           // 排除健康检查
                    "/llmctl/actuator/**"       // 排除监控端点
                );
    }
}
```

### 3.3 Service层改造（以TokenService为例）

```java
package com.llmctl.service.impl;

import com.llmctl.context.UserContext;
import com.llmctl.entity.Token;
import com.llmctl.mapper.TokenMapper;
import com.llmctl.service.ITokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenServiceImpl implements ITokenService {

    private final TokenMapper tokenMapper;
    private final ITokenEncryptionService encryptionService;

    /**
     * 创建Token（自动关联当前用户）
     */
    @Override
    public Token createToken(String providerId, CreateTokenRequest request) {
        Long userId = UserContext.getUserId();  // 从上下文获取用户ID

        log.info("用户 {} 正在创建Token for Provider {}", userId, providerId);

        // 加密Token值
        String encrypted = encryptionService.encrypt(request.getValue());

        Token token = new Token();
        token.setUserId(userId);  // 关键：设置用户ID
        token.setProviderId(providerId);
        token.setValue(encrypted);
        token.setAlias(request.getAlias());
        token.setWeight(request.getWeight());
        token.setEnabled(request.getEnabled());
        token.setHealthy(true);
        token.setEncryptionVersion("v1");

        tokenMapper.insert(token);
        log.info("Token创建成功: tokenId={}, userId={}", token.getId(), userId);

        return token;
    }

    /**
     * 获取用户的所有Token（自动过滤）
     */
    @Override
    public List<Token> getTokensByProviderId(String providerId) {
        Long userId = UserContext.getUserId();  // 从上下文获取用户ID

        log.debug("查询用户 {} 的Provider {} 的所有Token", userId, providerId);

        // 只查询当前用户的Token
        return tokenMapper.findByUserIdAndProviderId(userId, providerId);
    }

    /**
     * 更新Token（权限检查）
     */
    @Override
    public Token updateToken(String tokenId, UpdateTokenRequest request) {
        Long userId = UserContext.getUserId();

        // 1. 先查询Token是否存在
        Token existingToken = tokenMapper.selectById(tokenId);
        if (existingToken == null) {
            throw new ResourceNotFoundException("Token不存在: " + tokenId);
        }

        // 2. 权限检查：确保Token属于当前用户
        if (!existingToken.getUserId().equals(userId)) {
            log.warn("用户 {} 尝试修改其他用户的Token: tokenId={}, ownerId={}",
                     userId, tokenId, existingToken.getUserId());
            throw new ForbiddenException("无权限修改此Token");
        }

        // 3. 执行更新
        existingToken.setAlias(request.getAlias());
        existingToken.setWeight(request.getWeight());
        existingToken.setEnabled(request.getEnabled());
        existingToken.setHealthy(request.getHealthy());

        tokenMapper.updateById(existingToken);
        log.info("Token更新成功: tokenId={}, userId={}", tokenId, userId);

        return existingToken;
    }

    /**
     * 删除Token（权限检查）
     */
    @Override
    public void deleteToken(String tokenId) {
        Long userId = UserContext.getUserId();

        Token token = tokenMapper.selectById(tokenId);
        if (token == null) {
            throw new ResourceNotFoundException("Token不存在");
        }

        // 权限检查
        if (!token.getUserId().equals(userId)) {
            throw new ForbiddenException("无权限删除此Token");
        }

        tokenMapper.deleteById(tokenId);
        log.info("Token删除成功: tokenId={}, userId={}", tokenId, userId);
    }
}
```

### 3.4 Mapper层改造

```java
package com.llmctl.mapper;

import com.llmctl.entity.Token;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TokenMapper {

    /**
     * 根据用户ID和Provider ID查询Token列表
     */
    List<Token> findByUserIdAndProviderId(@Param("userId") Long userId,
                                          @Param("providerId") String providerId);

    /**
     * 查询用户的所有健康Token
     */
    List<Token> findHealthyTokensByUserId(@Param("userId") Long userId,
                                          @Param("providerId") String providerId);

    /**
     * 统计用户的Token数量
     */
    Integer countTokensByUserId(@Param("userId") Long userId);

    // ... 其他方法
}
```

**TokenMapper.xml**:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.llmctl.mapper.TokenMapper">

    <!-- 根据用户ID和Provider ID查询 -->
    <select id="findByUserIdAndProviderId" resultType="com.llmctl.entity.Token">
        SELECT * FROM tokens
        WHERE user_id = #{userId}
          AND provider_id = #{providerId}
        ORDER BY created_at DESC
    </select>

    <!-- 查询用户的健康Token -->
    <select id="findHealthyTokensByUserId" resultType="com.llmctl.entity.Token">
        SELECT * FROM tokens
        WHERE user_id = #{userId}
          AND provider_id = #{providerId}
          AND healthy = TRUE
          AND enabled = TRUE
        ORDER BY last_used ASC
    </select>

    <!-- 统计用户Token数量 -->
    <select id="countTokensByUserId" resultType="java.lang.Integer">
        SELECT COUNT(*) FROM tokens
        WHERE user_id = #{userId}
    </select>

</mapper>
```

---

## 四、前端实现

### 4.1 用户标识存储

使用 **localStorage** 或 **Electron Store** 存储当前用户标识：

```typescript
// electron-app/src/renderer/utils/userStorage.ts

/**
 * 用户标识管理
 */
class UserStorage {
    private readonly USER_KEY = 'current_user';

    /**
     * 设置当前用户
     */
    setCurrentUser(username: string): void {
        localStorage.setItem(this.USER_KEY, username);
        console.log('[UserStorage] 当前用户已设置:', username);
    }

    /**
     * 获取当前用户
     */
    getCurrentUser(): string | null {
        const username = localStorage.getItem(this.USER_KEY);
        if (!username) {
            console.warn('[UserStorage] 未设置当前用户，使用默认用户');
            return 'default_user';  // 向后兼容
        }
        return username;
    }

    /**
     * 清除当前用户
     */
    clearCurrentUser(): void {
        localStorage.removeItem(this.USER_KEY);
    }

    /**
     * 检查是否已设置用户
     */
    hasCurrentUser(): boolean {
        return !!localStorage.getItem(this.USER_KEY);
    }
}

export const userStorage = new UserStorage();
```

### 4.2 HTTP请求拦截器

```typescript
// electron-app/src/renderer/services/api.ts

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { userStorage } from '../utils/userStorage';

/**
 * 创建HTTP客户端
 */
const createHttpClient = (): AxiosInstance => {
    const client = axios.create({
        baseURL: 'http://localhost:8080/llmctl',
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // 请求拦截器：添加用户标识
    client.interceptors.request.use(
        (config: AxiosRequestConfig) => {
            const username = userStorage.getCurrentUser();
            if (username) {
                // 在HTTP Header中传递用户标识
                config.headers = config.headers || {};
                config.headers['X-User-ID'] = username;
                console.log('[API] 请求携带用户标识:', username);
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // 响应拦截器：处理401错误
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                console.error('[API] 用户未授权，清除用户信息');
                userStorage.clearCurrentUser();
                // 可以触发跳转到用户选择页面
            }
            return Promise.reject(error);
        }
    );

    return client;
};

export const httpClient = createHttpClient();
```

### 4.3 用户选择界面（可选）

```typescript
// electron-app/src/renderer/components/UserSelector/UserSelector.tsx

import React, { useState, useEffect } from 'react';
import { Select, Card, Button, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { userStorage } from '../../utils/userStorage';
import { userAPI } from '../../services/api';

interface User {
    id: number;
    username: string;
    displayName: string;
}

const UserSelector: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
        // 加载当前用户
        const currentUser = userStorage.getCurrentUser();
        if (currentUser) {
            setSelectedUser(currentUser);
        }
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getAllUsers();
            setUsers(response.data || []);
        } catch (error) {
            message.error('加载用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleUserChange = (username: string) => {
        setSelectedUser(username);
    };

    const handleConfirm = () => {
        if (selectedUser) {
            userStorage.setCurrentUser(selectedUser);
            message.success(`已切换到用户: ${selectedUser}`);
            // 刷新页面或重新加载数据
            window.location.reload();
        }
    };

    return (
        <Card
            title="选择用户"
            style={{ maxWidth: 500, margin: '50px auto' }}
            extra={<UserOutlined />}
        >
            <Select
                style={{ width: '100%', marginBottom: 16 }}
                placeholder="请选择用户"
                value={selectedUser}
                onChange={handleUserChange}
                loading={loading}
            >
                {users.map(user => (
                    <Select.Option key={user.username} value={user.username}>
                        {user.displayName} ({user.username})
                    </Select.Option>
                ))}
            </Select>

            <Button
                type="primary"
                block
                onClick={handleConfirm}
                disabled={!selectedUser}
            >
                确认切换
            </Button>
        </Card>
    );
};

export default UserSelector;
```

### 4.4 顶部用户显示组件

```typescript
// electron-app/src/renderer/components/Layout/UserIndicator.tsx

import React from 'react';
import { Space, Tag, Dropdown, Menu } from 'antd';
import { UserOutlined, SwapOutlined } from '@ant-design/icons';
import { userStorage } from '../../utils/userStorage';

const UserIndicator: React.FC = () => {
    const currentUser = userStorage.getCurrentUser();

    const handleSwitchUser = () => {
        // 跳转到用户选择页面
        window.location.href = '#/user-selector';
    };

    const menu = (
        <Menu>
            <Menu.Item key="switch" icon={<SwapOutlined />} onClick={handleSwitchUser}>
                切换用户
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={menu} trigger={['click']}>
            <Space style={{ cursor: 'pointer', padding: '0 16px' }}>
                <UserOutlined />
                <Tag color="blue">{currentUser}</Tag>
            </Space>
        </Dropdown>
    );
};

export default UserIndicator;
```

**集成到TopBar**:

```typescript
// electron-app/src/renderer/components/Layout/TopBar.tsx

import UserIndicator from './UserIndicator';

export const TopBar: React.FC<TopBarProps> = ({ ... }) => {
    return (
        <Header style={{ ... }}>
            {/* ...其他组件 */}
            <UserIndicator />  {/* 添加用户指示器 */}
        </Header>
    );
};
```

---

## 五、加密密钥管理方案

### 5.1 方案一：全局主密钥 + 用户ID派生（推荐）

**原理**：
```
全局主密钥 (Master Key) + 用户ID
    ↓ HKDF派生
用户专属密钥 (User-Specific Key)
    ↓ AES-256-GCM加密
用户的Token密文
```

**优势**：
- ✅ 只需管理一个全局主密钥
- ✅ 每个用户有独立的派生密钥
- ✅ 用户之间无法解密彼此的Token
- ✅ 支持密钥轮换

**实现**：

```java
package com.llmctl.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Slf4j
@Service
public class UserKeyDerivationService {

    private final SecretKey globalMasterKey;

    public UserKeyDerivationService() {
        this.globalMasterKey = loadGlobalMasterKey();
    }

    /**
     * 为特定用户派生加密密钥
     * 使用HKDF (HMAC-based Key Derivation Function)
     */
    public SecretKey deriveUserKey(Long userId) {
        try {
            // 1. 构造info参数: "llmctl_user_" + userId
            String info = "llmctl_user_" + userId;
            byte[] infoBytes = info.getBytes(StandardCharsets.UTF_8);

            // 2. 使用HMAC-SHA256派生密钥
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(globalMasterKey.getEncoded(), "HmacSHA256");
            hmac.init(keySpec);
            hmac.update(infoBytes);

            byte[] derivedKey = hmac.doFinal();

            // 3. 截取256位作为AES密钥
            byte[] aesKey = new byte[32];  // 256 bits
            System.arraycopy(derivedKey, 0, aesKey, 0, 32);

            log.debug("为用户 {} 派生加密密钥成功", userId);
            return new SecretKeySpec(aesKey, "AES");

        } catch (Exception e) {
            throw new RuntimeException("派生用户密钥失败", e);
        }
    }

    private SecretKey loadGlobalMasterKey() {
        // 从环境变量或文件加载全局主密钥
        // 实现逻辑与TokenEncryptionServiceImpl类似
        // ...
    }
}
```

**使用示例**：

```java
@Service
public class TokenEncryptionServiceImpl implements ITokenEncryptionService {

    private final UserKeyDerivationService keyDerivation;

    @Override
    public String encrypt(String plaintext) {
        Long userId = UserContext.getUserId();

        // 为当前用户派生专属密钥
        SecretKey userKey = keyDerivation.deriveUserKey(userId);

        // 使用用户专属密钥加密
        // ... AES-256-GCM加密逻辑
    }

    @Override
    public String decrypt(String encrypted) {
        Long userId = UserContext.getUserId();

        // 使用用户专属密钥解密
        SecretKey userKey = keyDerivation.deriveUserKey(userId);

        // ... AES-256-GCM解密逻辑
    }
}
```

### 5.2 方案二：每用户独立密钥（高安全）

**原理**：
```
用户A → 密钥A (存储在user表的user_key_hash)
用户B → 密钥B (存储在user表的user_key_hash)
```

**优势**：
- ✅ 最高安全性：用户密钥完全独立
- ✅ 支持用户级别的密钥轮换
- ✅ 即使全局密钥泄露，单个用户密钥不受影响

**劣势**：
- ⚠️ 需要为每个用户管理独立密钥
- ⚠️ 密钥存储需要额外加密保护

**实现**（简化版）：

```java
@Service
public class PerUserKeyManagement {

    /**
     * 为新用户生成独立密钥
     */
    public SecretKey generateUserKey(Long userId) {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256, new SecureRandom());
        SecretKey userKey = keyGen.generateKey();

        // 加密用户密钥后存储到数据库
        String encryptedKey = encryptUserKey(userKey);
        userMapper.updateUserKeyHash(userId, encryptedKey);

        return userKey;
    }

    /**
     * 获取用户密钥
     */
    public SecretKey getUserKey(Long userId) {
        String encryptedKey = userMapper.getUserKeyHash(userId);
        return decryptUserKey(encryptedKey);
    }

    private String encryptUserKey(SecretKey key) {
        // 使用全局主密钥加密用户密钥
        // ...
    }

    private SecretKey decryptUserKey(String encrypted) {
        // 使用全局主密钥解密用户密钥
        // ...
    }
}
```

### 5.3 密钥管理对比

| 方案 | 安全性 | 复杂度 | 推荐场景 |
|------|--------|--------|----------|
| **方案一：密钥派生** | ⭐⭐⭐⭐ | ⭐⭐ | 中小团队，推荐 |
| **方案二：独立密钥** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 企业级，高安全要求 |

---

## 六、权限控制设计

### 6.1 基于资源所有权的权限模型

```java
/**
 * 权限检查切面
 */
@Aspect
@Component
@Slf4j
public class ResourceOwnershipAspect {

    @Around("@annotation(checkOwnership)")
    public Object checkResourceOwnership(ProceedingJoinPoint joinPoint, CheckOwnership checkOwnership)
            throws Throwable {

        Long currentUserId = UserContext.getUserId();

        // 获取资源ID参数
        Object[] args = joinPoint.getArgs();
        String resourceId = (String) args[checkOwnership.resourceIdParamIndex()];

        // 查询资源所有者
        Long resourceOwnerId = getResourceOwnerId(checkOwnership.resourceType(), resourceId);

        // 权限检查
        if (!currentUserId.equals(resourceOwnerId)) {
            log.warn("用户 {} 尝试访问用户 {} 的资源: {} {}",
                     currentUserId, resourceOwnerId, checkOwnership.resourceType(), resourceId);
            throw new ForbiddenException("无权限访问此资源");
        }

        return joinPoint.proceed();
    }

    private Long getResourceOwnerId(String resourceType, String resourceId) {
        // 根据资源类型查询所有者
        switch (resourceType) {
            case "token":
                return tokenMapper.selectById(resourceId).getUserId();
            case "provider":
                return providerMapper.selectById(resourceId).getUserId();
            case "session":
                return sessionMapper.selectById(resourceId).getUserId();
            default:
                throw new IllegalArgumentException("Unknown resource type: " + resourceType);
        }
    }
}

/**
 * 权限检查注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CheckOwnership {
    String resourceType();  // "token", "provider", "session"
    int resourceIdParamIndex() default 0;  // 资源ID参数索引
}
```

**使用示例**：

```java
@Service
public class TokenServiceImpl implements ITokenService {

    @CheckOwnership(resourceType = "token", resourceIdParamIndex = 0)
    @Override
    public Token updateToken(String tokenId, UpdateTokenRequest request) {
        // 方法执行前会自动检查tokenId是否属于当前用户
        // ...
    }

    @CheckOwnership(resourceType = "token", resourceIdParamIndex = 0)
    @Override
    public void deleteToken(String tokenId) {
        // 同样会自动检查权限
        // ...
    }
}
```

### 6.2 查询自动过滤

使用 **MyBatis Interceptor** 自动添加 `user_id` 过滤条件：

```java
@Intercepts({
    @Signature(type = Executor.class, method = "query", args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
@Component
@Slf4j
public class UserDataFilterInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        if (!UserContext.isUserContextSet()) {
            // 如果未设置用户上下文，直接执行（如系统任务）
            return invocation.proceed();
        }

        Long userId = UserContext.getUserId();
        MappedStatement mappedStatement = (MappedStatement) invocation.getArgs()[0];
        Object parameter = invocation.getArgs()[1];

        // 自动注入user_id条件（简化示例）
        if (parameter instanceof Map) {
            Map<String, Object> paramMap = (Map<String, Object>) parameter;
            if (!paramMap.containsKey("userId")) {
                paramMap.put("userId", userId);
                log.debug("自动注入userId过滤: {}", userId);
            }
        }

        return invocation.proceed();
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
}
```

---

## 七、部署与配置

### 7.1 环境变量配置

```bash
# .env.production

# 全局主密钥（用于派生用户密钥）
LLMCTL_MASTER_KEY=5K8vYmZ3N9tP2xQrL4kJ8aF6hW1dC7eB9mN0oU5pV2s=

# Jasypt密钥（用于配置文件加密）
JASYPT_PASSWORD=jasypt_secret_key_2024

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=llmctl
DB_USER=llmctl
DB_PASSWORD=llmctl123

# 默认用户（向后兼容）
DEFAULT_USER_ENABLED=true
DEFAULT_USERNAME=default_user
```

### 7.2 Docker Compose 配置

```yaml
version: '3.8'

services:
  llmctl-backend:
    image: llmctl:2.1.0
    ports:
      - "8080:8080"
    environment:
      - LLMCTL_MASTER_KEY=${LLMCTL_MASTER_KEY}
      - JASYPT_PASSWORD=${JASYPT_PASSWORD}
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/llmctl
      - SPRING_DATASOURCE_USERNAME=${DB_USER}
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
      - DEFAULT_USER_ENABLED=true
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: llmctl
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./migration_add_multi_user_support.sql:/docker-entrypoint-initdb.d/01-multi-user.sql

volumes:
  mysql_data:
```

---

## 八、向后兼容策略

### 8.1 默认用户模式

为了不破坏现有用户的使用体验，保留"默认用户"模式：

```java
@Service
public class DefaultUserCompatibilityService {

    private static final String DEFAULT_USER = "default_user";

    /**
     * 确保默认用户存在
     */
    @PostConstruct
    public void ensureDefaultUserExists() {
        User defaultUser = userMapper.findByUsername(DEFAULT_USER);
        if (defaultUser == null) {
            log.info("创建默认用户: {}", DEFAULT_USER);
            User user = new User();
            user.setUsername(DEFAULT_USER);
            user.setDisplayName("Default User");
            user.setIsActive(true);
            user.setQuotaLimit(10000);
            userMapper.insert(user);
        }
    }

    /**
     * 检查是否启用默认用户模式
     */
    public boolean isDefaultUserModeEnabled() {
        return environment.getProperty("default.user.enabled", Boolean.class, true);
    }
}
```

### 8.2 渐进式迁移

```java
/**
 * 数据迁移服务
 */
@Service
public class MultiUserMigrationService {

    /**
     * 将现有数据迁移到默认用户
     */
    @EventListener(ApplicationReadyEvent.class)
    public void migrateExistingData() {
        Long defaultUserId = userMapper.findByUsername("default_user").getId();

        // 迁移所有未关联用户的Provider
        int providerCount = providerMapper.updateUserIdForNull(defaultUserId);
        log.info("迁移 {} 个Provider到默认用户", providerCount);

        // 迁移所有未关联用户的Token
        int tokenCount = tokenMapper.updateUserIdForNull(defaultUserId);
        log.info("迁移 {} 个Token到默认用户", tokenCount);

        // 迁移所有未关联用户的Session
        int sessionCount = sessionMapper.updateUserIdForNull(defaultUserId);
        log.info("迁移 {} 个Session到默认用户", sessionCount);
    }
}
```

---

## 九、总结

### 核心设计要点

| 方面 | 设计方案 | 关键实现 |
|------|----------|----------|
| **用户识别** | HTTP Header传递用户标识 | UserIdentificationInterceptor |
| **上下文管理** | ThreadLocal存储当前用户 | UserContext |
| **数据隔离** | 所有表添加user_id外键 | 数据库Schema改造 |
| **权限控制** | 资源所有权验证 + 自动过滤 | AOP切面 + MyBatis拦截器 |
| **加密隔离** | 基于用户ID派生加密密钥 | HKDF密钥派生 |
| **前端集成** | localStorage存储用户 + HTTP拦截器 | 用户选择器组件 |
| **向后兼容** | 默认用户模式 | 数据迁移脚本 |

### 实施步骤

1. ✅ 数据库迁移（添加users表和user_id列）
2. ✅ 后端改造（UserContext + Service层改造）
3. ✅ 密钥管理（实现密钥派生服务）
4. ✅ 权限控制（添加AOP切面）
5. ✅ 前端改造（用户选择器 + HTTP拦截器）
6. ✅ 测试验证（多用户隔离测试）
7. ✅ 文档更新（API文档 + 用户手册）

### 下一步扩展

- 👥 **团队协作**: 支持用户之间共享Provider/Token
- 🔐 **细粒度权限**: 实现RBAC（Role-Based Access Control）
- 📊 **用户配额**: 限制每个用户的Token数量和使用量
- 🔔 **通知系统**: Token即将过期/配额用尽时通知用户
- 📈 **多租户模式**: 支持组织/团队级别的用户分组

---

**文档版本**: v1.0
**最后更新**: 2025-10-10
**作者**: LLMctl Development Team
