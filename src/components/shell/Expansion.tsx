'use client';
/**
 * 추가 확장 예정 (대표 기획안) — 메뉴 안에 접어 두는 목차.
 *  · 평소엔 한 줄로 접혀 있고(따라다니지 않게), 펼치면 2개 영역·10개 항목
 *  · 항목을 누르면 '도입되면 / 지금 앱에서는' 을 짧게 보여주는 시트
 *  · 다른 화면으로 이동하면 다시 접힌다
 */
import { ChevronDown, Rocket, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { StatusPill } from '@/components/ui/Status';
import { Button, Sheet, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { EXPANSION_COUNT, EXPANSION_GOAL, EXPANSION_PURPOSE, EXPANSION_SOURCE, EXPANSION_STEPS, EXPANSION_TRACKS, type ExpansionItem, type ExpansionTrack } from '@/lib/expansion';
import { act, useAppState } from '@/lib/store';
import { cx } from '@/lib/util';

type Tone = 'shell' | 'brand';

export function ExpansionNav({ tone, compact, onNavigate }: { tone: Tone; compact?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<{ track: ExpansionTrack; item: ExpansionItem } | null>(null);
  const [overview, setOverview] = useState(false);
  const id = useId();
  useEffect(() => setOpen(false), [pathname]);
  const shell = tone === 'shell';

  if (compact)
    return (
      <>
        <button type="button" onClick={() => setOverview(true)} title={`추가 확장 예정 ${EXPANSION_COUNT}개`} aria-label={`추가 확장 예정 ${EXPANSION_COUNT}개 보기`} className="mx-auto grid h-11 w-11 place-items-center rounded-xl text-violet-300 hover:bg-ax-shell-hover/10" data-testid="expansion-compact">
          <Rocket className="h-5 w-5" />
        </button>
        <ExpansionOverviewSheet open={overview} onClose={() => setOverview(false)} tone={shell ? 'ax' : 'brand'} onPick={(t, i) => { setOverview(false); setItem({ track: t, item: i }); }} />
        <ExpansionItemSheet value={item} onClose={() => setItem(null)} tone={shell ? 'ax' : 'brand'} />
      </>
    );

  return (
    <div data-testid="expansion-nav" className={cx('rounded-xl', shell ? 'border border-dashed border-ax-shell-hover/25' : 'border border-dashed border-violet-300 bg-white')}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cx('flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-[0.9375rem] font-semibold transition', shell ? 'text-ax-shell-fg hover:bg-ax-shell-hover/[.07]' : 'text-ink hover:bg-violet-50')}
      >
        <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg', shell ? 'bg-violet-400/20 text-violet-300' : 'bg-violet-50 text-violet-700')}>
          <Rocket className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          추가 확장 예정
          <span className={cx('ml-1.5 text-[0.8125rem] font-semibold', shell ? 'text-ax-shell-muted' : 'text-ink-3')}>{EXPANSION_COUNT}개</span>
        </span>
        <ChevronDown className={cx('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      <div id={id} hidden={!open} className="px-1.5 pb-2">
        <p className={cx('px-2 pb-1.5 text-[0.8125rem] leading-snug', shell ? 'text-ax-shell-muted' : 'text-ink-3')}>대표 기획안 기준 · 아직 개발 전이에요</p>
        {EXPANSION_TRACKS.map((t) => (
          <div key={t.key} className="mt-1">
            <p className={cx('px-2 py-1 text-[0.8125rem] font-bold', shell ? 'text-ax-shell-muted' : 'text-ink-3')}>
              <span aria-hidden>{t.emoji}</span> {t.brand} · {t.title}
            </p>
            <ul>
              {t.items.map((i) => (
                <li key={i.key}>
                  <button
                    type="button"
                    onClick={() => setItem({ track: t, item: i })}
                    className={cx('flex min-h-11 w-full items-center rounded-lg px-2 py-1.5 text-left text-[0.875rem] font-medium leading-snug', shell ? 'text-ax-shell-fg/90 hover:bg-ax-shell-hover/[.07]' : 'text-ink-2 hover:bg-canvas')}
                    data-testid={`expansion-item-${i.key}`}
                  >
                    {i.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button type="button" onClick={() => setOverview(true)} className={cx('mt-1 flex min-h-11 w-full items-center gap-1.5 rounded-lg px-2 text-[0.875rem] font-bold', shell ? 'text-violet-200 hover:bg-ax-shell-hover/[.07]' : 'text-violet-700 hover:bg-violet-50')}>
          <Sparkles className="h-4 w-4" /> 최종 목표·개발 방향
        </button>
      </div>
      <ExpansionItemSheet value={item} onClose={() => setItem(null)} tone={shell ? 'ax' : 'brand'} onNavigate={onNavigate} />
      <ExpansionOverviewSheet open={overview} onClose={() => setOverview(false)} tone={shell ? 'ax' : 'brand'} onPick={(t, i) => { setOverview(false); setItem({ track: t, item: i }); }} />
    </div>
  );
}

function ExpansionItemSheet({ value, onClose, tone, onNavigate }: { value: { track: ExpansionTrack; item: ExpansionItem } | null; onClose: () => void; tone: 'ax' | 'brand'; onNavigate?: () => void }) {
  const s = useAppState();
  const run = useRun();
  const v = value;
  const me = s?.session.customerId ?? null;
  const interested = !!(v?.item.roadmapKey && me && s?.roadmapInterest.some((r) => r.itemKey === v.item.roadmapKey && r.userId === me));
  const interestCount = v?.item.roadmapKey && s ? s.roadmapInterest.filter((r) => r.itemKey === v.item.roadmapKey).length : 0;
  return (
    <Sheet open={!!v} onClose={onClose} tone={tone} size="sm" title={v?.item.title ?? ''} description={v ? `${v.track.emoji} ${v.track.brand} · ${v.track.title}` : undefined} testId="expansion-sheet">
      {v && (
        <div className="space-y-3">
          <StatusPill kind="next" label="확장 예정 · 아직 개발 전" />
          <div>
            <p className="text-[0.875rem] font-bold text-slate-500">도입되면</p>
            <p className="mt-0.5 text-[1rem] leading-relaxed text-slate-800">{v.item.plan}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[0.875rem] font-bold text-slate-500">지금 앱에서는</p>
            {v.item.base && <p className="mt-0.5 text-[0.9375rem] font-semibold text-emerald-800">✓ {v.item.base}</p>}
            <p className="mt-0.5 text-[0.9375rem] leading-relaxed text-slate-700">{v.item.now}</p>
          </div>
          {tone === 'brand' && v.item.roadmapKey && (
            <Button
              full
              variant={interested ? 'soft' : 'primary'}
              onClick={() => run(() => act((d, c) => D.toggleRoadmapInterest(d, c, me, v.item.roadmapKey!, false)), (on) => (on ? '관심을 남겼어요. 어떤 것부터 만들지 정하는 데 참고해요.' : '관심을 취소했어요.'))}
              data-testid="expansion-interest"
            >
              {interested ? '관심 취소' : '이 서비스에 관심 있어요'}
            </Button>
          )}
          {tone === 'ax' && v.item.roadmapKey && <p className="text-[0.875rem] text-slate-600">고객 관심 등록 {interestCount}건 (DEMO 집계 · 고객 화면 &lsquo;관심 있어요&rsquo;)</p>}
          <p className="text-[0.8125rem] text-slate-500">출처: {EXPANSION_SOURCE}</p>
          <Link href={tone === 'ax' ? '/ax/why#expansion' : '/roadmap'} onClick={() => { onClose(); onNavigate?.(); }} className="inline-flex min-h-11 items-center text-[0.9375rem] font-bold text-violet-700 hover:underline">
            전체 확장 계획 보기 →
          </Link>
        </div>
      )}
    </Sheet>
  );
}

export function ExpansionOverviewSheet({ open, onClose, tone, onPick }: { open: boolean; onClose: () => void; tone: 'ax' | 'brand'; onPick: (t: ExpansionTrack, i: ExpansionItem) => void }) {
  return (
    <Sheet open={open} onClose={onClose} tone={tone} size="sm" title="추가 확장 예정" description="대표 기획안 기준 · 아직 개발 전" testId="expansion-overview">
      <ExpansionOverview onPick={onPick} />
    </Sheet>
  );
}

/** 목표·방향·두 영역 요약 — 시트·Why AX·시연 모드에서 공통 */
export function ExpansionOverview({ onPick, dense }: { onPick?: (t: ExpansionTrack, i: ExpansionItem) => void; dense?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-3.5">
        <p className="text-[0.8125rem] font-bold text-violet-800">최종 목표</p>
        <p className="mt-0.5 text-[1rem] font-bold leading-snug text-slate-900">{EXPANSION_GOAL}</p>
        {!dense && <p className="mt-1 text-[0.875rem] text-slate-600">{EXPANSION_PURPOSE}</p>}
      </div>
      <div className={cx('grid gap-3', !dense && 'md:grid-cols-2')}>
        {EXPANSION_TRACKS.map((t) => (
          <div key={t.key} className="rounded-xl border border-slate-200 bg-white p-3.5">
            <p className="text-[1rem] font-extrabold text-slate-900">
              <span aria-hidden>{t.emoji}</span> {t.brand} · {t.title}
            </p>
            <p className="text-[0.875rem] text-slate-600">{t.summary}</p>
            <ul className="mt-2 space-y-0.5">
              {t.items.map((i) =>
                onPick ? (
                  <li key={i.key}>
                    <button type="button" onClick={() => onPick(t, i)} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-[0.9375rem] text-slate-800 hover:bg-slate-50">
                      {i.title} <span className="shrink-0 text-violet-700">›</span>
                    </button>
                  </li>
                ) : (
                  <li key={i.key} className="py-0.5 text-[0.9375rem] text-slate-800">
                    · {i.title}
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[0.875rem] font-bold text-slate-500">개발 방향</p>
        <ol className="mt-1.5 space-y-1.5">
          {EXPANSION_STEPS.map((x, n) => (
            <li key={x.title} className="flex items-start gap-2.5 text-[0.9375rem]">
              <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.8125rem] font-bold', n === 0 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700')}>{n + 1}</span>
              <span>
                <span className="font-semibold text-slate-900">{x.title}</span>
                <span className="block text-[0.8125rem] text-slate-500">{x.now}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-[0.8125rem] text-slate-500">출처: {EXPANSION_SOURCE} · 표시된 기능은 모두 계획이며 현재 제공되지 않아요.</p>
    </div>
  );
}
