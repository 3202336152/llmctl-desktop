package com.llmctl.service.impl;

import com.llmctl.dto.UserInfoDTO;
import com.llmctl.entity.User;
import com.llmctl.mapper.UserMapper;
import com.llmctl.service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户服务实现
 *
 * @author Liu Yifan
 * @version 2.1.5
 * @since 2025-10-15
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements IUserService {

    private final UserMapper userMapper;

    @Override
    public List<UserInfoDTO> getAllUsers() {
        log.info("查询所有用户列表");

        List<User> users = userMapper.findAll();

        return users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<Long> getAllUserIds() {
        log.info("查询所有用户ID列表");

        List<User> users = userMapper.findAll();

        return users.stream()
                .map(User::getId)
                .collect(Collectors.toList());
    }

    /**
     * 转换为DTO
     */
    private UserInfoDTO convertToDTO(User user) {
        // 根据 isActive 和 isLocked 计算状态
        String status;
        if (user.getIsLocked() != null && user.getIsLocked()) {
            status = "LOCKED";
        } else if (user.getIsActive() != null && user.getIsActive()) {
            status = "ACTIVE";
        } else {
            status = "INACTIVE";
        }

        return UserInfoDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .status(status)
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
