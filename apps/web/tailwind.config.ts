import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand Palette ────────────────────────────────────────────
        brand: {
          50:  '#fdf6f0',
          100: '#fce9da',
          200: '#f8cfb0',
          300: '#f2ae7e',
          400: '#eb8449',
          500: '#e4672a',   // main terracotta
          600: '#c8532a',   // deep terracotta (primary CTA)
          700: '#a63f22',
          800: '#87331e',
          900: '#6f2c1d',
          950: '#3c130c',
        },
        // ── Rose / Blush ──────────────────────────────────────────────
        rose: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        // ── Gold / Amber ──────────────────────────────────────────────
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#c4963e',   // muted gold
          600: '#a87c32',
          700: '#8a6326',
        },
        // ── Neutral (warm toned) ──────────────────────────────────────
        warm: {
          50:  '#faf7f2',   // main background
          100: '#f5f0e8',
          200: '#ede5d5',
          300: '#ddd3bf',
          400: '#c8b99e',
          500: '#b09a7e',
          600: '#8c7a62',
          700: '#6e5f4c',
          800: '#4a3d30',
          900: '#2d2418',   // deep espresso (headings)
          950: '#1c140f',
        },
        // ── Dark (primary text / backgrounds) ────────────────────────
        ink: {
          DEFAULT: '#1c1410',
          light:   '#3d2e23',
          muted:   '#7a6654',
          subtle:  '#b5a395',
        },
      },

      // ── Typography ───────────────────────────────────────────────────
      fontFamily: {
        sans:    ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui'],
        serif:   ['var(--font-playfair)', '"Playfair Display"', 'Georgia', 'serif'],
        display: ['var(--font-cormorant)', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '10xl': ['10rem',  { lineHeight: '1' }],
      },

      // ── Spacing ───────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },

      // ── Border Radius ─────────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // ── Box Shadows ───────────────────────────────────────────────────
      boxShadow: {
        'warm-sm':  '0 1px 3px 0 rgba(60,30,10,0.06), 0 1px 2px -1px rgba(60,30,10,0.06)',
        'warm':     '0 4px 12px -2px rgba(60,30,10,0.10), 0 2px 4px -2px rgba(60,30,10,0.06)',
        'warm-md':  '0 8px 24px -4px rgba(60,30,10,0.14), 0 4px 8px -4px rgba(60,30,10,0.08)',
        'warm-lg':  '0 20px 50px -8px rgba(60,30,10,0.18), 0 8px 20px -8px rgba(60,30,10,0.10)',
        'warm-xl':  '0 32px 64px -12px rgba(60,30,10,0.22)',
        'card':     '0 2px 8px rgba(60,30,10,0.08)',
        'card-hover': '0 12px 32px rgba(60,30,10,0.16)',
        'glow-brand': '0 0 0 3px rgba(200,83,42,0.18)',
        'glow-gold':  '0 0 0 3px rgba(196,150,62,0.20)',
        'inner-warm': 'inset 0 1px 3px rgba(60,30,10,0.06)',
      },

      // ── Animations & Keyframes ─────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'marquee': {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'heart-beat': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.3)' },
        },
        'slide-up-fade': {
          '0%':   { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'zoom-in': {
          '0%':   { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.08)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.4s ease-out',
        'fade-up':        'fade-up 0.5s ease-out',
        'fade-down':      'fade-down 0.3s ease-out',
        'scale-in':       'scale-in 0.3s ease-out',
        'slide-left':     'slide-left 0.4s ease-out',
        'slide-right':    'slide-right 0.4s ease-out',
        'shimmer':        'shimmer 2s infinite linear',
        'float':          'float 3s ease-in-out infinite',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
        'spin-slow':      'spin-slow 8s linear infinite',
        'marquee':        'marquee 28s linear infinite',
        'heart-beat':     'heart-beat 0.3s ease-in-out',
        'slide-up-fade':  'slide-up-fade 0.4s ease-out',
        'zoom-in':        'zoom-in 6s ease-out forwards',
      },

      // ── Backdrop ──────────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },

      // ── Transitions ───────────────────────────────────────────────────
      transitionTimingFunction: {
        'bounce-soft':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-expo':'cubic-bezier(0.19, 1, 0.22, 1)',
      },

      // ── Z-index ────────────────────────────────────────────────────────
      zIndex: {
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};

export default config;
