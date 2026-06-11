import { create } from 'zustand';
import { getMe, login, logout as logoutService, register } from '../services/auth';
import { tokenStorage } from '../services/api';
import type { LoginPayload, RegisterPayload, User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await tokenStorage.getAccess();
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await tokenStorage.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (payload) => {
    await login(payload);
    const user = await getMe();
    set({ user, isAuthenticated: true });
  },

  register: async (payload) => {
    await register(payload);
  },

  logout: async () => {
    await logoutService();
    set({ user: null, isAuthenticated: false });
  },
}));
