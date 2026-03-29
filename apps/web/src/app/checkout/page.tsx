'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, ChevronRight, ShoppingBag, Tag, Zap, Lock } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  is_default: boolean;
}

interface OrderResponse {
  order_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const { items, subtotal, deliveryFee, platformFee, grandTotal } = useCart();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const { data: addresses, isLoading: addressLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await api.get<{ addresses: Address[] }>('/users/addresses');
      const defaultAddr = data.addresses.find((a) => a.is_default);
      if (defaultAddr && !selectedAddressId) setSelectedAddressId(defaultAddr.id);
      return data.addresses;
    },
    enabled: isLoggedIn(),
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<OrderResponse>('/orders', {
        address_id: selectedAddressId,
        coupon_code: couponApplied ? couponCode : undefined,
      });
      return data;
    },
    onSuccess: async (data) => {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Try again.');
        return;
      }

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'LocalFashion',
        description: 'Fashion from your local boutique',
        order_id: data.razorpay_order_id,
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
          email: user?.email || '',
        },
        theme: { color: '#c8532a' },
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              order_id: data.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Order placed successfully! 🎉');
            router.push(`/orders/${data.order_id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    onError: () => {
      toast.error('Failed to place order. Please try again.');
    },
  });

  if (!isLoggedIn()) {
    router.replace('/login');
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="container-fashion py-20 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-warm-200 mb-4" />
        <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">Your cart is empty</h2>
        <button className="btn-brand px-8 py-3 rounded-xl mt-4" onClick={() => router.push('/search')}>
          Start Shopping
        </button>
      </div>
    );
  }

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);
  const canPlaceOrder = !!selectedAddressId && !placeOrderMutation.isPending;

  return (
    <div className="container-fashion py-5 pb-24 md:pb-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-warm-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Address + items */}
        <div className="space-y-4">
          {/* Delivery address */}
          <div className="bg-white rounded-2xl shadow-warm-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" />
                <h2 className="font-semibold text-ink">Delivery Address</h2>
              </div>
              <button
                onClick={() => setShowAddAddress(true)}
                className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add new
              </button>
            </div>

            {addressLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : !addresses || addresses.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-sm text-ink-muted mb-3">No saved addresses</p>
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="btn-brand px-5 py-2.5 rounded-xl text-sm"
                >
                  Add Address
                </button>
              </div>
            ) : (
              <div className="divide-y divide-warm-50">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-warm-50 transition-colors ${selectedAddressId === addr.id ? 'bg-brand-50/50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-brand-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-ink">{addr.label || 'Home'}</span>
                        {addr.is_default && (
                          <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-semibold">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {addr.line1}{addr.line2 && `, ${addr.line2}`}, {addr.city} — {addr.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Order items */}
          <div className="bg-white rounded-2xl shadow-warm-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-100">
              <h2 className="font-semibold text-ink">
                Order Items ({items.length})
              </h2>
            </div>
            <div className="divide-y divide-warm-50">
              {items.map((item) => (
                <div key={item.variant_id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-warm-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-warm-400 m-auto mt-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink line-clamp-1">{item.name}</p>
                    <p className="text-xs text-ink-muted">{item.size} · {item.color} · Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-ink flex-shrink-0">
                    {(item.price * item.quantity).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-2xl shadow-warm-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-ink">Coupon Code</h2>
            </div>
            {couponApplied ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-green-700">{couponCode} applied!</p>
                  <p className="text-xs text-green-600">Discount applied to your order</p>
                </div>
                <button
                  onClick={() => { setCouponApplied(false); setCouponCode(''); }}
                  className="text-xs text-green-700 font-semibold hover:text-green-900"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="input-warm flex-1 py-2.5"
                />
                <button
                  onClick={() => {
                    if (couponCode.length < 3) { toast.error('Enter a valid coupon'); return; }
                    setCouponApplied(true);
                    toast.success(`Coupon ${couponCode} applied!`);
                  }}
                  className="btn-brand px-4 py-2.5 rounded-xl text-sm flex-shrink-0"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary + CTA */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          {/* Delivery promise */}
          {selectedAddress && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-2xl">
              <Zap className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">Delivered in 2-3 hours</p>
                <p className="text-xs text-green-600">To {selectedAddress.line1}, {selectedAddress.city}</p>
              </div>
            </div>
          )}

          {/* Price breakdown */}
          <div className="bg-white rounded-2xl shadow-warm-sm p-5">
            <h2 className="font-semibold text-ink mb-4">Price Details</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal ({items.length} items)</span>
                <span>{subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Delivery fee</span>
                <span>
                  {deliveryFee === 0
                    ? <span className="text-green-600 font-semibold">FREE</span>
                    : deliveryFee.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                </span>
              </div>
              {platformFee > 0 && (
                <div className="flex justify-between text-ink-muted">
                  <span>Platform fee</span>
                  <span>{platformFee.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
                </div>
              )}
              {couponApplied && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Coupon ({couponCode})</span>
                  <span>— Applied</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-ink text-base pt-3 border-t border-warm-100">
                <span>Total</span>
                <span>{grandTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Place order */}
          <button
            onClick={() => placeOrderMutation.mutate()}
            disabled={!canPlaceOrder}
            className={`btn-brand w-full py-4 rounded-2xl text-base flex items-center justify-center gap-2.5 ${!canPlaceOrder ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Lock className="w-4 h-4" />
            {placeOrderMutation.isPending ? 'Placing Order...' : !selectedAddressId ? 'Select Address First' : 'Place Order & Pay'}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <Lock className="w-3 h-3" />
            <span>Secure checkout powered by Razorpay</span>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2">
            {[['🔄', '7-day returns'], ['🔒', 'Secure payment'], ['⚡', '2-3 hr delivery'], ['🏪', 'Local boutique']].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2 bg-warm-50 rounded-xl px-3 py-2">
                <span className="text-base">{icon}</span>
                <span className="text-[11px] text-ink-muted font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
