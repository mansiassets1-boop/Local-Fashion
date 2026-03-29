'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, getDiscountPct } from '@/lib/utils';
import { StarRating } from '@/components/ui/StarRating';
import { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const discount = getDiscountPct(product.mrp, product.price);

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        'group block rounded-xl bg-white shadow-card hover:shadow-card-hover transition-shadow overflow-hidden',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-300 text-4xl">
            👗
          </div>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            {discount}% OFF
          </span>
        )}

        {/* ETA badge */}
        <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
          <Clock className="h-3 w-3" />
          {product.eta_minutes} min
        </span>

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setWishlisted((prev) => !prev);
          }}
          className="absolute top-2 right-2 rounded-full bg-white/80 backdrop-blur-sm p-1.5 shadow-sm hover:bg-white transition-colors"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
            )}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-0.5 truncate">{product.store_name} · {product.store_area}</p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-sm font-bold text-gray-900">{formatPrice(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
          )}
        </div>

        {/* Rating + sold */}
        <div className="flex items-center gap-2">
          <StarRating rating={product.rating} size="sm" />
          <span className="text-xs text-gray-400">({product.review_count})</span>
          {product.sold_count > 0 && (
            <span className="text-xs text-gray-400 ml-auto">{product.sold_count.toLocaleString()} sold</span>
          )}
        </div>
      </div>
    </Link>
  );
}
