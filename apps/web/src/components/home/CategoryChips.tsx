'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  emoji: string;
  color?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'kurtis', name: 'Kurtis', emoji: '👘', color: 'bg-pink-50 text-pink-700' },
  { id: 'sarees', name: 'Sarees', emoji: '🥻', color: 'bg-purple-50 text-purple-700' },
  { id: 'tops', name: 'Tops', emoji: '👚', color: 'bg-blue-50 text-blue-700' },
  { id: 'dresses', name: 'Dresses', emoji: '👗', color: 'bg-rose-50 text-rose-700' },
  { id: 'jeans', name: 'Jeans', emoji: '👖', color: 'bg-indigo-50 text-indigo-700' },
  { id: 'heels', name: 'Heels', emoji: '👠', color: 'bg-orange-50 text-orange-700' },
  { id: 'bags', name: 'Bags', emoji: '👜', color: 'bg-amber-50 text-amber-700' },
  { id: 'jewellery', name: 'Jewellery', emoji: '💍', color: 'bg-yellow-50 text-yellow-700' },
  { id: 'lehengas', name: 'Lehengas', emoji: '🪷', color: 'bg-fuchsia-50 text-fuchsia-700' },
  { id: 'dupattas', name: 'Dupattas', emoji: '🧣', color: 'bg-teal-50 text-teal-700' },
];

interface CategoryChipsProps {
  categories?: Category[];
}

export function CategoryChips({ categories = DEFAULT_CATEGORIES }: CategoryChipsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.id}`}
          className={cn(
            'flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all hover:scale-105',
            cat.color || 'bg-gray-50 text-gray-700'
          )}
        >
          <span className="text-2xl leading-none">{cat.emoji}</span>
          <span className="text-xs font-medium whitespace-nowrap">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
