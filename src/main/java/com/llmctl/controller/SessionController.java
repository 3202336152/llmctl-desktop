package com.llmctl.controller;

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

/**
 * Session管理REST控制器
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
     * 启动新的CLI会话
     *
     * @param request 启动会话请求
     * @return 创建的会话
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SessionDTO>> startSession(
            @Valid @RequestBody StartSessionRequest request) {
        log.info("启动新的CLI会话: {} (Provider: {})", request.getCommand(), request.getProviderId());

        SessionDTO session = sessionService.startSession(request);
        ApiResponse<SessionDTO> response = ApiResponse.success(session, "会话启动成功");

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
     * 终止会话
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
     * 获取会话统计信息
     *
     * @return 会话统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<ISessionService.SessionStatistics>> getSessionStatistics() {
        log.info("获取会话统计信息");

        ISessionService.SessionStatistics statistics = sessionService.getSessionStatistics();
        ApiResponse<ISessionService.SessionStatistics> response = ApiResponse.success(statistics);

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