'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore, CartItem } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

interface AddToCartPayload {
  product_id: string;
  variant_id: string;
  quantity: number;
}

interface RemoveFromCartPayload {
  item_id: string;
  variant_id: string;
}

export function useCart() {
  const cartStore = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const isAuth = isLoggedIn();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await api.get<{ items: CartItem[] }>('/cart');
      cartStore.setItems(data.items);
      return data;
    },
    enabled: isAuth,
    staleTime: 1000 * 30,
  });

  return {
    items: cartStore.items,
    itemCount: cartStore.itemCount(),
    subtotal: cartStore.subtotal(),
    total: cartStore.total(),
    deliveryFee: cartStore.deliveryFee(),
    platformFee: cartStore.platformFee(),
    grandTotal: cartStore.grandTotal(),
    isLoading: cartQuery.isLoading,
    refetch: cartQuery.refetch,
  };
}

export function useAddToCart() {
  const cartStore = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddToCartPayload & { item: CartItem }) => {
      const isAuth = isLoggedIn();
      if (isAuth) {
        const { data } = await api.post('/cart/items', {
          product_id: payload.product_id,
          variant_id: payload.variant_id,
          quantity: payload.quantity,
        });
        return data;
      }
      // Guest: add to local cart
      return null;
    },
    onMutate: (payload) => {
      // Optimistic update
      cartStore.addItem(payload.item);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    },
    onError: (_err, payload) => {
      // Rollback
      cartStore.removeItem(payload.variant_id);
      toast.error('Failed to add to cart');
    },
  });
}

export function useRemoveFromCart() {
  const cartStore = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RemoveFromCartPayload) => {
      const isAuth = isLoggedIn();
      if (isAuth) {
        await api.delete(`/cart/items/${payload.item_id}`);
      }
    },
    onMutate: (payload) => {
      cartStore.removeItem(payload.variant_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Failed to remove item');
    },
  });
}

export function useUpdateCartQty() {
  const cartStore = useCartStore();
  const { isLoggedIn } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: { item_id: string; variant_id: string; quantity: number }) => {
      const isAuth = isLoggedIn();
      if (isAuth) {
        await api.patch(`/cart/items/${payload.item_id}`, { quantity: payload.quantity });
      }
      cartStore.updateQty(payload.variant_id, payload.quantity);
    },
    onError: () => {
      toast.error('Failed to update quantity');
    },
  });
}
