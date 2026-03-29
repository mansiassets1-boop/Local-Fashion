'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Product } from '@/hooks/useProducts';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
  className?: string;
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  isLoading = false,
  skeletonCount = 8,
  className,
  emptyMessage = 'No products found.',
}: ProductGridProps) {
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-5xl mb-4">🛍️</span>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4',
        className
      )}
    >
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        : products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
    </div>
  );
}
