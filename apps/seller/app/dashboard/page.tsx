'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Package,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import SLATimer from '@/components/SLATimer'
import Link from 'next/link'

interface DashboardStats {
  revenue_today: number
  orders_today: number
  pending_orders: number
  active_products: number
}

interface Order {
  id: string
  order_number: string
  status: string
  created_at: string
  total_amount: number
  buyer_area: string
  items_count: number
  sla_deadline?: string
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  prefix,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
  prefix?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {prefix && <span className="text-lg">{prefix}</span>}
        {value}
      </p>
    </div>
  )
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  ready_for_pickup: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/sellers/dashboard/stats').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<Order[]>({
    queryKey: ['recent-orders'],
    queryFn: () => api.get('/sellers/orders?limit=10&sort=created_at:desc').then((r) => r.data.orders),
    refetchInterval: 30000,
  })

  const pendingOrders = recentOrders?.filter((o) => o.status === 'pending') || []

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Under Review Banner */}
        {user?.store_status === 'pending' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Store Under Review</p>
              <p className="text-sm text-yellow-600 mt-0.5">
                Our team is reviewing your application. You'll be notified once approved (usually 24-48 hours).
              </p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Welcome back, {user?.name || 'Seller'}
            </p>
          </div>
          <button
            onClick={() => { refetchStats(); refetchOrders() }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-7 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Today's Revenue"
              value={(stats?.revenue_today || 0).toLocaleString('en-IN')}
              icon={TrendingUp}
              color="bg-emerald-600"
              prefix="₹"
            />
            <StatCard
              title="Orders Today"
              value={stats?.orders_today || 0}
              icon={ShoppingBag}
              color="bg-blue-600"
            />
            <StatCard
              title="Pending Orders"
              value={stats?.pending_orders || 0}
              icon={Clock}
              color="bg-orange-500"
            />
            <StatCard
              title="Active Products"
              value={stats?.active_products || 0}
              icon={Package}
              color="bg-violet-600"
            />
          </div>
        )}

        {/* Pending Orders SLA Alert */}
        {pendingOrders.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <h3 className="text-sm font-semibold text-red-800">
                  {pendingOrders.length} Order(s) Awaiting Response
                </h3>
              </div>
              <Link
                href="/orders"
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {pendingOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-100"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">#{order.order_number}</span>
                    <span className="text-xs text-gray-500 ml-2">— {order.buyer_area}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </span>
                    {order.sla_deadline && (
                      <SLATimer deadline={order.sla_deadline} compact />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
            <Link
              href="/orders"
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
            </div>
          ) : !recentOrders || recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders yet</p>
              <p className="text-sm text-gray-400 mt-1">Orders will appear here once customers start buying</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-900">#{order.order_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-600">{order.buyer_area}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-600">{order.items_count} item(s)</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-gray-900">
                          ₹{order.total_amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
