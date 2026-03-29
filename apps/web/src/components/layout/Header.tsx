'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ShoppingBag, User, MapPin, ChevronDown, LogOut, Package, Heart, Menu, X, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { CitySelector } from '@/components/auth/CitySelector';

const NAV_CATEGORIES = [
  { label: "Women's Ethnic", href: '/search?category=ethnic', sub: ['Kurtis', 'Sarees', 'Lehengas', 'Suits', 'Dupattas'] },
  { label: 'Footwear', href: '/search?category=footwear', sub: ['Heels', 'Flats', 'Sandals', 'Sneakers', 'Wedges'] },
  { label: 'Bags', href: '/search?category=bags', sub: ['Handbags', 'Clutches', 'Totes', 'Backpacks', 'Potlis'] },
  { label: 'Jewellery', href: '/search?category=jewellery', sub: ['Earrings', 'Necklaces', 'Bangles', 'Rings', 'Sets'] },
  { label: "Men's", href: '/search?category=mens', sub: ['Kurtas', 'Sherwanis', 'Casual', 'Formal', 'Accessories'] },
  { label: 'New Arrivals', href: '/search?sort=newest', sub: [], accent: true },
  { label: 'Sale', href: '/search?sort=discount', sub: [], accent: true },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { city, user, isLoggedIn, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const isAuth = isLoggedIn();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      {/* ── Main header ────────────────────────────────────────────── */}
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300',
          scrolled ? 'glass shadow-warm-md' : 'bg-white border-b border-warm-200'
        )}
        style={{ height: 'var(--header-h, 72px)' }}
      >
        <div className="container-fashion flex items-center gap-4 h-full">

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-warm-100 transition-colors flex-shrink-0"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-ink" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-5 h-5 text-brand-600" fill="currentColor" />
              <div className="leading-none">
                <div className="text-[9px] font-bold tracking-[0.25em] text-ink-muted uppercase">LOCAL</div>
                <div className="text-xl font-serif font-black text-ink leading-none tracking-tight">Fashion</div>
              </div>
            </div>
          </Link>

          {/* City selector — desktop */}
          <button
            onClick={() => setCitySelectorOpen(true)}
            className="hidden md:flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand-600 transition-colors flex-shrink-0 border border-warm-200 rounded-full px-3 py-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <span className="font-medium max-w-[90px] truncate">{city?.name || 'Select City'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            <input
              type="search"
              placeholder="Search kurtis, sarees, heels, bags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-warm-100 border border-warm-200 text-sm text-ink placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all duration-200"
            />
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link href="/wishlist" className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl hover:bg-warm-100 transition-colors relative" aria-label="Wishlist">
              <Heart className="w-5 h-5 text-ink-muted" />
            </Link>

            <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-warm-100 transition-colors" aria-label={`Cart (${itemCount} items)`}>
              <ShoppingBag className="w-5 h-5 text-ink" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-600 text-white text-[10px] font-bold px-1 animate-[scale-in_0.2s_ease]">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-warm-100 transition-colors"
                aria-label="Profile"
              >
                {isAuth ? (
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-brand-700 text-xs font-bold">{(user?.name || user?.phone || 'U')[0].toUpperCase()}</span>
                  </div>
                ) : (
                  <User className="w-5 h-5 text-ink" />
                )}
              </button>
              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-warm-lg border border-warm-100 py-2 z-20 animate-[scale-in_0.15s_ease]">
                    {isAuth ? (
                      <>
                        <div className="px-4 py-3 border-b border-warm-100">
                          <p className="text-sm font-semibold text-ink truncate">{user?.name || 'My Account'}</p>
                          <p className="text-xs text-ink-muted truncate">{user?.phone}</p>
                        </div>
                        <Link href="/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-warm-50 transition-colors">
                          <User className="w-4 h-4 text-ink-muted" /> My Profile
                        </Link>
                        <Link href="/orders" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-warm-50 transition-colors">
                          <Package className="w-4 h-4 text-ink-muted" /> My Orders
                        </Link>
                        <div className="my-1 border-t border-warm-100" />
                        <button onClick={() => { logout(); setProfileMenuOpen(false); }} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </>
                    ) : (
                      <div className="p-3">
                        <Link href="/login" onClick={() => setProfileMenuOpen(false)} className="btn-brand w-full text-sm py-2.5 rounded-xl flex items-center justify-center gap-2">
                          Login / Sign up
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Category nav bar ─────────────────────────────────────── */}
        <nav className="hidden lg:block border-t border-warm-100 bg-white/80" ref={navRef}>
          <div className="container-fashion flex items-center gap-0 h-10">
            {NAV_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="relative group"
                onMouseEnter={() => setActiveNav(cat.label)}
                onMouseLeave={() => setActiveNav(null)}
              >
                <Link
                  href={cat.href}
                  className={cn(
                    'inline-flex items-center px-4 h-10 text-sm font-medium transition-colors whitespace-nowrap',
                    cat.accent ? 'text-brand-600 font-semibold' : 'text-ink hover:text-brand-600',
                    activeNav === cat.label && 'text-brand-600'
                  )}
                >
                  {cat.label}
                  {cat.sub.length > 0 && <ChevronDown className="w-3 h-3 ml-0.5 mt-px opacity-60" />}
                </Link>
                {/* Dropdown */}
                {cat.sub.length > 0 && activeNav === cat.label && (
                  <div className="absolute top-full left-0 bg-white rounded-2xl shadow-warm-lg border border-warm-100 py-3 min-w-[180px] animate-[fade-down_0.15s_ease] z-50">
                    {cat.sub.map((sub) => (
                      <Link key={sub} href={`/search?q=${sub.toLowerCase()}`} className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:text-brand-600 hover:bg-warm-50 transition-colors">
                        <ChevronRight className="w-3 h-3 text-ink-subtle" /> {sub}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-ink/40 z-60 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[90vw] bg-white z-70 shadow-warm-xl animate-[slide-right_0.3s_ease] lg:hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-warm-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600" fill="currentColor" />
                <span className="font-serif font-bold text-lg text-ink">LocalFashion</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full hover:bg-warm-100 flex items-center justify-center">
                <X className="w-5 h-5 text-ink" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3">
              <button onClick={() => { setCitySelectorOpen(true); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-3 text-sm text-ink hover:bg-warm-50">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>{city?.name || 'Select City'}</span>
              </button>
              <div className="border-t border-warm-100 mt-2 pt-2">
                {NAV_CATEGORIES.map((cat) => (
                  <Link key={cat.label} href={cat.href} className={cn('flex items-center gap-2 px-4 py-3 text-sm hover:bg-warm-50', cat.accent ? 'text-brand-600 font-semibold' : 'text-ink')}>
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
            {!isAuth && (
              <div className="p-4 border-t border-warm-100">
                <Link href="/login" className="btn-brand w-full py-3 rounded-xl text-sm flex items-center justify-center">Login / Sign up</Link>
              </div>
            )}
          </div>
        </>
      )}

      <CitySelector open={citySelectorOpen} onClose={() => setCitySelectorOpen(false)} />
    </>
  );
}
