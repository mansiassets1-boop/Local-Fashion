import { create } from 'zustand'

interface SellerUser {
  id: string
  phone: string
  name: string
  role: string
  store_id?: string
  store_name?: string
  store_status?: string
}

interface AuthState {
  user: SellerUser | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: SellerUser, token: string) => void
  clearAuth: () => void
  initAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seller_token', token)
      localStorage.setItem('seller_user', JSON.stringify(user))
    }
    set({ user, token, isAuthenticated: true })
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('seller_token')
      localStorage.removeItem('seller_user')
    }
    set({ user: null, token: null, isAuthenticated: false })
  },

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('seller_token')
      const userStr = localStorage.getItem('seller_user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          set({ user, token, isAuthenticated: true })
        } catch {
          localStorage.removeItem('seller_token')
          localStorage.removeItem('seller_user')
        }
      }
    }
  },
}))
