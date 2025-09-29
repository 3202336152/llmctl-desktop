import httpClient from './httpClient';
import {
  ApiResponse,
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
  ConfigValidationResponse,
} from '../types';

export const providerAPI = {
  // 获取所有Providers
  getAllProviders: (): Promise<ApiResponse<Provider[]>> => {
    return httpClient.get('/providers').then(response => response.data);
  },

  // 根据ID获取Provider
  getProviderById: (id: string): Promise<ApiResponse<Provider>> => {
    return httpClient.get(`/providers/${id}`).then(response => response.data);
  },

  // 创建Provider
  createProvider: (request: CreateProviderRequest): Promise<ApiResponse<Provider>> => {
    return httpClient.post('/providers', request).then(response => response.data);
  },

  // 更新Provider
  updateProvider: (id: string, request: UpdateProviderRequest): Promise<ApiResponse<Provider>> => {
    return httpClient.put(`/providers/${id}`, request).then(response => response.data);
  },

  // 删除Provider
  deleteProvider: (id: string): Promise<ApiResponse<void>> => {
    return httpClient.delete(`/providers/${id}`).then(response => response.data);
  },

  // 验证Provider配置
  validateProvider: (id: string): Promise<ApiResponse<ConfigValidationResponse>> => {
    return httpClient.post(`/config/validate`, { providerId: id }).then(response => response.data);
  },

  // 获取活跃Provider
  getActiveProvider: (): Promise<ApiResponse<{ activeProviderId: string; activeProvider: Provider }>> => {
    return httpClient.get('/config/active-provider').then(response => response.data);
  },

  // 设置活跃Provider
  setActiveProvider: (providerId: string): Promise<ApiResponse<void>> => {
    return httpClient.put('/config/active-provider', { providerId }).then(response => response.data);
  },
};