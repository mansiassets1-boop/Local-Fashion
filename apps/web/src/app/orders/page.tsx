'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { useOrders, Order } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/auth.store';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatPrice } from '@/lib/utils';
import Image from 'next/image';

function OrderCard({ order }: { order: Order }) {
  const firstItem = order.items[0];
  const extraCount = order.items.length - 1;

  return (
    <Link
      href={`/orders/${order.id}`}
      className="block bg-white rounded-2xl shadow-warm-sm hover:shadow-warm transition-shadow duration-200 overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-ink-muted mb-1">Order #{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-ink-muted">{formatDate(order.created_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} size="sm" />
        </div>

        <div className="flex items-center gap-3">
          {/* Product thumbnails */}
          <div className="flex -space-x-2">
            {order.items.slice(0, 3).map((item, i) => (
              <div
                key={item.id}
                className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0"
                style={{ zIndex: 3 - i }}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-warm-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-warm-400" />
                  </div>
                )}
              </div>
            ))}
            {extraCount > 0 && (
              <div className="w-14 h-14 rounded-xl bg-warm-100 border-2 border-white flex items-center justify-center flex-shrink-0" style={{ zIndex: 0 }}>
                <span className="text-xs font-bold text-ink-muted">+{extraCount}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink line-clamp-1">{firstItem.name}</p>
            {order.items.length > 1 && (
              <p className="text-xs text-ink-muted">+{order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}</p>
            )}
            <p className="text-sm font-bold text-ink mt-0.5">
              {order.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-warm-300 flex-shrink-0" />
        </div>

        {/* ETA / delivery info */}
        {order.status === 'out_for_delivery' && order.eta_minutes && (
          <div className="mt-3 flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-xl text-xs font-semibold">
            <span className="text-base">🛵</span>
            Arriving in ~{order.eta_minutes} mins
          </div>
        )}
        {order.status === 'delivered' && order.delivered_at && (
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
            <span className="text-base">✅</span>
            Delivered on {formatDate(order.delivered_at)}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { data: orders, isLoading } = useOrders();

  if (!isLoggedIn()) {
    return (
      <div className="container-fashion py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-warm-200 mb-4" />
        <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">Track your orders</h2>
        <p className="text-ink-muted text-sm mb-6">Login to view your order history</p>
        <button className="btn-brand px-8 py-3 rounded-xl" onClick={() => router.push('/login')}>
          Login to Continue
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-fashion py-8 max-w-2xl mx-auto">
        <Skeleton className="h-9 w-40 rounded-xl mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container-fashion py-20 text-center">
        <div className="relative inline-block mb-6">
          <ShoppingBag className="w-20 h-20 text-warm-200" />
          <span className="absolute bottom-0 right-0 text-3xl">🛍️</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">No orders yet</h2>
        <p className="text-ink-muted text-sm mb-8 max-w-sm mx-auto">
          Your orders will appear here once you start shopping from local boutiques.
        </p>
        <button className="btn-brand px-8 py-3 rounded-xl" onClick={() => router.push('/search')}>
          Start Shopping
        </button>
      </div>
    );
  }

  // Separate active and past orders
  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];
  const activeOrders = orders.filter((o) => activeStatuses.includes(o.status));
  const pastOrders = orders.filter((o) => !activeStatuses.includes(o.status));

  return (
    <div className="container-fashion py-5 pb-24 md:pb-8 max-w-2xl mx-auto">
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-warm-900 mb-6">My Orders</h1>

      {activeOrders.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider">Active</h2>
          </div>
          <div className="space-y-3">
            {activeOrders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        </section>
      )}

      {pastOrders.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-3">Past Orders</h2>
          <div className="space-y-3">
            {pastOrders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        </section>
      )}
    </div>
  );
}
