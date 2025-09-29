import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GlobalConfig } from '../../types';

interface ConfigState {
  configs: GlobalConfig[];
  activeProviderId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConfigState = {
  configs: [],
  activeProviderId: null,
  loading: false,
  error: null,
};

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfigs: (state, action: PayloadAction<GlobalConfig[]>) => {
      state.configs = action.payload;
    },
    updateConfig: (state, action: PayloadAction<GlobalConfig>) => {
      const index = state.configs.findIndex((c: GlobalConfig) => c.key === action.payload.key);
      if (index !== -1) {
        state.configs[index] = action.payload;
      } else {
        state.configs.push(action.payload);
      }
    },
    setActiveProviderId: (state, action: PayloadAction<string | null>) => {
      state.activeProviderId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setConfigs,
  updateConfig,
  setActiveProviderId,
  setLoading,
  setError,
} = configSlice.actions;

export default configSlice.reducer;