import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

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
        // 600 이상은 흰 글자·글자색으로 쓰이므로 WCAG AA(4.5:1) 이상으로 잡는다 (600: 4.95 · 700: 6.62)
        brand: { 50: '#EEF8FB', 100: '#D8F0F7', 200: '#B3E2EF', 300: '#86CFE3', 400: '#55BEDD', 500: '#2B93AE', 600: '#1B7A92', 700: '#166579', 800: '#13576A' },
        ink: { DEFAULT: '#1F2B32', 2: '#3F4E57', 3: '#5B6A73', 4: '#7F8C95' },
        canvas: '#F7FAFB',
        line: '#E3E9ED', // 구분선(가벼운)
        cardline: '#D3DCE2', // 카드 테두리 — 흰 바탕 대비 1.39:1 (보이는 경계)
        axline: '#CDD5DF', // 운영 AX 카드 테두리 — 1.48:1
        sage: { 50: '#F3FAF8', 100: '#EAF7F4', 300: '#B9DFD4', 600: '#2B6B57' },
        ivory: { 50: '#FFFBF4', 100: '#FBF4E6' },
        promo: { 50: '#FFF8E6', 100: '#FFEFC2', 600: '#845400' },
        coral: { 50: '#FFF1EC', 500: '#E2683F', 600: '#B0482A' },
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
        // 보조 글자용 slate-500 을 한 단계 진하게 (흰 6.38:1 · slate-100 5.82:1)
        slate: { ...colors.slate, 500: '#556070' },
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
        'drawer-in-right': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        grow: { '0%': { transform: 'scaleX(0)' }, '100%': { transform: 'scaleX(1)' } },
        growy: { '0%': { transform: 'scaleY(0)' }, '100%': { transform: 'scaleY(1)' } },
      },
      animation: {
        'fade-up': 'fade-up 300ms cubic-bezier(.2,.7,.2,1) both',
        'fade-in': 'fade-in 200ms ease-out both',
        'sheet-up': 'sheet-up 240ms cubic-bezier(.2,.8,.2,1) both',
        'drawer-in': 'drawer-in 220ms cubic-bezier(.2,.8,.2,1) both',
        'drawer-in-right': 'drawer-in-right 220ms cubic-bezier(.2,.8,.2,1) both',
        'scale-in': 'scale-in 200ms cubic-bezier(.2,.8,.2,1) both',
        grow: 'grow 800ms cubic-bezier(.2,.7,.2,1) both',
        growy: 'growy 700ms cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
