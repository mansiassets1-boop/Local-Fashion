'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Phone, Star, RotateCcw, MapPin } from 'lucide-react';
import { useOrder, useOrderLocation } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/auth.store';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { LiveMap } from '@/components/order/LiveMap';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const ACTIVE_DELIVERY = ['out_for_delivery'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [showOtp, setShowOtp] = useState(false);

  const { data: order, isLoading } = useOrder(id);
  const isDelivering = order?.status === 'out_for_delivery';
  const { data: location } = useOrderLocation(id, isDelivering);

  if (!isLoggedIn()) {
    router.replace('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="container-fashion py-8 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-32 rounded-xl mb-6" />
        <Skeleton className="h-40 rounded-2xl mb-4" />
        <Skeleton className="h-64 rounded-2xl mb-4" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-fashion py-20 text-center">
        <p className="text-5xl mb-4">📦</p>
        <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">Order not found</h2>
        <button className="btn-outline-brand px-6 py-2.5 rounded-xl mt-4" onClick={() => router.back()}>
          Go back
        </button>
      </div>
    );
  }

  const subtotal = order.subtotal;
  const total = order.total;

  return (
    <div className="container-fashion py-5 pb-24 md:pb-8 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        My Orders
      </button>

      {/* Order header */}
      <div className="bg-white rounded-2xl shadow-warm-sm p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h1 className="font-serif text-xl font-bold text-warm-900">
              Order #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">{formatDate(order.created_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-ink-muted mt-2">
          {order.items.length} item{order.items.length !== 1 ? 's' : ''} from{' '}
          <span className="font-semibold text-ink">{order.store_name}</span>
        </p>
      </div>

      {/* Live map + delivery partner */}
      {isDelivering && (
        <div className="bg-white rounded-2xl shadow-warm-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="font-semibold text-ink">Live Tracking</h2>
            {order.eta_minutes && (
              <span className="ml-auto text-sm font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                ~{order.eta_minutes} mins away
              </span>
            )}
          </div>
          <LiveMap
            buyerLat={order.address.lat}
            buyerLng={order.address.lng}
            partnerLat={location?.lat}
            partnerLng={location?.lng}
          />
          {order.delivery_partner && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-warm-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                  {order.delivery_partner.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{order.delivery_partner.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-ink-muted">{order.delivery_partner.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <a
                href={`tel:${order.delivery_partner.phone}`}
                className="flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-100 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            </div>
          )}
          {/* Delivery OTP */}
          {order.otp && (
            <div className="mt-3">
              <button
                onClick={() => setShowOtp(!showOtp)}
                className="w-full text-sm text-brand-600 font-semibold py-2 rounded-xl border border-brand-200 hover:bg-brand-50 transition-colors"
              >
                {showOtp ? 'Hide' : 'Show'} Delivery OTP
              </button>
              {showOtp && (
                <div className="mt-2 text-center py-3 bg-brand-50 rounded-xl">
                  <p className="text-xs text-ink-muted mb-1">Share this OTP with the delivery partner</p>
                  <p className="text-4xl font-bold tracking-[0.5em] text-brand-700">{order.otp}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Order timeline */}
      <div className="bg-white rounded-2xl shadow-warm-sm p-5 mb-4">
        <h2 className="font-semibold text-ink mb-4">Order Status</h2>
        <OrderTimeline statusHistory={order.status_history} currentStatus={order.status} />
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-warm-sm overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-warm-100">
          <h2 className="font-semibold text-ink">Items Ordered</h2>
        </div>
        <div className="divide-y divide-warm-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-warm-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-6 h-6 text-warm-400 m-auto mt-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink line-clamp-1">{item.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {item.size} · {item.color} · Qty {item.quantity}
                </p>
                <p className="text-sm font-bold text-ink mt-1">
                  {(item.price * item.quantity).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery address */}
      <div className="bg-white rounded-2xl shadow-warm-sm p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-ink">Delivery Address</h2>
        </div>
        <p className="text-sm text-ink-muted leading-relaxed">
          {order.address.line1}
          {order.address.line2 && `, ${order.address.line2}`}
          <br />
          {order.address.city} — {order.address.pincode}
        </p>
      </div>

      {/* Payment summary */}
      <div className="bg-white rounded-2xl shadow-warm-sm p-5 mb-4">
        <h2 className="font-semibold text-ink mb-3">Payment Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Delivery fee</span>
            <span>{order.delivery_fee === 0 ? <span className="text-green-600 font-semibold">FREE</span> : order.delivery_fee.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
          </div>
          {order.platform_fee > 0 && (
            <div className="flex justify-between text-ink-muted">
              <span>Platform fee</span>
              <span>{order.platform_fee.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-ink pt-2 border-t border-warm-100">
            <span>Total</span>
            <span>{total.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {order.status === 'delivered' && (
        <div className="flex gap-3">
          <button
            onClick={() => toast.success('Rate & review feature coming soon!')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition-colors border border-amber-200"
          >
            <Star className="w-4 h-4" />
            Rate Order
          </button>
          <button
            onClick={() => toast.success('Return request submitted!')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-warm-50 text-ink font-semibold text-sm hover:bg-warm-100 transition-colors border border-warm-200"
          >
            <RotateCcw className="w-4 h-4" />
            Return
          </button>
        </div>
      )}
    </div>
  );
}
