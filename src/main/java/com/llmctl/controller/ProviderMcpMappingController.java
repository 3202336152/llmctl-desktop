package com.llmctl.controller;

import com.llmctl.entity.ProviderMcpMapping;
import com.llmctl.service.ProviderMcpMappingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Provider MCP 映射控制器
 * 提供 Provider 与 MCP 服务器关联关系的 REST API
 *
 * @author LLMctl Team
 * @since v2.3.0
 */
@Slf4j
@RestController
@RequestMapping("/provider-mcp-mappings")
@RequiredArgsConstructor
public class ProviderMcpMappingController {

    private final ProviderMcpMappingService mappingService;

    /**
     * 根据 Provider ID 和 CLI 类型查询关联的 MCP 服务器
     *
     * @param providerId Provider ID
     * @param cliType    CLI 类型
     * @return 响应对象，包含 MCP 映射列表
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMappingsByProviderAndCli(
            @RequestParam String providerId,
            @RequestParam String cliType) {
        try {
            List<ProviderMcpMapping> mappings = mappingService.getMappingsByProviderAndCli(providerId, cliType);
            return ResponseEntity.ok(buildSuccessResponse("查询成功", mappings));
        } catch (Exception e) {
            log.error("查询 Provider MCP 映射失败，Provider ID: {}, CLI 类型: {}", providerId, cliType, e);
            return ResponseEntity.ok(buildErrorResponse("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 根据 Provider ID 查询所有关联
     *
     * @param providerId Provider ID
     * @return 响应对象，包含 MCP 映射列表
     */
    @GetMapping("/provider/{providerId}")
    public ResponseEntity<Map<String, Object>> getMappingsByProviderId(@PathVariable String providerId) {
        try {
            List<ProviderMcpMapping> mappings = mappingService.getMappingsByProviderId(providerId);
            return ResponseEntity.ok(buildSuccessResponse("查询成功", mappings));
        } catch (Exception e) {
            log.error("查询 Provider MCP 映射失败，Provider ID: {}", providerId, e);
            return ResponseEntity.ok(buildErrorResponse("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 根据 ID 查询映射
     *
     * @param id 映射 ID
     * @return 响应对象，包含 MCP 映射对象
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMappingById(@PathVariable Long id) {
        try {
            ProviderMcpMapping mapping = mappingService.getMappingById(id);
            if (mapping == null) {
                return ResponseEntity.ok(buildErrorResponse("Provider MCP 映射不存在"));
            }
            return ResponseEntity.ok(buildSuccessResponse("查询成功", mapping));
        } catch (Exception e) {
            log.error("查询 Provider MCP 映射失败，ID: {}", id, e);
            return ResponseEntity.ok(buildErrorResponse("查询失败: " + e.getMessage()));
        }
    }

    /**
     * 创建 Provider MCP 映射
     *
     * @param mapping MCP 映射对象
     * @return 响应对象，包含创建后的 MCP 映射对象
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createMapping(@RequestBody ProviderMcpMapping mapping) {
        try {
            ProviderMcpMapping created = mappingService.createMapping(mapping);
            return ResponseEntity.ok(buildSuccessResponse("Provider MCP 映射创建成功", created));
        } catch (IllegalArgumentException e) {
            log.warn("创建 Provider MCP 映射失败: {}", e.getMessage());
            return ResponseEntity.ok(buildErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("创建 Provider MCP 映射失败", e);
            return ResponseEntity.ok(buildErrorResponse("创建失败: " + e.getMessage()));
        }
    }

    /**
     * 更新 Provider MCP 映射
     *
     * @param id      映射 ID
     * @param mapping MCP 映射对象
     * @return 响应对象，包含更新后的 MCP 映射对象
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateMapping(
            @PathVariable Long id,
            @RequestBody ProviderMcpMapping mapping) {
        try {
            mapping.setId(id);
            ProviderMcpMapping updated = mappingService.updateMapping(mapping);
            return ResponseEntity.ok(buildSuccessResponse("Provider MCP 映射更新成功", updated));
        } catch (IllegalArgumentException e) {
            log.warn("更新 Provider MCP 映射失败: {}", e.getMessage());
            return ResponseEntity.ok(buildErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("更新 Provider MCP 映射失败，ID: {}", id, e);
            return ResponseEntity.ok(buildErrorResponse("更新失败: " + e.getMessage()));
        }
    }

    /**
     * 删除 Provider MCP 映射
     *
     * @param id 映射 ID
     * @return 响应对象
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteMapping(@PathVariable Long id) {
        try {
            mappingService.deleteMapping(id);
            return ResponseEntity.ok(buildSuccessResponse("Provider MCP 映射删除成功", null));
        } catch (IllegalArgumentException e) {
            log.warn("删除 Provider MCP 映射失败: {}", e.getMessage());
            return ResponseEntity.ok(buildErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("删除 Provider MCP 映射失败，ID: {}", id, e);
            return ResponseEntity.ok(buildErrorResponse("删除失败: " + e.getMessage()));
        }
    }

    /**
     * 批量保存 Provider MCP 映射
     *
     * @param request 请求对象，包含 providerId、cliType 和 mappings 字段
     * @return 响应对象
     */
    @PostMapping("/batch-save")
    public ResponseEntity<Map<String, Object>> batchSaveMappings(@RequestBody Map<String, Object> request) {
        try {
            String providerId = (String) request.get("providerId");
            String cliType = (String) request.get("cliType");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> mappingsData = (List<Map<String, Object>>) request.get("mappings");

            // 转换为 ProviderMcpMapping 列表
            List<ProviderMcpMapping> mappings = mappingsData.stream()
                    .map(this::convertToMapping)
                    .toList();

            mappingService.batchSaveMappings(providerId, cliType, mappings);
            return ResponseEntity.ok(buildSuccessResponse("批量保存成功", null));
        } catch (Exception e) {
            log.error("批量保存 Provider MCP 映射失败", e);
            return ResponseEntity.ok(buildErrorResponse("批量保存失败: " + e.getMessage()));
        }
    }

    /**
     * 更新映射优先级
     *
     * @param id       映射 ID
     * @param priority 优先级
     * @return 响应对象
     */
    @PatchMapping("/{id}/priority")
    public ResponseEntity<Map<String, Object>> updatePriority(
            @PathVariable Long id,
            @RequestParam Integer priority) {
        try {
            mappingService.updatePriority(id, priority);
            return ResponseEntity.ok(buildSuccessResponse("优先级更新成功", null));
        } catch (Exception e) {
            log.error("更新 Provider MCP 映射优先级失败，ID: {}, 优先级: {}", id, priority, e);
            return ResponseEntity.ok(buildErrorResponse("优先级更新失败: " + e.getMessage()));
        }
    }

    /**
     * 批量更新优先级
     *
     * @param mappings 包含 ID 和优先级的映射列表
     * @return 响应对象
     */
    @PostMapping("/batch-update-priority")
    public ResponseEntity<Map<String, Object>> batchUpdatePriority(
            @RequestBody List<ProviderMcpMapping> mappings) {
        try {
            mappingService.batchUpdatePriority(mappings);
            return ResponseEntity.ok(buildSuccessResponse("批量更新优先级成功", null));
        } catch (Exception e) {
            log.error("批量更新 Provider MCP 映射优先级失败", e);
            return ResponseEntity.ok(buildErrorResponse("批量更新优先级失败: " + e.getMessage()));
        }
    }

    /**
     * 批量关联 MCP 服务器到 Provider
     *
     * @param request 请求对象，包含 providerId、cliType 和 mcpServerIds 字段
     * @return 响应对象
     */
    @PostMapping("/batch-associate")
    public ResponseEntity<Map<String, Object>> batchAssociateMcpServers(@RequestBody Map<String, Object> request) {
        try {
            String providerId = (String) request.get("providerId");
            String cliType = (String) request.get("cliType");
            @SuppressWarnings("unchecked")
            List<Number> mcpServerIdsNumbers = (List<Number>) request.get("mcpServerIds");
            List<Long> mcpServerIds = mcpServerIdsNumbers.stream()
                    .map(Number::longValue)
                    .toList();

            mappingService.batchAssociateMcpServers(providerId, cliType, mcpServerIds);
            return ResponseEntity.ok(buildSuccessResponse("批量关联 MCP 服务器成功", null));
        } catch (Exception e) {
            log.error("批量关联 MCP 服务器失败", e);
            return ResponseEntity.ok(buildErrorResponse("批量关联失败: " + e.getMessage()));
        }
    }

    /**
     * 将 Map 转换为 ProviderMcpMapping 对象
     *
     * @param data Map 数据
     * @return ProviderMcpMapping 对象
     */
    private ProviderMcpMapping convertToMapping(Map<String, Object> data) {
        ProviderMcpMapping mapping = new ProviderMcpMapping();

        if (data.containsKey("id")) {
            mapping.setId(((Number) data.get("id")).longValue());
        }
        if (data.containsKey("mcpServerId")) {
            mapping.setMcpServerId(((Number) data.get("mcpServerId")).longValue());
        }
        if (data.containsKey("enabled")) {
            mapping.setEnabled((Boolean) data.get("enabled"));
        }
        if (data.containsKey("priority")) {
            mapping.setPriority(((Number) data.get("priority")).intValue());
        }
        if (data.containsKey("customConfig")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> customConfig = (Map<String, Object>) data.get("customConfig");
            mapping.setCustomConfig(customConfig);
        }

        return mapping;
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
}
