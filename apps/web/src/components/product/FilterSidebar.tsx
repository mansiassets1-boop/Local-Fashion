'use client';

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ProductFilters } from '@/hooks/useProducts';
import { StarRating } from '@/components/ui/StarRating';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', '28', '30', '32', '34', '36', '38'];
const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Beige', hex: '#E5C9A0' },
];
const CATEGORIES = ['Kurtis', 'Sarees', 'Lehengas', 'Tops', 'Jeans', 'Dresses', 'Heels', 'Flats', 'Bags', 'Jewellery', 'Dupattas'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'discount', label: 'Best Discount' },
];

interface FilterSidebarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-3 text-sm font-semibold text-gray-800 hover:text-primary-600"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ filters, onFiltersChange, onClose, isMobile = false }: FilterSidebarProps) {
  const update = (partial: Partial<ProductFilters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  const toggle = (key: keyof ProductFilters, value: string) => {
    const current = (filters[key] as string | undefined) || '';
    const values = current ? current.split(',') : [];
    const next = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
    update({ [key]: next.length > 0 ? next.join(',') : undefined });
  };

  const isActive = (key: keyof ProductFilters, value: string) => {
    const current = (filters[key] as string | undefined) || '';
    return current.split(',').includes(value);
  };

  const clearAll = () => {
    onFiltersChange({ q: filters.q });
  };

  const hasFilters = Object.keys(filters).some(
    (k) => k !== 'q' && filters[k as keyof ProductFilters] !== undefined
  );

  return (
    <div className={cn('flex flex-col h-full', isMobile && 'p-4')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Filters</h2>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              Clear all
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0">
        {/* Sort */}
        <Section title="Sort By">
          <div className="space-y-1.5">
            {SORT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={opt.value}
                  checked={filters.sort === opt.value}
                  onChange={() => update({ sort: opt.value as ProductFilters['sort'] })}
                  className="text-primary-600"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Category */}
        <Section title="Category">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggle('category', cat)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs border transition-colors',
                  isActive('category', cat)
                    ? 'border-primary-600 bg-primary-50 text-primary-600 font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </Section>

        {/* Size */}
        <Section title="Size">
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => toggle('size', size)}
                className={cn(
                  'min-w-[2.5rem] px-2 py-1 rounded-lg border text-xs font-medium transition-colors',
                  isActive('size', size)
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </Section>

        {/* Color */}
        <Section title="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map(({ name, hex }) => (
              <button
                key={name}
                title={name}
                onClick={() => toggle('color', name)}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-all',
                  isActive('color', name)
                    ? 'border-primary-600 scale-110 shadow-sm'
                    : 'border-transparent hover:border-gray-300'
                )}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </Section>

        {/* Price Range */}
        <Section title="Price Range">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Min (₹)</label>
                <input
                  type="number"
                  value={filters.min_price || ''}
                  onChange={(e) => update({ min_price: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Max (₹)</label>
                <input
                  type="number"
                  value={filters.max_price || ''}
                  onChange={(e) => update({ max_price: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="10000"
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[500, 1000, 2000, 5000].map((price) => (
                <button
                  key={price}
                  onClick={() => update({ max_price: price, min_price: undefined })}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition-colors',
                    filters.max_price === price
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-gray-200 text-gray-500 hover:border-primary-300'
                  )}
                >
                  Under ₹{price.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Min Rating */}
        <Section title="Minimum Rating">
          <div className="space-y-2">
            {[4, 3, 2].map((r) => (
              <button
                key={r}
                onClick={() => update({ min_rating: filters.min_rating === r ? undefined : r })}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg border transition-colors',
                  filters.min_rating === r
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-transparent hover:bg-gray-50'
                )}
              >
                <StarRating rating={r} size="sm" />
                <span className="text-xs text-gray-600">{r}+ stars</span>
              </button>
            ))}
          </div>
        </Section>
      </div>

      {isMobile && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button fullWidth onClick={onClose}>
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}
