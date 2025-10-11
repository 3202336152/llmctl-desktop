import httpClient from './httpClient';
import { ApiResponse } from '../types';

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  displayName: string;
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
}

/**
 * 刷新Token请求参数
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * 认证相关API
 */
export const authAPI = {
  /**
   * 用户登录
   */
  login: (data: LoginRequest) => {
    return httpClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
  },

  /**
   * 用户注册
   */
  register: (data: RegisterRequest) => {
    return httpClient.post<ApiResponse<void>>('/auth/register', data);
  },

  /**
   * 刷新Token
   */
  refreshToken: (data: RefreshTokenRequest) => {
    return httpClient.post<ApiResponse<LoginResponse>>('/auth/refresh', data);
  },

  /**
   * 登出
   */
  logout: () => {
    return httpClient.post<ApiResponse<void>>('/auth/logout', {});
  },
};
