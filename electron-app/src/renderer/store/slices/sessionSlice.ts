import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session } from '../../types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
  // 终端状态
  openTerminalSessions: string[]; // 已打开终端的会话ID列表
  activeTabKey: string | undefined; // 当前激活的终端标签
}

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,
  openTerminalSessions: [],
  activeTabKey: undefined,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
    },
    addSession: (state, action: PayloadAction<Session>) => {
      state.sessions.push(action.payload);
    },
    updateSession: (state, action: PayloadAction<Session>) => {
      const index = state.sessions.findIndex((s: Session) => s.id === action.payload.id);
      if (index !== -1) {
        state.sessions[index] = action.payload;
      }
      if (state.currentSession?.id === action.payload.id) {
        state.currentSession = action.payload;
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s: Session) => s.id !== action.payload);
      if (state.currentSession?.id === action.payload) {
        state.currentSession = null;
      }
      // 同时关闭对应的终端
      state.openTerminalSessions = state.openTerminalSessions.filter(id => id !== action.payload);
      if (state.activeTabKey === action.payload) {
        state.activeTabKey = state.openTerminalSessions[0];
      }
    },
    setCurrentSession: (state, action: PayloadAction<Session | null>) => {
      state.currentSession = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // 终端管理actions
    openTerminal: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload;
      if (!state.openTerminalSessions.includes(sessionId)) {
        state.openTerminalSessions.push(sessionId);
      }
      state.activeTabKey = sessionId;
    },
    closeTerminal: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload;
      state.openTerminalSessions = state.openTerminalSessions.filter(id => id !== sessionId);
      // 如果关闭的是当前激活的标签，切换到其他标签
      if (state.activeTabKey === sessionId) {
        state.activeTabKey = state.openTerminalSessions[0];
      }
    },
    setActiveTab: (state, action: PayloadAction<string | undefined>) => {
      state.activeTabKey = action.payload;
    },
  },
});

export const {
  setSessions,
  addSession,
  updateSession,
  removeSession,
  setCurrentSession,
  setLoading,
  setError,
  openTerminal,
  closeTerminal,
  setActiveTab,
} = sessionSlice.actions;

export default sessionSlice.reducer;