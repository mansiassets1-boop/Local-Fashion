'use client';

import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCities, useDetectCity } from '@/hooks/useCity';
import { useAuthStore, City } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface CitySelectorProps {
  open: boolean;
  onClose: () => void;
}

export function CitySelector({ open, onClose }: CitySelectorProps) {
  const [search, setSearch] = useState('');
  const { data: cities, isLoading } = useCities();
  const { setCity, city: currentCity } = useAuthStore();
  const { isDetecting, detectedCity } = useDetectCity();

  const filtered = cities?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelect = (city: City) => {
    setCity(city);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Select Your City" size="md">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search for your city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* Detect location */}
        {detectedCity && detectedCity.id !== currentCity?.id && (
          <button
            onClick={() => handleSelect(detectedCity)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-100 hover:bg-primary-100 transition-colors"
          >
            {isDetecting ? (
              <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5 text-primary-600" />
            )}
            <div className="text-left">
              <p className="text-sm font-medium text-primary-700">Use detected location</p>
              <p className="text-xs text-primary-500">{detectedCity.name}, {detectedCity.state}</p>
            </div>
          </button>
        )}

        {/* City list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No cities found</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {!search && (
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 mb-2">
                Popular Cities
              </p>
            )}
            {filtered.map((city) => (
              <button
                key={city.id}
                onClick={() => handleSelect(city)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-colors',
                  currentCity?.id === city.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <div className="flex items-center gap-2">
                  <MapPin className={cn('h-4 w-4', currentCity?.id === city.id ? 'text-primary-500' : 'text-gray-400')} />
                  <div>
                    <p className="text-sm font-medium">{city.name}</p>
                    <p className="text-xs text-gray-400">{city.state}</p>
                  </div>
                </div>
                {currentCity?.id === city.id && (
                  <span className="text-xs text-primary-600 font-medium bg-primary-100 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
