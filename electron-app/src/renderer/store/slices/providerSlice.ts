import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Provider, CreateProviderRequest, UpdateProviderRequest } from '../../types';
import { providerAPI } from '../../services/api';

interface ProviderState {
  providers: Provider[];
  currentProvider: Provider | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProviderState = {
  providers: [],
  currentProvider: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchProviders = createAsyncThunk(
  'provider/fetchProviders',
  async () => {
    const response = await providerAPI.getAllProviders();
    return response.data;
  }
);

export const fetchProviderById = createAsyncThunk(
  'provider/fetchProviderById',
  async (id: string) => {
    const response = await providerAPI.getProviderById(id);
    return response.data;
  }
);

export const createProvider = createAsyncThunk(
  'provider/createProvider',
  async (request: CreateProviderRequest) => {
    const response = await providerAPI.createProvider(request);
    return response.data;
  }
);

export const updateProvider = createAsyncThunk(
  'provider/updateProvider',
  async ({ id, request }: { id: string; request: UpdateProviderRequest }) => {
    const response = await providerAPI.updateProvider(id, request);
    return response.data;
  }
);

export const deleteProvider = createAsyncThunk(
  'provider/deleteProvider',
  async (id: string) => {
    await providerAPI.deleteProvider(id);
    return id;
  }
);

export const validateProvider = createAsyncThunk(
  'provider/validateProvider',
  async (id: string) => {
    const response = await providerAPI.validateProvider(id);
    return response.data;
  }
);

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProvider: (state, action: PayloadAction<Provider | null>) => {
      state.currentProvider = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch providers
      .addCase(fetchProviders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviders.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload || [];
      })
      .addCase(fetchProviders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch providers';
      })

      // Fetch provider by ID
      .addCase(fetchProviderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProvider = action.payload || null;
      })
      .addCase(fetchProviderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch provider';
      })

      // Create provider
      .addCase(createProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProvider.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.providers.push(action.payload);
        }
      })
      .addCase(createProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create provider';
      })

      // Update provider
      .addCase(updateProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProvider.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.providers.findIndex((p: Provider) => p.id === action.payload?.id);
        if (index !== -1 && action.payload) {
          state.providers[index] = action.payload;
        }
        if (state.currentProvider?.id === action.payload?.id && action.payload) {
          state.currentProvider = action.payload;
        }
      })
      .addCase(updateProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update provider';
      })

      // Delete provider
      .addCase(deleteProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProvider.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = state.providers.filter((p: Provider) => p.id !== action.payload);
        if (state.currentProvider?.id === action.payload) {
          state.currentProvider = null;
        }
      })
      .addCase(deleteProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete provider';
      });
  },
});

export const { clearError, setCurrentProvider } = providerSlice.actions;
export default providerSlice.reducer;