'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, leftAddon, rightAddon, wrapperClassName, className, id, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftAddon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-gray-400">
              {leftAddon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900',
              'placeholder:text-gray-400',
              'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
              'transition-colors',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              className
            )}
            {...props}
          />

          {rightAddon && (
            <div className="absolute right-3 flex items-center text-gray-400">
              {rightAddon}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
