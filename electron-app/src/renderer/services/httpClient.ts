import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types';
import { authStorage } from '../utils/authStorage';

// 获取 API 基础 URL（优先使用环境变量，fallback 到 localStorage，最后使用默认值）
const getApiBaseUrl = (): string => {
  // 1. 尝试从环境变量获取（打包时注入）
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // 2. 尝试从 localStorage 获取（用户配置）
  try {
    const savedUrl = localStorage.getItem('apiBaseUrl');
    if (savedUrl) {
      return savedUrl;
    }
  } catch (e) {
    console.warn('Failed to read apiBaseUrl from localStorage:', e);
  }

  // 3. 使用默认值
  return 'http://localhost:8080/llmctl';
};

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加JWT Token
apiClient.interceptors.request.use(
  (config) => {
    // 添加请求日志
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);

    // 为所有请求添加JWT Token (排除认证接口)
    const isAuthEndpoint = config.url?.startsWith('/auth/');
    if (!isAuthEndpoint) {
      const token = authStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理业务错误和401认证失败
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 添加响应日志
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);

    // 检查业务逻辑错误
    if (response.data.code !== 200) {
      const errorMessage = response.data.message || response.data.error || 'Unknown error';
      throw new Error(errorMessage);
    }

    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    console.error('[API Response Error]', error);

    let errorMessage = 'Network error';

    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response;
      errorMessage = data?.message || data?.error || `HTTP ${status} Error`;

      switch (status) {
        case 400:
          errorMessage = '请求参数错误';
          break;
        case 401:
          // Token失效或未登录，清除认证信息并跳转到登录页
          errorMessage = '登录已过期，请重新登录';
          authStorage.clearAuth();
          // 使用 window.location 强制刷新到登录页
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/#/login';
          }
          break;
        case 403:
          errorMessage = '访问被禁止';
          break;
        case 404:
          errorMessage = '资源不存在';
          break;
        case 409:
          errorMessage = '资源冲突';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = data?.message || `HTTP ${status} Error`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接失败，请检查后端服务是否启动';
    } else {
      // 其他错误
      errorMessage = error.message || 'Unknown error';
    }

    // 显示错误通知
    if (window.electronAPI?.showNotification) {
      window.electronAPI.showNotification('API错误', errorMessage);
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;