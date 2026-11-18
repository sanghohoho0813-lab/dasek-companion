'use client';
import { ClipboardCheck, PlusCircle, Search, Ticket } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { CounterPurchase, CouponRedeem } from '@/components/ax/CounterTools';
import { PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { QueueRow } from '@/components/ax/widgets';
import { Button, Empty, PageSkeleton, Segmented } from '@/components/ui';
import { fmtDate, relTime } from '@/lib/util';
import { getProfile } from '@/lib/rules';
import { StatusPill, statusOf } from '@/components/ui/Status';

function Inner() {
  const { s, can } = useOperator();
  const sp = useSearchParams();
  const [tab, setTab] = useState<'checkin' | 'purchase' | 'other' | 'done'>((sp.get('tab') as 'other') ?? 'checkin');
  const [counter, setCounter] = useState(false);
  const [redeem, setRedeem] = useState(false);
  const [q, setQ] = useState('');
  if (!s) return <PageSkeleton />;
  const term = q.trim().toLowerCase();
  const match = (userId: string | null) => {
    if (!term) return true;
    const u = getProfile(s, userId);
    return !!u && (u.name.toLowerCase().includes(term) || u.memberCode.toLowerCase().includes(term));
  };
  const open = s.tasks.filter((t) => t.status === 'OPEN' && match(t.userId)).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const by = {
    checkin: open.filter((t) => t.type === 'VERIFY_CHECKIN'),
    purchase: open.filter((t) => t.type === 'VERIFY_PURCHASE'),
    other: open.filter((t) => t.type !== 'VERIFY_CHECKIN' && t.type !== 'VERIFY_PURCHASE'),
  };
  const done = s.tasks.filter((t) => t.status !== 'OPEN' && (t.type === 'VERIFY_CHECKIN' || t.type === 'VERIFY_PURCHASE')).sort((a, b) => ((a.doneAt ?? '') < (b.doneAt ?? '') ? 1 : -1)).slice(0, 30);
  return (
    <div>
      <PageIntro
        title="방문·구매 확인"
        body="오래 기다린 요청부터 보여요. 확인해야 스탬프·추천 보상이 지급돼요."
        more="고객의 체크인과 구매 확인 요청을 직원이 확인하는 곳입니다. 확인된 건만 스탬프·추천 보상·운영 수치(KPI)·성과 기록(Proof)에 반영돼요."
        right={
          <>
            <Button tone="ax" variant="outline" onClick={() => setRedeem(true)} data-testid="open-redeem">
              <Ticket className="h-4 w-4" /> 쿠폰 사용 처리
            </Button>
            <Button tone="ax" onClick={() => setCounter(true)} disabled={!can('purchase.create')} data-testid="open-counter">
              <PlusCircle className="h-4 w-4" /> 카운터 구매 등록
            </Button>
          </>
        }
      />
      <label className="mb-3 flex h-11 max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-ax-primary">
        <Search className="h-4 w-4 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 또는 회원코드로 찾기" aria-label="큐 검색" className="w-full text-[1rem] outline-none" data-testid="queue-search" />
      </label>
      <Segmented
        tone="ax"
        label="큐 종류"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'checkin', label: '방문 체크인', count: by.checkin.length },
          { value: 'purchase', label: '구매 확인', count: by.purchase.length },
          { value: 'other', label: '사진·요청·검토', count: by.other.length },
          { value: 'done', label: '처리 완료' },
        ]}
      />
      <div className="mt-4">
        {tab !== 'done' ? (
          by[tab].length ? (
            <ul className="space-y-2" data-testid="queue-list">
              {by[tab].map((t) => (
                <QueueRow key={t.id} s={s} t={t} canVerify={can('queue.verify')} />
              ))}
            </ul>
          ) : (
            <Empty icon={<ClipboardCheck className="h-11 w-11 lg:h-8 lg:w-8" />} title="대기 중인 요청이 없어요" body="고객 화면에서 체크인하거나 '구매했어요'를 누르면 여기로 들어와요." />
          )
        ) : (
          <Panel>
            <div className="overflow-x-auto">
              <table className="ax-table w-full min-w-[560px] text-left text-[0.875rem]">
                <thead className="text-[0.8125rem] text-slate-500">
                  <tr>
                    <th className="pb-2 font-semibold">요청</th>
                    <th className="pb-2 font-semibold">결과</th>
                    <th className="pb-2 font-semibold">처리자</th>
                    <th className="pb-2 font-semibold">요청 → 처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {done.map((t) => {
                    const rec = t.type === 'VERIFY_CHECKIN' ? s.checkins.find((c) => c.id === t.refId) : s.verifications.find((v) => v.id === t.refId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-semibold text-slate-800">{t.title}</td>
                        <td className="py-2.5">{rec?.status === 'CONFIRMED' ? <StatusPill kind="done" size="sm" /> : rec?.status === 'REJECTED' ? <StatusPill kind="rejected" label={`반려 · ${rec.rejectReason}`} size="sm" /> : rec?.status === 'REVERSED' ? <StatusPill kind="reversed" label="환불·취소됨 (보상 회수)" size="sm" /> : <StatusPill kind="pending" size="sm" />}</td>
                        <td className="py-2.5 text-slate-500">{getProfile(s, t.doneBy)?.name ?? '-'}</td>
                        <td className="py-2.5 text-slate-500">
                          {fmtDate(t.createdAt, { time: true })} → {t.doneAt ? relTime(t.doneAt) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
      <CounterPurchase s={s} open={counter} onClose={() => setCounter(false)} />
      <CouponRedeem s={s} open={redeem} onClose={() => setRedeem(false)} />
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
