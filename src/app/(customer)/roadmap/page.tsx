'use client';
import { Check, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, PageSkeleton, Sheet, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { hasConsent } from '@/lib/rules';
import { ROADMAP, type RoadmapItem } from '@/lib/roadmap';
import { act } from '@/lib/store';
import { cx } from '@/lib/util';

function Inner() {
  const { s, me } = useCustomer();
  const sp = useSearchParams();
  const run = useRun();
  const [open, setOpen] = useState<RoadmapItem | null>(null);
  const [notify, setNotify] = useState(false);
  useEffect(() => {
    const k = sp.get('item');
    if (k) setOpen(ROADMAP.find((r) => r.key === k) ?? null);
  }, [sp]);
  if (!s) return <PageSkeleton />;
  const mine = (k: string) => !!me && s.roadmapInterest.some((r) => r.userId === me.id && r.itemKey === k);
  const count = (k: string) => s.roadmapInterest.filter((r) => r.itemKey === k).length;
  return (
    <div>
      <BackHeader title="준비 중인 서비스" />
      <div className="mx-auto max-w-5xl px-4 pb-10 pt-4 md:px-5 md:pt-10">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-extrabold text-ink">준비 중인 서비스</h1>
          <StatusBadge status="NEXT" label="향후 개발" />
        </div>
        <p className="mt-1 text-[14px] text-ink-3">아직 제공하지 않는 서비스예요. 관심을 남겨 주시면 어떤 서비스를 먼저 만들지 정하는 데 참고해요.</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {ROADMAP.map((r) => (
            <button key={r.key} onClick={() => setOpen(r)} className="lift flex items-start gap-4 rounded-3xl bg-white p-5 text-left ring-1 ring-line" data-testid={`roadmap-${r.key}`}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-2xl" aria-hidden>
                {r.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-[12px] font-bold text-violet-600">{r.group}</span>
                <span className="block text-[16px] font-extrabold text-ink">{r.title}</span>
                <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">{r.oneLine}</span>
                <span className="mt-2 flex items-center gap-2 text-[12px] text-ink-4">
                  관심 {count(r.key)}명 {mine(r.key) && <span className="font-bold text-brand-700">· 관심 남김</span>}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.title ?? ''}
        description={open ? `${open.group} · 향후 개발 · 아이디어 검증 중` : ''}
        testId="roadmap-sheet"
        footer={
          open && (
            <div className="space-y-2">
              {me && !mine(open.key) && (
                <label className="flex items-center gap-2 text-[13px] text-ink-2">
                  <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                  출시되면 앱 알림으로 알려주세요 {hasConsent(s, me.id, 'marketing_inapp') ? '' : '(앱 안 혜택 알림 동의 필요)'}
                </label>
              )}
              <Button
                full
                size="lg"
                variant={mine(open.key) ? 'soft' : 'primary'}
                data-testid="roadmap-interest"
                onClick={() =>
                  run(
                    () => act((d, c) => D.toggleRoadmapInterest(d, c, me?.id ?? null, open.key, notify && !!me && hasConsent(d, me.id, 'marketing_inapp'))),
                    (on) => (on ? '관심을 남겼어요. 고마워요!' : '관심을 취소했어요.'),
                  )
                }
              >
                {mine(open.key) ? '관심 취소' : '관심 있어요'}
              </Button>
            </div>
          )
        }
      >
        {open && (
          <div className="space-y-4">
            <StatusBadge status="NEXT" label="지금은 제공하지 않아요" />
            <div>
              <p className="text-[12.5px] font-bold text-ink-3">이런 서비스를 검토하고 있어요</p>
              <ul className="mt-2 space-y-1.5">
                {open.what.map((w) => (
                  <li key={w} className="flex gap-2 text-[14px] text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-[12.5px] font-bold text-ink-3">분명히 해두면</p>
              <ul className="mt-2 space-y-1.5">
                {open.notNow.map((w) => (
                  <li key={w} className="flex gap-2 text-[13.5px] text-ink-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" /> {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[12.5px] font-bold text-ink-3">시작 전에 필요한 것</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {open.prerequisites.map((p) => (
                  <span key={p} className={cx('rounded-full bg-violet-50 px-2.5 py-1 text-[12px] font-semibold text-violet-700')}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
