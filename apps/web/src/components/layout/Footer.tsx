import React from 'react';
import Link from 'next/link';
import { Zap, Instagram, Youtube, Facebook } from 'lucide-react';

const SHOP_LINKS = ['Kurtis', 'Sarees', 'Lehengas', 'Heels', 'Bags', 'Jewellery', 'New Arrivals', 'Sale'];
const ACCOUNT_LINKS = [{ label: 'My Orders', href: '/orders' }, { label: 'Wishlist', href: '/wishlist' }, { label: 'My Profile', href: '/profile' }, { label: 'Track Order', href: '/orders' }];
const COMPANY_LINKS = [{ label: 'About Us', href: '/about' }, { label: 'Sell on LocalFashion', href: '/sell' }, { label: 'Careers', href: '/careers' }, { label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }];

export function Footer() {
  return (
    <footer className="hidden sm:block bg-warm-950 text-warm-400 mt-16">
      {/* Top CTA band */}
      <div className="border-b border-warm-800">
        <div className="container-fashion py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-1">Stay in style. Get early access.</h3>
            <p className="text-sm text-warm-400">New arrivals, exclusive offers & style inspiration — straight to your inbox.</p>
          </div>
          <form className="flex gap-2 w-full max-w-sm" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-2.5 rounded-xl bg-warm-800 border border-warm-700 text-white text-sm placeholder:text-warm-500 focus:outline-none focus:border-brand-500"
            />
            <button type="submit" className="btn-brand px-5 py-2.5 text-sm rounded-xl flex-shrink-0">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="container-fashion py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand col */}
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-brand-500" fill="currentColor" />
            <div>
              <div className="text-[8px] font-bold tracking-[0.3em] text-warm-500 uppercase leading-none">LOCAL</div>
              <div className="font-serif font-black text-white text-lg leading-none">Fashion</div>
            </div>
          </Link>
          <p className="text-xs text-warm-500 leading-relaxed mb-5">
            Hyperlocal fashion delivered in 2-3 hours from boutiques in your city.
          </p>
          {/* Social */}
          <div className="flex items-center gap-3">
            {[
              { icon: Instagram, href: '#', label: 'Instagram' },
              { icon: Youtube, href: '#', label: 'YouTube' },
              { icon: Facebook, href: '#', label: 'Facebook' },
            ].map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label} className="w-8 h-8 rounded-lg bg-warm-800 hover:bg-brand-600 flex items-center justify-center transition-colors">
                <Icon className="w-4 h-4 text-warm-300" />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-xs font-bold tracking-[0.15em] text-white uppercase mb-4">Shop</h4>
          <ul className="space-y-2.5">
            {SHOP_LINKS.map((item) => (
              <li key={item}>
                <Link href={`/search?category=${item.toLowerCase().replace(' ', '-')}`} className="text-xs text-warm-500 hover:text-brand-400 transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="text-xs font-bold tracking-[0.15em] text-white uppercase mb-4">Account</h4>
          <ul className="space-y-2.5">
            {ACCOUNT_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-xs text-warm-500 hover:text-brand-400 transition-colors">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-xs font-bold tracking-[0.15em] text-white uppercase mb-4">Company</h4>
          <ul className="space-y-2.5">
            {COMPANY_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-xs text-warm-500 hover:text-brand-400 transition-colors">{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Delivery promise */}
        <div>
          <h4 className="text-xs font-bold tracking-[0.15em] text-white uppercase mb-4">Our Promise</h4>
          <ul className="space-y-3">
            {[
              { icon: '⚡', text: '2-3 Hour Delivery' },
              { icon: '🏪', text: 'Local Boutiques' },
              { icon: '🔄', text: '7-Day Returns' },
              { icon: '🔒', text: 'Secure Payments' },
              { icon: '📞', text: '24/7 Support' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-2 text-xs text-warm-500">
                <span className="text-base leading-none">{item.icon}</span> {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-warm-800">
        <div className="container-fashion py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-warm-600">© {new Date().getFullYear()} LocalFashion. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-warm-600">Payments accepted:</span>
            {['UPI', 'Visa', 'Mastercard', 'RuPay'].map((p) => (
              <span key={p} className="text-[10px] font-bold text-warm-500 bg-warm-800 px-2 py-0.5 rounded">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
