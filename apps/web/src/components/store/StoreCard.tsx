'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Store {
  id: string;
  name: string;
  logo_url?: string;
  banner_url?: string;
  area: string;
  city: string;
  rating: number;
  review_count: number;
  product_count: number;
  eta_minutes: number;
  distance_km?: number;
  categories: string[];
  followers_count: number;
}

interface StoreCardProps {
  store: Store;
  variant?: 'mini' | 'full';
  className?: string;
}

export function StoreCard({ store, variant = 'mini', className }: StoreCardProps) {
  if (variant === 'full') {
    return (
      <Link
        href={`/stores/${store.id}`}
        className={cn(
          'block rounded-xl bg-white shadow-card hover:shadow-card-hover transition-shadow overflow-hidden',
          className
        )}
      >
        {/* Banner */}
        <div className="relative h-28 bg-gradient-to-r from-primary-100 to-primary-200">
          {store.banner_url && (
            <Image src={store.banner_url} alt={store.name} fill className="object-cover" sizes="400px" />
          )}
          {/* Logo */}
          <div className="absolute -bottom-5 left-4 h-12 w-12 rounded-xl bg-white shadow-md border border-gray-100 overflow-hidden">
            {store.logo_url ? (
              <Image src={store.logo_url} alt={store.name} fill className="object-cover" sizes="48px" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary-50 text-primary-600 text-lg font-bold">
                {store.name[0]}
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 pb-4 px-4">
          <h3 className="font-semibold text-gray-900 text-sm">{store.name}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
            <MapPin className="h-3 w-3" />
            <span>{store.area}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-gray-600 font-medium">{store.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">{store.eta_minutes} min</span>
            </div>
            <span className="text-xs text-gray-400">{store.product_count} products</span>
          </div>
          {store.categories.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {store.categories.slice(0, 3).map((cat) => (
                <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Mini variant
  return (
    <Link
      href={`/stores/${store.id}`}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl bg-white shadow-card hover:shadow-card-hover transition-shadow',
        className
      )}
    >
      <div className="relative h-12 w-12 flex-shrink-0 rounded-xl bg-primary-50 overflow-hidden border border-gray-100">
        {store.logo_url ? (
          <Image src={store.logo_url} alt={store.name} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-primary-600 text-lg font-bold">
            {store.name[0]}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">{store.name}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
          <span>{store.area}</span>
          {store.distance_km && <span>· {store.distance_km.toFixed(1)} km</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-gray-600">{store.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Clock className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">{store.eta_minutes} min</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
