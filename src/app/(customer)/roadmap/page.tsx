'use client';
import { Check, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { ExpansionOverview } from '@/components/shell/Expansion';
import { Button, PageSkeleton, Sheet, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { hasConsent } from '@/lib/rules';
import { ROADMAP, ROADMAP_GROUPS, type RoadmapItem } from '@/lib/roadmap';
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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[1.625rem] font-extrabold tracking-[-0.02em] text-ink">앞으로 준비하는 서비스</h1>
          <StatusBadge status="NEXT" label="개발 예정" />
        </div>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">지금은 매장 메뉴·고양이·멤버십에 집중하고 있어요. 아래 서비스는 <b>아직 제공하지 않으며</b>, 관심을 남겨 주시면 어떤 것부터 만들지 정하는 데 참고해요.</p>
        <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-canvas p-3 text-[0.8125rem]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-sage-600 ring-1 ring-line">● 지금 이용 가능: 메뉴·고양이 탐색, 회원·스탬프·쿠폰·친구 추천, 체크인</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-violet-700 ring-1 ring-line">○ 개발 예정: 아래 서비스</span>
        </div>
        <section id="expansion" className="mt-6 scroll-mt-20" aria-labelledby="rg-expansion">
          <h2 id="rg-expansion" className="text-[1.1875rem] font-extrabold text-ink">확장 계획 한눈에 보기</h2>
          <p className="mt-0.5 text-[0.875rem] text-ink-3">다색컴패니언이 앞으로 연결하려는 서비스예요. 아래 항목별로 관심을 남길 수 있어요.</p>
          <div className="mt-3">
            <ExpansionOverview dense />
          </div>
        </section>
        {ROADMAP_GROUPS.map((g) => (
          <section key={g.key} id={g.key} className="mt-8 scroll-mt-20" aria-labelledby={`rg-${g.key}`}>
            <h2 id={`rg-${g.key}`} className="flex items-center gap-2 text-[1.1875rem] font-extrabold text-ink">
              <span aria-hidden>{g.emoji}</span> {g.title}
            </h2>
            <p className="mt-0.5 text-[0.875rem] text-ink-3">{g.desc}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {ROADMAP.filter((r) => r.group === g.key).map((r) => (
                <button key={r.key} onClick={() => setOpen(r)} className="lift flex items-start gap-4 rounded-[24px] bg-white p-5 text-left ring-1 ring-line" data-testid={`roadmap-${r.key}`}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-2xl" aria-hidden>
                    {r.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[1.0312rem] font-extrabold text-ink">{r.title}</span>
                      <StatusBadge status="NEXT" label="개발 예정" />
                    </span>
                    <span className="mt-1 block text-[0.875rem] leading-relaxed text-ink-2">{r.oneLine}</span>
                    <span className="mt-2 flex items-center gap-2 text-[0.8125rem] text-ink-3">
                      관심 {count(r.key)}명 {mine(r.key) && <span className="font-bold text-brand-700">· 관심 남김</span>}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.title ?? ''}
        description={open ? `${ROADMAP_GROUPS.find((g) => g.key === open.group)?.title} · 개발 예정 · 아이디어 검증 중` : ''}
        testId="roadmap-sheet"
        footer={
          open && (
            <div className="space-y-2">
              {me && !mine(open.key) && (
                <label className="flex items-center gap-2 text-[0.8125rem] text-ink-2">
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
              <p className="text-[0.8438rem] font-bold text-ink-3">이런 서비스를 검토하고 있어요</p>
              <ul className="mt-2 space-y-1.5">
                {open.what.map((w) => (
                  <li key={w} className="flex gap-2 text-[0.875rem] text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-[0.8438rem] font-bold text-ink-3">분명히 해두면</p>
              <ul className="mt-2 space-y-1.5">
                {open.notNow.map((w) => (
                  <li key={w} className="flex gap-2 text-[0.8438rem] text-ink-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" /> {w}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.8438rem] font-bold text-ink-3">시작 전에 필요한 것</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {open.prerequisites.map((p) => (
                  <span key={p} className={cx('rounded-full bg-violet-50 px-2.5 py-1 text-[0.8125rem] font-semibold text-violet-700')}>
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
