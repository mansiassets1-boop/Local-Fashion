'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  onChange,
  size = 'md',
  showValue = false,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const displayRating = hovered ?? rating;

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, i) => {
          const starValue = i + 1;
          const filled = displayRating >= starValue;
          const partial = !filled && displayRating > i && displayRating < starValue;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHovered(starValue)}
              onMouseLeave={() => interactive && setHovered(null)}
              className={cn(
                'relative',
                interactive && 'cursor-pointer hover:scale-110 transition-transform',
                !interactive && 'cursor-default'
              )}
            >
              {partial ? (
                <span className="relative">
                  <Star className={cn(sizeMap[size], 'text-gray-200 fill-gray-200')} />
                  <span
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${(displayRating - i) * 100}%` }}
                  >
                    <Star className={cn(sizeMap[size], 'text-amber-400 fill-amber-400')} />
                  </span>
                </span>
              ) : (
                <Star
                  className={cn(
                    sizeMap[size],
                    filled
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-medium text-gray-600">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
