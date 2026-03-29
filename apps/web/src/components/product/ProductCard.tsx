'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Zap, ShoppingBag, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice, getDiscountPct } from '@/lib/utils';
import { Product, Variant } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cart.store';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    mrp?: number;
    primary_image?: string;
    store_name?: string;
    avg_rating?: number;
    sold_count?: number;
    eta_minutes?: number;
    created_at?: string;
    variants?: Array<{ id: string; size?: string; color?: string; stock_quantity: number }>;
    /* also accepts full Product shape */
    images?: string[];
    rating?: number;
    review_count?: number;
    store_area?: string;
    store_id?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
function formatSoldCount(count: number): string {
  if (count > 999) return `${(count / 1000).toFixed(1)}k sold`;
  return `${count} sold`;
}

function isNewProduct(createdAt?: string): boolean {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 72 * 60 * 60 * 1000;
}

/* ─── stars ──────────────────────────────────────────────────────────────── */
function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-px" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            'w-3 h-3 flex-shrink-0',
            s <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-warm-200 text-warm-200'
          )}
        />
      ))}
    </span>
  );
}

/* ─── quick size picker ──────────────────────────────────────────────────── */
function QuickSizePicker({
  variants,
  onSelect,
}: {
  variants: Variant[];
  onSelect: (v: Variant) => void;
}) {
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));

  if (sizes.length === 0) {
    const v = variants.find((x) => x.stock > 0) ?? variants[0];
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(v); }}
        className="btn-brand w-full text-xs py-2 rounded-xl gap-1.5"
      >
        <ShoppingBag className="w-3.5 h-3.5" /> Quick Add
      </button>
    );
  }

  return (
    <div>
      <p className="text-[10px] text-ink-muted uppercase tracking-widest mb-1.5 font-semibold">
        Select Size
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((size) => {
          const v = variants.find((x) => x.size === size);
          const ok = (v?.stock ?? 0) > 0;
          return (
            <button
              key={size}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (v && ok) onSelect(v); }}
              disabled={!ok}
              className={cn(
                'px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all duration-150 active:scale-95',
                ok
                  ? 'border-warm-300 text-ink hover:border-brand-600 hover:bg-brand-600 hover:text-white'
                  : 'border-warm-100 text-warm-300 line-through cursor-not-allowed bg-warm-50'
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

/* ─── placeholder ────────────────────────────────────────────────────────── */
function ImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-warm-100 via-warm-50 to-warm-200">
      <svg className="w-12 h-12 text-warm-300" fill="none" stroke="currentColor" strokeWidth={0.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
        />
      </svg>
      <p className="text-warm-400 text-[10px] mt-2 font-semibold tracking-widest uppercase">No Image</p>
    </div>
  );
}

/* ─── main card ──────────────────────────────────────────────────────────── */
export function ProductCard({ product, size = 'md', className }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [heartBeat, setHeartBeat] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  /* Normalise fields – card props or full Product shape both work */
  const primaryImage =
    product.primary_image ??
    (product.images?.length ? product.images[0] : undefined);
  const rating  = product.avg_rating ?? product.rating ?? 0;
  const sold    = product.sold_count ?? 0;
  const eta     = product.eta_minutes;
  const mrp     = product.mrp ?? 0;
  const disc    = getDiscountPct(mrp, product.price);
  const isNew   = isNewProduct(product.created_at);

  /* Normalise variants */
  const variants: Variant[] = (product.variants ?? []).map((v) => ({
    id: v.id,
    size:      v.size  ?? '',
    color:     v.color ?? '',
    color_hex: '',
    stock:     (v as { stock_quantity?: number; stock?: number }).stock_quantity
               ?? (v as { stock_quantity?: number; stock?: number }).stock
               ?? 0,
  }));

  const handleAdd = (v: Variant) => {
    addItem({
      id:          `${product.id}-${v.id}`,
      product_id:  product.id,
      variant_id:  v.id,
      store_id:    (product as Product).store_id ?? '',
      store_name:  product.store_name ?? '',
      name:        product.name,
      image_url:   primaryImage ?? '',
      size:        v.size ?? '',
      color:       v.color ?? '',
      price:       v.price ?? product.price,
      mrp,
      quantity:    1,
      max_qty:     v.stock,
      in_stock:    v.stock > 0,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartBeat(true);
    setWishlisted((p) => !p);
    setTimeout(() => setHeartBeat(false), 400);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn('product-card group block', className)}
      aria-label={product.name}
    >
      {/* ── image ── */}
      <div className="product-card-img aspect-product">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            sizes={
              size === 'sm'  ? '(max-width:640px) 50vw, 200px' :
              size === 'lg'  ? '(max-width:640px) 100vw, (max-width:1024px) 50vw, 400px' :
                               '(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw'
            }
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* badges – top-left stack */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {disc >= 5 && (
            <span className="badge-discount">{disc}% OFF</span>
          )}
          {isNew && (
            <span className="badge-new">New</span>
          )}
          {!!eta && eta <= 120 && (
            <span className="badge-delivery">
              <Zap className="w-2.5 h-2.5 flex-shrink-0" />
              {eta} min
            </span>
          )}
        </div>

        {/* wishlist */}
        <button
          onClick={handleWishlist}
          className={cn('wishlist-btn z-20', wishlisted && 'active', heartBeat && 'animate-[heart-beat_0.35s_ease-in-out]')}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-all duration-200',
              wishlisted ? 'fill-red-500 text-red-500' : 'text-ink-muted group-hover:text-ink'
            )}
          />
        </button>

        {/* quick-add overlay */}
        <div className="quick-actions rounded-b-2xl">
          {added ? (
            <div className="flex items-center justify-center gap-2 py-2.5 text-green-600 font-semibold text-sm animate-[fade-in_0.2s_ease]">
              <Check className="w-4 h-4" /> Added to bag!
            </div>
          ) : variants.length > 0 ? (
            <QuickSizePicker variants={variants} onSelect={handleAdd} />
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd({ id: product.id, size: '', color: '', color_hex: '', stock: 1 }); }}
              className="btn-brand w-full text-xs py-2.5 rounded-xl gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Quick Add
            </button>
          )}
        </div>
      </div>

      {/* ── info ── */}
      <div className={cn('p-3 pt-2.5', size === 'sm' && 'p-2.5 pt-2')}>
        {/* store + eta meta */}
        <div className="flex items-center gap-1 mb-1 min-w-0">
          {product.store_name && (
            <span className="text-[11px] text-ink-muted truncate font-medium leading-none">
              {product.store_name}
            </span>
          )}
          {!!eta && eta > 120 && (
            <span className="ml-auto text-[11px] text-ink-muted flex items-center gap-0.5 flex-shrink-0">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              {eta} min
            </span>
          )}
        </div>

        {/* name */}
        <h3
          className={cn(
            'font-serif text-ink line-clamp-2 leading-snug mb-1.5',
            size === 'sm' ? 'text-[13px] font-medium' : 'text-[15px] font-medium',
            size === 'lg' && 'text-base'
          )}
        >
          {product.name}
        </h3>

        {/* rating + sold */}
        {(rating > 0 || sold > 0) && (
          <div className="flex items-center gap-1.5 mb-1.5">
            {rating > 0 && (
              <>
                <StarRow rating={rating} />
                <span className="text-[11px] font-semibold text-ink-muted tabular-nums">
                  {rating.toFixed(1)}
                </span>
              </>
            )}
            {sold > 0 && (
              <>
                {rating > 0 && <span className="text-warm-300 text-[10px]">·</span>}
                <span className="text-[11px] text-ink-muted">{formatSoldCount(sold)}</span>
              </>
            )}
          </div>
        )}

        {/* price */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className={cn('font-bold text-ink tabular-nums', size === 'sm' ? 'text-sm' : 'text-base')}>
            {formatPrice(product.price)}
          </span>
          {mrp > product.price && (
            <>
              <span className="text-xs text-ink-subtle line-through tabular-nums">
                {formatPrice(mrp)}
              </span>
              {disc >= 5 && (
                <span className="text-xs font-semibold text-green-600">{disc}% off</span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
