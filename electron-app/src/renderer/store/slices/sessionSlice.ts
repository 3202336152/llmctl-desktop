import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session } from '../../types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  loading: boolean;
  error: string | null;
  // 终端状态
  createdTerminalSessions: string[]; // 已创建的终端实例（包括隐藏的）
  openTerminalSessions: string[]; // 当前显示的终端标签
  activeTabKey: string | undefined; // 当前激活的终端标签
  terminalSessionData: Record<string, Session>; // 终端渲染所需的session数据快照
  isTerminalFullscreen: boolean; // 终端全屏状态
}

const initialState: SessionState = {
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,
  createdTerminalSessions: [],
  openTerminalSessions: [],
  activeTabKey: undefined,
  terminalSessionData: {},
  isTerminalFullscreen: false,
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
      // 同时销毁对应的终端实例
      state.createdTerminalSessions = state.createdTerminalSessions.filter(id => id !== action.payload);
      state.openTerminalSessions = state.openTerminalSessions.filter(id => id !== action.payload);
      delete state.terminalSessionData[action.payload];
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
      // 保存session数据快照，用于终端渲染
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        state.terminalSessionData[sessionId] = session;
      }
      // 添加到已创建列表（如果尚未创建）
      if (!state.createdTerminalSessions.includes(sessionId)) {
        state.createdTerminalSessions.push(sessionId);
      }
      // 添加到打开列表（如果尚未打开）
      if (!state.openTerminalSessions.includes(sessionId)) {
        state.openTerminalSessions.push(sessionId);
      }
      state.activeTabKey = sessionId;
    },
    closeTerminal: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload;
      // 只从打开列表移除，保留在已创建列表中
      state.openTerminalSessions = state.openTerminalSessions.filter(id => id !== sessionId);
      // 如果关闭的是当前激活的标签，切换到其他标签
      if (state.activeTabKey === sessionId) {
        state.activeTabKey = state.openTerminalSessions[0];
      }
    },
    destroyTerminal: (state, action: PayloadAction<string>) => {
      const sessionId = action.payload;
      // 从两个列表中都移除，真正销毁终端
      state.createdTerminalSessions = state.createdTerminalSessions.filter(id => id !== sessionId);
      state.openTerminalSessions = state.openTerminalSessions.filter(id => id !== sessionId);
      delete state.terminalSessionData[sessionId];
      if (state.activeTabKey === sessionId) {
        state.activeTabKey = state.openTerminalSessions[0];
      }
    },
    setActiveTab: (state, action: PayloadAction<string | undefined>) => {
      state.activeTabKey = action.payload;
    },
    toggleTerminalFullscreen: (state) => {
      state.isTerminalFullscreen = !state.isTerminalFullscreen;
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
  destroyTerminal,
  setActiveTab,
  toggleTerminalFullscreen,
} = sessionSlice.actions;

export default sessionSlice.reducer;