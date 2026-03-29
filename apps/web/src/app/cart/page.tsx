'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, AlertTriangle, Package } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { CartItemRow } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { items, subtotal, deliveryFee, platformFee, grandTotal } = useCart();

  const isAuth = isLoggedIn();
  const hasOOSItems = items.some((item) => !item.in_stock);

  const groupedItems = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.store_id]) acc[item.store_id] = [];
    acc[item.store_id].push(item);
    return acc;
  }, {});

  const savings = items.reduce(
    (sum, item) => sum + Math.max(0, (item.mrp - item.price) * item.quantity),
    0
  );

  if (!isAuth) {
    return (
      <div className="container-fashion py-20 text-center max-w-sm mx-auto">
        <div className="w-20 h-20 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-5">
          <ShoppingBag className="w-10 h-10 text-warm-400" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-warm-900 mb-2">Your cart is waiting</h1>
        <p className="text-ink-muted text-sm mb-7">Login to view your cart and checkout</p>
        <button className="btn-brand w-full py-3.5 rounded-xl" onClick={() => router.push('/login')}>
          Login to Continue
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-fashion py-20 text-center max-w-sm mx-auto">
        <div className="relative inline-block mb-6">
          <ShoppingBag className="w-20 h-20 text-warm-200" />
          <span className="absolute bottom-0 right-0 text-3xl">🛍️</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-warm-900 mb-2">Your bag is empty</h1>
        <p className="text-ink-muted text-sm mb-8">
          Add items from local boutiques near you and get them delivered in hours.
        </p>
        <button className="btn-brand w-full py-3.5 rounded-xl" onClick={() => router.push('/search')}>
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container-fashion py-5 pb-24 md:pb-8">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-warm-900">My Bag</h1>
        <span className="text-ink-muted text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      {hasOOSItems && (
        <div className="flex items-center gap-2.5 bg-red-50 text-red-700 px-4 py-3 rounded-2xl mb-5 text-sm border border-red-100">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Some items are out of stock. Remove them to proceed to checkout.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Cart items grouped by store */}
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([storeId, storeItems]) => (
            <div key={storeId} className="bg-white rounded-2xl shadow-warm-sm overflow-hidden">
              {/* Store header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-warm-50">
                <Link
                  href={`/stores/${storeId}`}
                  className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand-600 transition-colors"
                >
                  <Package className="w-4 h-4 text-brand-500" />
                  {storeItems[0].store_name}
                </Link>
                <span className="text-xs text-ink-muted">
                  {storeItems.length} item{storeItems.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="px-4 divide-y divide-warm-50">
                {storeItems.map((item) => (
                  <CartItemRow key={item.variant_id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary + CTA */}
        <div className="space-y-4">
          <CartSummary
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            platformFee={platformFee}
            grandTotal={grandTotal}
            savings={savings}
          />

          <button
            className={`btn-brand w-full py-4 rounded-2xl text-base flex items-center justify-center gap-2 ${(hasOOSItems || items.length === 0) ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={hasOOSItems || items.length === 0}
            onClick={() => router.push('/checkout')}
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            href="/search"
            className="block text-center text-sm text-brand-600 hover:text-brand-700 transition-colors font-medium"
          >
            Continue Shopping
          </Link>

          {/* Trust */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[['🔒', 'Secure checkout'], ['⚡', '2-3 hr delivery']].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2 bg-warm-50 rounded-xl px-3 py-2">
                <span className="text-sm">{icon}</span>
                <span className="text-[11px] text-ink-muted font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
