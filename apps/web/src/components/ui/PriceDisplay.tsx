import React from 'react';
import { cn } from '@/lib/utils';
import { formatPrice, getDiscountPct } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  mrp?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBadge?: boolean;
}

const priceSize = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-bold',
  lg: 'text-xl font-bold',
};

const mrpSize = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function PriceDisplay({ price, mrp, size = 'md', className, showBadge = true }: PriceDisplayProps) {
  const discount = mrp ? getDiscountPct(mrp, price) : 0;

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className={cn('text-gray-900', priceSize[size])}>{formatPrice(price)}</span>

      {mrp && mrp > price && (
        <span className={cn('text-gray-400 line-through', mrpSize[size])}>
          {formatPrice(mrp)}
        </span>
      )}

      {showBadge && discount > 0 && (
        <span className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
          {discount}% off
        </span>
      )}
    </div>
  );
}
