import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '@/lib/api';

export type UserRole = 'delivery' | 'agent';

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;

  // Actions
  setAuth: (user: AuthUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const USER_KEY = 'auth_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  setAuth: async (user, token) => {
    // Persist token in SecureStore
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, token: null });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userRaw = await SecureStore.getItemAsync(USER_KEY);
      if (token && userRaw) {
        const user: AuthUser = JSON.parse(userRaw);
        set({ user, token, isHydrated: true });
        return;
      }
    } catch {
      // Ignore parse errors; fall through to unauthenticated state
    }
    set({ user: null, token: null, isHydrated: true });
  },
}));
