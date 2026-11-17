'use client';
/**
 * 상태 표시 — 색만으로 전달하지 않는다: 아이콘 + 글자 + 색 (WCAG 1.4.1)
 * 고객·운영 AX 공통. 글자색은 각 바탕에서 4.5:1 이상인 800 단계.
 */
import { AlertTriangle, Ban, CalendarX, CheckCircle2, CircleDot, Clock3, FilePen, PauseCircle, Send, Sparkles, Ticket, Undo2, XCircle } from 'lucide-react';
import { cx } from '@/lib/util';

export type StatusKind = 'pending' | 'done' | 'rejected' | 'usable' | 'used' | 'expired' | 'cancelled' | 'next' | 'delayed' | 'reversed' | 'draft' | 'sent' | 'paused' | 'expected' | 'neutral';

const MAP: Record<StatusKind, { label: string; Icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  pending: { label: '확인 대기', Icon: Clock3, cls: 'bg-sky-50 text-sky-800 ring-sky-200' },
  done: { label: '확인 완료', Icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  rejected: { label: '반려', Icon: XCircle, cls: 'bg-rose-50 text-rose-800 ring-rose-200' },
  usable: { label: '사용 가능', Icon: Ticket, cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  used: { label: '사용 완료', Icon: CheckCircle2, cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  expired: { label: '기간 만료', Icon: CalendarX, cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  cancelled: { label: '취소됨', Icon: Ban, cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  next: { label: '개발 예정', Icon: Sparkles, cls: 'bg-violet-50 text-violet-800 ring-violet-200' },
  delayed: { label: '처리 지연', Icon: AlertTriangle, cls: 'bg-red-50 text-red-800 ring-red-200' },
  reversed: { label: '환불·취소', Icon: Undo2, cls: 'bg-amber-50 text-amber-900 ring-amber-200' },
  draft: { label: '초안', Icon: FilePen, cls: 'bg-amber-50 text-amber-900 ring-amber-200' },
  sent: { label: '발송 완료', Icon: Send, cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  paused: { label: '중지', Icon: PauseCircle, cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
  expected: { label: '확정 예정', Icon: Clock3, cls: 'bg-sky-50 text-sky-800 ring-sky-200' },
  neutral: { label: '', Icon: CircleDot, cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export function StatusPill({ kind, label, className, size = 'md' }: { kind: StatusKind; label?: string; className?: string; size?: 'sm' | 'md' }) {
  const m = MAP[kind];
  return (
    <span data-badge data-status={kind} className={cx('inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-bold ring-1 ring-inset', size === 'sm' ? 'px-2 py-0.5 text-[0.75rem]' : 'px-2.5 py-1 text-[0.8125rem]', m.cls, className)}>
      <m.Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      {label ?? m.label}
    </span>
  );
}

/** 도메인 상태값 → 표시 종류 */
export const statusOf = {
  verification: (s: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REVERSED'): StatusKind => ({ PENDING: 'pending', CONFIRMED: 'done', REJECTED: 'rejected', REVERSED: 'reversed' } as const)[s],
  coupon: (s: 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED'): StatusKind => ({ ISSUED: 'usable', REDEEMED: 'used', EXPIRED: 'expired', CANCELLED: 'cancelled' } as const)[s],
  campaign: (s: 'DRAFT' | 'APPROVED' | 'SENT' | 'PAUSED'): StatusKind => ({ DRAFT: 'draft', APPROVED: 'pending', SENT: 'sent', PAUSED: 'paused' } as const)[s],
  ledger: (s: 'EXPECTED' | 'CONFIRMED' | 'REVERSED'): StatusKind => ({ EXPECTED: 'expected', CONFIRMED: 'done', REVERSED: 'reversed' } as const)[s],
};
