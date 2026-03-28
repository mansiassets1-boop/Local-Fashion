import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  default_address_id?: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  city: City | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  setCity: (city: City) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      city: null,

      setUser: (user) => set({ user }),

      setToken: (token, refreshToken) => {
        set({ token, refreshToken: refreshToken ?? get().refreshToken });
        if (typeof window !== 'undefined') {
          localStorage.setItem('lf_token', token);
          if (refreshToken) {
            localStorage.setItem('lf_refresh_token', refreshToken);
          }
        }
      },

      setCity: (city) => set({ city }),

      logout: () => {
        set({ user: null, token: null, refreshToken: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('lf_token');
          localStorage.removeItem('lf_refresh_token');
        }
      },

      isLoggedIn: () => {
        const state = get();
        return !!(state.user && state.token);
      },
    }),
    {
      name: 'lf_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        city: state.city,
      }),
    }
  )
);
