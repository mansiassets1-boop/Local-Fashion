'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  activeGradient: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'kurtis',
    name: 'Kurtis',
    emoji: '👗',
    gradient: 'bg-gradient-to-br from-rose-50 to-pink-100 text-rose-700 border-rose-100',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
  {
    id: 'sarees',
    name: 'Sarees',
    emoji: '🥻',
    gradient: 'bg-gradient-to-br from-purple-50 to-fuchsia-100 text-purple-700 border-purple-100',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
  {
    id: 'lehengas',
    name: 'Lehengas',
    emoji: '👑',
    gradient: 'bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-700 border-amber-100',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
  {
    id: 'heels',
    name: 'Heels',
    emoji: '👠',
    gradient: 'bg-gradient-to-br from-orange-50 to-warm-100 text-orange-700 border-orange-100',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
  {
    id: 'bags',
    name: 'Bags',
    emoji: '👜',
    gradient: 'bg-gradient-to-br from-warm-100 to-warm-200 text-warm-800 border-warm-200',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
  {
    id: 'jewellery',
    name: 'Jewellery',
    emoji: '💍',
    gradient: 'bg-gradient-to-br from-yellow-50 to-gold-100 text-gold-700 border-yellow-100',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
  {
    id: 'dupattas',
    name: 'Dupattas',
    emoji: '🧣',
    gradient: 'bg-gradient-to-br from-teal-50 to-cyan-100 text-teal-700 border-teal-100',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
  {
    id: 'mens',
    name: "Men's",
    emoji: '👔',
    gradient: 'bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 border-blue-100',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
  {
    id: 'new-in',
    name: 'New In',
    emoji: '🌸',
    gradient: 'bg-gradient-to-br from-pink-50 to-rose-100 text-pink-700 border-pink-100',
    activeGradient: 'bg-gradient-to-br from-brand-500 to-brand-600 text-white border-brand-600 shadow-warm-md',
  },
];

interface CategoryChipsProps {
  categories?: Category[];
  activeId?: string;
}

export function CategoryChips({ categories = DEFAULT_CATEGORIES, activeId }: CategoryChipsProps) {
  const [active, setActive] = useState<string | null>(activeId || null);

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6">
      {categories.map((cat) => {
        const isActive = active === cat.id;
        return (
          <Link
            key={cat.id}
            href={`/search?category=${cat.id}`}
            onClick={() => setActive(cat.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border font-medium text-sm',
              'transition-all duration-200 hover:scale-105 hover:-translate-y-0.5',
              isActive ? cat.activeGradient : cat.gradient
            )}
          >
            <span className="text-base leading-none">{cat.emoji}</span>
            <span className="whitespace-nowrap tracking-tight">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
