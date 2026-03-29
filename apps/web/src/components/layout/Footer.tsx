import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="hidden sm:block bg-white border-t border-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <span className="text-xl font-black text-primary-600">
              Local<span className="text-fashion-rose">Fashion</span>
            </span>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              Hyperlocal fashion from your neighbourhood stores, delivered in 2–3 hours.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Shop</h4>
            <ul className="space-y-2">
              {['Kurtis', 'Sarees', 'Bags', 'Heels', 'Jewellery'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/search?category=${item.toLowerCase()}`}
                    className="text-sm text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Account</h4>
            <ul className="space-y-2">
              {[
                { label: 'My Orders', href: '/orders' },
                { label: 'Wishlist', href: '/wishlist' },
                { label: 'Profile', href: '/profile' },
                { label: 'Cart', href: '/cart' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Company</h4>
            <ul className="space-y-2">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Sell on LocalFashion', href: '/sell' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Contact Us', href: '/contact' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} LocalFashion. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-gray-400">Made with ❤️ for local boutiques</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
