import { create } from 'zustand'

interface AdminUser {
  id: string
  phone: string
  name: string
  role: string
  email?: string
}

interface AuthState {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: AdminUser, token: string) => void
  clearAuth: () => void
  initAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_user', JSON.stringify(user))
    }
    set({ user, token, isAuthenticated: true })
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
    set({ user: null, token: null, isAuthenticated: false })
  },

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token')
      const userStr = localStorage.getItem('admin_user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          set({ user, token, isAuthenticated: true })
        } catch {
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_user')
        }
      }
    }
  },
}))
