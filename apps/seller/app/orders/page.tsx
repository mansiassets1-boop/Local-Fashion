'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Eye,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import SLATimer from '@/components/SLATimer'
import api from '@/lib/api'

const TABS = ['new', 'active', 'completed', 'cancelled', 'returns'] as const
type Tab = typeof TABS[number]

interface OrderItem {
  id: string
  product_name: string
  image_url?: string
  quantity: number
  price: number
  size?: string
  color?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  created_at: string
  total_amount: number
  buyer_area: string
  items: OrderItem[]
  sla_deadline?: string
  items_count: number
}

const TAB_STATUSES: Record<Tab, string[]> = {
  new: ['pending'],
  active: ['accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery'],
  completed: ['delivered'],
  cancelled: ['cancelled'],
  returns: ['return_requested', 'return_approved', 'return_rejected'],
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  ready_for_pickup: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  return_requested: 'bg-pink-100 text-pink-800',
}

function RejectModal({
  orderId,
  onClose,
  onConfirm,
}: {
  orderId: string
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Order</h3>
        <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejection</p>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Select reason</option>
          <option value="out_of_stock">Item out of stock</option>
          <option value="cannot_fulfill">Cannot fulfill at this time</option>
          <option value="store_closed">Store temporarily closed</option>
          <option value="other">Other</option>
        </select>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => reason && onConfirm(reason)}
            disabled={!reason}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Reject Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('new')
  const [rejectModal, setRejectModal] = useState<string | null>(null)
  const router = useRouter()
  const qc = useQueryClient()

  const { data, isLoading, refetch } = useQuery<{ orders: Order[] }>({
    queryKey: ['orders', activeTab],
    queryFn: () =>
      api
        .get(`/sellers/orders?statuses=${TAB_STATUSES[activeTab].join(',')}`)
        .then((r) => r.data),
    refetchInterval: activeTab === 'new' ? 30000 : undefined,
  })

  const updateOrder = useMutation({
    mutationFn: ({ orderId, status, reason }: { orderId: string; status: string; reason?: string }) =>
      api.patch(`/sellers/orders/${orderId}/status`, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Order updated')
    },
    onError: () => toast.error('Failed to update order'),
  })

  const orders = data?.orders || []

  const tabLabels: Record<Tab, string> = {
    new: `New${orders.length > 0 && activeTab === 'new' ? ` (${orders.length})` : ''}`,
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    returns: 'Returns',
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        {rejectModal && (
          <RejectModal
            orderId={rejectModal}
            onClose={() => setRejectModal(null)}
            onConfirm={(reason) => {
              updateOrder.mutate({ orderId: rejectModal, status: 'cancelled', reason })
              setRejectModal(null)
            }}
          />
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Orders */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ShoppingBag className="h-14 w-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No {activeTab} orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-semibold text-gray-900">
                        #{order.order_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">{order.buyer_area}</p>

                    {/* Items preview */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-2">
                        {order.items?.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="w-10 h-10 rounded-lg border-2 border-white bg-gray-100 overflow-hidden flex-shrink-0"
                          >
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {order.items_count} item(s)
                      </span>
                      <span className="text-base font-bold text-gray-900 ml-auto">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* SLA Timer for new orders */}
                  {order.status === 'pending' && order.sla_deadline && (
                    <div className="flex-shrink-0">
                      <SLATimer deadline={order.sla_deadline} />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 flex-wrap">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrder.mutate({ orderId: order.id, status: 'accepted' })}
                        disabled={updateOrder.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => setRejectModal(order.id)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === 'accepted' && (
                    <button
                      onClick={() => updateOrder.mutate({ orderId: order.id, status: 'preparing' })}
                      disabled={updateOrder.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Package className="h-4 w-4" />
                      Mark Preparing
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrder.mutate({ orderId: order.id, status: 'ready_for_pickup' })}
                      disabled={updateOrder.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Truck className="h-4 w-4" />
                      Mark Ready for Pickup
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium rounded-lg transition-colors ml-auto"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
