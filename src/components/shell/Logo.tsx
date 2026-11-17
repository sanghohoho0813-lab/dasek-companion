'use client';
import { useId } from 'react';
import { cx } from '@/lib/util';

export function LogoMark({ className }: { className?: string }) {
  const gid = `lg-dc-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 40 40" className={cx('shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#55BEDD" />
          <stop offset="1" stopColor="#258EA8" />
        </linearGradient>
      </defs>
      <path d="M7 15 L9 4 L16 10 Q20 9 24 10 L31 4 L33 15 Q36 20 35 25 Q33 36 20 36 Q7 36 5 25 Q4 20 7 15 Z" fill={`url(#${gid})`} />
      <path d="M14 27 Q20 14 27 17 Q25 27 14 27 Z" fill="#EAF7F4" />
      <path d="M15 26 Q20 21 25 18" stroke="#3C8C74" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="19" r="1.6" fill="#fff" />
    </svg>
  );
}

export function Wordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <LogoMark className="h-8 w-8" />
      <span className="leading-none">
        <span className="block text-[16px] font-extrabold tracking-tight text-ink">다색컴패니언</span>
        {!compact && <span className="mt-0.5 block text-[9.5px] font-bold tracking-[0.18em] text-brand-600">DASEK COMPANION</span>}
      </span>
    </span>
  );
}
