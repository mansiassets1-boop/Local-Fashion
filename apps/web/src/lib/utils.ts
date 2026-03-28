import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Merge Tailwind class names safely
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a number as Indian Rupees
 * e.g. 1999 → "₹1,999"
 */
export function formatPrice(amount: number, showSymbol = true): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Format a date string into a human-readable format
 */
export function formatDate(dateString: string, fmt = 'dd MMM yyyy'): string {
  try {
    return format(parseISO(dateString), fmt);
  } catch {
    return dateString;
  }
}

/**
 * Format a date string as relative time (e.g. "2 hours ago")
 */
export function formatRelativeDate(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

/**
 * Truncate a string to maxLen characters with ellipsis
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}

/**
 * Calculate discount percentage
 * Returns an integer like 25 (for 25%)
 */
export function getDiscountPct(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Check if running in browser
 */
export const isBrowser = typeof window !== 'undefined';
