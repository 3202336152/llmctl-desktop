import httpClient from './httpClient';
import {
  ApiResponse,
  Session,
  StartSessionRequest,
  UpdateSessionStatusRequest,
} from '../types';

export const sessionAPI = {
  // 获取所有会话
  getAllSessions: (): Promise<ApiResponse<Session[]>> => {
    return httpClient.get('/sessions/all').then(response => response.data);
  },

  // 根据ID获取会话信息
  getSessionById: (sessionId: string): Promise<ApiResponse<Session>> => {
    return httpClient.get(`/sessions/${sessionId}`).then(response => response.data);
  },

  // 启动CLI会话
  startSession: (request: StartSessionRequest): Promise<ApiResponse<Session>> => {
    return httpClient.post('/sessions', request).then(response => response.data);
  },

  // 更新会话状态
  updateSessionStatus: (sessionId: string, request: UpdateSessionStatusRequest): Promise<ApiResponse<Session>> => {
    return httpClient.put(`/sessions/${sessionId}/status`, request).then(response => response.data);
  },

  // 终止会话
  terminateSession: (sessionId: string): Promise<ApiResponse<void>> => {
    return httpClient.delete(`/sessions/${sessionId}`).then(response => response.data);
  },

  // 重新激活会话（将inactive状态改为active）
  reactivateSession: (sessionId: string): Promise<ApiResponse<Session>> => {
    return httpClient.post(`/sessions/${sessionId}/reactivate`).then(response => response.data);
  },

  // 删除会话记录
  deleteSession: (sessionId: string): Promise<ApiResponse<void>> => {
    return httpClient.delete(`/sessions/${sessionId}/record`).then(response => response.data);
  },

  // 获取会话环境变量
  getSessionEnvironment: (sessionId: string): Promise<ApiResponse<Record<string, string>>> => {
    return httpClient.get(`/sessions/${sessionId}/environment`).then(response => response.data);
  },

  // 批量停用所有活跃会话（Electron应用退出时调用）
  deactivateAllActiveSessions: (): Promise<ApiResponse<number>> => {
    return httpClient.post('/sessions/deactivate-all').then(response => response.data);
  },

  // 批量停用当前用户的所有活跃会话（用户登出时调用）
  deactivateCurrentUserSessions: (): Promise<ApiResponse<number>> => {
    return httpClient.post('/sessions/deactivate-current-user').then(response => response.data);
  },

  // 获取活跃会话列表
  getActiveSessions: (): Promise<ApiResponse<Session[]>> => {
    return httpClient.get('/sessions').then(response => response.data);
  },

  // 一键清除当前用户的所有非活跃会话
  cleanupInactiveSessions: (): Promise<ApiResponse<number>> => {
    return httpClient.delete('/sessions/cleanup-inactive').then(response => response.data);
  },
};