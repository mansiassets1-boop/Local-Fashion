import React from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/hooks/useOrders';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparing', className: 'bg-purple-100 text-purple-700' },
  ready_for_pickup: { label: 'Ready for Pickup', className: 'bg-indigo-100 text-indigo-700' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-orange-100 text-orange-700' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
  return_requested: { label: 'Return Requested', className: 'bg-orange-100 text-orange-600' },
  returned: { label: 'Returned', className: 'bg-gray-100 text-gray-600' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function OrderStatusBadge({ status, size = 'md', className }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
