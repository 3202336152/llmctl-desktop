import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import providerSlice from './slices/providerSlice';
import tokenSlice from './slices/tokenSlice';
import sessionSlice from './slices/sessionSlice';
import configSlice from './slices/configSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    provider: providerSlice,
    token: tokenSlice,
    session: sessionSlice,
    config: configSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 类型化的 hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;