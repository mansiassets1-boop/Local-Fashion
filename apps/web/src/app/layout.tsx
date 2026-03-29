import type { Metadata } from 'next';
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'LocalFashion — Hyperlocal Fashion Delivered Fast',
    template: '%s | LocalFashion',
  },
  description:
    'Shop kurtis, sarees, heels, bags and more from local boutiques in your city. Get 2–3 hour delivery.',
  keywords: ['fashion', 'local boutiques', 'fast delivery', 'kurtis', 'sarees', 'hyperlocal'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}
    >
      <body className="min-h-screen bg-[#faf7f2] font-sans antialiased">
        <Providers>
          {/* Delivery announcement strip — marquee */}
          <div className="delivery-strip overflow-hidden">
            <div className="marquee-container">
              <div className="flex animate-marquee whitespace-nowrap gap-0">
                {[0, 1].map((idx) => (
                  <span key={idx} className="flex items-center gap-8 px-4">
                    <span>⚡ 2-3 Hour Delivery Now Live in Your City</span>
                    <span className="opacity-60">·</span>
                    <span>Free Delivery Above ₹499</span>
                    <span className="opacity-60">·</span>
                    <span>🏪 500+ Local Boutiques</span>
                    <span className="opacity-60">·</span>
                    <span>✨ Curated Fashion</span>
                    <span className="opacity-60">·</span>
                    <span>🔄 7-Day Easy Returns</span>
                    <span className="opacity-60">·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Header />

          <main className="pb-16 sm:pb-0 min-h-[calc(100vh-var(--header-h))]">
            {children}
          </main>

          <Footer />
          <BottomNav />

          <Toaster
            position="top-center"
            toastOptions={{
              className: 'text-sm font-medium',
              style: {
                borderRadius: '12px',
                background: '#1c1410',
                color: '#faf7f2',
                border: '1px solid rgba(200,185,158,0.2)',
              },
              success: {
                iconTheme: { primary: '#16a34a', secondary: '#faf7f2' },
              },
              error: {
                iconTheme: { primary: '#c8532a', secondary: '#faf7f2' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
