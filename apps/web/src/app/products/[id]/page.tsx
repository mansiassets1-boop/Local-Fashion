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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl mb-2">😕</p>
        <p className="text-gray-500">Product not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Left: Image Gallery */}
        <div>
          <ProductImageGallery images={product.images} alt={product.name} />
        </div>

        {/* Right: Product info */}
        <div className="space-y-4">
          {/* Breadcrumb/category */}
          <Badge variant="primary" size="sm">{product.category}</Badge>

          {/* Name + share */}
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <button
              onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              aria-label="Share product"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Rating + sold */}
          <div className="flex items-center gap-3">
            <StarRating rating={product.rating} size="sm" showValue />
            <span className="text-sm text-gray-400">({product.review_count} reviews)</span>
            {product.sold_count > 0 && (
              <span className="text-sm text-gray-400">{product.sold_count.toLocaleString()} sold</span>
            )}
          </div>

          {/* Price */}
          <PriceDisplay price={selectedVariant?.price || product.price} mrp={product.mrp} size="lg" />

          {/* ETA */}
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-xl w-fit">
            <span className="text-lg">🛵</span>
            <div>
              <span className="text-sm font-semibold">{product.eta_minutes} min delivery</span>
              <p className="text-xs text-green-600">From {product.store_area}</p>
            </div>
          </div>

          {/* Variant selector */}
          <VariantSelector
            variants={product.variants}
            selectedSize={selectedSize}
            selectedColor={selectedColor}
            onSizeChange={setSelectedSize}
            onColorChange={setSelectedColor}
          />

          {/* Stock warning */}
          {stockCount !== null && stockCount > 0 && stockCount <= 5 && (
            <p className="text-orange-500 text-sm font-medium flex items-center gap-1">
              ⚠️ Only {stockCount} left in stock!
            </p>
          )}

          {/* Add to cart / Notify Me */}
          <div className="flex gap-3">
            {isAvailable || !selectedVariant ? (
              <Button
                fullWidth
                size="lg"
                disabled={!canAddToCart}
                loading={addToCart.isPending}
                leftIcon={<ShoppingBag className="h-5 w-5" />}
                onClick={handleAddToCart}
              >
                {!selectedSize || !selectedColor
                  ? 'Select Size & Color'
                  : 'Add to Cart'}
              </Button>
            ) : (
              <Button
                fullWidth
                size="lg"
                variant="outline"
                leftIcon={<Bell className="h-5 w-5" />}
                onClick={() => toast.success("We'll notify you when this is back in stock!")}
              >
                Notify Me
              </Button>
            )}
          </div>

          {/* Return policy */}
          {product.return_policy && (
            <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
              <RotateCcw className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary-400" />
              <span>{product.return_policy}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <section className="mt-8">
          <h2 className="text-base font-bold text-gray-900 mb-2">Product Description</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
        </section>
      )}

      {/* Store card */}
      {store && (
        <section className="mt-8">
          <h2 className="text-base font-bold text-gray-900 mb-3">Sold By</h2>
          <StoreCard store={store} variant="mini" />
        </section>
      )}

      {/* Reviews */}
      <section className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-bold text-gray-900">Ratings & Reviews</h2>
          {reviewsData && (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-amber-700">{reviewsData.average.toFixed(1)}</span>
              <span className="text-xs text-amber-500">/ 5</span>
            </div>
          )}
        </div>

        {reviewsData?.reviews.length ? (
          <div className="space-y-4">
            {reviewsData.reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-bold">
                      {review.user_name[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{review.user_name}</span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(review.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Star className="h-8 w-8 mx-auto mb-2 text-gray-200" />
            <p className="text-sm">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </section>

      {/* Similar products */}
      {similarData && similarData.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-bold text-gray-900 mb-4">Similar Products</h2>
          <ProductGrid products={similarData} />
        </section>
      )}
    </div>
  );
}
