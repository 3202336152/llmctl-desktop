import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoadingState, ErrorState } from '../../types';

interface UIState {
  loading: LoadingState;
  errors: ErrorState;
  notifications: Array<{
    id: string;
    type: 'success' | 'info' | 'warning' | 'error';
    title: string;
    message?: string;
    duration?: number;
  }>;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

const initialState: UIState = {
  loading: {},
  errors: {},
  notifications: [],
  theme: 'light',
  sidebarCollapsed: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },
    setError: (state, action: PayloadAction<{ key: string; error: string | null }>) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
    clearAllErrors: (state) => {
      state.errors = {};
    },
    addNotification: (
      state,
      action: PayloadAction<{
        type: 'success' | 'info' | 'warning' | 'error';
        title: string;
        message?: string;
        duration?: number;
      }>
    ) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  clearAllErrors,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setTheme,
  setSidebarCollapsed,
} = uiSlice.actions;

export default uiSlice.reducer;