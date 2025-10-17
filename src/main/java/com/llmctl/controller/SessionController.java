package com.llmctl.controller;

import com.llmctl.context.UserContext;
import com.llmctl.dto.*;
import com.llmctl.service.ISessionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Session管理REST控制器
 *
 * 职责：提供会话元数据管理的REST API
 * 注意：终端I/O由Electron层直接处理，本控制器不再提供SSE和输入接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-28
 */
@Slf4j
@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@Validated
public class SessionController {

    private final ISessionService sessionService;

    /**
     * 获取活跃会话列表
     *
     * @return 活跃会话列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SessionDTO>>> getActiveSessions() {
        log.info("获取活跃会话列表");

        List<SessionDTO> sessions = sessionService.getActiveSessions();
        ApiResponse<List<SessionDTO>> response = ApiResponse.success(sessions);

        return ResponseEntity.ok(response);
    }

    /**
     * 获取所有会话列表
     *
     * @return 所有会话列表
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<SessionDTO>>> getAllSessions() {
        log.info("获取所有会话列表");

        List<SessionDTO> sessions = sessionService.getAllSessions();
        ApiResponse<List<SessionDTO>> response = ApiResponse.success(sessions);

        return ResponseEntity.ok(response);
    }

    /**
     * 根据ID获取会话详情
     *
     * @param sessionId 会话ID
     * @return 会话详情
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<SessionDTO>> getSessionById(
            @PathVariable @NotBlank(message = "会话ID不能为空") String sessionId) {
        log.info("根据ID获取会话详情: {}", sessionId);

        SessionDTO session = sessionService.getSessionById(sessionId);
        ApiResponse<SessionDTO> response = ApiResponse.success(session);

        return ResponseEntity.ok(response);
    }

    /**
     * 启动新的CLI会话（仅创建元数据记录）
     *
     * @param request 启动会话请求
     * @return 创建的会话
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SessionDTO>> startSession(
            @Valid @RequestBody StartSessionRequest request) {
        log.info("创建会话记录: {} (Provider: {})", request.getCommand(), request.getProviderId());

        SessionDTO session = sessionService.startSession(request);
        ApiResponse<SessionDTO> response = ApiResponse.success(session, "会话记录创建成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 更新会话状态
     *
     * @param sessionId 会话ID
     * @param request 状态更新请求
     * @return 更新后的会话
     */
    @PutMapping("/{sessionId}/status")
    public ResponseEntity<ApiResponse<SessionDTO>> updateSessionStatus(
            @PathVariable @NotBlank(message = "会话ID不能为空") String sessionId,
            @Valid @RequestBody UpdateSessionStatusRequest request) {
        log.info("更新会话状态: {} -> {}", sessionId, request.getStatus());

        SessionDTO session = sessionService.updateSessionStatus(sessionId, request.getStatus());
        ApiResponse<SessionDTO> response = ApiResponse.success(session, "会话状态更新成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 终止会话（仅更新元数据）
     *
     * @param sessionId 会话ID
     * @return 终止结果
     */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<Object>> terminateSession(
            @PathVariable @NotBlank(message = "会话ID不能为空") String sessionId) {
        log.info("终止会话: {}", sessionId);

        sessionService.terminateSession(sessionId);
        ApiResponse<Object> response = ApiResponse.success("会话终止成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 重新激活会话（将inactive状态改为active）
     *
     * @param sessionId 会话ID
     * @return 重新激活后的会话
     */
    @PostMapping("/{sessionId}/reactivate")
    public ResponseEntity<ApiResponse<SessionDTO>> reactivateSession(
            @PathVariable @NotBlank(message = "会话ID不能为空") String sessionId) {
        log.info("重新激活会话: {}", sessionId);

        SessionDTO session = sessionService.reactivateSession(sessionId);
        ApiResponse<SessionDTO> response = ApiResponse.success(session, "会话重新激活成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 删除会话记录（从数据库中永久删除）
     *
     * @param sessionId 会话ID
     * @return 删除结果
     */
    @DeleteMapping("/{sessionId}/record")
    public ResponseEntity<ApiResponse<Object>> deleteSession(
            @PathVariable @NotBlank(message = "会话ID不能为空") String sessionId) {
        log.info("删除会话记录: {}", sessionId);

        sessionService.deleteSession(sessionId);
        ApiResponse<Object> response = ApiResponse.success("会话记录删除成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 更新会话最后活动时间
     *
     * @param sessionId 会话ID
     * @return 更新结果
     */
    @PostMapping("/{sessionId}/activity")
    public ResponseEntity<ApiResponse<Object>> updateLastActivity(
            @PathVariable @NotBlank(message = "会话ID不能为空") String sessionId) {
        log.info("更新会话最后活动时间: {}", sessionId);

        sessionService.updateLastActivity(sessionId);
        ApiResponse<Object> response = ApiResponse.success("活动时间更新成功");

        return ResponseEntity.ok(response);
    }

    /**
     * 获取会话环境变量（供Electron前端使用）
     *
     * @param sessionId 会话ID
     * @return 环境变量Map
     */
    @GetMapping("/{sessionId}/environment")
    public ResponseEntity<ApiResponse<Map<String, String>>> getSessionEnvironment(
            @PathVariable @NotBlank(message = "会话ID不能为空") String sessionId) {
        log.info("获取会话环境变量: {}", sessionId);

        Map<String, String> envVars = sessionService.getSessionEnvironmentVariables(sessionId);
        ApiResponse<Map<String, String>> response = ApiResponse.success(envVars);

        return ResponseEntity.ok(response);
    }

    /**
     * 批量停用所有活跃会话（Electron应用退出时调用）
     * 原因：Electron应用关闭后，所有终端进程已全部终止
     *
     * @return 影响的行数
     */
    @PostMapping("/deactivate-all")
    public ResponseEntity<ApiResponse<Integer>> deactivateAllActiveSessions() {
        log.info("Electron应用退出，批量停用所有活跃会话");

        int count = sessionService.deactivateAllActiveSessions();
        String message = count > 0
                ? String.format("已将 %d 个活跃会话设置为非活跃状态", count)
                : "无需处理，当前没有活跃会话";
        ApiResponse<Integer> response = ApiResponse.success(count, message);

        return ResponseEntity.ok(response);
    }

    /**
     * 批量停用当前用户的所有活跃会话（用户登出时调用）
     * 原因：用户登出后，其会话应被清理，避免资源泄漏和状态混乱
     *
     * @return 影响的行数
     */
    @PostMapping("/deactivate-current-user")
    public ResponseEntity<ApiResponse<Integer>> deactivateCurrentUserSessions() {
        Long userId = UserContext.getUserId();
        log.info("用户登出，批量停用用户活跃会话，用户ID: {}", userId);

        int count = sessionService.deactivateUserActiveSessions(userId);
        String message = count > 0
                ? String.format("已终止 %d 个活跃会话", count)
                : "当前没有活跃会话";
        ApiResponse<Integer> response = ApiResponse.success(count, message);

        return ResponseEntity.ok(response);
    }

    /**
     * 批量删除当前用户的所有非活跃会话（一键清除功能）
     * 原因：清理冗余的非活跃会话记录，释放存储空间
     *
     * @return 删除的会话数量
     */
    @DeleteMapping("/cleanup-inactive")
    public ResponseEntity<ApiResponse<Integer>> cleanupInactiveSessions() {
        Long userId = UserContext.getUserId();
        log.info("一键清除非活跃会话，用户ID: {}", userId);

        int count = sessionService.deleteInactiveSessions(userId);
        String message = count > 0
                ? String.format("已清除 %d 个非活跃会话", count)
                : "当前没有非活跃会话";
        ApiResponse<Integer> response = ApiResponse.success(count, message);

        return ResponseEntity.ok(response);
    }

    /**
     * 更新会话状态请求DTO
     */
    public static class UpdateSessionStatusRequest {
        @NotBlank(message = "会话状态不能为空")
        private String status;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}