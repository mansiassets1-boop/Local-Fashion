import React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { StatusEvent, OrderStatus } from '@/hooks/useOrders';

const ALL_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'pending', label: 'Order Placed', icon: '📋' },
  { status: 'confirmed', label: 'Confirmed', icon: '✅' },
  { status: 'preparing', label: 'Being Prepared', icon: '🧵' },
  { status: 'ready_for_pickup', label: 'Ready for Pickup', icon: '📦' },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
  { status: 'delivered', label: 'Delivered', icon: '🎉' },
];

interface OrderTimelineProps {
  statusHistory: StatusEvent[];
  currentStatus: OrderStatus;
}

export function OrderTimeline({ statusHistory, currentStatus }: OrderTimelineProps) {
  const isCancelled = currentStatus === 'cancelled';
  const isReturned = currentStatus === 'returned' || currentStatus === 'return_requested';

  const getStepStatus = (stepStatus: OrderStatus): 'completed' | 'current' | 'upcoming' => {
    const stepIndex = ALL_STEPS.findIndex((s) => s.status === stepStatus);
    const currentIndex = ALL_STEPS.findIndex((s) => s.status === currentStatus);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getTimestamp = (status: OrderStatus) => {
    const event = statusHistory.find((e) => e.status === status);
    return event?.timestamp;
  };

  if (isCancelled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-semibold text-red-700">Order Cancelled</p>
            {statusHistory.find((e) => e.status === 'cancelled') && (
              <p className="text-xs text-red-500 mt-0.5">
                {formatDate(statusHistory.find((e) => e.status === 'cancelled')!.timestamp, 'dd MMM, hh:mm a')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isReturned) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl">
          <span className="text-2xl">↩️</span>
          <div>
            <p className="font-semibold text-orange-700">
              {currentStatus === 'return_requested' ? 'Return Requested' : 'Order Returned'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {ALL_STEPS.map((step, index) => {
        const stepStatus = getStepStatus(step.status);
        const timestamp = getTimestamp(step.status);
        const isLast = index === ALL_STEPS.length - 1;

        return (
          <div key={step.status} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                  stepStatus === 'completed'
                    ? 'bg-primary-600 text-white'
                    : stepStatus === 'current'
                    ? 'bg-primary-100 border-2 border-primary-600'
                    : 'bg-gray-100 border-2 border-gray-200'
                )}
              >
                {stepStatus === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : stepStatus === 'current' ? (
                  <Circle className="h-4 w-4 text-primary-600 fill-primary-600 animate-pulse" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[2rem]',
                    stepStatus === 'completed' ? 'bg-primary-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-4', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  stepStatus === 'upcoming' ? 'text-gray-400' : 'text-gray-900'
                )}
              >
                {step.icon} {step.label}
              </p>
              {timestamp && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(timestamp, 'dd MMM, hh:mm a')}
                </p>
              )}
              {stepStatus === 'current' && !timestamp && (
                <p className="text-xs text-primary-500 mt-0.5 animate-pulse">In progress...</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
