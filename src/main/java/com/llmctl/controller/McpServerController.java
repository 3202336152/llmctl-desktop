package com.llmctl.controller;

import com.llmctl.entity.McpServer;
import com.llmctl.service.McpServerService;
import com.llmctl.context.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * MCP 服务器控制器
 * 提供 MCP 服务器的 REST API
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Slf4j
@RestController
@RequestMapping("/mcp-servers")
@RequiredArgsConstructor
public class McpServerController {

    private final McpServerService mcpServerService;

    /**
     * 获取当前用户的 MCP 服务器列表
     *
     * @return 响应对象，包含 MCP 服务器列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllServers() {
        try {
            Long userId = getCurrentUserId();
            List<McpServer> servers = mcpServerService.getUserServers(userId);
            return ResponseEntity.ok(buildSuccessResponse("查询成功", servers));
        } catch (Exception e) {
            log.error("查询 MCP 服务器失败", e);
            return ResponseEntity.ok(buildErrorResponse("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 获取所有模板
     *
     * @return 响应对象，包含模板列表
     */
    @GetMapping("/templates")
    public ResponseEntity<Map<String, Object>> getAllTemplates() {
        try {
            List<McpServer> templates = mcpServerService.getAllTemplates();
            return ResponseEntity.ok(buildSuccessResponse("查询成功", templates));
        } catch (Exception e) {
            log.error("查询 MCP 模板失败", e);
            return ResponseEntity.ok(buildErrorResponse("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 根据分类获取模板
     *
     * @param category 模板分类
     * @return 响应对象，包含模板列表
     */
    @GetMapping("/templates/category/{category}")
    public ResponseEntity<Map<String, Object>> getTemplatesByCategory(@PathVariable String category) {
        try {
            List<McpServer> templates = mcpServerService.getTemplatesByCategory(category);
            return ResponseEntity.ok(buildSuccessResponse("查询成功", templates));
        } catch (Exception e) {
            log.error("查询 MCP 模板失败，分类: {}", category, e);
            return ResponseEntity.ok(buildErrorResponse("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 搜索 MCP 服务器
     *
     * @param keyword 搜索关键词
     * @return 响应对象，包含搜索结果
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchServers(@RequestParam String keyword) {
        try {
            List<McpServer> servers = mcpServerService.searchServers(keyword);
            return ResponseEntity.ok(buildSuccessResponse("搜索成功", servers));
        } catch (Exception e) {
            log.error("搜索 MCP 服务器失败，关键词: {}", keyword, e);
            return ResponseEntity.ok(buildErrorResponse("搜索失败: " + e.getMessage()));
        }
    }

    /**
     * 根据 ID 获取 MCP 服务器
     *
     * @param id MCP 服务器 ID
     * @return 响应对象，包含 MCP 服务器对象
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getServerById(@PathVariable Long id) {
        try {
            McpServer server = mcpServerService.getServerById(id);
            if (server == null) {
                return ResponseEntity.ok(buildErrorResponse("MCP 服务器不存在"));
            }
            return ResponseEntity.ok(buildSuccessResponse("查询成功", server));
        } catch (Exception e) {
            log.error("查询 MCP 服务器失败，ID: {}", id, e);
            return ResponseEntity.ok(buildErrorResponse("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 创建 MCP 服务器
     *
     * @param mcpServer MCP 服务器对象
     * @return 响应对象，包含创建后的 MCP 服务器对象
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createServer(@RequestBody McpServer mcpServer) {
        try {
            Long userId = getCurrentUserId();
            mcpServer.setUserId(userId);
            McpServer created = mcpServerService.createServer(mcpServer);
            return ResponseEntity.ok(buildSuccessResponse("MCP 服务器创建成功", created));
        } catch (IllegalArgumentException e) {
            log.warn("创建 MCP 服务器失败: {}", e.getMessage());
            return ResponseEntity.ok(buildErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("创建 MCP 服务器失败", e);
            return ResponseEntity.ok(buildErrorResponse("创建失败: " + e.getMessage()));
        }
    }

    /**
     * 从模板创建 MCP 服务器
     *
     * @param templateId   模板 ID
     * @param customConfig 自定义配置
     * @return 响应对象，包含创建后的 MCP 服务器对象
     */
    @PostMapping("/from-template")
    public ResponseEntity<Map<String, Object>> createFromTemplate(
            @RequestParam Long templateId,
            @RequestBody Map<String, Object> customConfig) {
        try {
            Long userId = getCurrentUserId();
            McpServer created = mcpServerService.createFromTemplate(templateId, userId, customConfig);
            return ResponseEntity.ok(buildSuccessResponse("从模板创建 MCP 服务器成功", created));
        } catch (IllegalArgumentException e) {
            log.warn("从模板创建 MCP 服务器失败: {}", e.getMessage());
            return ResponseEntity.ok(buildErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("从模板创建 MCP 服务器失败，模板 ID: {}", templateId, e);
            return ResponseEntity.ok(buildErrorResponse("创建失败: " + e.getMessage()));
        }
    }

    /**
     * 更新 MCP 服务器
     *
     * @param id        MCP 服务器 ID
     * @param mcpServer MCP 服务器对象
     * @return 响应对象，包含更新后的 MCP 服务器对象
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateServer(
            @PathVariable Long id,
            @RequestBody McpServer mcpServer) {
        try {
            mcpServer.setId(id);
            McpServer updated = mcpServerService.updateServer(mcpServer);
            return ResponseEntity.ok(buildSuccessResponse("MCP 服务器更新成功", updated));
        } catch (IllegalArgumentException e) {
            log.warn("更新 MCP 服务器失败: {}", e.getMessage());
            return ResponseEntity.ok(buildErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("更新 MCP 服务器失败，ID: {}", id, e);
            return ResponseEntity.ok(buildErrorResponse("更新失败: " + e.getMessage()));
        }
    }

    /**
     * 删除 MCP 服务器
     *
     * @param id MCP 服务器 ID
     * @return 响应对象
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteServer(@PathVariable Long id) {
        try {
            mcpServerService.deleteServer(id);
            return ResponseEntity.ok(buildSuccessResponse("MCP 服务器删除成功", null));
        } catch (IllegalArgumentException e) {
            log.warn("删除 MCP 服务器失败: {}", e.getMessage());
            return ResponseEntity.ok(buildErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("删除 MCP 服务器失败，ID: {}", id, e);
            return ResponseEntity.ok(buildErrorResponse("删除失败: " + e.getMessage()));
        }
    }

    /**
     * 切换启用状态
     *
     * @param id      MCP 服务器 ID
     * @param enabled 是否启用
     * @return 响应对象
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Map<String, Object>> toggleEnabled(
            @PathVariable Long id,
            @RequestParam Boolean enabled) {
        try {
            mcpServerService.toggleEnabled(id, enabled);
            return ResponseEntity.ok(buildSuccessResponse("状态更新成功", null));
        } catch (Exception e) {
            log.error("切换 MCP 服务器状态失败，ID: {}, enabled: {}", id, enabled, e);
            return ResponseEntity.ok(buildErrorResponse("状态更新失败: " + e.getMessage()));
        }
    }

    /**
     * 批量切换启用状态
     *
     * @param request 请求对象，包含 ids 和 enabled 字段
     * @return 响应对象
     */
    @PostMapping("/batch-toggle")
    public ResponseEntity<Map<String, Object>> batchToggleEnabled(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Number> idsNumbers = (List<Number>) request.get("ids");
            Boolean enabled = (Boolean) request.get("enabled");

            if (idsNumbers == null || idsNumbers.isEmpty()) {
                return ResponseEntity.ok(buildErrorResponse("IDs 不能为空"));
            }

            // 将 Number 列表转换为 Long 列表
            List<Long> ids = idsNumbers.stream()
                    .map(Number::longValue)
                    .toList();

            mcpServerService.batchToggleEnabled(ids, enabled);
            return ResponseEntity.ok(buildSuccessResponse("批量操作完成", null));
        } catch (Exception e) {
            log.error("批量切换 MCP 服务器状态失败", e);
            return ResponseEntity.ok(buildErrorResponse("批量操作失败: " + e.getMessage()));
        }
    }

    /**
     * 批量删除 MCP 服务器
     *
     * @param request 请求对象，包含 ids 字段
     * @return 响应对象
     */
    @PostMapping("/batch-delete")
    public ResponseEntity<Map<String, Object>> batchDeleteServers(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Number> idsNumbers = (List<Number>) request.get("ids");

            if (idsNumbers == null || idsNumbers.isEmpty()) {
                return ResponseEntity.ok(buildErrorResponse("IDs 不能为空"));
            }

            // 将 Number 列表转换为 Long 列表
            List<Long> ids = idsNumbers.stream()
                    .map(Number::longValue)
                    .toList();

            mcpServerService.batchDeleteServers(ids);
            return ResponseEntity.ok(buildSuccessResponse("批量删除完成", null));
        } catch (IllegalArgumentException e) {
            log.warn("批量删除 MCP 服务器失败: {}", e.getMessage());
            return ResponseEntity.ok(buildErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("批量删除 MCP 服务器失败", e);
            return ResponseEntity.ok(buildErrorResponse("批量删除失败: " + e.getMessage()));
        }
    }

    /**
     * 生成 MCP 配置
     *
     * @param providerId Provider ID
     * @param cliType    CLI 类型
     * @param clientOs   客户端操作系统（可选）：windows, mac, linux，默认为当前服务器系统
     * @return 响应对象，包含生成的 MCP 配置
     */
    @GetMapping("/provider/{providerId}/cli/{cliType}/config")
    public ResponseEntity<Map<String, Object>> generateMcpConfig(
            @PathVariable String providerId,
            @PathVariable String cliType,
            @RequestParam(required = false) String clientOs) {
        try {
            Map<String, Object> config = mcpServerService.generateMcpConfig(providerId, cliType, clientOs);
            return ResponseEntity.ok(buildSuccessResponse("配置生成成功", config));
        } catch (Exception e) {
            log.error("生成 MCP 配置失败，Provider ID: {}, CLI 类型: {}, 客户端系统: {}", providerId, cliType, clientOs, e);
            return ResponseEntity.ok(buildErrorResponse("配置生成失败: " + e.getMessage()));
        }
    }

    /**
     * 构建成功响应
     *
     * @param message 消息
     * @param data    数据
     * @return 响应 Map
     */
    private Map<String, Object> buildSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 200);
        response.put("message", message);
        response.put("data", data);
        return response;
    }

    /**
     * 构建错误响应
     *
     * @param message 错误消息
     * @return 响应 Map
     */
    private Map<String, Object> buildErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", 500);
        response.put("message", message);
        response.put("data", null);
        return response;
    }

    /**
     * 获取当前登录用户的 ID
     *
     * @return 用户 ID
     */
    private Long getCurrentUserId() {
        return UserContext.getUserId();
    }
}
