import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationFilter, NotificationSettings } from '../../components/Notifications/types';
import { NotificationAPI, notificationSSE } from '../../components/Notifications/notificationAPI';

// 通知状态接口
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  filter: NotificationFilter;
  settings: NotificationSettings;
  sseConnected: boolean;
  lastUpdated: number | null;
}

// 初始状态
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  filter: {
    page: 1,
    size: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  settings: {
    enableDesktop: true,
    enableSound: false,
    enableSSE: true,
    autoRefresh: true,
    refreshInterval: 30,
    displayCount: 50
  },
  sseConnected: false,
  lastUpdated: null
};

// 异步thunk：获取通知列表
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (filter: NotificationFilter = {}) => {
    const response = await NotificationAPI.getNotifications(filter);
    return response;
  }
);

// 异步thunk：获取未读数量
export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const count = await NotificationAPI.getUnreadCount();
    return count;
  }
);

// 异步thunk：标记为已读
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: number) => {
    await NotificationAPI.markAsRead(id);
    return id;
  }
);

// 异步thunk：批量标记为已读
export const batchMarkAsRead = createAsyncThunk(
  'notifications/batchMarkAsRead',
  async (ids: number[]) => {
    await NotificationAPI.batchMarkAsRead(ids);
    return ids;
  }
);

// 异步thunk：标记所有为已读
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    await NotificationAPI.markAllAsRead();
  }
);

// 异步thunk：删除通知
export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (id: number) => {
    await NotificationAPI.deleteNotification(id);
    return id;
  }
);

// 异步thunk：批量删除通知
export const batchDeleteNotifications = createAsyncThunk(
  'notifications/batchDeleteNotifications',
  async (ids: number[]) => {
    await NotificationAPI.batchDeleteNotifications(ids);
    return ids;
  }
);

// 通知slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // 设置过滤器
    setFilter: (state, action: PayloadAction<Partial<NotificationFilter>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },

    // 重置过滤器
    resetFilter: (state) => {
      state.filter = {
        page: 1,
        size: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
    },

    // 添加新通知（来自SSE）
    addNotification: (state, action: PayloadAction<Notification>) => {
      // 检查是否已存在
      const exists = state.notifications.some(n => n.id === action.payload.id);
      if (!exists) {
        // 添加到列表开头
        state.notifications.unshift(action.payload);

        // 限制显示数量
        if (state.notifications.length > state.settings.displayCount) {
          state.notifications = state.notifications.slice(0, state.settings.displayCount);
        }

        // 更新未读数量
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }

        state.lastUpdated = Date.now();
      }
    },

    // 更新通知状态
    updateNotification: (state, action: PayloadAction<{ id: number; updates: Partial<Notification> }>) => {
      const { id, updates } = action.payload;
      const index = state.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        const oldNotification = state.notifications[index];
        state.notifications[index] = { ...oldNotification, ...updates };

        // 更新未读数量
        if (oldNotification.isRead !== updates.isRead) {
          if (updates.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          } else {
            state.unreadCount += 1;
          }
        }

        state.lastUpdated = Date.now();
      }
    },

    // 移除通知
    removeNotification: (state, action: PayloadAction<number>) => {
      const id = action.payload;
      const index = state.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        const notification = state.notifications[index];
        state.notifications.splice(index, 1);

        // 更新未读数量
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }

        state.lastUpdated = Date.now();
      }
    },

    // 设置未读数量
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    // 更新设置
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    // 设置SSE连接状态
    setSseConnected: (state, action: PayloadAction<boolean>) => {
      state.sseConnected = action.payload;
    },

    // 清除错误
    clearError: (state) => {
      state.error = null;
    },

    // 清除所有通知
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.lastUpdated = Date.now();
    }
  },
  extraReducers: (builder) => {
    // 获取通知列表
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取通知列表失败';
      });

    // 获取未读数量
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });

    // 标记为已读
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.lastUpdated = Date.now();
        }
      });

    // 批量标记为已读
    builder
      .addCase(batchMarkAsRead.fulfilled, (state, action) => {
        const ids = action.payload;
        let countReduced = 0;

        ids.forEach(id => {
          const notification = state.notifications.find(n => n.id === id);
          if (notification && !notification.isRead) {
            notification.isRead = true;
            countReduced++;
          }
        });

        state.unreadCount = Math.max(0, state.unreadCount - countReduced);
        state.lastUpdated = Date.now();
      });

    // 标记所有为已读
    builder
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
        state.lastUpdated = Date.now();
      });

    // 删除通知
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
          const notification = state.notifications[index];
          state.notifications.splice(index, 1);
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.lastUpdated = Date.now();
        }
      });

    // 批量删除通知
    builder
      .addCase(batchDeleteNotifications.fulfilled, (state, action) => {
        const ids = action.payload;
        let countReduced = 0;

        state.notifications = state.notifications.filter(notification => {
          if (ids.includes(notification.id)) {
            if (!notification.isRead) {
              countReduced++;
            }
            return false;
          }
          return true;
        });

        state.unreadCount = Math.max(0, state.unreadCount - countReduced);
        state.lastUpdated = Date.now();
      });
  }
});

export const {
  setFilter,
  resetFilter,
  addNotification,
  updateNotification,
  removeNotification,
  setUnreadCount,
  updateSettings,
  setSseConnected,
  clearError,
  clearNotifications
} = notificationSlice.actions;

export default notificationSlice.reducer;