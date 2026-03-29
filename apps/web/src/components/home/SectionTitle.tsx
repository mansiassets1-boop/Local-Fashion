import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  seeAllHref?: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionTitle({
  title,
  seeAllHref,
  subtitle,
  align = 'left',
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-between mb-6',
        align === 'center' && 'flex-col items-center text-center gap-2',
        className
      )}
    >
      <div className={cn('flex flex-col gap-1', align === 'center' && 'items-center')}>
        {subtitle && (
          <p className="section-subheading text-xs text-brand-600 flex items-center gap-2">
            <span
              className={cn(
                'inline-block w-6 h-px bg-brand-500',
                align === 'center' && 'hidden'
              )}
            />
            {subtitle}
          </p>
        )}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-block w-1 h-6 rounded-full bg-gradient-to-b from-brand-500 to-brand-700 flex-shrink-0',
              align === 'center' && 'hidden'
            )}
          />
          <h2 className="section-heading text-2xl md:text-3xl lg:text-4xl">{title}</h2>
        </div>
      </div>

      {seeAllHref && align !== 'center' && (
        <Link
          href={seeAllHref}
          className="group flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors flex-shrink-0 pb-1"
        >
          See all
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}

      {seeAllHref && align === 'center' && (
        <Link
          href={seeAllHref}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors mt-1"
        >
          Explore All
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
