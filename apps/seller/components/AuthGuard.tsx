'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user, initAuth } = useAuthStore()

  useEffect(() => {
    initAuth()
  }, [initAuth])

  useEffect(() => {
    const token = localStorage.getItem('seller_token')
    const userStr = localStorage.getItem('seller_user')

    if (!token || !userStr) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(userStr)
      if (userData.role !== 'seller') {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    }
  }, [router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return <>{children}</>
}
