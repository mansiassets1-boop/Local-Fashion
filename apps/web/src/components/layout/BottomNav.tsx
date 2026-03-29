'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart.store';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Discover', icon: Search },
  { href: '/cart', label: 'Bag', icon: ShoppingBag, badge: true },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden safe-area-pb">
      {/* Glass background */}
      <div className="glass-warm border-t border-warm-200/60 shadow-warm-lg">
        <div className="grid grid-cols-5 h-[60px]">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            const count = badge ? itemCount : 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200',
                  isActive ? 'text-brand-600' : 'text-ink-muted'
                )}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-600" />
                )}
                <div className="relative">
                  <Icon
                    className={cn('w-5 h-5 transition-all duration-200', isActive && 'scale-110')}
                    strokeWidth={isActive ? 2.5 : 2}
                    fill={isActive && (href === '/cart' || href === '/wishlist') ? 'currentColor' : 'none'}
                  />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-brand-600 text-white text-[9px] font-bold px-0.5">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <span className={cn('text-[9px] font-medium leading-none', isActive && 'font-bold text-brand-600')}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
