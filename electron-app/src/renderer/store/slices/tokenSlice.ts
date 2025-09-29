import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Token } from '../../types';

interface TokenState {
  tokens: Token[];
  loading: boolean;
  error: string | null;
}

const initialState: TokenState = {
  tokens: [],
  loading: false,
  error: null,
};

const tokenSlice = createSlice({
  name: 'token',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<Token[]>) => {
      state.tokens = action.payload;
    },
    addToken: (state, action: PayloadAction<Token>) => {
      state.tokens.push(action.payload);
    },
    updateToken: (state, action: PayloadAction<Token>) => {
      const index = state.tokens.findIndex((t: Token) => t.id === action.payload.id);
      if (index !== -1) {
        state.tokens[index] = action.payload;
      }
    },
    removeToken: (state, action: PayloadAction<string>) => {
      state.tokens = state.tokens.filter((t: Token) => t.id !== action.payload);
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
  setTokens,
  addToken,
  updateToken,
  removeToken,
  setLoading,
  setError,
} = tokenSlice.actions;

export default tokenSlice.reducer;