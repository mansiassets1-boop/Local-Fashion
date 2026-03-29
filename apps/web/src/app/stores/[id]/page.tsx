'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Star, Clock, Heart, Package, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Store } from '@/components/store/StoreCard';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Product, ProductFilters } from '@/hooks/useProducts';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const { city, isLoggedIn } = useAuthStore();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [following, setFollowing] = useState(false);

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      const { data } = await api.get<Store>(`/stores/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['store-products', id, city?.id, filters],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>(`/stores/${id}/products`, {
        params: { city_id: city?.id, ...filters },
      });
      return data.products;
    },
    enabled: !!id,
  });

  const handleFollow = () => {
    if (!isLoggedIn()) {
      toast.error('Please login to follow stores');
      return;
    }
    setFollowing((prev) => !prev);
    toast.success(following ? 'Unfollowed store' : 'Following store!');
  };

  if (storeLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Skeleton className="h-40 w-full rounded-2xl mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl mb-2">🏪</p>
        <p className="text-gray-500">Store not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
      {/* Store header */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
        {/* Banner */}
        <div className="relative h-36 sm:h-48 bg-gradient-to-r from-primary-100 to-primary-200">
          {store.banner_url && (
            <Image
              src={store.banner_url}
              alt={store.name}
              fill
              className="object-cover"
              sizes="1200px"
              priority
            />
          )}
        </div>

        {/* Info */}
        <div className="px-4 sm:px-6 pb-4">
          <div className="flex items-end gap-4 -mt-6 mb-4">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white shadow-md border-2 border-white overflow-hidden flex-shrink-0">
              {store.logo_url ? (
                <Image src={store.logo_url} alt={store.name} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary-50 text-primary-600 text-2xl font-bold">
                  {store.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-6">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{store.name}</h1>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <MapPin className="h-3.5 w-3.5" />
                <span>{store.area}, {store.city}</span>
              </div>
            </div>
            <Button
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              leftIcon={<Heart className={following ? 'h-4 w-4 fill-primary-600' : 'h-4 w-4'} />}
              onClick={handleFollow}
            >
              {following ? 'Following' : 'Follow'}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-2">
            <StatBox icon={<Star className="h-4 w-4 text-amber-400" />} label="Rating" value={store.rating.toFixed(1)} />
            <StatBox icon={<Clock className="h-4 w-4 text-green-500" />} label="ETA" value={`${store.eta_minutes}m`} />
            <StatBox icon={<Package className="h-4 w-4 text-primary-400" />} label="Products" value={store.product_count.toString()} />
            <StatBox icon={<Users className="h-4 w-4 text-blue-400" />} label="Followers" value={store.followers_count >= 1000 ? `${(store.followers_count / 1000).toFixed(1)}k` : store.followers_count.toString()} />
          </div>

          {/* Categories */}
          {store.categories.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {store.categories.map((cat) => (
                <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products section */}
      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-20 bg-white rounded-xl shadow-card p-4">
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Products ({productsData?.length || 0})
          </h2>
          <ProductGrid
            products={productsData || []}
            isLoading={productsLoading}
            emptyMessage="No products available from this store right now."
          />
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-gray-50 rounded-xl py-2.5 px-1">
      {icon}
      <span className="text-sm font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}
