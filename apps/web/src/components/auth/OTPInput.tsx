'use client';

import React, { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: OTPInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusAt = (index: number) => {
    inputs.current[index]?.focus();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = val;
    onChange(newDigits.join(''));
    if (val && index < length - 1) {
      focusAt(index + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        focusAt(index - 1);
      } else if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted.padEnd(length, '').slice(0, length).replace(/\s/g, ''));
      const nextIndex = Math.min(pasted.length, length - 1);
      focusAt(nextIndex);
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" role="group" aria-label="OTP input">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`OTP digit ${index + 1}`}
          className={cn(
            'h-12 w-11 sm:w-12 rounded-xl border-2 text-center text-lg font-bold text-gray-900',
            'focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'transition-all',
            digit
              ? 'border-primary-600 bg-primary-50'
              : 'border-gray-200 bg-white',
            disabled && 'cursor-not-allowed bg-gray-50 text-gray-400'
          )}
        />
      ))}
    </div>
  );
}
