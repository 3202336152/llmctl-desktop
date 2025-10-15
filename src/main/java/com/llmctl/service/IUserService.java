package com.llmctl.service;

import com.llmctl.dto.UserInfoDTO;

import java.util.List;

/**
 * 用户服务接口
 *
 * @author Liu Yifan
 * @version 2.1.4
 * @since 2025-10-15
 */
public interface IUserService {

    /**
     * 获取所有用户列表
     *
     * @return 用户信息列表
     */
    List<UserInfoDTO> getAllUsers();

    /**
     * 获取所有用户ID列表
     *
     * @return 用户ID列表
     */
    List<Long> getAllUserIds();
}
