'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, User, MapPin, ChevronDown, LogOut, Package, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { CitySelector } from '@/components/auth/CitySelector';

export function Header() {
  const router = useRouter();
  const { city, user, isLoggedIn, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAuth = isLoggedIn();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-primary-600 tracking-tight">
                Local<span className="text-fashion-rose">Fashion</span>
              </span>
            </Link>

            {/* City selector */}
            <button
              onClick={() => setCitySelectorOpen(true)}
              className="hidden sm:flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 transition-colors ml-1 flex-shrink-0"
            >
              <MapPin className="h-3.5 w-3.5 text-primary-500" />
              <span className="font-medium max-w-[100px] truncate">
                {city?.name || 'Select City'}
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="flex-1 flex items-center relative"
            >
              <Search className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search kurtis, sarees, heels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Wishlist - desktop only */}
              <Link
                href="/wishlist"
                className="hidden sm:flex items-center justify-center h-9 w-9 rounded-xl hover:bg-gray-50 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5 text-gray-500" />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center h-9 w-9 rounded-xl hover:bg-gray-50 transition-colors"
                aria-label={`Cart (${itemCount} items)`}
              >
                <ShoppingBag className="h-5 w-5 text-gray-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-primary-600 text-white text-[10px] font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((o) => !o)}
                  className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-gray-50 transition-colors"
                  aria-label="Profile menu"
                >
                  {isAuth && user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user.name || 'Profile'}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-600" />
                  )}
                </button>

                {/* Profile dropdown */}
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      {isAuth ? (
                        <>
                          <div className="px-4 py-2 border-b border-gray-50">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user?.name || user?.phone}
                            </p>
                            {user?.email && (
                              <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            )}
                          </div>
                          <Link
                            href="/profile"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <User className="h-4 w-4" /> Profile
                          </Link>
                          <Link
                            href="/orders"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Package className="h-4 w-4" /> My Orders
                          </Link>
                          <button
                            onClick={() => { logout(); setProfileMenuOpen(false); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            <LogOut className="h-4 w-4" /> Logout
                          </button>
                        </>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 font-medium hover:bg-primary-50"
                        >
                          Login / Sign up
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile city selector */}
          <div className="flex sm:hidden items-center pb-2">
            <button
              onClick={() => setCitySelectorOpen(true)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600 transition-colors"
            >
              <MapPin className="h-3 w-3 text-primary-500" />
              <span className="font-medium">{city?.name || 'Select City'}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      <CitySelector open={citySelectorOpen} onClose={() => setCitySelectorOpen(false)} />
    </>
  );
}
