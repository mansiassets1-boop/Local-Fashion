'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LookProduct {
  id: string;
  name: string;
  price: string;
  image: string;
  href: string;
}

interface Look {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  products: LookProduct[];
}

const LOOKS: Look[] = [
  {
    id: 'look-1',
    title: 'Festive Glow',
    subtitle: 'Look #1',
    image: 'https://images.unsplash.com/photo-1524504388868-5b69b3085e97?w=800&q=80&auto=format&fit=crop',
    products: [
      {
        id: 'p1',
        name: 'Silk Kurti',
        price: '₹1,299',
        image: 'https://images.unsplash.com/photo-1594938298603-e47b7e8bae9f?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=kurtis',
      },
      {
        id: 'p2',
        name: 'Embroidered Dupatta',
        price: '₹649',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=dupattas',
      },
      {
        id: 'p3',
        name: 'Jhumka Earrings',
        price: '₹429',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=jewellery',
      },
      {
        id: 'p4',
        name: 'Block Heels',
        price: '₹1,099',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=heels',
      },
    ],
  },
  {
    id: 'look-2',
    title: 'Casual Chic',
    subtitle: 'Look #2',
    image: 'https://images.unsplash.com/photo-1529139514571-ac4baab12d29?w=800&q=80&auto=format&fit=crop',
    products: [
      {
        id: 'p5',
        name: 'Printed Kurta',
        price: '₹899',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=kurtis',
      },
      {
        id: 'p6',
        name: 'Cotton Palazzo',
        price: '₹549',
        image: 'https://images.unsplash.com/photo-1546961342-ea5f62d4d073?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=kurtis',
      },
      {
        id: 'p7',
        name: 'Sling Bag',
        price: '₹799',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=bags',
      },
      {
        id: 'p8',
        name: 'Kolhapuri Flats',
        price: '₹699',
        image: 'https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=heels',
      },
    ],
  },
  {
    id: 'look-3',
    title: 'Office Ready',
    subtitle: 'Look #3',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&auto=format&fit=crop',
    products: [
      {
        id: 'p9',
        name: 'Straight Kurta',
        price: '₹999',
        image: 'https://images.unsplash.com/photo-1583391099977-103b05f5e33c?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=kurtis',
      },
      {
        id: 'p10',
        name: 'Palazzo Pants',
        price: '₹649',
        image: 'https://images.unsplash.com/photo-1594938298603-e47b7e8bae9f?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=kurtis',
      },
      {
        id: 'p11',
        name: 'Statement Necklace',
        price: '₹329',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=jewellery',
      },
      {
        id: 'p12',
        name: 'Structured Tote',
        price: '₹1,499',
        image: 'https://images.unsplash.com/photo-1548036161-97f5a8ac2c43?w=200&q=80&auto=format&fit=crop',
        href: '/search?category=bags',
      },
    ],
  },
];

function LookCard({ look }: { look: Look }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col gap-4 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main look image */}
      <div className="look-card relative rounded-3xl overflow-hidden">
        <Image
          src={look.image}
          alt={look.title}
          fill
          className={cn(
            'object-cover transition-transform duration-700 ease-out',
            hovered ? 'scale-[1.05]' : 'scale-100'
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 overlay-bottom" />

        {/* Label */}
        <div className="absolute bottom-0 inset-x-0 z-10 p-5">
          <p className="text-warm-200 text-xs font-semibold tracking-widest uppercase mb-1">
            {look.subtitle}
          </p>
          <h3 className="font-serif text-white text-2xl font-bold leading-tight">{look.title}</h3>
        </div>

        {/* "Shop This Look" button on hover */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center z-10 transition-all duration-300',
            hovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Link
            href={`/search?look=${look.id}`}
            className="btn-brand flex items-center gap-2 shadow-warm-lg"
          >
            <ShoppingBag className="h-4 w-4" />
            Shop This Look
          </Link>
        </div>
      </div>

      {/* Product thumbnails */}
      <div className="flex items-center gap-3">
        {look.products.map((product) => (
          <Link
            key={product.id}
            href={product.href}
            className="group/thumb flex flex-col items-center gap-1.5 flex-1 min-w-0"
            title={product.name}
          >
            <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-warm-200 transition-all duration-200 group-hover/thumb:border-brand-400 group-hover/thumb:scale-110">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <span className="text-[10px] text-ink-muted text-center leading-tight line-clamp-1 w-full">
              {product.price}
            </span>
          </Link>
        ))}
        <Link
          href={`/search?look=${look.id}`}
          className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-50 border-2 border-brand-200 hover:bg-brand-100 transition-colors flex-shrink-0"
          title="Shop all"
        >
          <ArrowRight className="h-4 w-4 text-brand-600" />
        </Link>
      </div>
    </div>
  );
}

export function ShopTheLook() {
  return (
    <section className="container-fashion py-12">
      {/* Section header */}
      <div className="text-center mb-10">
        <p className="section-subheading text-xs text-brand-600 mb-2 flex items-center justify-center gap-2">
          <span className="inline-block w-8 h-px bg-brand-500" />
          Curated by Stylists
          <span className="inline-block w-8 h-px bg-brand-500" />
        </p>
        <h2 className="section-heading text-3xl md:text-4xl lg:text-5xl mb-3">Shop The Look</h2>
        <p className="text-ink-muted text-sm md:text-base max-w-md mx-auto">
          Complete outfits curated by our in-house stylists — one tap to wear the full look.
        </p>
      </div>

      {/* Look cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {LOOKS.map((look) => (
          <LookCard key={look.id} look={look} />
        ))}
      </div>
    </section>
  );
}
