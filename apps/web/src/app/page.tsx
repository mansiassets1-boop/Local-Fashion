'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useDetectCity } from '@/hooks/useCity';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryChips } from '@/components/home/CategoryChips';
import { TrendingCollections } from '@/components/home/TrendingCollections';
import { ShopTheLook } from '@/components/home/ShopTheLook';
import { VideoReels } from '@/components/home/VideoReels';
import { SectionTitle } from '@/components/home/SectionTitle';
import { ProductGrid } from '@/components/product/ProductGrid';
import { StoreCard, Store } from '@/components/store/StoreCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Product } from '@/hooks/useProducts';
import { MapPin, Zap } from 'lucide-react';

interface HomeData {
  banners: any[];
  trending: Product[];
  new_arrivals: Product[];
  nearby_stores: Store[];
}

const WHY_US = [
  { icon: '⚡', title: '2-3 Hour Delivery', desc: 'From local store to your door in hours, not days' },
  { icon: '🏪', title: 'Local Boutiques', desc: '500+ curated stores from your own city' },
  { icon: '🔄', title: 'Easy Returns', desc: '7-day hassle-free return policy' },
  { icon: '🔒', title: 'Secure Payments', desc: 'UPI, cards, wallets — all encrypted' },
];

export default function HomePage() {
  const { city } = useAuthStore();
  useDetectCity();

  const { data, isLoading } = useQuery({
    queryKey: ['home', city?.id],
    queryFn: async () => {
      const { data } = await api.get<HomeData>('/home', { params: { city_id: city?.id } });
      return data;
    },
    enabled: !!city?.id,
  });

  const trending   = data?.trending    || [];
  const newArrivals = data?.new_arrivals || [];
  const nearbyStores = data?.nearby_stores || [];

  return (
    <div className="pb-20 sm:pb-0">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="container-fashion pt-4 md:pt-6">
        <HeroBanner banners={data?.banners} />
      </section>

      {/* ── Category chips ────────────────────────────────────────────── */}
      <section className="container-fashion mt-6">
        <CategoryChips />
      </section>

      {/* ── Trending Collections grid ─────────────────────────────────── */}
      <section className="container-fashion mt-12">
        <TrendingCollections />
      </section>

      {/* ── Trending Products ─────────────────────────────────────────── */}
      <section className="container-fashion mt-14">
        <SectionTitle title="What's Hot Right Now" subtitle="Trending this week" seeAllHref="/search?sort=sold_count" />
        <ProductGrid products={trending} isLoading={isLoading && !data} skeletonCount={8} />
        {!city && !isLoading && (
          <div className="text-center py-14 bg-warm-50 rounded-3xl">
            <MapPin className="w-10 h-10 text-brand-400 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-warm-900 mb-1">Select your city</h3>
            <p className="text-sm text-ink-muted">We&apos;ll show trending styles from stores near you</p>
          </div>
        )}
      </section>

      {/* ── Shop the Look ─────────────────────────────────────────────── */}
      <section className="container-fashion mt-16">
        <ShopTheLook />
      </section>

      {/* ── New Arrivals ──────────────────────────────────────────────── */}
      <section className="container-fashion mt-14">
        <SectionTitle title="Just Dropped" subtitle="New arrivals this week" seeAllHref="/search?sort=newest" />
        <ProductGrid products={newArrivals} isLoading={isLoading && !data} skeletonCount={4} />
      </section>

      {/* ── Video Reels ───────────────────────────────────────────────── */}
      <section className="container-fashion mt-16">
        <VideoReels />
      </section>

      {/* ── Nearby Stores ─────────────────────────────────────────────── */}
      {(nearbyStores.length > 0 || isLoading) && (
        <section className="container-fashion mt-14">
          <SectionTitle title="Stores Near You" subtitle="Local boutiques in your city" seeAllHref="/search?view=stores" />
          {isLoading && !data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {nearbyStores.map((store) => <StoreCard key={store.id} store={store} variant="mini" />)}
            </div>
          )}
        </section>
      )}

      {/* ── Why LocalFashion ──────────────────────────────────────────── */}
      <section className="container-fashion mt-16 mb-8">
        <div className="bg-warm-900 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.2em] text-brand-400 uppercase mb-2">Why Choose Us</p>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">Fashion, delivered differently</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {WHY_US.map((item) => (
              <div key={item.title} className="text-center">
                <span className="text-3xl block mb-3">{item.icon}</span>
                <h3 className="font-semibold text-white text-sm mb-1">{item.title}</h3>
                <p className="text-warm-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
