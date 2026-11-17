import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Noto Sans KR', 'Noto Sans', 'Apple SD Gothic Neo', 'Malgun Gothic', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Customer brand (밝은 다색컴패니언 테마)
        brand: { 50: '#EEF8FB', 100: '#D8F0F7', 200: '#B3E2EF', 400: '#55BEDD', 500: '#36A9C9', 600: '#258EA8', 700: '#1C7186', 800: '#175B6B' },
        ink: { DEFAULT: '#25333B', 2: '#4A5A63', 3: '#6E7D86', 4: '#9AA7AF' },
        canvas: '#F7FAFB',
        line: '#E7EDF0',
        sage: { 50: '#F3FAF8', 100: '#EAF7F4', 300: '#B9DFD4', 600: '#3C8C74' },
        ivory: { 50: '#FFFBF4', 100: '#FBF4E6' },
        promo: { 50: '#FFF8E6', 100: '#FFEFC2', 600: '#A86D00' },
        coral: { 50: '#FFF1EC', 500: '#EE7A55', 600: '#D35F3A' },
        // AX theme tokens (7 canonical themes via CSS variables)
        ax: {
          shell: v('--ax-shell'),
          primary: v('--ax-primary'),
          secondary: v('--ax-secondary'),
          accent: v('--ax-accent'),
          highlight: v('--ax-highlight'),
          soft: v('--ax-soft'),
          'shell-fg': v('--ax-shell-fg'),
          'shell-muted': v('--ax-shell-muted'),
          'shell-hover': v('--ax-shell-hover'),
        },
        grp: { ops: '#5B8DEF', growth: '#D79A43', intel: '#3C9A75', sys: '#718096' },
      },
      borderRadius: { '4xl': '2rem' },
      boxShadow: {
        card: '0 1px 2px rgba(16,40,52,.04), 0 4px 16px rgba(16,40,52,.06)',
        lift: '0 2px 4px rgba(16,40,52,.06), 0 12px 28px rgba(16,40,52,.10)',
        sheet: '0 -8px 40px rgba(16,40,52,.18)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'sheet-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'drawer-in': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        grow: { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
        growy: { '0%': { transform: 'scaleY(0)' }, '100%': { transform: 'scaleY(1)' } },
      },
      animation: {
        'fade-up': 'fade-up 300ms cubic-bezier(.2,.7,.2,1) both',
        'fade-in': 'fade-in 200ms ease-out both',
        'sheet-up': 'sheet-up 240ms cubic-bezier(.2,.8,.2,1) both',
        'drawer-in': 'drawer-in 220ms cubic-bezier(.2,.8,.2,1) both',
        'scale-in': 'scale-in 200ms cubic-bezier(.2,.8,.2,1) both',
        grow: 'grow 800ms cubic-bezier(.2,.7,.2,1) both',
        growy: 'growy 700ms cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
