'use client';

import React from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { CartItem as CartItemType } from '@/store/cart.store';
import { useRemoveFromCart, useUpdateCartQty } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType;
}

export function CartItemRow({ item }: CartItemProps) {
  const removeItem = useRemoveFromCart();
  const updateQty = useUpdateCartQty();

  const handleQtyChange = (delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem.mutate({ item_id: item.id, variant_id: item.variant_id });
    } else {
      updateQty.mutate({ item_id: item.id, variant_id: item.variant_id, quantity: newQty });
    }
  };

  return (
    <div className={cn('flex gap-3 py-3', !item.in_stock && 'opacity-60')}>
      {/* Image */}
      <div className="relative h-20 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-2xl">👗</div>
        )}
        {!item.in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-medium text-red-500 text-center px-1">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{item.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {item.size} · {item.color}
        </p>
        <p className="text-xs text-gray-400">{item.store_name}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Price */}
          <div>
            <span className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
            {item.mrp > item.price && (
              <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(item.mrp * item.quantity)}</span>
            )}
          </div>

          {/* Qty controls */}
          {item.in_stock ? (
            <div className="flex items-center gap-0 rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => handleQtyChange(-1)}
                className="p-1.5 hover:bg-gray-50 transition-colors"
                aria-label="Decrease quantity"
              >
                {item.quantity === 1 ? (
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-gray-600" />
                )}
              </button>
              <span className="px-3 py-1 text-sm font-semibold text-gray-900 min-w-[2rem] text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQtyChange(1)}
                disabled={item.quantity >= item.max_qty}
                className="p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5 text-gray-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => removeItem.mutate({ item_id: item.id, variant_id: item.variant_id })}
              className="text-xs text-red-500 hover:underline"
            >
              Remove
            </button>
          )}
        </div>

        {item.quantity >= item.max_qty && item.in_stock && (
          <p className="text-xs text-orange-500 mt-1">Max {item.max_qty} per order</p>
        )}
      </div>
    </div>
  );
}
