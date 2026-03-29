'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useDetectCity } from '@/hooks/useCity';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryChips } from '@/components/home/CategoryChips';
import { SectionTitle } from '@/components/home/SectionTitle';
import { ProductGrid } from '@/components/product/ProductGrid';
import { StoreCard, Store } from '@/components/store/StoreCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Product } from '@/hooks/useProducts';

interface HomeData {
  banners: {
    id: string;
    image_url: string;
    title?: string;
    subtitle?: string;
    cta_label?: string;
    cta_url?: string;
    bg_color?: string;
  }[];
  trending: Product[];
  new_arrivals: Product[];
  nearby_stores: Store[];
}

// Fallback banners for when API is unavailable
const FALLBACK_BANNERS = [
  {
    id: '1',
    image_url: '',
    title: 'New Season Arrivals',
    subtitle: 'Fresh styles from your local boutiques',
    cta_label: 'Shop Now',
    cta_url: '/search',
    bg_color: '#EEF2FF',
  },
  {
    id: '2',
    image_url: '',
    title: '2–3 Hour Delivery',
    subtitle: 'Get fashion delivered from stores near you',
    cta_label: 'Explore',
    cta_url: '/search?sort=popular',
    bg_color: '#FDF2F8',
  },
];

export default function HomePage() {
  const { city } = useAuthStore();
  useDetectCity();

  const { data, isLoading } = useQuery({
    queryKey: ['home', city?.id],
    queryFn: async () => {
      const { data } = await api.get<HomeData>('/home', {
        params: { city_id: city?.id },
      });
      return data;
    },
    enabled: !!city?.id,
  });

  const banners = data?.banners || FALLBACK_BANNERS;
  const trending = data?.trending || [];
  const newArrivals = data?.new_arrivals || [];
  const nearbyStores = data?.nearby_stores || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-8">
      {/* Hero Banner */}
      <section>
        {banners.length > 0 ? (
          <HeroBanner banners={banners} />
        ) : (
          <Skeleton className="aspect-[2.4/1] sm:aspect-[3/1] rounded-2xl" />
        )}
      </section>

      {/* Category chips */}
      <section>
        <CategoryChips />
      </section>

      {/* Trending Now */}
      <section>
        <SectionTitle
          title="Trending Now"
          subtitle="Most loved by shoppers in your city"
          seeAllHref="/search?sort=popular"
        />
        <ProductGrid
          products={trending}
          isLoading={isLoading && !data}
          skeletonCount={8}
          emptyMessage="Trending products will appear here once your city is selected."
        />
      </section>

      {/* New Arrivals */}
      {(newArrivals.length > 0 || isLoading) && (
        <section>
          <SectionTitle
            title="New Arrivals"
            subtitle="Fresh picks just landed"
            seeAllHref="/search?sort=newest"
          />
          <ProductGrid
            products={newArrivals}
            isLoading={isLoading && !data}
            skeletonCount={4}
          />
        </section>
      )}

      {/* Nearby Stores */}
      {(nearbyStores.length > 0 || isLoading) && (
        <section className="pb-4">
          <SectionTitle
            title="Shops Near You"
            subtitle="Boutiques in your neighbourhood"
            seeAllHref="/search?tab=stores"
          />
          {isLoading && !data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {nearbyStores.map((store) => (
                <StoreCard key={store.id} store={store} variant="mini" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* No city selected */}
      {!city && !isLoading && (
        <div className="text-center py-16">
          <span className="text-5xl mb-4 block">📍</span>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Select your city to get started</h2>
          <p className="text-gray-500 text-sm">
            We&apos;ll show you fashion from local stores near you
          </p>
        </div>
      )}
    </div>
  );
}
