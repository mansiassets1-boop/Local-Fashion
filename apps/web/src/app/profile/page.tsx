'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Package, Heart, MapPin, Bell, Shield, ChevronRight,
  LogOut, Camera, Edit2, Check, Phone, Mail
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const MENU_ITEMS = [
  {
    group: 'Shopping',
    items: [
      { icon: Package, label: 'My Orders', href: '/orders', badge: null },
      { icon: Heart, label: 'My Wishlist', href: '/wishlist', badge: null },
    ],
  },
  {
    group: 'Account',
    items: [
      { icon: MapPin, label: 'Saved Addresses', href: '/profile/addresses', badge: null },
      { icon: Bell, label: 'Notifications', href: '/profile/notifications', badge: null },
      { icon: Shield, label: 'Privacy & Security', href: '/profile/security', badge: null },
    ],
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuthStore();
  const { handleLogout } = useAuth();
  const { data: orders } = useOrders();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  if (!isLoggedIn()) {
    return (
      <div className="container-fashion py-20 text-center max-w-sm mx-auto">
        <div className="w-24 h-24 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-6">
          <User className="w-12 h-12 text-warm-400" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-warm-900 mb-2">Your Profile</h2>
        <p className="text-ink-muted text-sm mb-8">Login to access your orders, wishlist and more</p>
        <button className="btn-brand w-full py-3.5 rounded-xl" onClick={() => router.push('/login')}>
          Login / Sign up
        </button>
      </div>
    );
  }

  const activeOrders = orders?.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status)
  ).length || 0;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.phone.slice(-2) || '?';

  return (
    <div className="container-fashion py-5 pb-24 md:pb-8 max-w-lg mx-auto">
      {/* Profile card */}
      <div className="bg-white rounded-3xl shadow-warm-sm p-6 mb-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || 'Profile'}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white font-bold text-xl">
                {initials}
              </div>
            )}
            <button
              onClick={() => toast.success('Profile photo upload coming soon!')}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-warm-sm border border-warm-100 flex items-center justify-center"
            >
              <Camera className="w-3 h-3 text-ink-muted" />
            </button>
          </div>

          {/* Name / phone */}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  className="input-warm text-sm flex-1 py-1.5 px-2.5 rounded-lg"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  placeholder="Your name"
                />
                <button
                  onClick={() => {
                    toast.success('Name updated!');
                    setEditingName(false);
                  }}
                  className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-warm-900 text-lg truncate">
                  {user?.name || 'Add your name'}
                </h2>
                <button onClick={() => setEditingName(true)} className="text-ink-muted hover:text-ink flex-shrink-0">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5 text-ink-muted">
              <Phone className="w-3 h-3" />
              <span className="text-xs">{user?.phone}</span>
            </div>
            {user?.email && (
              <div className="flex items-center gap-1.5 mt-0.5 text-ink-muted">
                <Mail className="w-3 h-3" />
                <span className="text-xs truncate">{user.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-warm-100">
          {[
            { label: 'Total Orders', value: orders?.length || 0, href: '/orders' },
            { label: 'Active', value: activeOrders, href: '/orders' },
            { label: 'Wishlist', value: '—', href: '/wishlist' },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} className="text-center p-2 rounded-xl hover:bg-warm-50 transition-colors">
              <p className="font-serif text-xl font-bold text-warm-900">{stat.value}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">{stat.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Menu groups */}
      {MENU_ITEMS.map((group) => (
        <div key={group.group} className="bg-white rounded-2xl shadow-warm-sm overflow-hidden mb-3">
          <p className="text-[11px] font-bold tracking-[0.15em] text-ink-muted uppercase px-5 pt-4 pb-2">
            {group.group}
          </p>
          <div className="divide-y divide-warm-50">
            {group.items.map(({ icon: Icon, label, href, badge }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-warm-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-warm-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
                <span className="flex-1 text-sm font-medium text-ink">{label}</span>
                {badge && (
                  <span className="text-xs font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full">{badge}</span>
                )}
                <ChevronRight className="w-4 h-4 text-warm-300" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-white shadow-warm-sm text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors border border-red-100 mt-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>

      <p className="text-center text-[11px] text-warm-300 mt-6">LocalFashion v2.0 · Made with ❤️ in India</p>
    </div>
  );
}
