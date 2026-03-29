import React from 'react';
import { formatPrice } from '@/lib/utils';
import { Info } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  grandTotal: number;
  savings?: number;
}

export function CartSummary({ subtotal, deliveryFee, platformFee, grandTotal, savings }: CartSummaryProps) {
  return (
    <div className="rounded-xl bg-white shadow-card p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm">Price Details</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-1">
            Delivery Fee
            {deliveryFee === 0 && (
              <span className="text-green-600 text-xs font-medium">(Free!)</span>
            )}
          </span>
          <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
            {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
          </span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span className="flex items-center gap-1">
            Platform Fee
            <span title="A small fee to keep the platform running" className="cursor-help">
              <Info className="h-3 w-3 text-gray-400" />
            </span>
          </span>
          <span>{formatPrice(platformFee)}</span>
        </div>

        {savings && savings > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Total Savings</span>
            <span>-{formatPrice(savings)}</span>
          </div>
        )}

        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>{formatPrice(grandTotal)}</span>
        </div>
      </div>

      {deliveryFee > 0 && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          Add items worth {formatPrice(499 - subtotal > 0 ? 499 - subtotal : 0)} more for FREE delivery
        </p>
      )}
    </div>
  );
}
