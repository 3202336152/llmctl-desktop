package com.llmctl.controller;

import com.llmctl.dto.ApiResponse;
import com.llmctl.dto.UserInfoDTO;
import com.llmctl.service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户控制器
 *
 * @author Liu Yifan
 * @version 2.1.4
 * @since 2025-10-15
 */
@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final IUserService userService;

    /**
     * 获取所有用户列表（简化信息，用于通知发送）
     *
     * GET /users/list
     */
    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<UserInfoDTO>>> getAllUsers() {
        log.info("获取所有用户列表");

        try {
            List<UserInfoDTO> users = userService.getAllUsers();
            return ResponseEntity.ok(ApiResponse.success(users, "获取成功"));
        } catch (Exception e) {
            log.error("获取用户列表失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("获取用户列表失败: " + e.getMessage()));
        }
    }

    /**
     * 获取所有用户ID列表
     *
     * GET /users/ids
     */
    @GetMapping("/ids")
    public ResponseEntity<ApiResponse<List<Long>>> getAllUserIds() {
        log.info("获取所有用户ID列表");

        try {
            List<Long> userIds = userService.getAllUserIds();
            return ResponseEntity.ok(ApiResponse.success(userIds, "获取成功"));
        } catch (Exception e) {
            log.error("获取用户ID列表失败", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.internalError("获取用户ID列表失败: " + e.getMessage()));
        }
    }
}
