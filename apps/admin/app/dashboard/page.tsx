'use client'

import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  IndianRupee, ShoppingBag, Bike, Store, Users, TrendingUp,
  Clock, XCircle, RefreshCw, AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import AdminLayout from '@/components/AdminLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'

interface DashboardKPIs {
  gmv_today: number
  gmv_month: number
  active_orders: number
  orders_by_status: Record<string, number>
  online_delivery_partners: number
  new_sellers_today: number
  new_buyers_today: number
  platform_revenue_today: number
  avg_delivery_time_minutes: number
  cancellation_rate: number
  last_updated: string
}

interface GmvTrend {
  date: string
  gmv: number
  orders: number
}

interface CityOrders {
  city: string
  orders: number
  gmv: number
}

const FUNNEL_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  urgent,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
  urgent?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border ${urgent ? 'border-red-300' : 'border-gray-200'} p-5`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className={`text-2xl font-bold ${urgent ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: kpis, isLoading, refetch } = useQuery<DashboardKPIs>({
    queryKey: ['admin-kpis'],
    queryFn: () => api.get('/admin/dashboard/kpis').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: gmvTrend } = useQuery<GmvTrend[]>({
    queryKey: ['admin-gmv-trend'],
    queryFn: () => api.get('/admin/dashboard/gmv-trend?days=7').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: cityOrders } = useQuery<CityOrders[]>({
    queryKey: ['admin-city-orders'],
    queryFn: () => api.get('/admin/dashboard/city-orders').then((r) => r.data),
  })

  const funnelData = kpis?.orders_by_status
    ? Object.entries(kpis.orders_by_status).map(([status, count], i) => ({
        name: status.replace(/_/g, ' '),
        value: count,
        fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
      }))
    : []

  return (
    <AuthGuard>
      <AdminLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {kpis?.last_updated
                ? `Last updated ${formatDistanceToNow(new Date(kpis.last_updated), { addSuffix: true })}`
                : 'Live platform metrics'}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-7 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Grid Row 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <KPICard
                title="GMV Today"
                value={`₹${((kpis?.gmv_today || 0) / 1000).toFixed(1)}K`}
                icon={IndianRupee}
                color="bg-violet-600"
              />
              <KPICard
                title="GMV This Month"
                value={`₹${((kpis?.gmv_month || 0) / 100000).toFixed(2)}L`}
                icon={TrendingUp}
                color="bg-indigo-600"
              />
              <KPICard
                title="Active Orders"
                value={kpis?.active_orders || 0}
                subtitle="across all cities"
                icon={ShoppingBag}
                color="bg-blue-600"
              />
              <KPICard
                title="Online Partners"
                value={kpis?.online_delivery_partners || 0}
                subtitle="delivery partners online"
                icon={Bike}
                color="bg-green-600"
              />
            </div>

            {/* KPI Grid Row 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard
                title="New Sellers Today"
                value={kpis?.new_sellers_today || 0}
                icon={Store}
                color="bg-emerald-600"
              />
              <KPICard
                title="New Buyers Today"
                value={kpis?.new_buyers_today || 0}
                icon={Users}
                color="bg-sky-600"
              />
              <KPICard
                title="Platform Revenue"
                value={`₹${((kpis?.platform_revenue_today || 0)).toLocaleString('en-IN')}`}
                subtitle="today"
                icon={IndianRupee}
                color="bg-amber-500"
              />
              <KPICard
                title="Avg Delivery Time"
                value={`${kpis?.avg_delivery_time_minutes || 0} min`}
                icon={Clock}
                color="bg-orange-500"
                urgent={(kpis?.avg_delivery_time_minutes || 0) > 45}
              />
            </div>

            {/* Cancellation Rate Alert */}
            {(kpis?.cancellation_rate || 0) > 10 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    High Cancellation Rate: {kpis?.cancellation_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Above 10% threshold. Investigate seller SLA compliance.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* GMV Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">GMV — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={gmvTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${(v / 1000).toFixed(0)}K`}`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'GMV']}
                />
                <Line
                  type="monotone"
                  dataKey="gmv"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#7c3aed' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by City */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Orders by City (Today)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityOrders || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="city" width={70} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#7c3aed" radius={[0, 4, 4, 0]}>
                  {(cityOrders || []).map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown */}
        {funnelData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Order Status Funnel</h3>
            <div className="flex flex-wrap gap-3">
              {funnelData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm text-gray-600 capitalize">{item.name}</span>
                  <span className="text-sm font-bold text-gray-900 ml-1">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  )
}
