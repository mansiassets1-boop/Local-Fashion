'use client';

import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface LiveMapProps {
  buyerLat: number;
  buyerLng: number;
  partnerLat?: number;
  partnerLng?: number;
  storeLat?: number;
  storeLng?: number;
}

export function LiveMap({ buyerLat, buyerLng, partnerLat, partnerLng, storeLat, storeLng }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const partnerMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // Show placeholder if no API key
      return;
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      const center = partnerLat && partnerLng
        ? { lat: partnerLat, lng: partnerLng }
        : { lat: buyerLat, lng: buyerLng };

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });

      mapInstanceRef.current = map;

      // Buyer marker
      new google.maps.Marker({
        position: { lat: buyerLat, lng: buyerLng },
        map,
        icon: {
          url: 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="#4F46E5" stroke="white" stroke-width="2"/>
              <text x="16" y="21" text-anchor="middle" font-size="14">🏠</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        title: 'Your location',
      });

      // Store marker
      if (storeLat && storeLng) {
        new google.maps.Marker({
          position: { lat: storeLat, lng: storeLng },
          map,
          icon: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="#7C3AED" stroke="white" stroke-width="2"/>
                <text x="16" y="21" text-anchor="middle" font-size="14">🏪</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
          },
          title: 'Store',
        });
      }

      // Partner marker
      if (partnerLat && partnerLng) {
        const marker = new google.maps.Marker({
          position: { lat: partnerLat, lng: partnerLng },
          map,
          icon: {
            url: 'data:image/svg+xml,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="#F97316" stroke="white" stroke-width="2"/>
                <text x="20" y="26" text-anchor="middle" font-size="18">🛵</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          },
          title: 'Delivery partner',
        });
        partnerMarkerRef.current = marker;

        // Fit bounds to show all markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: buyerLat, lng: buyerLng });
        bounds.extend({ lat: partnerLat, lng: partnerLng });
        map.fitBounds(bounds, 60);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update partner marker position
  useEffect(() => {
    if (partnerMarkerRef.current && partnerLat && partnerLng) {
      partnerMarkerRef.current.setPosition({ lat: partnerLat, lng: partnerLng });
    }
  }, [partnerLat, partnerLng]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="h-56 w-full rounded-xl bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-2">🗺️</div>
          <p className="text-sm">Map unavailable</p>
          <p className="text-xs">Configure Google Maps API key</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="h-56 w-full rounded-xl overflow-hidden bg-gray-100"
      aria-label="Live delivery map"
    />
  );
}
