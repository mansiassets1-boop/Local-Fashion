'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useAddToCart } from '@/hooks/useCart';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Product } from '@/hooks/useProducts';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: string;
  product: Product;
  created_at: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();
  const addToCart = useAddToCart();

  const { data: wishlistItems, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get<{ items: WishlistItem[] }>('/wishlists');
      return data.items;
    },
    enabled: isLoggedIn(),
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/wishlists/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
  });

  if (!isLoggedIn()) {
    return (
      <div className="container-fashion py-20 text-center">
        <Heart className="w-16 h-16 mx-auto text-warm-200 mb-4" />
        <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">Your wishlist is waiting</h2>
        <p className="text-ink-muted text-sm mb-6">Login to save your favourite finds</p>
        <button className="btn-brand px-8 py-3 rounded-xl" onClick={() => router.push('/login')}>
          Login to Continue
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container-fashion py-8">
        <Skeleton className="h-9 w-48 rounded-xl mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="container-fashion py-20 text-center">
        <div className="relative inline-block mb-6">
          <Heart className="w-20 h-20 text-warm-200" />
          <span className="absolute bottom-0 right-0 text-3xl">✨</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">Nothing saved yet</h2>
        <p className="text-ink-muted text-sm mb-8 max-w-sm mx-auto">
          Tap the heart on any product to save it here. Build your dream wardrobe!
        </p>
        <button className="btn-brand px-8 py-3 rounded-xl" onClick={() => router.push('/search')}>
          Start Exploring
        </button>
      </div>
    );
  }

  return (
    <div className="container-fashion py-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-warm-900">My Wishlist</h1>
          <p className="text-ink-muted text-sm mt-0.5">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved</p>
        </div>
        <button
          onClick={() => {
            wishlistItems.forEach((item) => removeMutation.mutate(item.product.id));
          }}
          className="text-xs text-ink-muted hover:text-brand-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-warm-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear all
        </button>
      </div>

      {/* Product grid with remove button overlay */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {wishlistItems.map((item) => (
          <div key={item.id} className="relative group">
            <ProductCard product={item.product} />
            <button
              onClick={() => removeMutation.mutate(item.product.id)}
              className="absolute top-2 left-2 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-warm-sm hover:bg-red-50 hover:text-red-500 text-ink-muted transition-all opacity-0 group-hover:opacity-100"
              aria-label="Remove from wishlist"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
