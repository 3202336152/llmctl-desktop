import httpClient from './httpClient';
import {
  ApiResponse,
  Token,
  CreateTokenRequest,
  UpdateTokenRequest,
  TokenStrategy,
} from '../types';

export const tokenAPI = {
  // 获取Provider的所有Tokens
  getTokensByProviderId: (providerId: string): Promise<ApiResponse<Token[]>> => {
    return httpClient.get(`/providers/${providerId}/tokens`).then(response => response.data);
  },

  // 为Provider添加Token
  createToken: (providerId: string, request: CreateTokenRequest): Promise<ApiResponse<Token>> => {
    return httpClient.post(`/providers/${providerId}/tokens`, request).then(response => response.data);
  },

  // 更新Token
  updateToken: (providerId: string, tokenId: string, request: UpdateTokenRequest): Promise<ApiResponse<Token>> => {
    return httpClient.put(`/providers/${providerId}/tokens/${tokenId}`, request).then(response => response.data);
  },

  // 删除Token
  deleteToken: (providerId: string, tokenId: string): Promise<ApiResponse<void>> => {
    return httpClient.delete(`/providers/${providerId}/tokens/${tokenId}`).then(response => response.data);
  },

  // 设置Token策略
  setTokenStrategy: (providerId: string, strategy: TokenStrategy): Promise<ApiResponse<void>> => {
    return httpClient.put(`/providers/${providerId}/token-strategy`, strategy).then(response => response.data);
  },

  // 获取Token使用统计
  getTokenStatistics: (providerId: string): Promise<ApiResponse<any>> => {
    return httpClient.get(`/statistics/tokens/${providerId}`).then(response => response.data);
  },

  // 批量恢复指定Provider下所有不健康Token的健康状态
  recoverAllUnhealthyTokens: (providerId: string): Promise<ApiResponse<number>> => {
    return httpClient.post(`/providers/${providerId}/tokens/recover-all`).then(response => response.data);
  },

  // 更新单个Token的健康状态
  updateTokenHealth: (providerId: string, tokenId: string, healthy: boolean): Promise<ApiResponse<void>> => {
    return httpClient.put(`/providers/${providerId}/tokens/${tokenId}/health`, { healthy }).then(response => response.data);
  },
};