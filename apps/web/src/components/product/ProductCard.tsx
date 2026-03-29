'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Zap, ShoppingBag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, getDiscountPct } from '@/lib/utils';
import { Product, Variant } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cart.store';

interface ProductCardProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function formatSoldCount(count: number): string {
  if (count > 999) return `${(count / 1000).toFixed(1)}k sold`;
  return `${count} sold`;
}

function isNewProduct(product: Product): boolean {
  // products don't have created_at in the Product type, so we skip this check
  return false;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            'w-3 h-3',
            star <= Math.round(rating) ? 'star-filled' : 'star-empty'
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

/* Quick size picker shown in the quick-actions overlay */
function QuickSizePicker({
  variants,
  onSelect,
}: {
  variants: Variant[];
  onSelect: (variant: Variant) => void;
}) {
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
  if (sizes.length === 0) {
    // no size variants — just pick first in-stock
    const v = variants.find((x) => x.stock > 0) ?? variants[0];
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          onSelect(v);
        }}
        className="btn-brand w-full text-sm py-2 rounded-xl"
      >
        <ShoppingBag className="w-4 h-4" />
        Quick Add
      </button>
    );
  }
  return (
    <div>
      <p className="text-[10px] text-ink-muted uppercase tracking-wider mb-1.5 font-semibold">
        Select Size
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((size) => {
          const v = variants.find((x) => x.size === size);
          const inStock = (v?.stock ?? 0) > 0;
          return (
            <button
              key={size}
              onClick={(e) => {
                e.preventDefault();
                if (v && inStock) onSelect(v);
              }}
              disabled={!inStock}
              className={cn(
                'px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all duration-150',
                inStock
                  ? 'border-warm-200 text-ink hover:border-brand-600 hover:bg-brand-600 hover:text-white'
                  : 'border-warm-100 text-warm-200 line-through cursor-not-allowed'
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProductCard({ product, size = 'md', className }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const discount = getDiscountPct(product.mrp, product.price);
  const isNew = isNewProduct(product);

  const handleAddToCart = (variant: Variant) => {
    addItem({
      id: `${product.id}-${variant.id}`,
      product_id: product.id,
      variant_id: variant.id,
      store_id: product.store_id,
      store_name: product.store_name,
      name: product.name,
      image_url: product.images[0] ?? '',
      size: variant.size ?? '',
      color: variant.color ?? '',
      price: variant.price ?? product.price,
      mrp: product.mrp,
      quantity: 1,
      max_qty: variant.stock,
      in_stock: variant.stock > 0,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const primaryImage = product.images[0];

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn('product-card group block', className)}
    >
      {/* ── Image container ── */}
      <div className="product-card-img aspect-product">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes={
              size === 'sm'
                ? '(max-width: 640px) 50vw, 200px'
                : size === 'lg'
                ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
                : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
            }
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-warm-100 to-warm-200">
            <svg
              className="w-12 h-12 text-warm-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M7 4v2a1 1 0 001 1h8a1 1 0 001-1V4M5 8h14l-1 12H6L5 8z"
              />
            </svg>
          </div>
        )}

        {/* ── Badges top-left ── */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discount >= 5 && (
            <span className="badge-discount">{discount}% OFF</span>
          )}
          {isNew && <span className="badge-new">New</span>}
          {product.eta_minutes && product.eta_minutes <= 60 && (
            <span className="badge-delivery">
              <Zap className="w-3 h-3" />
              {product.eta_minutes} min
            </span>
          )}
        </div>

        {/* ── Wishlist button ── */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setWishlisted((prev) => !prev);
          }}
          className={cn('wishlist-btn', wishlisted && 'active')}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-all duration-200',
              wishlisted
                ? 'fill-red-500 text-red-500 scale-110'
                : 'text-ink-muted'
            )}
          />
        </button>

        {/* ── Quick actions overlay ── */}
        <div className="quick-actions rounded-b-2xl">
          {added ? (
            <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-semibold text-sm">
              <Check className="w-4 h-4" />
              Added to bag!
            </div>
          ) : product.variants && product.variants.length > 0 ? (
            <QuickSizePicker
              variants={product.variants}
              onSelect={handleAddToCart}
            />
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart({ id: product.id, size: '', color: '', color_hex: '', stock: 1 });
              }}
              className="btn-brand w-full text-sm py-2.5 rounded-xl"
            >
              <ShoppingBag className="w-4 h-4" />
              Quick Add
            </button>
          )}
        </div>
      </div>

      {/* ── Card info ── */}
      <div className="p-3 pt-2.5">
        {/* Meta row */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[11px] text-ink-muted truncate font-medium">
            {product.store_name}
          </span>
          {product.store_area && (
            <>
              <span className="text-warm-200 text-[11px]">·</span>
              <span className="text-[11px] text-ink-muted truncate">
                {product.store_area}
              </span>
            </>
          )}
          {product.eta_minutes && product.eta_minutes > 60 && (
            <>
              <span className="text-warm-200 text-[11px] ml-auto">·</span>
              <span className="text-[11px] text-ink-muted flex items-center gap-0.5 flex-shrink-0">
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                {product.eta_minutes} min
              </span>
            </>
          )}
        </div>

        {/* Product name */}
        <h3
          className={cn(
            'font-serif text-ink line-clamp-2 leading-snug mb-1.5',
            size === 'sm' ? 'text-sm' : 'text-[15px] font-medium'
          )}
        >
          {product.name}
        </h3>

        {/* Rating + social proof */}
        {(product.rating > 0 || product.sold_count > 0) && (
          <div className="flex items-center gap-2 mb-2">
            {product.rating > 0 && (
              <>
                <StarRow rating={product.rating} />
                <span className="text-[11px] text-ink-muted">
                  {product.rating.toFixed(1)}
                </span>
              </>
            )}
            {product.review_count > 0 && (
              <span className="text-[11px] text-warm-200">·</span>
            )}
            {product.review_count > 0 && (
              <span className="text-[11px] text-ink-muted">
                {product.review_count} reviews
              </span>
            )}
            {product.sold_count > 0 && (
              <span className="text-[11px] text-ink-muted ml-auto">
                {formatSoldCount(product.sold_count)}
              </span>
            )}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="price-main text-base">{formatPrice(product.price)}</span>
          {product.mrp > product.price && (
            <>
              <span className="price-mrp text-xs">{formatPrice(product.mrp)}</span>
              {discount >= 5 && (
                <span className="price-off text-xs">{discount}% off</span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
