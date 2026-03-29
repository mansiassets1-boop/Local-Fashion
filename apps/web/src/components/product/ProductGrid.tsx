'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ProductCard } from './ProductCard';
import { Product } from '@/hooks/useProducts';
import Image from 'next/image';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  skeletonCount?: number;
  emptyMessage?: string;
  searchQuery?: string;
  className?: string;
}

/* ── Skeleton card ── */
function SkeletonCard({ list = false }: { list?: boolean }) {
  if (list) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden flex gap-0 shadow-sm">
        <div className="skeleton w-32 flex-shrink-0 aspect-[3/4]" />
        <div className="flex-1 p-4 flex flex-col gap-3 justify-center">
          <div className="skeleton h-3 w-24 rounded-full" />
          <div className="skeleton h-5 w-3/4 rounded-lg" />
          <div className="skeleton h-4 w-1/2 rounded-lg" />
          <div className="skeleton h-4 w-20 rounded-full" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="skeleton aspect-product w-full" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

/* ── List card (horizontal layout) ── */
function ProductListCard({ product }: { product: Product }) {
  const primaryImage = product.images[0];
  const discount =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden flex gap-0 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(60,30,10,0.12)] hover:-translate-y-0.5"
      style={{ boxShadow: '0 2px 8px rgba(60,30,10,0.06)' }}
    >
      {/* Image */}
      <div className="relative w-36 sm:w-44 flex-shrink-0 aspect-[3/4] bg-warm-100 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 144px, 176px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-warm-100 to-warm-200">
            <svg className="w-10 h-10 text-warm-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v2a1 1 0 001 1h8a1 1 0 001-1V4M5 8h14l-1 12H6L5 8z" />
            </svg>
          </div>
        )}
        {discount >= 5 && (
          <span className="badge-discount absolute top-2 left-2 z-10">{discount}% OFF</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-xs text-ink-muted mb-1 truncate">
            {product.store_name}
            {product.store_area ? ` · ${product.store_area}` : ''}
          </p>
          <h3 className="font-serif text-ink text-base font-medium line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-ink-muted line-clamp-2 mb-2 leading-relaxed">
              {product.description}
            </p>
          )}
          {(product.rating > 0 || product.review_count > 0) && (
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    className={cn('w-3 h-3', s <= Math.round(product.rating) ? 'star-filled' : 'star-empty')}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
              <span className="text-xs text-ink-muted">{product.rating.toFixed(1)}</span>
              {product.review_count > 0 && (
                <span className="text-xs text-ink-muted">({product.review_count})</span>
              )}
              {product.sold_count > 0 && (
                <span className="text-xs text-ink-muted ml-auto">
                  {product.sold_count > 999 ? `${(product.sold_count / 1000).toFixed(1)}k` : product.sold_count} sold
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-ink">₹{product.price.toLocaleString('en-IN')}</span>
            {product.mrp > product.price && (
              <span className="text-sm text-ink-muted line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
            )}
          </div>
          {product.eta_minutes && (
            <span className="badge-delivery text-[11px]">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              {product.eta_minutes} min
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Empty state ── */
function EmptyState({ message, query }: { message: string; query?: string }) {
  const SUGGESTION_SEARCHES = ['Kurtis', 'Sarees', 'Lehengas', 'Heels', 'Bags', 'Jewellery'];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      {/* Illustration */}
      <div className="w-24 h-24 mb-6 rounded-full bg-warm-100 flex items-center justify-center">
        <Search className="w-10 h-10 text-warm-200" strokeWidth={1.5} />
      </div>
      <h3 className="font-serif text-xl font-semibold text-ink mb-2">
        {query ? `No results for "${query}"` : 'No styles found'}
      </h3>
      <p className="text-sm text-ink-muted mb-6 max-w-xs leading-relaxed">
        {message}
      </p>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {SUGGESTION_SEARCHES.map((s) => (
          <Link
            key={s}
            href={`/search?q=${encodeURIComponent(s)}`}
            className="px-4 py-1.5 rounded-full border border-warm-200 text-sm text-ink-muted hover:border-brand-600 hover:text-brand-600 transition-colors"
          >
            {s}
          </Link>
        ))}
      </div>

      <Link href="/search" className="btn-outline-brand text-sm px-5 py-2.5 rounded-xl">
        Browse all categories
      </Link>
    </div>
  );
}

export function ProductGrid({
  products,
  isLoading = false,
  viewMode = 'grid',
  skeletonCount = 8,
  emptyMessage = 'Try adjusting your filters or search a different term.',
  searchQuery,
  className,
}: ProductGridProps) {
  /* Empty state */
  if (!isLoading && products.length === 0) {
    return <EmptyState message={emptyMessage} query={searchQuery} />;
  }

  /* List view */
  if (viewMode === 'list') {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {isLoading
          ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} list />)
          : products.map((product) => (
              <ProductListCard key={product.id} product={product} />
            ))}
      </div>
    );
  }

  /* Grid view */
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4',
        className
      )}
    >
      {isLoading
        ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
        : products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              size={idx < 2 ? 'md' : 'sm'}
              className="animate-[fade-up_0.4s_ease_both]"
            />
          ))}
    </div>
  );
}
