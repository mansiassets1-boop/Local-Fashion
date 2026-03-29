'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Heart, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reel {
  id: string;
  thumbnail: string;
  productName: string;
  price: string;
  hearts: string;
  comments: string;
}

const REELS: Reel[] = [
  {
    id: 'r1',
    thumbnail:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80&auto=format&fit=crop',
    productName: 'Festive Kurti Set',
    price: '₹1,299',
    hearts: '4.2k',
    comments: '186',
  },
  {
    id: 'r2',
    thumbnail:
      'https://images.unsplash.com/photo-1529139514571-ac4baab12d29?w=400&q=80&auto=format&fit=crop',
    productName: 'Summer Maxi Dress',
    price: '₹899',
    hearts: '2.8k',
    comments: '94',
  },
  {
    id: 'r3',
    thumbnail:
      'https://images.unsplash.com/photo-1524504388868-5b69b3085e97?w=400&q=80&auto=format&fit=crop',
    productName: 'Bridal Lehenga Look',
    price: '₹5,499',
    hearts: '9.1k',
    comments: '412',
  },
  {
    id: 'r4',
    thumbnail:
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80&auto=format&fit=crop',
    productName: 'Printed Anarkali',
    price: '₹1,699',
    hearts: '3.4k',
    comments: '127',
  },
  {
    id: 'r5',
    thumbnail:
      'https://images.unsplash.com/photo-1594938298603-e47b7e8bae9f?w=400&q=80&auto=format&fit=crop',
    productName: 'Casual Kurta Palazzo',
    price: '₹749',
    hearts: '1.9k',
    comments: '63',
  },
];

function ReelModal({ reel, onClose }: { reel: Reel; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs mx-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 glass-dark rounded-full p-2 text-white hover:bg-white/20 transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="reel-card rounded-3xl overflow-hidden shadow-warm-xl">
          <Image
            src={reel.thumbnail}
            alt={reel.productName}
            fill
            className="object-cover"
            sizes="320px"
          />
          {/* Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col justify-between p-5">
            {/* Top: social actions */}
            <div className="flex flex-col items-end gap-4">
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <Heart className="h-5 w-5 fill-white" />
                </div>
                <span className="text-xs font-semibold">{reel.hearts}</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-white">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold">{reel.comments}</span>
              </button>
            </div>

            {/* Bottom: product info */}
            <div>
              <p className="text-white font-serif font-bold text-lg leading-tight">
                {reel.productName}
              </p>
              <p className="text-warm-200 font-semibold text-sm mt-0.5">{reel.price}</p>
              <button className="btn-brand mt-3 w-full text-sm py-2.5 rounded-xl">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReelCard({ reel, onClick }: { reel: Reel; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'reel-card flex-shrink-0 w-36 sm:w-44 cursor-pointer',
        'transition-all duration-300 hover:scale-[1.04] hover:shadow-warm-lg',
        'rounded-3xl overflow-hidden'
      )}
    >
      <Image
        src={reel.thumbnail}
        alt={reel.productName}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 144px, 176px"
      />

      {/* Dark overlay (::after via CSS class handles base overlay) */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 pointer-events-none">
        {/* Social counts top-right */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 text-white text-[11px] font-semibold">
            <Heart className="h-3 w-3 fill-white" />
            {reel.hearts}
          </div>
          <div className="flex items-center gap-1 text-white text-[11px] font-semibold">
            <MessageCircle className="h-3 w-3" />
            {reel.comments}
          </div>
        </div>

        {/* Play button center */}
        <div className="flex items-center justify-center absolute inset-0">
          <div className="glass w-12 h-12 rounded-full flex items-center justify-center shadow-warm-md transition-transform duration-200 group-hover:scale-110">
            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Product name bottom */}
        <div>
          <p className="text-white font-semibold text-xs leading-tight line-clamp-2">
            {reel.productName}
          </p>
          <p className="text-warm-200 text-[11px] font-semibold mt-0.5">{reel.price}</p>
        </div>
      </div>
    </div>
  );
}

export function VideoReels() {
  const [activeReel, setActiveReel] = useState<Reel | null>(null);

  return (
    <section className="py-12 bg-ink overflow-hidden">
      <div className="container-fashion">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-warm-300 text-xs font-semibold uppercase tracking-widest mb-1">
              Instagram-style
            </p>
            <h2 className="font-serif text-warm-50 text-3xl md:text-4xl font-bold">
              Style Inspo 🎬
            </h2>
            <p className="text-warm-400 text-sm mt-1">
              Watch, discover, and shop in one tap
            </p>
          </div>
        </div>

        {/* Reels horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory sm:-mx-6 sm:px-6">
          {REELS.map((reel) => (
            <div key={reel.id} className="snap-start">
              <ReelCard reel={reel} onClick={() => setActiveReel(reel)} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8">
          <p className="text-warm-400 text-sm">
            Tap any reel to shop the look
          </p>
        </div>
      </div>

      {/* Modal */}
      {activeReel && (
        <ReelModal reel={activeReel} onClose={() => setActiveReel(null)} />
      )}
    </section>
  );
}
