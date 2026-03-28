/**
 * Format a number as Indian Rupees currency string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a distance in kilometres to a human-readable string.
 * < 1 km → metres; >= 1 km → km with 1 decimal.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format a duration in minutes to a human-readable string.
 * < 60 min → "X min"; >= 60 min → "X hr Y min" (omitting 0 minutes).
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

/**
 * Format a date string to a localised display date.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date string to a time string (HH:MM AM/PM).
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date string to date + time.
 */
export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}

/**
 * Returns "Good morning/afternoon/evening" based on current hour.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Truncate a string to maxLength characters, appending "…".
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/**
 * Validate an Indian mobile number (10 digits, starts with 6-9).
 */
export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Validate a GST number format (15-character alphanumeric).
 */
export function isValidGST(gst: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
}

/**
 * Validate IFSC code format (4 alpha + 0 + 6 alphanumeric).
 */
export function isValidIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
