import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types';
import { authStorage } from '../utils/authStorage';

// 获取 API 基础 URL（优先使用环境变量，fallback 到 localStorage，最后使用默认值）
const getApiBaseUrl = (): string => {
  // 开发模式：使用相对路径，让webpack代理转发到后端
  if (process.env.NODE_ENV === 'development') {
    console.log('[API BaseURL] 开发模式，使用相对路径（通过webpack代理转发）: /llmctl');
    return '/llmctl';
  }

  // 1. 尝试从环境变量获取（打包时注入）
  if (process.env.REACT_APP_API_BASE_URL) {
    console.log('[API BaseURL] 使用环境变量:', process.env.REACT_APP_API_BASE_URL);
    return process.env.REACT_APP_API_BASE_URL;
  }

  // 2. 尝试从 localStorage 获取（用户配置）
  try {
    const savedUrl = localStorage.getItem('apiBaseUrl');
    if (savedUrl) {
      console.log('[API BaseURL] 使用localStorage配置:', savedUrl);
      return savedUrl;
    }
  } catch (e) {
    console.warn('Failed to read apiBaseUrl from localStorage:', e);
  }

  // 3. 使用默认值
  console.log('[API BaseURL] 使用默认配置: http://localhost:8080/llmctl');
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
    // 开发环境下打印请求日志（生产环境不打印）
    if (process.env.NODE_ENV === 'development') {
      // 安全日志：敏感数据脱敏
      const isAuthEndpoint = config.url?.startsWith('/auth/');
      if (isAuthEndpoint && config.data) {
        // 登录/注册请求：脱敏密码字段
        const safeData = { ...config.data };
        if (safeData.password) safeData.password = '***';
        if (safeData.confirmPassword) safeData.confirmPassword = '***';
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, safeData);
      } else {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }
    }

    // 为所有请求添加JWT Token (仅排除公开的认证接口)
    // 公开接口：登录、注册、刷新token、发送验证码、验证验证码
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/send-verification-code',
      '/auth/verify-code'
    ];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.startsWith(endpoint));

    if (!isPublicEndpoint) {
      const token = authStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// 标志位：防止多个请求同时触发刷新
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * 将等待中的请求添加到队列
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * 刷新成功后，通知所有等待的请求使用新Token重试
 */
function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
}

// 响应拦截器 - 处理业务错误和401认证失败
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 开发环境下打印响应日志（生产环境不打印）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.data.code}`);
    }

    // 检查业务逻辑错误
    if (response.data.code !== 200) {
      const errorMessage = response.data.message || response.data.error || 'Unknown error';
      throw new Error(errorMessage);
    }

    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    // 只在开发环境打印详细错误
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Response Error]', error);
    }

    const originalRequest = error.config;
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
          // 区分登录失败、刷新Token失败和Token过期三种情况
          const isLoginEndpoint = error.config?.url?.includes('/auth/login');
          const isRefreshEndpoint = error.config?.url?.includes('/auth/refresh');

          if (isLoginEndpoint) {
            // 登录接口返回401 - 用户名或密码错误
            errorMessage = data?.message || data?.error || '用户名或密码错误';
          } else if (isRefreshEndpoint) {
            // Refresh Token也失效了，清除认证信息并跳转到登录页
            console.log('[Token刷新失败] Refresh Token已失效，跳转登录页');
            errorMessage = '登录已过期，请重新登录';
            authStorage.clearAuth();
            isRefreshing = false;
            refreshSubscribers = [];
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/#/login';
            }
          } else {
            // Access Token过期，尝试使用Refresh Token刷新
            console.log('[Token过期] 尝试自动刷新Token');

            // 如果正在刷新中，将请求加入队列
            if (isRefreshing) {
              console.log('[Token刷新中] 将请求加入等待队列');
              return new Promise((resolve) => {
                subscribeTokenRefresh((newToken: string) => {
                  if (originalRequest && originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                  }
                  resolve(apiClient.request(originalRequest!));
                });
              });
            }

            // 开始刷新Token
            isRefreshing = true;
            const refreshToken = authStorage.getRefreshToken();

            if (refreshToken) {
              try {
                console.log('[Token刷新] 调用刷新接口');
                const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
                  refreshToken: refreshToken
                });

                if (response.data && response.data.code === 200) {
                  const { accessToken, expiresIn } = response.data.data;
                  console.log('[Token刷新成功] 更新本地Token');

                  // 更新本地存储
                  authStorage.updateAccessToken(accessToken, expiresIn);

                  // 通知所有等待的请求使用新Token重试
                  onTokenRefreshed(accessToken);
                  isRefreshing = false;

                  // 重试当前请求
                  if (originalRequest && originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                  }
                  return apiClient.request(originalRequest!);
                } else {
                  throw new Error('刷新Token失败');
                }
              } catch (refreshError) {
                console.error('[Token刷新失败]', refreshError);
                authStorage.clearAuth();
                isRefreshing = false;
                refreshSubscribers = [];
                errorMessage = '登录已过期，请重新登录';
                if (!window.location.pathname.includes('/login')) {
                  window.location.href = '/#/login';
                }
              }
            } else {
              // 没有Refresh Token，清除认证信息并跳转到登录页
              console.log('[无Refresh Token] 跳转登录页');
              errorMessage = '登录已过期，请重新登录';
              authStorage.clearAuth();
              isRefreshing = false;
              if (!window.location.pathname.includes('/login')) {
                window.location.href = '/#/login';
              }
            }
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