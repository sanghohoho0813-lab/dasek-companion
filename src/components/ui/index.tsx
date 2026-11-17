'use client';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CapabilityStatus, DataStatus, Evidence } from '@/lib/types';
import { cx } from '@/lib/util';

/* ── Button ───────────────────────────────────────── */
type Tone = 'brand' | 'ax';
type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'soft';
export function Button({
  tone = 'brand',
  variant = 'primary',
  size = 'md',
  className,
  full,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; variant?: Variant; size?: 'sm' | 'md' | 'lg'; full?: boolean }) {
  const base =
    'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[.98]';
  const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-[15px]' };
  const brand: Record<Variant, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow focus-visible:ring-brand-400',
    secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-400',
    soft: 'bg-canvas text-ink hover:bg-line focus-visible:ring-brand-400',
    ghost: 'text-ink-2 hover:bg-canvas hover:text-ink focus-visible:ring-brand-400',
    outline: 'border border-line bg-white text-ink hover:border-brand-200 hover:bg-brand-50/50 focus-visible:ring-brand-400',
    danger: 'bg-coral-600 text-white hover:bg-coral-500 focus-visible:ring-coral-500',
  };
  const ax: Record<Variant, string> = {
    primary: 'bg-ax-primary text-white hover:brightness-110 shadow-sm focus-visible:ring-ax-primary',
    secondary: 'bg-ax-soft text-ax-primary hover:brightness-[.97] focus-visible:ring-ax-primary',
    soft: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-ax-primary',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-ax-primary',
    outline: 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-ax-primary',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  };
  return <button className={cx(base, sizes[size], (tone === 'brand' ? brand : ax)[variant], full && 'w-full', className)} {...rest} />;
}

/* ── Badges ───────────────────────────────────────── */
const STATUS_STYLE: Record<CapabilityStatus | DataStatus, string> = {
  LIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PILOT: 'bg-sky-50 text-sky-700 ring-sky-200',
  DEMO: 'bg-amber-50 text-amber-800 ring-amber-200',
  READY: 'bg-slate-100 text-slate-600 ring-slate-200',
  NEXT: 'bg-violet-50 text-violet-700 ring-violet-200',
};
const STATUS_LABEL: Record<CapabilityStatus | DataStatus, string> = { LIVE: 'LIVE', PILOT: 'PILOT', DEMO: 'DEMO', READY: 'READY', NEXT: 'NEXT' };
export function StatusBadge({ status, label, className }: { status: CapabilityStatus | DataStatus; label?: string; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-bold tracking-wide ring-1 ring-inset', STATUS_STYLE[status], className)}>{label ?? STATUS_LABEL[status]}</span>;
}

const EV_STYLE: Record<Evidence, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700',
  USER_PROVIDED: 'bg-sky-50 text-sky-700',
  ASSUMPTION: 'bg-amber-50 text-amber-800',
  UNKNOWN: 'bg-slate-100 text-slate-500',
};
export const EV_LABEL: Record<Evidence, string> = { VERIFIED: '운영자 확인', USER_PROVIDED: '제공 정보', ASSUMPTION: '가정', UNKNOWN: '미확인' };
export function EvidenceBadge({ ev, className }: { ev: Evidence; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold', EV_STYLE[ev], className)}>{EV_LABEL[ev]}</span>;
}

export function Chip({ active, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      aria-pressed={active}
      className={cx(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition duration-150 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        active ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-ink-2 ring-1 ring-inset ring-line hover:bg-brand-50 hover:text-brand-700',
        className,
      )}
      {...rest}
    />
  );
}

/* ── Skeleton / Empty ─────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-slate-200/60', className)} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="불러오는 중">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export function Empty({ icon, title, body, action, className }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 text-ink-4">{icon}</div>}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-3">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Toast ────────────────────────────────────────── */
type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}
const ToastCtx = createContext<(text: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-2), { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), kind === 'error' ? 4800 : 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={cx(
              'pointer-events-auto flex max-w-md animate-fade-up items-start gap-2 rounded-2xl px-4 py-3 text-[13.5px] font-medium shadow-lift',
              t.kind === 'error' ? 'bg-red-600 text-white' : 'bg-ink text-white',
            )}
          >
            {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />}
            {t.kind === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            {t.kind === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />}
            <span className="leading-snug">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** 액션 실행 + 오류 토스트 공통 처리 */
export function useRun() {
  const toast = useToast();
  return useCallback(
    <R,>(fn: () => R, success?: string | ((r: R) => string)): R | undefined => {
      try {
        const r = fn();
        if (success) toast(typeof success === 'function' ? success(r) : success, 'success');
        return r;
      } catch (e) {
        toast(e instanceof Error ? e.message : '처리하지 못했습니다.', 'error');
        return undefined;
      }
    },
    [toast],
  );
}

/* ── Sheet / Modal ────────────────────────────────── */
/**
 * 모바일: 하단 Bottom Sheet / 데스크톱: 중앙 Modal 또는 우측 Drawer
 * - Esc·배경 클릭·닫기 버튼·브라우저 뒤로가기로 닫힘
 * - 열릴 때 포커스 이동, 닫힐 때 원래 위치로 복귀, 배경 스크롤 잠금
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  side = 'center',
  tone = 'brand',
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  side?: 'center' | 'right';
  tone?: Tone;
  testId?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // 뒤로가기로 닫기: Next 라우터 state를 보존한 채 한 단계 push
    const marker = `sheet-${Math.random().toString(36).slice(2)}`;
    window.history.pushState({ ...(window.history.state ?? {}), __sheet: marker }, '', window.location.href);
    let closedByPop = false;
    const onPop = () => {
      closedByPop = true;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus() ?? panel.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey);
      if (!closedByPop && window.history.state?.__sheet === marker) window.history.back();
      restore.current?.focus?.();
    };
  }, [open]);

  if (!open || !mounted) return null;
  const widths = { sm: 'md:max-w-sm', md: 'md:max-w-lg', lg: 'md:max-w-2xl', xl: 'md:max-w-4xl' };
  return createPortal(
    <div className="fixed inset-0 z-[80]" data-testid={testId}>
      <div className="absolute inset-0 animate-fade-in bg-[#0B1A20]/45" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'absolute flex max-h-[92dvh] flex-col bg-white outline-none',
          'inset-x-0 bottom-0 animate-sheet-up rounded-t-[28px] shadow-sheet',
          side === 'center' && cx('md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:-translate-x-1/2 md:-translate-y-1/2 md:animate-scale-in md:rounded-3xl md:shadow-lift', widths[size]),
          side === 'right' && cx('md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-full md:rounded-none md:rounded-l-3xl md:animate-fade-in', widths[size]),
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 md:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4 md:px-6 md:pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[17px] font-bold leading-snug text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="닫기" className={cx('-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition hover:bg-canvas hover:text-ink', tone === 'ax' && 'hover:bg-slate-100')}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 md:px-6">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] md:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ── Form fields ──────────────────────────────────── */
export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">
        {label}
        {required && <span className="ml-0.5 text-coral-600">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-[12px] text-ink-3">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] font-medium text-red-600">{error}</span>}
    </label>
  );
}

export const inputCls =
  'h-11 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-ink-4 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100';
export const axInputCls =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-ax-primary focus:outline-none focus:ring-2 focus:ring-ax-soft';

export function Toggle({ checked, onChange, label, tone = 'brand', disabled, testId }: { checked: boolean; onChange: (v: boolean) => void; label: string; tone?: Tone; disabled?: boolean; testId?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40',
        checked ? (tone === 'brand' ? 'bg-brand-600' : 'bg-ax-primary') : 'bg-slate-300',
      )}
    >
      <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

export function Segmented<T extends string>({ value, onChange, options, tone = 'brand', size = 'md', label }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; count?: number }[]; tone?: Tone; size?: 'sm' | 'md'; label: string }) {
  return (
    <div role="tablist" aria-label={label} className={cx('inline-flex max-w-full gap-1 overflow-x-auto rounded-xl p-1 no-scrollbar', tone === 'brand' ? 'bg-canvas' : 'bg-slate-100')}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg font-semibold transition duration-150',
            size === 'sm' ? 'h-7 px-2.5 text-[12.5px]' : 'h-8 px-3 text-[13px]',
            value === o.value ? cx('bg-white shadow-sm', tone === 'brand' ? 'text-ink' : 'text-slate-900') : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {o.label}
          {o.count != null && <span className={cx('rounded-full px-1.5 text-[11px]', value === o.value ? (tone === 'brand' ? 'bg-brand-50 text-brand-700' : 'bg-ax-soft text-ax-primary') : 'bg-white/70 text-slate-500')}>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** 숫자 Count-up (첫 진입 1회, reduced-motion 존중) */
export function CountUp({ value, duration = 650, format = (n: number) => Math.round(n).toLocaleString('ko-KR') }: { value: number; duration?: number; format?: (n: number) => string }) {
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return;
    }
    done.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(n)}</>;
}
