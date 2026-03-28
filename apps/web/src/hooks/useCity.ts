'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore, City } from '@/store/auth.store';

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data } = await api.get<{ cities: City[] }>('/cities');
      return data.cities;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

async function detectCityFromIP(): Promise<City | null> {
  try {
    const { data } = await api.get<{ city: City }>('/cities/detect');
    return data.city;
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<City | null> {
  try {
    const { data } = await api.get<{ city: City }>('/cities/reverse-geocode', {
      params: { lat, lng },
    });
    return data.city;
  } catch {
    return null;
  }
}

export function useDetectCity() {
  const { city, setCity } = useAuthStore();

  const detectQuery = useQuery({
    queryKey: ['detect-city'],
    queryFn: async (): Promise<City | null> => {
      // Try GPS first
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 60000,
          });
        }).catch(() => null);

        if (position) {
          const detected = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );
          if (detected) return detected;
        }
      }
      // Fallback: IP-based detection
      return detectCityFromIP();
    },
    enabled: !city, // Only detect if no city set
    staleTime: Infinity,
  });

  useEffect(() => {
    if (detectQuery.data && !city) {
      setCity(detectQuery.data);
    }
  }, [detectQuery.data, city, setCity]);

  return {
    city,
    setCity,
    isDetecting: detectQuery.isLoading,
    detectedCity: detectQuery.data,
  };
}
