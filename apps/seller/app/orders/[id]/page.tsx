'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import SLATimer from '@/components/SLATimer'
import api from '@/lib/api'

interface OrderDetail {
  id: string
  order_number: string
  status: string
  created_at: string
  updated_at: string
  total_amount: number
  subtotal: number
  platform_fee: number
  buyer_area: string
  sla_deadline?: string
  items: {
    id: string
    product_name: string
    brand?: string
    image_url?: string
    quantity: number
    price: number
    size?: string
    color?: string
    sku?: string
  }[]
  timeline: {
    status: string
    timestamp: string
    note?: string
  }[]
  return_request?: {
    reason: string
    images?: string[]
    requested_at: string
    status: string
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  return_approved: 'Return Approved',
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ['order', id],
    queryFn: () => api.get(`/sellers/orders/${id}`).then((r) => r.data),
  })

  const updateOrder = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      api.patch(`/sellers/orders/${id}/status`, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order updated')
    },
    onError: () => toast.error('Failed to update order'),
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

  if (!order) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Order not found</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order #{order.order_number}</h1>
            <p className="text-sm text-gray-500">
              {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {order.status === 'pending' && order.sla_deadline && (
              <SLATimer deadline={order.sla_deadline} />
            )}
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
              {STATUS_LABELS[order.status] || order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Items + Return */}
          <div className="lg:col-span-2 space-y-5">
            {/* Items */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Order Items</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                      {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {item.size && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {item.color}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-400">₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50 rounded-b-xl space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform fee</span>
                  <span className="text-red-600">-₹{order.platform_fee?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Your Earnings</span>
                  <span className="text-emerald-700">₹{(order.total_amount - (order.platform_fee || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Return Request */}
            {order.return_request && (
              <div className="bg-white rounded-xl border border-red-200">
                <div className="p-5 border-b border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h2 className="text-base font-semibold text-gray-900">Return Request</h2>
                  <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    {order.return_request.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Reason:</span> {order.return_request.reason}
                  </p>
                  <p className="text-xs text-gray-400">
                    Requested {format(new Date(order.return_request.requested_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                  {order.return_request.images && order.return_request.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {order.return_request.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Return evidence ${i + 1}`}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Info + Timeline + Actions */}
          <div className="space-y-5">
            {/* Delivery Area */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Delivery Area</h3>
              </div>
              <p className="text-sm text-gray-700 font-medium">{order.buyer_area}</p>
              <p className="text-xs text-gray-400 mt-1">
                Full address shared with delivery partner only
              </p>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Order Timeline</h3>
              </div>
              <div className="space-y-4">
                {order.timeline?.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-0.5 ${i === 0 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                      {i < order.timeline.length - 1 && (
                        <div className="w-px h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-gray-900">
                        {STATUS_LABELS[event.status] || event.status.replace(/_/g, ' ')}
                      </p>
                      {event.note && (
                        <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(event.timestamp), 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrder.mutate({ status: 'accepted' })}
                      disabled={updateOrder.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {updateOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Accept Order
                    </button>
                    <button
                      onClick={() => updateOrder.mutate({ status: 'cancelled', reason: 'rejected_by_seller' })}
                      disabled={updateOrder.isPending}
                      className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-medium"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Order
                    </button>
                  </>
                )}
                {order.status === 'accepted' && (
                  <button
                    onClick={() => updateOrder.mutate({ status: 'preparing' })}
                    disabled={updateOrder.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    <Package className="h-4 w-4" />
                    Mark Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrder.mutate({ status: 'ready_for_pickup' })}
                    disabled={updateOrder.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    <Truck className="h-4 w-4" />
                    Mark Ready for Pickup
                  </button>
                )}
                {['delivered', 'cancelled'].includes(order.status) && (
                  <p className="text-sm text-gray-400 text-center py-2">
                    No further actions available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
