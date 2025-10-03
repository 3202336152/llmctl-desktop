package com.llmctl.service;

import com.llmctl.dto.CreateTokenRequest;
import com.llmctl.dto.UpdateTokenRequest;
import com.llmctl.dto.TokenDTO;
import com.llmctl.entity.Token;

import java.util.List;

/**
 * Token服务接口
 *
 * @author Liu Yifan
 * @version 2.0.0
 * @since 2025-09-29
 */
public interface TokenService {

    /**
     * 根据Provider ID获取Token列表
     *
     * @param providerId Provider ID
     * @return Token DTO列表
     */
    List<TokenDTO> getTokensByProviderId(String providerId);

    /**
     * 根据Provider ID获取可用的Token列表
     *
     * @param providerId Provider ID
     * @return 可用的Token DTO列表
     */
    List<TokenDTO> getAvailableTokensByProviderId(String providerId);

    /**
     * 根据ID获取Token详情
     *
     * @param id Token ID
     * @return Token DTO
     * @throws IllegalArgumentException 如果Token不存在
     */
    TokenDTO getTokenById(String id);

    /**
     * 为Provider创建新的Token
     *
     * @param providerId Provider ID
     * @param request 创建Token请求
     * @return 创建的Token DTO
     * @throws IllegalArgumentException 如果Provider不存在或Token别名冲突
     */
    TokenDTO createToken(String providerId, CreateTokenRequest request);

    /**
     * 更新Token
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @param request 更新Token请求
     * @return 更新后的Token DTO
     * @throws IllegalArgumentException 如果Token不存在或别名冲突
     */
    TokenDTO updateToken(String providerId, String tokenId, UpdateTokenRequest request);

    /**
     * 删除Token
     *
     * @param providerId Provider ID
     * @param tokenId Token ID
     * @throws IllegalArgumentException 如果Token不存在
     */
    void deleteToken(String providerId, String tokenId);

    /**
     * 根据轮询策略选择Token
     *
     * @param providerId Provider ID
     * @return 选中的Token，如果没有可用Token则返回null
     */
    Token selectToken(String providerId);

    /**
     * 更新Token健康状态
     *
     * @param tokenId Token ID
     * @param healthy 健康状态
     */
    void updateTokenHealth(String tokenId, boolean healthy);

    /**
     * 增加Token错误计数
     *
     * @param tokenId Token ID
     */
    void incrementTokenError(String tokenId);

    /**
     * 重置Token错误计数
     *
     * @param tokenId Token ID
     */
    void resetTokenError(String tokenId);

    /**
     * 将Token实体转换为DTO
     *
     * @param token Token实体
     * @return Token DTO
     */
    TokenDTO convertToDTO(Token token);
}