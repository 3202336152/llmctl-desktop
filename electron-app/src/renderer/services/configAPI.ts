import httpClient from './httpClient';
import {
  ApiResponse,
  ConfigExportResponse,
  ConfigImportRequest,
  ConfigValidationResponse,
  GlobalConfig,
} from '../types';

export const configAPI = {
  // 导出配置
  exportConfig: (format: 'bash' | 'powershell' | 'cmd' | 'json'): Promise<ApiResponse<ConfigExportResponse>> => {
    return httpClient.get(`/config/export?format=${format}`).then(response => response.data);
  },

  // 导入配置
  importConfig: (request: ConfigImportRequest): Promise<ApiResponse<void>> => {
    return httpClient.post('/config/import', request).then(response => response.data);
  },

  // 验证配置
  validateConfig: (providerId: string): Promise<ApiResponse<ConfigValidationResponse>> => {
    return httpClient.post('/config/validate', { providerId }).then(response => response.data);
  },

  // 获取当前活跃Provider
  getActiveProvider: (): Promise<ApiResponse<{ activeProviderId: string; activeProvider: any }>> => {
    return httpClient.get('/config/active-provider').then(response => response.data);
  },

  // 设置活跃Provider
  setActiveProvider: (providerId: string): Promise<ApiResponse<void>> => {
    return httpClient.put('/config/active-provider', { providerId }).then(response => response.data);
  },

  // ==================== 全局配置 API ====================

  // 获取所有全局配置
  getGlobalConfigs: (): Promise<ApiResponse<GlobalConfig[]>> => {
    return httpClient.get('/config/global').then(response => response.data);
  },

  // 设置单个全局配置
  setGlobalConfig: (configKey: string, configValue: string): Promise<ApiResponse<void>> => {
    return httpClient.post('/config/global', { configKey, configValue }).then(response => response.data);
  },

  // 批量设置全局配置
  setBatchGlobalConfigs: (configs: { configKey: string; configValue: string }[]): Promise<ApiResponse<void>> => {
    return httpClient.post('/config/global/batch', configs).then(response => response.data);
  },
};