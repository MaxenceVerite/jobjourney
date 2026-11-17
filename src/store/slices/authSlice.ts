
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService from '../../services/authService';


export interface AuthState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isConnected: false,
  isLoading: false,
  error: null,
};

interface LoginPayload {
  mail: string;
  password: string;
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginPayload, { rejectWithValue }) => {
    try {

      const data = await authService.login(credentials);
      return data;

    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);



interface RegisterPayload{
  mail: string;
  tel: string;
  password: string;
}

export const register = createAsyncThunk(
  'auth/register',
  async (registerPayload: RegisterPayload, { rejectWithValue }) => {
    try {

      const data = await authService.register({...registerPayload});
      return data;

    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {

      await authService.checkSession();

    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);



import { clearTokens } from '../../api/myJobBoard/tokenManager';

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    logout(state) {
      state.isConnected = false;
      state.isLoading = false;
      state.error = null;
      clearTokens();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<void>) => {
        state.isLoading = false;
        state.isConnected = true;
      })
      .addCase(login.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isConnected = false;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<void>) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(checkSession.fulfilled, (state) => {
        state.isConnected = true;
        state.isLoading = false;
      })
      .addCase(checkSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkSession.rejected, (state) => {
        state.isConnected = false;
        state.isLoading = false;
        clearTokens();
      });
  },
});

export const { logout, setConnected } = authSlice.actions;
export default authSlice.reducer;
