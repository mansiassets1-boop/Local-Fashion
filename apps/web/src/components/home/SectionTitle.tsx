import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface SectionTitleProps {
  title: string;
  seeAllHref?: string;
  subtitle?: string;
}

export function SectionTitle({ title, seeAllHref, subtitle }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="flex items-center gap-0.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          See all
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
