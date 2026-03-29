'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Variant } from '@/hooks/useProducts';

interface VariantSelectorProps {
  variants: Variant[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
}

export function VariantSelector({
  variants,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
}: VariantSelectorProps) {
  const sizes = Array.from(new Set(variants.map((v) => v.size)));
  const colors = Array.from(
    new Map(variants.map((v) => [v.color, { color: v.color, hex: v.color_hex }])).values()
  );

  const isSizeAvailable = (size: string) => {
    if (!selectedColor) return variants.some((v) => v.size === size && v.stock > 0);
    return variants.some((v) => v.size === size && v.color === selectedColor && v.stock > 0);
  };

  const isColorAvailable = (color: string) => {
    if (!selectedSize) return variants.some((v) => v.color === color && v.stock > 0);
    return variants.some((v) => v.color === color && v.size === selectedSize && v.stock > 0);
  };

  return (
    <div className="space-y-4">
      {/* Size selector */}
      {sizes.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Size{selectedSize && <span className="font-normal text-gray-500 ml-1">— {selectedSize}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              const selected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => available && onSizeChange(size)}
                  disabled={!available}
                  className={cn(
                    'min-w-[2.5rem] h-10 px-3 rounded-lg border text-sm font-medium transition-all',
                    selected
                      ? 'border-primary-600 bg-primary-600 text-white'
                      : available
                      ? 'border-gray-200 text-gray-800 hover:border-primary-400 hover:text-primary-600'
                      : 'border-gray-100 text-gray-300 cursor-not-allowed relative overflow-hidden'
                  )}
                >
                  {!available && (
                    <span
                      className="absolute inset-0 flex items-center justify-center"
                      aria-hidden
                    >
                      <span className="absolute w-full border-t border-gray-200 rotate-45 top-1/2" />
                    </span>
                  )}
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color selector */}
      {colors.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Color
            {selectedColor && (
              <span className="font-normal text-gray-500 ml-1">— {selectedColor}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map(({ color, hex }) => {
              const available = isColorAvailable(color);
              const selected = selectedColor === color;
              return (
                <button
                  key={color}
                  title={color}
                  onClick={() => available && onColorChange(color)}
                  disabled={!available}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-all relative',
                    selected
                      ? 'border-primary-600 scale-110 shadow-md'
                      : available
                      ? 'border-transparent hover:border-gray-300 hover:scale-105'
                      : 'border-transparent opacity-30 cursor-not-allowed'
                  )}
                  style={{ backgroundColor: hex || color }}
                >
                  {!available && (
                    <span className="absolute inset-0 rounded-full overflow-hidden">
                      <span className="absolute w-full border-t border-gray-400 rotate-45 top-1/2" />
                    </span>
                  )}
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-white shadow-sm" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
