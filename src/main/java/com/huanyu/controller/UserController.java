package com.llmctl.controller;

import com.llmctl.dto.Result;
import com.llmctl.dto.response.UserResponse;
import com.llmctl.security.CurrentUser;
import com.llmctl.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 用户管理控制器
 */
@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "用户管理", description = "用户信息管理相关接口")
public class UserController {

    private final UserService userService;

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的详细信息")
    public Result<UserResponse> getCurrentUser(@CurrentUser String userId) {
        log.info("获取当前用户信息: {}", userId);
        UserResponse user = userService.getUserById(userId);
        return Result.success(user);
    }

    /**
     * 更新当前用户信息
     */
    @PutMapping("/me")
    @Operation(summary = "更新当前用户信息", description = "更新当前登录用户的信息")
    public Result<UserResponse> updateCurrentUser(@CurrentUser String userId,
                                                 @RequestBody UserResponse userRequest) {
        log.info("更新用户信息: {}", userId);
        UserResponse updatedUser = userService.updateUser(userId, userRequest);
        return Result.success("用户信息更新成功", updatedUser);
    }

    /**
     * 获取用户列表（管理员权限）
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取用户列表", description = "分页获取用户列表（管理员权限）")
    public Result<Page<UserResponse>> getUsers(Pageable pageable) {
        log.info("获取用户列表");
        Page<UserResponse> users = userService.getUsers(pageable);
        return Result.success(users);
    }

    /**
     * 根据ID获取用户信息（管理员权限）
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "获取用户详情", description = "根据ID获取用户详细信息（管理员权限）")
    public Result<UserResponse> getUser(@PathVariable String userId) {
        log.info("获取用户详情: {}", userId);
        UserResponse user = userService.getUserById(userId);
        return Result.success(user);
    }

    /**
     * 启用/禁用用户（管理员权限）
     */
    @PutMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "更新用户状态", description = "启用或禁用用户账户（管理员权限）")
    public Result<Void> updateUserStatus(@PathVariable String userId,
                                        @RequestParam Boolean isActive) {
        log.info("更新用户状态: {} -> {}", userId, isActive);
        userService.updateUserStatus(userId, isActive);
        return Result.success("用户状态更新成功");
    }

    /**
     * 搜索用户（管理员权限）
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "搜索用户", description = "根据关键词搜索用户（管理员权限）")
    public Result<Page<UserResponse>> searchUsers(@RequestParam String keyword,
                                                 Pageable pageable) {
        log.info("搜索用户: {}", keyword);
        Page<UserResponse> users = userService.searchUsers(keyword, pageable);
        return Result.success(users);
    }
}