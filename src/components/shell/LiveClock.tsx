'use client';
/**
 * 실시간 한국 시계 — Asia/Seoul, 1초마다 갱신(초 경계에 맞춤), 해제 시 타이머 정리.
 * 서버 렌더링 때는 자리만 잡아 두고(같은 폭) 브라우저에서 시작 → 하이드레이션 불일치 없음.
 * 화면 낭독기가 매초 읽지 않도록 aria-live 를 쓰지 않는다.
 */
import { useEffect, useState } from 'react';
import { cx } from '@/lib/util';

const TZ = 'Asia/Seoul';
const partsOf = (d: Date) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('ko-KR', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  ) as Record<string, string>;
  return { y: p.year, m: p.month, d: p.day, wd: p.weekday, time: `${p.hour}:${p.minute}:${p.second}` };
};

export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const d = new Date();
      setNow(d);
      t = setTimeout(tick, 1000 - d.getMilliseconds() + 4);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return now;
}

export function LiveClock({ variant = 'inline', className }: { variant?: 'inline' | 'pill'; className?: string }) {
  const now = useNow();
  const p = now ? partsOf(now) : null;
  const date = p ? (variant === 'pill' ? `${p.y}년 ${Number(p.m)}월 ${Number(p.d)}일 (${p.wd})` : `${p.y}.${p.m}.${p.d} (${p.wd})`) : ' '.repeat(variant === 'pill' ? 16 : 14);
  const time = p ? p.time : '  :  :  ';
  return (
    <time
      data-testid="live-clock"
      data-kst-date={p ? `${p.y}-${p.m}-${p.d}` : ''}
      data-kst-time={p?.time ?? ''}
      dateTime={now?.toISOString()}
      aria-label={p ? `현재 한국 시각 ${date} ${time}` : '현재 시각 불러오는 중'}
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap tabular-nums',
        variant === 'pill' ? 'h-9 rounded-lg bg-slate-100 px-3 text-[0.875rem] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200' : 'text-[0.8125rem] font-semibold text-slate-600',
        className,
      )}
    >
      <span>{date}</span>
      <span className={cx('font-bold', variant === 'pill' ? 'text-slate-900' : 'text-slate-800')}>{time}</span>
    </time>
  );
}
