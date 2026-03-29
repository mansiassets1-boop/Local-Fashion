'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingBag, IndianRupee, RotateCcw, XCircle } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'

const DATE_RANGES = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
]

interface AnalyticsData {
  summary: {
    total_revenue: number
    total_orders: number
    avg_order_value: number
    return_rate: number
    cancellation_rate: number
  }
  revenue_trend: { date: string; revenue: number; orders: number }[]
  top_products: { name: string; revenue: number; orders: number }[]
  order_status: { status: string; count: number }[]
  peak_hours: { hour: number; orders: number }[]
}

const PIE_COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

const formatCurrency = (v: number) =>
  `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}`

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  suffix,
}: {
  title: string
  value: string
  icon: React.ElementType
  color: string
  suffix?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
      </p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [range, setRange] = useState('7d')

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', range],
    queryFn: () => api.get(`/sellers/analytics?range=${range}`).then((r) => r.data),
  })

  const hourLabels = Array.from({ length: 24 }, (_, i) => {
    const h = i % 12 || 12
    return `${h}${i < 12 ? 'am' : 'pm'}`
  })

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            {DATE_RANGES.map((d) => (
              <button
                key={d.value}
                onClick={() => setRange(d.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  range === d.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(data?.summary.total_revenue || 0)}
            icon={IndianRupee}
            color="bg-emerald-600"
          />
          <StatCard
            title="Total Orders"
            value={String(data?.summary.total_orders || 0)}
            icon={ShoppingBag}
            color="bg-blue-600"
          />
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(data?.summary.avg_order_value || 0)}
            icon={TrendingUp}
            color="bg-violet-600"
          />
          <StatCard
            title="Return Rate"
            value={`${(data?.summary.return_rate || 0).toFixed(1)}%`}
            icon={RotateCcw}
            color="bg-orange-500"
          />
          <StatCard
            title="Cancellation Rate"
            value={`${(data?.summary.cancellation_rate || 0).toFixed(1)}%`}
            icon={XCircle}
            color="bg-red-500"
          />
        </div>

        {/* Revenue + Orders trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data?.revenue_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Orders Per Day</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.revenue_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v)
                    return `${d.getDate()}/${d.getMonth() + 1}`
                  }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top products + Status breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Top 5 Products by Revenue</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={(data?.top_products || []).slice(0, 5)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + '…' : v}
                />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data?.order_status || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ status, percent }) =>
                    `${status.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {(data?.order_status || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak hours heatmap */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Peak Order Hours</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-w-max">
              {(data?.peak_hours || Array.from({ length: 24 }, (_, i) => ({ hour: i, orders: 0 }))).map(
                ({ hour, orders }) => {
                  const maxOrders = Math.max(...(data?.peak_hours || []).map((h) => h.orders), 1)
                  const heightPct = (orders / maxOrders) * 80
                  const isHighest = orders === maxOrders && orders > 0
                  return (
                    <div key={hour} className="flex flex-col items-center gap-1" style={{ width: 36 }}>
                      <span className="text-xs text-gray-500">{orders || ''}</span>
                      <div
                        className={`w-7 rounded-t transition-all ${
                          isHighest ? 'bg-red-500' : orders > maxOrders * 0.6 ? 'bg-orange-400' : 'bg-emerald-400'
                        }`}
                        style={{ height: Math.max(4, heightPct) }}
                      />
                      <span className="text-xs text-gray-400" style={{ fontSize: 10 }}>
                        {hourLabels[hour]}
                      </span>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
