'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectionItem {
  id: string;
  name: string;
  count: string;
  image: string;
  href: string;
  gridClass: string;
}

const COLLECTIONS: CollectionItem[] = [
  {
    id: 'kurtis',
    name: 'Kurtis',
    count: '143 styles',
    image: 'https://images.unsplash.com/photo-1594938298603-e47b7e8bae9f?w=800&q=80&auto=format&fit=crop',
    href: '/search?category=kurtis',
    gridClass: 'col-span-12 sm:col-span-5 row-span-2',
  },
  {
    id: 'heels',
    name: 'Heels',
    count: '89 styles',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80&auto=format&fit=crop',
    href: '/search?category=heels',
    gridClass: 'col-span-6 sm:col-span-3 row-span-1',
  },
  {
    id: 'bags',
    name: 'Bags',
    count: '67 styles',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80&auto=format&fit=crop',
    href: '/search?category=bags',
    gridClass: 'col-span-6 sm:col-span-4 row-span-1',
  },
  {
    id: 'sarees',
    name: 'Sarees',
    count: '212 styles',
    image: 'https://images.unsplash.com/photo-1487222477067-3acb51a8d7e3?w=800&q=80&auto=format&fit=crop',
    href: '/search?category=sarees',
    gridClass: 'col-span-12 sm:col-span-7 row-span-1',
  },
  {
    id: 'lehengas',
    name: 'Lehengas',
    count: '74 styles',
    image: 'https://images.unsplash.com/photo-1546961342-ea5f62d4d073?w=800&q=80&auto=format&fit=crop',
    href: '/search?category=lehengas',
    gridClass: 'col-span-7 sm:col-span-4 row-span-1',
  },
  {
    id: 'jewellery',
    name: 'Jewellery',
    count: '156 styles',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&auto=format&fit=crop',
    href: '/search?category=jewellery',
    gridClass: 'col-span-5 sm:col-span-3 row-span-1',
  },
];

function CollectionTile({ item }: { item: CollectionItem }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative rounded-2xl overflow-hidden cursor-pointer',
        item.gridClass
      )}
      style={{ minHeight: '160px' }}
    >
      {/* Image */}
      <Image
        src={item.image}
        alt={item.name}
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 overlay-bottom transition-opacity duration-500 group-hover:opacity-90" />

      {/* Hover: darkening top overlay */}
      <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-all duration-500" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-white font-bold text-xl leading-tight">{item.name}</h3>
          <p className="text-warm-200 text-xs mt-0.5 font-medium">{item.count}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <div className="glass rounded-full p-2">
            <ArrowUpRight className="h-4 w-4 text-ink" />
          </div>
        </div>
      </div>

      {/* "Shop Now" hover text */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
        <span className="px-5 py-2 rounded-full glass font-semibold text-sm text-ink">
          Shop Now
        </span>
      </div>
    </Link>
  );
}

export function TrendingCollections() {
  return (
    <section className="container-fashion py-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="section-subheading text-xs text-brand-600 flex items-center gap-2 mb-1">
            <span className="inline-block w-6 h-px bg-brand-500" />
            Collections
          </p>
          <h2 className="section-heading text-2xl md:text-3xl lg:text-4xl">Shop by Category</h2>
        </div>
        <Link
          href="/search"
          className="group hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          All Categories
          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-12 gap-3 auto-rows-[180px] sm:auto-rows-[200px]">
        {COLLECTIONS.map((item) => (
          <CollectionTile key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
