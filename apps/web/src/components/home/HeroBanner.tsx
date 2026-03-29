'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  label?: string;
  cta_label?: string;
  cta_url?: string;
  bg_color?: string;
}

const STATIC_SLIDES: Banner[] = [
  { id: '1', image_url: 'https://images.unsplash.com/photo-1583391099977-103b05f5e33c?w=1600&q=85&fit=crop', label: 'NEW FESTIVE COLLECTION', title: 'Celebrate in Style', subtitle: 'Handpicked kurtis from local boutiques — delivered in hours', cta_label: 'Shop Kurtis', cta_url: '/search?category=kurtis' },
  { id: '2', image_url: 'https://images.unsplash.com/photo-1546961342-ea5f62d4d073?w=1600&q=85&fit=crop', label: 'BRIDAL SEASON', title: 'Your Dream Lehenga Awaits', subtitle: 'Exquisite bridal wear from the city\'s finest stores', cta_label: 'Shop Lehengas', cta_url: '/search?category=lehengas' },
  { id: '3', image_url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1600&q=85&fit=crop', label: 'STEP UP YOUR STYLE', title: 'Walk with Confidence', subtitle: 'Heels, flats & sandals from top local boutiques', cta_label: 'Shop Footwear', cta_url: '/search?category=heels' },
  { id: '4', image_url: 'https://images.unsplash.com/photo-1487222477067-3acb51a8d7e3?w=1600&q=85&fit=crop', label: 'SAREE SEASON', title: 'Drape Yourself in Elegance', subtitle: 'Silk, cotton, georgette — every kind of saree near you', cta_label: 'Shop Sarees', cta_url: '/search?category=sarees' },
  { id: '5', image_url: 'https://images.unsplash.com/photo-1548036161-97f5a8ac2c43?w=1600&q=85&fit=crop', label: 'LUXURY BAGS', title: 'Carry it Beautifully', subtitle: 'Curated bags & clutches from local accessory boutiques', cta_label: 'Shop Bags', cta_url: '/search?category=bags' },
];

interface HeroBannerProps {
  banners?: Banner[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const slides = (banners && banners.length > 0) ? banners : STATIC_SLIDES;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setProgress(0);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-play with progress
  useEffect(() => {
    if (!emblaApi) return;
    let start: number;
    let rafId: number;
    const DURATION = 5000;

    const tick = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      setProgress(Math.min((elapsed / DURATION) * 100, 100));
      if (elapsed >= DURATION) { emblaApi.scrollNext(); start = timestamp; }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [emblaApi, selectedIndex]);

  if (!slides.length) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-warm-xl group">
      {/* Carousel */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="relative flex-[0_0_100%] aspect-banner min-h-[340px]">
              {/* Background image */}
              {slide.image_url && (
                <Image
                  src={slide.image_url}
                  alt={slide.title || 'Collection'}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={idx === 0}
                />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 overlay-left" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container-fashion">
                  <div className="max-w-lg animate-[fade-up_0.6s_ease]">
                    {slide.label && (
                      <p className="text-[11px] font-bold tracking-[0.3em] text-warm-200 mb-3 uppercase">{slide.label}</p>
                    )}
                    <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-light italic text-white leading-[1.1] mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-warm-200 text-sm sm:text-base mb-6 max-w-md leading-relaxed">{slide.subtitle}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {slide.cta_url && slide.cta_label && (
                        <Link href={slide.cta_url} className="btn-brand text-sm px-6 py-3 rounded-full">
                          {slide.cta_label}
                        </Link>
                      )}
                      <div className="flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Zap className="w-3 h-3" fill="currentColor" /> Delivered in 2-3 hrs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prev/Next arrows */}
      <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/20" aria-label="Previous">
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button onClick={() => emblaApi?.scrollNext()} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/20" aria-label="Next">
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Progress dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => emblaApi?.scrollTo(i)} className={cn('transition-all duration-300 rounded-full', i === selectedIndex ? 'w-8 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40')} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div className="h-full bg-brand-400 transition-none" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
