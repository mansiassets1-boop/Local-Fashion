'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  size?: string;
  color?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'discount';
  store_id?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  images: string[];
  price: number;
  mrp: number;
  rating: number;
  review_count: number;
  sold_count: number;
  store_id: string;
  store_name: string;
  store_area: string;
  eta_minutes: number;
  variants: Variant[];
  return_policy: string;
  tags: string[];
}

export interface Variant {
  id: string;
  size: string;
  color: string;
  color_hex: string;
  stock: number;
  price?: number;
}

export interface ProductAvailability {
  product_id: string;
  variants: {
    variant_id: string;
    in_stock: boolean;
    stock: number;
  }[];
}

export interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  images?: string[];
}

const PAGE_SIZE = 20;

export function useProducts(filters: ProductFilters = {}) {
  const { city } = useAuthStore();

  return useInfiniteQuery({
    queryKey: ['products', city?.id, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = {
        city_id: city?.id,
        limit: PAGE_SIZE,
        offset: pageParam,
        ...filters,
      };
      // Remove undefined values
      Object.keys(params).forEach((k) => {
        if ((params as Record<string, unknown>)[k] === undefined) {
          delete (params as Record<string, unknown>)[k];
        }
      });
      const { data } = await api.get('/products', { params });
      return data as { products: Product[]; total: number };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.products).length;
      if (loaded < lastPage.total) return loaded;
      return undefined;
    },
    enabled: !!city?.id,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useProductAvailability(id: string) {
  return useQuery({
    queryKey: ['product-availability', id],
    queryFn: async () => {
      const { data } = await api.get<ProductAvailability>(`/products/${id}/availability`);
      return data;
    },
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds — frequently refreshed
  });
}

export function useProductReviews(id: string) {
  return useQuery({
    queryKey: ['product-reviews', id],
    queryFn: async () => {
      const { data } = await api.get<{ reviews: Review[]; average: number; total: number }>(
        `/products/${id}/reviews`
      );
      return data;
    },
    enabled: !!id,
  });
}
