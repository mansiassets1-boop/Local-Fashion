'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';
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

  // Group items by store
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
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-gray-200 mb-4" />
        <h1 className="text-lg font-bold text-gray-900 mb-2">Your cart is waiting</h1>
        <p className="text-gray-500 text-sm mb-6">
          Login to view your cart and checkout
        </p>
        <Button fullWidth onClick={() => router.push('/login')}>
          Login to Continue
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-gray-200 mb-4" />
        <h1 className="text-lg font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 text-sm mb-6">
          Add items from local stores to get started
        </p>
        <Button fullWidth onClick={() => router.push('/search')}>
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">
        My Cart ({items.length} item{items.length !== 1 ? 's' : ''})
      </h1>

      {hasOOSItems && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Some items are out of stock. Remove them to proceed.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
        {/* Cart items grouped by store */}
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([storeId, storeItems]) => (
            <div key={storeId} className="bg-white rounded-xl shadow-card overflow-hidden">
              {/* Store header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <Link
                  href={`/stores/${storeId}`}
                  className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  🏪 {storeItems[0].store_name}
                </Link>
                <span className="text-xs text-gray-400">
                  {storeItems.length} item{storeItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Items */}
              <div className="px-4 divide-y divide-gray-50">
                {storeItems.map((item) => (
                  <CartItemRow key={item.variant_id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          <CartSummary
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            platformFee={platformFee}
            grandTotal={grandTotal}
            savings={savings}
          />

          <Button
            fullWidth
            size="lg"
            rightIcon={<ArrowRight className="h-5 w-5" />}
            disabled={hasOOSItems || items.length === 0}
            onClick={() => router.push('/checkout')}
          >
            Proceed to Checkout
          </Button>

          <Link
            href="/search"
            className="block text-center text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
