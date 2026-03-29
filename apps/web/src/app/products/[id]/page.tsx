'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, Bell, Share2, RotateCcw, Star } from 'lucide-react';
import { useProduct, useProductAvailability, useProductReviews } from '@/hooks/useProducts';
import { useAddToCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/auth.store';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { VariantSelector } from '@/components/product/VariantSelector';
import { ProductGrid } from '@/components/product/ProductGrid';
import { StoreCard } from '@/components/store/StoreCard';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatPrice } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Product } from '@/hooks/useProducts';
import { Store } from '@/components/store/StoreCard';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const { data: product, isLoading: productLoading } = useProduct(id);
  const { data: availability } = useProductAvailability(id);
  const { data: reviewsData } = useProductReviews(id);

  const addToCart = useAddToCart();

  // Fetch store
  const { data: store } = useQuery({
    queryKey: ['store', product?.store_id],
    queryFn: async () => {
      const { data } = await api.get<Store>(`/stores/${product!.store_id}`);
      return data;
    },
    enabled: !!product?.store_id,
  });

  // Fetch similar products
  const { data: similarData } = useQuery({
    queryKey: ['similar-products', id],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>(`/products/${id}/similar`);
      return data.products;
    },
    enabled: !!id,
  });

  const selectedVariant = product?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const stockCount = selectedVariant?.stock ?? null;

  const isAvailable = selectedVariant
    ? (availability?.variants.find((v) => v.variant_id === selectedVariant.id)?.in_stock ?? selectedVariant.stock > 0)
    : true;

  const canAddToCart = !!(selectedSize && selectedColor && selectedVariant && isAvailable);

  const handleAddToCart = () => {
    if (!isLoggedIn()) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }
    if (!product || !selectedVariant) return;

    addToCart.mutate({
      product_id: product.id,
      variant_id: selectedVariant.id,
      quantity: 1,
      item: {
        id: `temp-${Date.now()}`,
        product_id: product.id,
        variant_id: selectedVariant.id,
        store_id: product.store_id,
        store_name: product.store_name,
        name: product.name,
        image_url: product.images[0] || '',
        size: selectedSize!,
        color: selectedColor!,
        price: selectedVariant.price || product.price,
        mrp: product.mrp,
        quantity: 1,
        max_qty: selectedVariant.stock,
        in_stock: isAvailable,
      },
    });
  };

  if (productLoading) {
    return (
      <div className="container-fashion py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-product rounded-3xl" />
          <div className="space-y-5">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-5 w-1/2 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-fashion py-20 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">Product not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const discountPct = product.mrp && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <div className="container-fashion py-5 pb-24 md:pb-8 animate-[fade-in_0.4s_ease]">
      {/* Breadcrumb */}
      <nav className="text-xs text-ink-muted mb-5 flex items-center gap-1.5 flex-wrap">
        <span>Home</span><span className="text-warm-300">/</span>
        {product.category && <><span>{product.category}</span><span className="text-warm-300">/</span></>}
        <span className="text-ink font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
        {/* ── Left: Gallery ───────────────────────────────────────── */}
        <div className="md:sticky md:top-24 h-fit">
          <ProductImageGallery images={product.images} alt={product.name} />
        </div>

        {/* ── Right: Info ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Store + category row */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.store_name && (
              <span className="text-xs font-semibold text-brand-600 hover:underline cursor-pointer">{product.store_name}</span>
            )}
            {product.category && (
              <span className="px-2.5 py-0.5 rounded-full bg-warm-100 text-warm-700 text-[11px] font-semibold">{product.category}</span>
            )}
          </div>

          {/* Title + share */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-warm-900 leading-tight">{product.name}</h1>
            <button
              onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
              className="flex-shrink-0 w-9 h-9 rounded-xl hover:bg-warm-100 flex items-center justify-center text-ink-muted transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Rating + sold */}
          <div className="flex items-center gap-3 flex-wrap">
            <StarRating rating={product.rating} size="sm" showValue />
            <span className="text-sm text-ink-muted">({product.review_count} reviews)</span>
            {product.sold_count > 0 && (
              <span className="text-sm text-ink-muted">· {product.sold_count.toLocaleString()} sold</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-ink">{product.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-lg text-ink-muted line-through">{product.mrp.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</span>
                <span className="badge-discount text-sm px-2 py-0.5">{discountPct}% OFF</span>
              </>
            )}
          </div>
          {product.mrp && product.mrp > product.price && (
            <p className="text-sm text-green-600 font-semibold -mt-2">
              You save {(product.mrp - product.price).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </p>
          )}

          {/* ETA delivery box */}
          {product.eta_minutes && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-2xl">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-sm font-bold">Delivered in ~{product.eta_minutes} mins</p>
                {product.store_area && <p className="text-xs text-green-600">From {product.store_area} · Near you</p>}
              </div>
            </div>
          )}

          <div className="divider-warm" />

          {/* Variants */}
          <VariantSelector
            variants={product.variants}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            onSizeChange={setSelectedSize}
            onColorChange={setSelectedColor}
          />

          {/* Stock warning */}
          {stockCount !== null && stockCount > 0 && stockCount <= 5 && (
            <p className="text-orange-600 text-sm font-semibold flex items-center gap-1.5 bg-orange-50 px-3 py-2 rounded-xl">
              🔥 Only {stockCount} left — grab it fast!
            </p>
          )}

          {/* CTA buttons */}
          <div className="space-y-3 pt-1">
            {isAvailable || !selectedVariant ? (
              <button
                disabled={!canAddToCart || addToCart.isPending}
                onClick={handleAddToCart}
                className={`btn-brand w-full py-4 text-base rounded-2xl flex items-center justify-center gap-2 ${(!canAddToCart || addToCart.isPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <ShoppingBag className="w-5 h-5" />
                {addToCart.isPending ? 'Adding...' : (!selectedSize || !selectedColor) ? 'Select Size & Color' : 'Add to Bag'}
              </button>
            ) : (
              <button
                className="btn-outline-brand w-full py-4 text-base rounded-2xl flex items-center justify-center gap-2"
                onClick={() => toast.success("We'll notify you when back in stock!")}
              >
                <Bell className="w-5 h-5" /> Notify Me When Available
              </button>
            )}
          </div>

          {/* Benefits strip */}
          <div className="grid grid-cols-4 gap-2 py-3 border-y border-warm-200">
            {[['🔄', '7-day returns'], ['🔒', 'Secure pay'], ['🏪', 'Local store'], ['⚡', 'Fast delivery']].map(([icon, text]) => (
              <div key={text} className="flex flex-col items-center text-center gap-1">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] text-ink-muted leading-tight">{text}</span>
              </div>
            ))}
          </div>

          {/* Return policy */}
          {product.return_policy && (
            <div className="flex items-start gap-2.5 text-sm text-ink-muted bg-warm-50 rounded-2xl px-4 py-3">
              <RotateCcw className="w-4 h-4 mt-0.5 flex-shrink-0 text-brand-500" />
              <span>{product.return_policy}</span>
            </div>
          )}

          {/* Store card */}
          {store && (
            <div>
              <p className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-2">Sold By</p>
              <StoreCard store={store} variant="mini" />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <section className="mt-12 bg-white rounded-3xl p-6 shadow-warm-sm">
          <h2 className="font-serif text-xl font-bold text-warm-900 mb-3">About this Product</h2>
          <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-line">{product.description}</p>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-10">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="font-serif text-2xl font-bold text-warm-900">Ratings & Reviews</h2>
          {reviewsData && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-700">{reviewsData.average.toFixed(1)}</span>
              <span className="text-xs text-amber-500">/ 5</span>
            </div>
          )}
        </div>
        {reviewsData?.reviews.length ? (
          <div className="space-y-4">
            {reviewsData.reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="bg-white rounded-2xl shadow-warm-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                      {review.user_name[0]}
                    </div>
                    <span className="text-sm font-semibold text-ink">{review.user_name}</span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">{review.comment}</p>
                <p className="text-xs text-warm-400 mt-2">{formatDate(review.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-warm-50 rounded-3xl">
            <Star className="w-10 h-10 mx-auto mb-2 text-warm-300" />
            <p className="text-sm text-ink-muted">No reviews yet. Be the first!</p>
          </div>
        )}
      </section>

      {/* Similar products */}
      {similarData && similarData.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-brand-700" />
            <h2 className="font-serif text-2xl font-bold text-warm-900">You May Also Like</h2>
          </div>
          <p className="text-sm text-ink-muted mb-6 pl-4">Similar styles from other boutiques</p>
          <ProductGrid products={similarData} />
        </section>
      )}

      {/* Sticky mobile CTA */}
      {!canAddToCart && (
        <div className="fixed bottom-[60px] sm:hidden left-0 right-0 px-4 py-3 glass-warm z-40 border-t border-warm-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-ink-muted">Select size & colour</p>
              <p className="font-bold text-ink text-lg">{product.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}</p>
            </div>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-brand px-6 py-3 rounded-xl text-sm">
              Choose Options
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
