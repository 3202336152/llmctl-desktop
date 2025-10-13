/**
 * 认证信息存储管理
 * 使用 localStorage 进行本地存储
 */
export class AuthStorage {

    /**
     * 保存登录信息
     */
    saveAuth(loginResponse: any): void {
        try {
            const expiresAt = Date.now() + loginResponse.expiresIn * 1000;

            localStorage.setItem('accessToken', loginResponse.accessToken);
            localStorage.setItem('refreshToken', loginResponse.refreshToken);
            localStorage.setItem('userId', String(loginResponse.userId));
            localStorage.setItem('username', loginResponse.username);
            localStorage.setItem('displayName', loginResponse.displayName || loginResponse.username);
            localStorage.setItem('expiresAt', String(expiresAt));

            console.log('[AuthStorage] 登录信息已保存');

            // 通知主进程登录状态已更新
            if (window.electronAPI) {
                window.electronAPI.send('set-auth-status', true);
            }
        } catch (error) {
            console.error('[AuthStorage] 保存登录信息失败:', error);
        }
    }

    /**
     * 获取Access Token
     */
    getAccessToken(): string | null {
        try {
            return localStorage.getItem('accessToken');
        } catch (error) {
            console.error('[AuthStorage] 获取 Access Token 失败:', error);
            return null;
        }
    }

    /**
     * 获取Refresh Token
     */
    getRefreshToken(): string | null {
        try {
            return localStorage.getItem('refreshToken');
        } catch (error) {
            console.error('[AuthStorage] 获取 Refresh Token 失败:', error);
            return null;
        }
    }

    /**
     * 获取当前用户信息
     */
    getCurrentUser(): { userId: number; username: string; displayName: string } | null {
        try {
            const userIdStr = localStorage.getItem('userId');
            const username = localStorage.getItem('username');
            const displayName = localStorage.getItem('displayName');

            if (!userIdStr || !username) {
                return null;
            }

            return {
                userId: parseInt(userIdStr),
                username,
                displayName: displayName || username
            };
        } catch (error) {
            console.error('[AuthStorage] 获取当前用户信息失败:', error);
            return null;
        }
    }

    /**
     * 检查是否已登录
     */
    isLoggedIn(): boolean {
        try {
            const token = this.getAccessToken();
            const expiresAtStr = localStorage.getItem('expiresAt');

            if (!token || !expiresAtStr) {
                return false;
            }

            const expiresAt = parseInt(expiresAtStr);

            // 检查Token是否过期
            return Date.now() < expiresAt;
        } catch (error) {
            console.error('[AuthStorage] 检查登录状态失败:', error);
            return false;
        }
    }

    /**
     * 检查Token是否即将过期（剩余时间少于10分钟）
     */
    isTokenExpiringSoon(): boolean {
        try {
            const expiresAtStr = localStorage.getItem('expiresAt');
            if (!expiresAtStr) return true;

            const expiresAt = parseInt(expiresAtStr);
            const timeLeft = expiresAt - Date.now();
            return timeLeft < 10 * 60 * 1000; // 10分钟
        } catch (error) {
            console.error('[AuthStorage] 检查 Token 过期状态失败:', error);
            return true;
        }
    }

    /**
     * 更新Access Token（刷新后）
     */
    updateAccessToken(accessToken: string, expiresIn: number): void {
        try {
            const expiresAt = Date.now() + expiresIn * 1000;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('expiresAt', String(expiresAt));

            console.log('[AuthStorage] Access Token已更新');
        } catch (error) {
            console.error('[AuthStorage] 更新 Access Token 失败:', error);
        }
    }

    /**
     * 清除所有登录信息（登出）
     */
    clearAuth(): void {
        try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
            localStorage.removeItem('displayName');
            localStorage.removeItem('expiresAt');

            console.log('[AuthStorage] 登录信息已清除');

            // 通知主进程登录状态已更新
            if (window.electronAPI) {
                window.electronAPI.send('set-auth-status', false);
            }
        } catch (error) {
            console.error('[AuthStorage] 清除登录信息失败:', error);
        }
    }
}

export const authStorage = new AuthStorage();
