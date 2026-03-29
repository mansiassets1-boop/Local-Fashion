'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useProducts, ProductFilters } from '@/hooks/useProducts';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterSidebar } from '@/components/product/FilterSidebar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Product } from '@/hooks/useProducts';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchInput, 300);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Build filters from URL
  const filters: ProductFilters = {
    q: debouncedSearch || undefined,
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    size: searchParams.get('size') || undefined,
    color: searchParams.get('color') || undefined,
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    min_rating: searchParams.get('min_rating') ? Number(searchParams.get('min_rating')) : undefined,
    sort: (searchParams.get('sort') as ProductFilters['sort']) || undefined,
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProducts(filters);

  const products: Product[] = data?.pages.flatMap((p) => p.products) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const updateFilters = useCallback(
    (newFilters: ProductFilters) => {
      const params = new URLSearchParams();
      if (newFilters.q) params.set('q', newFilters.q);
      if (newFilters.category) params.set('category', newFilters.category);
      if (newFilters.brand) params.set('brand', newFilters.brand);
      if (newFilters.size) params.set('size', newFilters.size);
      if (newFilters.color) params.set('color', newFilters.color);
      if (newFilters.min_price) params.set('min_price', String(newFilters.min_price));
      if (newFilters.max_price) params.set('max_price', String(newFilters.max_price));
      if (newFilters.min_rating) params.set('min_rating', String(newFilters.min_rating));
      if (newFilters.sort) params.set('sort', newFilters.sort);
      router.push(`/search?${params.toString()}`);
    },
    [router]
  );

  // Active filter count
  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'q' && v !== undefined
  ).length;

  return (
    <div className="container-fashion py-4 pb-20 sm:pb-6">
      {/* Breadcrumb */}
      <div className="text-xs text-ink-muted mb-4 flex items-center gap-1.5">
        <span>Home</span> <span className="text-warm-300">/</span>
        <span className="text-ink font-medium">{debouncedSearch ? `"${debouncedSearch}"` : 'All Products'}</span>
      </div>

      {/* Mobile search bar */}
      <div className="relative mb-4 sm:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <input
          type="search"
          placeholder="Search kurtis, sarees, heels..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input-warm w-full pl-9 pr-10"
        />
        {searchInput && (
          <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky bg-white rounded-2xl shadow-warm p-5" style={{ top: 'calc(var(--header-h, 72px) + 80px)' }}>
            <FilterSidebar filters={filters} onFiltersChange={updateFilters} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              {debouncedSearch ? (
                <h1 className="font-serif text-xl font-bold text-warm-900">
                  Results for &ldquo;<span className="text-brand-600">{debouncedSearch}</span>&rdquo;
                </h1>
              ) : (
                <h1 className="font-serif text-xl font-bold text-warm-900">All Products</h1>
              )}
              {!isLoading ? (
                <p className="text-sm text-ink-muted mt-0.5">{totalCount.toLocaleString()} items found</p>
              ) : (
                <Skeleton className="h-4 w-28 mt-1" />
              )}
            </div>

            {/* Filter + sort buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-warm-200 text-sm font-medium text-ink hover:border-brand-400 transition-colors shadow-warm-sm"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-brand-600 text-white text-[10px] font-bold h-4 min-w-[16px] rounded-full inline-flex items-center justify-center px-1">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.category && (
                <FilterChip label={`Category: ${filters.category}`} onRemove={() => updateFilters({ ...filters, category: undefined })} />
              )}
              {filters.size && (
                <FilterChip label={`Size: ${filters.size}`} onRemove={() => updateFilters({ ...filters, size: undefined })} />
              )}
              {filters.color && (
                <FilterChip label={`Color: ${filters.color}`} onRemove={() => updateFilters({ ...filters, color: undefined })} />
              )}
              {(filters.min_price || filters.max_price) && (
                <FilterChip label={`₹${filters.min_price || 0} – ₹${filters.max_price || '∞'}`} onRemove={() => updateFilters({ ...filters, min_price: undefined, max_price: undefined })} />
              )}
              {filters.min_rating && (
                <FilterChip label={`${filters.min_rating}★ & above`} onRemove={() => updateFilters({ ...filters, min_rating: undefined })} />
              )}
              {filters.sort && (
                <FilterChip label={`Sort: ${filters.sort.replace(/_/g, ' ')}`} onRemove={() => updateFilters({ ...filters, sort: undefined })} />
              )}
              <button onClick={() => updateFilters({})} className="text-xs text-brand-600 underline hover:text-brand-700 font-medium px-1">
                Clear all
              </button>
            </div>
          )}

          {/* Product grid */}
          <ProductGrid
            products={products}
            isLoading={isLoading}
            emptyMessage={debouncedSearch ? `No results for "${debouncedSearch}". Try different keywords.` : 'No products match your filters.'}
          />

          {/* Load more sentinel */}
          <div ref={loadMoreRef} className="h-12 flex items-center justify-center mt-4">
            {isFetchingNextPage && (
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Modal open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} size="full">
        <div className="h-[85vh] flex flex-col">
          <FilterSidebar filters={filters} onFiltersChange={(f) => { updateFilters(f); }} onClose={() => setFilterDrawerOpen(false)} isMobile />
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full border border-brand-100">
      {label}
      <button onClick={onRemove} className="hover:text-brand-900 ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
