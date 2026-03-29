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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Search bar (mobile) */}
      <div className="relative mb-4 sm:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search fashion..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-20 bg-white rounded-xl shadow-card p-4">
            <FilterSidebar
              filters={filters}
              onFiltersChange={updateFilters}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              {debouncedSearch && (
                <h1 className="text-base font-semibold text-gray-900">
                  Results for &ldquo;{debouncedSearch}&rdquo;
                </h1>
              )}
              {!isLoading && (
                <p className="text-sm text-gray-400">
                  {totalCount.toLocaleString()} product{totalCount !== 1 ? 's' : ''} found
                </p>
              )}
              {isLoading && <Skeleton className="h-4 w-32" />}
            </div>

            {/* Filter button - mobile/tablet */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SlidersHorizontal className="h-4 w-4" />}
              onClick={() => setFilterDrawerOpen(true)}
              className="lg:hidden"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-primary-600 text-white text-[10px] font-bold h-4 w-4 rounded-full inline-flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.category && (
                <FilterChip
                  label={`Category: ${filters.category}`}
                  onRemove={() => updateFilters({ ...filters, category: undefined })}
                />
              )}
              {filters.size && (
                <FilterChip
                  label={`Size: ${filters.size}`}
                  onRemove={() => updateFilters({ ...filters, size: undefined })}
                />
              )}
              {filters.color && (
                <FilterChip
                  label={`Color: ${filters.color}`}
                  onRemove={() => updateFilters({ ...filters, color: undefined })}
                />
              )}
              {(filters.min_price || filters.max_price) && (
                <FilterChip
                  label={`₹${filters.min_price || 0} – ₹${filters.max_price || '∞'}`}
                  onRemove={() => updateFilters({ ...filters, min_price: undefined, max_price: undefined })}
                />
              )}
              {filters.min_rating && (
                <FilterChip
                  label={`${filters.min_rating}+ stars`}
                  onRemove={() => updateFilters({ ...filters, min_rating: undefined })}
                />
              )}
              {filters.sort && (
                <FilterChip
                  label={`Sort: ${filters.sort.replace('_', ' ')}`}
                  onRemove={() => updateFilters({ ...filters, sort: undefined })}
                />
              )}
            </div>
          )}

          {/* Product grid */}
          <ProductGrid
            products={products}
            isLoading={isLoading}
            emptyMessage={
              debouncedSearch
                ? `No products found for "${debouncedSearch}". Try a different search.`
                : 'No products match your filters.'
            }
          />

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="h-8 flex items-center justify-center mt-4">
            {isFetchingNextPage && (
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Modal
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        size="full"
      >
        <div className="h-[80vh] flex flex-col">
          <FilterSidebar
            filters={filters}
            onFiltersChange={(f) => { updateFilters(f); }}
            onClose={() => setFilterDrawerOpen(false)}
            isMobile
          />
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-primary-900 ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
