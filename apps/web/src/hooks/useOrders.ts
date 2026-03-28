'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string;
  name: string;
  image_url: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  store_id: string;
  store_name: string;
}

export interface StatusEvent {
  status: string;
  timestamp: string;
  note?: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  avatar_url?: string;
  rating: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  total: number;
  address: {
    line1: string;
    line2?: string;
    city: string;
    pincode: string;
    lat: number;
    lng: number;
  };
  delivery_partner?: DeliveryPartner;
  otp?: string;
  eta_minutes?: number;
  status_history: StatusEvent[];
  created_at: string;
  delivered_at?: string;
  store_id: string;
  store_name: string;
  razorpay_order_id?: string;
  payment_id?: string;
}

export interface OrderLocation {
  lat: number;
  lng: number;
  heading?: number;
  updated_at: string;
}

export function useOrders() {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get<{ orders: Order[] }>('/orders');
      return data.orders;
    },
    enabled: isLoggedIn(),
  });
}

export function useOrder(id: string) {
  const { isLoggedIn } = useAuthStore();

  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get<Order>(`/orders/${id}`);
      return data;
    },
    enabled: !!id && isLoggedIn(),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll while active
      if (status && !['delivered', 'cancelled', 'returned'].includes(status)) {
        return 30000; // every 30s
      }
      return false;
    },
  });
}

export function useOrderLocation(id: string, enabled = false) {
  return useQuery({
    queryKey: ['order-location', id],
    queryFn: async () => {
      const { data } = await api.get<OrderLocation>(`/orders/${id}/location`);
      return data;
    },
    enabled: !!id && enabled,
    refetchInterval: enabled ? 10000 : false, // poll every 10s when active
  });
}
