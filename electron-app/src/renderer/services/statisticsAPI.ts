import httpClient from './httpClient';
import {
  ApiResponse,
  UsageStatistics,
} from '../types';

export const statisticsAPI = {
  // 获取使用统计
  getUsageStatistics: (providerId?: string, days: number = 7): Promise<ApiResponse<UsageStatistics>> => {
    const params = new URLSearchParams();
    if (providerId) params.append('providerId', providerId);
    params.append('days', days.toString());

    return httpClient.get(`/statistics/usage?${params.toString()}`).then(response => response.data);
  },

  // 获取Token使用统计
  getTokenStatistics: (providerId: string): Promise<ApiResponse<any>> => {
    return httpClient.get(`/statistics/tokens/${providerId}`).then(response => response.data);
  },
};