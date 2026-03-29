import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>
          <Header />
          <main className="pb-16 sm:pb-0 min-h-[calc(100vh-4rem)]">
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
                background: '#1f2937',
                color: '#fff',
              },
              success: {
                iconTheme: { primary: '#4ade80', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#fff' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
