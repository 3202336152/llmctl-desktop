/**
 * API 服务器配置工具
 */
export const apiConfig = {
  /**
   * 获取当前 API 基础 URL
   */
  getBaseUrl(): string {
    if (process.env.REACT_APP_API_BASE_URL) {
      return process.env.REACT_APP_API_BASE_URL;
    }

    try {
      const savedUrl = localStorage.getItem('apiBaseUrl');
      if (savedUrl) {
        return savedUrl;
      }
    } catch (e) {
      console.warn('Failed to read apiBaseUrl from localStorage:', e);
    }

    return 'http://localhost:8080/llmctl';
  },

  /**
   * 设置 API 基础 URL
   */
  setBaseUrl(url: string): void {
    try {
      localStorage.setItem('apiBaseUrl', url);
      console.log('API Base URL updated:', url);
    } catch (e) {
      console.error('Failed to save apiBaseUrl to localStorage:', e);
      throw new Error('无法保存 API 配置');
    }
  },

  /**
   * 重置为默认 URL
   */
  resetBaseUrl(): void {
    try {
      localStorage.removeItem('apiBaseUrl');
      console.log('API Base URL reset to default');
    } catch (e) {
      console.error('Failed to remove apiBaseUrl from localStorage:', e);
    }
  },

  /**
   * 测试 API 连接
   */
  async testConnection(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 秒超时
      });
      return response.ok;
    } catch (e) {
      console.error('API connection test failed:', e);
      return false;
    }
  },
};
