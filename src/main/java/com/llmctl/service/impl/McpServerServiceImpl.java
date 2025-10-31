package com.llmctl.service.impl;

import com.llmctl.context.UserContext;
import com.llmctl.entity.McpServer;
import com.llmctl.mapper.McpServerMapper;
import com.llmctl.service.McpServerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * MCP 服务器服务实现类
 * 业务逻辑层，负责 MCP 服务器的业务处理
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class McpServerServiceImpl implements McpServerService {

    private final McpServerMapper mcpServerMapper;

    @Override
    public List<McpServer> getAllServers() {
        log.info("查询所有 MCP 服务器");
        return mcpServerMapper.findAll();
    }

    @Override
    public List<McpServer> getUserServers(Long userId) {
        log.info("查询用户的 MCP 服务器，用户 ID: {}", userId);
        return mcpServerMapper.findByUserId(userId);
    }

    @Override
    public List<McpServer> getAllTemplates() {
        log.info("查询所有 MCP 模板");
        return mcpServerMapper.findAllTemplates();
    }

    @Override
    public List<McpServer> getTemplatesByCategory(String category) {
        log.info("查询分类为 {} 的 MCP 模板", category);
        return mcpServerMapper.findTemplatesByCategory(category);
    }

    @Override
    public List<McpServer> searchServers(String keyword) {
        log.info("搜索 MCP 服务器，关键词: {}", keyword);
        return mcpServerMapper.searchByKeyword(keyword);
    }

    @Override
    public McpServer getServerById(Long id) {
        log.info("根据 ID 查询 MCP 服务器: {}", id);
        return mcpServerMapper.findById(id);
    }

    @Override
    public McpServer getServerByName(String name) {
        log.info("根据名称查询 MCP 服务器: {}", name);
        return mcpServerMapper.findByName(name);
    }

    @Override
    @Transactional
    public McpServer createServer(McpServer mcpServer) {
        log.info("创建 MCP 服务器: {}", mcpServer.getName());

        // 检查名称是否已存在（用户范围内）
        McpServer existingServer = mcpServerMapper.findByUserIdAndName(mcpServer.getUserId(), mcpServer.getName());
        if (existingServer != null) {
            throw new IllegalArgumentException("您已创建过同名的 MCP 服务器: " + mcpServer.getName());
        }

        // 设置为非模板
        mcpServer.setIsTemplate(false);

        // 默认启用
        if (mcpServer.getEnabled() == null) {
            mcpServer.setEnabled(true);
        }

        mcpServerMapper.insert(mcpServer);
        log.info("MCP 服务器创建成功，ID: {}", mcpServer.getId());
        return mcpServer;
    }

    @Override
    @Transactional
    public McpServer createFromTemplate(Long templateId, Long userId, Map<String, Object> customConfig) {
        log.info("从模板创建 MCP 服务器，模板 ID: {}, 用户 ID: {}", templateId, userId);

        // 获取模板
        McpServer template = mcpServerMapper.findById(templateId);
        if (template == null || !template.getIsTemplate()) {
            throw new IllegalArgumentException("无效的模板 ID: " + templateId);
        }

        // 克隆模板并应用自定义配置
        McpServer newServer = new McpServer();
        newServer.setUserId(userId);  // ✅ 设置用户 ID
        newServer.setName((String) customConfig.getOrDefault("name", template.getName() + "-copy"));
        newServer.setDescription((String) customConfig.getOrDefault("description", template.getDescription()));
        newServer.setType((String) customConfig.getOrDefault("type", template.getType()));
        newServer.setCommand((String) customConfig.getOrDefault("command", template.getCommand()));

        // 处理 args
        if (customConfig.containsKey("args")) {
            newServer.setArgs((List<String>) customConfig.get("args"));
        } else {
            newServer.setArgs(template.getArgs());
        }

        // 处理 env
        if (customConfig.containsKey("env")) {
            newServer.setEnv((Map<String, String>) customConfig.get("env"));
        } else {
            newServer.setEnv(template.getEnv());
        }

        newServer.setEnabled(true);
        newServer.setIsTemplate(false);  // ✅ 用户创建的不是模板
        newServer.setIcon(template.getIcon());

        // 检查名称是否已存在（用户范围内）
        McpServer existingServer = mcpServerMapper.findByUserIdAndName(userId, newServer.getName());
        if (existingServer != null) {
            throw new IllegalArgumentException("您已创建过同名的 MCP 服务器: " + newServer.getName());
        }

        mcpServerMapper.insert(newServer);
        log.info("从模板创建 MCP 服务器成功，ID: {}", newServer.getId());
        return newServer;
    }

    @Override
    @Transactional
    public McpServer updateServer(McpServer mcpServer) {
        log.info("更新 MCP 服务器，ID: {}", mcpServer.getId());

        // 检查是否存在
        McpServer existingServer = mcpServerMapper.findById(mcpServer.getId());
        if (existingServer == null) {
            throw new IllegalArgumentException("MCP 服务器不存在，ID: " + mcpServer.getId());
        }

        // 检查是否为模板（模板不允许修改某些字段）
        if (existingServer.getIsTemplate()) {
            log.warn("尝试修改模板，仅允许修改启用状态");
            // 模板只允许修改启用状态
            existingServer.setEnabled(mcpServer.getEnabled());
            mcpServerMapper.update(existingServer);
            return existingServer;
        }

        // 检查名称是否与其他服务器冲突（用户范围内）
        if (!existingServer.getName().equals(mcpServer.getName())) {
            McpServer duplicateServer = mcpServerMapper.findByUserIdAndName(existingServer.getUserId(), mcpServer.getName());
            if (duplicateServer != null && !duplicateServer.getId().equals(mcpServer.getId())) {
                throw new IllegalArgumentException("您已创建过同名的 MCP 服务器: " + mcpServer.getName());
            }
        }

        mcpServerMapper.update(mcpServer);
        log.info("MCP 服务器更新成功，ID: {}", mcpServer.getId());
        return mcpServer;
    }

    @Override
    @Transactional
    public void deleteServer(Long id) {
        log.info("删除 MCP 服务器，ID: {}", id);

        // 检查是否存在
        McpServer existingServer = mcpServerMapper.findById(id);
        if (existingServer == null) {
            throw new IllegalArgumentException("MCP 服务器不存在，ID: " + id);
        }

        // 检查是否为模板（模板不允许删除）
        if (existingServer.getIsTemplate()) {
            throw new IllegalArgumentException("不允许删除内置模板");
        }

        int deletedRows = mcpServerMapper.deleteById(id);
        if (deletedRows > 0) {
            log.info("MCP 服务器删除成功，ID: {}", id);
        } else {
            log.warn("MCP 服务器删除失败，可能已被删除，ID: {}", id);
        }
    }

    @Override
    @Transactional
    public void toggleEnabled(Long id, Boolean enabled) {
        log.info("切换 MCP 服务器启用状态，ID: {}, enabled: {}", id, enabled);
        mcpServerMapper.updateEnabled(id, enabled);
    }

    @Override
    @Transactional
    public void batchToggleEnabled(List<Long> ids, Boolean enabled) {
        log.info("批量切换 MCP 服务器启用状态，数量: {}, enabled: {}", ids.size(), enabled);
        ids.forEach(id -> mcpServerMapper.updateEnabled(id, enabled));
    }

    @Override
    @Transactional
    public void batchDeleteServers(List<Long> ids) {
        log.info("批量删除 MCP 服务器，数量: {}", ids.size());
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("ID 列表不能为空");
        }

        // 逐个删除，确保只删除非模板的 MCP 服务器
        for (Long id : ids) {
            McpServer server = mcpServerMapper.findById(id);
            if (server == null) {
                log.warn("MCP 服务器不存在，ID: {}", id);
            } else if (Boolean.TRUE.equals(server.getIsTemplate())) {
                log.warn("不允许删除模板 MCP 服务器，ID: {}", id);
            } else {
                mcpServerMapper.deleteById(id);
                log.info("删除 MCP 服务器成功，ID: {}", id);
            }
        }
    }

    @Override
    public Map<String, Object> generateMcpConfig(String providerId, String cliType) {
        log.info("生成 MCP 配置（全局模式），Provider ID: {}, CLI 类型: {}", providerId, cliType);

        // 全局模式：获取当前用户所有启用的 MCP 服务器
        Long userId = getCurrentUserId();
        List<McpServer> enabledServers = mcpServerMapper.findByUserId(userId).stream()
                .filter(McpServer::getEnabled)
                .toList();

        Map<String, Object> mcpConfig = new LinkedHashMap<>();

        for (McpServer server : enabledServers) {
            // 构建服务器配置
            Map<String, Object> serverConfig = new LinkedHashMap<>();

            // ✅ Windows 系统：对 npx/npm 命令进行包装
            String command = server.getCommand();
            List<String> args = server.getArgs();

            if (isWindows() && needsCmdWrapper(command)) {
                // Windows 上需要 cmd /c 包装
                serverConfig.put("command", "cmd");

                List<String> wrappedArgs = new ArrayList<>();
                wrappedArgs.add("/c");
                wrappedArgs.add(command);
                if (args != null && !args.isEmpty()) {
                    wrappedArgs.addAll(args);
                }
                serverConfig.put("args", wrappedArgs);

                log.debug("Windows 系统：将命令 {} 包装为 cmd /c {}", command, command);
            } else {
                // 非 Windows 或不需要包装的命令
                serverConfig.put("command", command);
                if (args != null && !args.isEmpty()) {
                    serverConfig.put("args", args);
                }
            }

            if (server.getEnv() != null && !server.getEnv().isEmpty()) {
                serverConfig.put("env", server.getEnv());
            }

            mcpConfig.put(server.getName(), serverConfig);
        }

        log.info("生成 MCP 配置成功（全局模式），包含 {} 个服务器", mcpConfig.size());
        return mcpConfig;
    }

    /**
     * 获取当前用户 ID
     */
    private Long getCurrentUserId() {
        return UserContext.getUserId();
    }

    /**
     * 检查是否为 Windows 系统
     */
    private boolean isWindows() {
        String os = System.getProperty("os.name").toLowerCase();
        return os.contains("win");
    }

    /**
     * 检查命令是否需要 cmd /c 包装（Windows 批处理命令）
     */
    private boolean needsCmdWrapper(String command) {
        if (command == null) {
            return false;
        }
        // npx、npm、yarn 等 Node.js 相关命令在 Windows 上是批处理文件
        return command.equals("npx") ||
               command.equals("npm") ||
               command.equals("yarn") ||
               command.equals("pnpm");
    }
}
