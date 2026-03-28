'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
  Store,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/payouts', label: 'Payouts', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-emerald-400" />
          <span className="font-bold text-lg text-white">LocalFashion</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Store info */}
      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-xs text-gray-400 uppercase tracking-wider">Your Store</p>
        <p className="text-sm font-medium text-white mt-1 truncate">
          {user?.store_name || 'My Store'}
        </p>
        {user?.store_status === 'pending' && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
            Under Review
          </span>
        )}
        {user?.store_status === 'active' && (
          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
            Active
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="mb-3">
          <p className="text-sm font-medium text-white truncate">{user?.name || 'Seller'}</p>
          <p className="text-xs text-gray-400">{user?.phone}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
