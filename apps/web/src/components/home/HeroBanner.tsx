'use client';

import React, { useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_url?: string;
  bg_color?: string;
}

interface HeroBannerProps {
  banners: Banner[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl" ref={emblaRef}>
      <div className="flex">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative flex-[0_0_100%] min-h-0"
            style={{ backgroundColor: banner.bg_color || '#EEF2FF' }}
          >
            {banner.cta_url ? (
              <Link href={banner.cta_url}>
                <BannerContent banner={banner} />
              </Link>
            ) : (
              <BannerContent banner={banner} />
            )}
          </div>
        ))}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === selectedIndex ? 'w-5 bg-primary-600' : 'w-1.5 bg-white/70'
              )}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BannerContent({ banner }: { banner: Banner }) {
  return (
    <div className="relative aspect-[2.4/1] sm:aspect-[3/1]">
      {banner.image_url ? (
        <Image
          src={banner.image_url}
          alt={banner.title || 'Banner'}
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 1280px"
          priority
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-primary-100 to-primary-200">
          <div className="text-center px-6">
            <p className="text-2xl font-bold text-primary-800">{banner.title}</p>
            {banner.subtitle && (
              <p className="text-sm text-primary-600 mt-1">{banner.subtitle}</p>
            )}
            {banner.cta_label && (
              <span className="inline-block mt-3 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl">
                {banner.cta_label}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overlay text */}
      {banner.image_url && (banner.title || banner.cta_label) && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center">
          <div className="px-6 py-4">
            {banner.title && (
              <p className="text-xl sm:text-2xl font-bold text-white drop-shadow">{banner.title}</p>
            )}
            {banner.subtitle && (
              <p className="text-sm text-white/80 mt-1">{banner.subtitle}</p>
            )}
            {banner.cta_label && (
              <span className="inline-block mt-3 px-4 py-2 bg-white text-primary-700 text-sm font-semibold rounded-xl shadow">
                {banner.cta_label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
