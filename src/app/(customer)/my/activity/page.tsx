'use client';
import { CheckCircle2, Clock3, MousePointerClick, XCircle } from 'lucide-react';
import { useState } from 'react';
import { LoginGate, PurchaseReportSheet } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, Empty, PageSkeleton, Segmented } from '@/components/ui';
import { getMenuItem } from '@/lib/rules';
import { cx, fmtDate } from '@/lib/util';
import Link from 'next/link';
import { StatusPill, statusOf } from '@/components/ui/Status';

type Row = { id: string; at: string; title: string; sub: string; state: 'CONFIRMED' | 'PENDING' | 'REJECTED' | 'REVERSED' | 'CLICK' };

export default function ActivityPage() {
  const { s, me } = useCustomer();
  const [tab, setTab] = useState<'uses' | 'clicks'>('uses');
  const [report, setReport] = useState(false);
  if (!s) return <PageSkeleton />;
  if (!me) return <div className="mx-auto max-w-md p-5"><LoginGate next="/my/activity" /></div>;
  const storeName = (id: string) => s.stores.find((x) => x.id === id)?.name ?? '';
  const uses: Row[] = [
    ...s.checkins.filter((c) => c.userId === me.id).map((c) => ({ id: c.id, at: c.createdAt, title: `${storeName(c.storeId)} 방문`, sub: c.status === 'REJECTED' ? `반려: ${c.rejectReason}` : '체크인', state: c.status })),
    ...s.verifications.filter((v) => v.userId === me.id).map((v) => ({
      id: v.id,
      at: v.createdAt,
      title: `${storeName(v.storeId)} 구매`,
      sub: v.status === 'REJECTED' ? `반려: ${v.rejectReason}` : v.menuItemIds.map((i) => getMenuItem(s, i)?.name).filter(Boolean).join(', ') || (v.method === 'STAFF' ? '카운터 확인' : '구매 확인 요청'),
      state: v.status,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
  const clicks: Row[] = s.events
    .filter((e) => e.userId === me.id && (e.type === 'order_link_click' || e.type === 'reservation_link_click' || e.type === 'visit_intent'))
    .map((e) => ({ id: e.id, at: e.createdAt, title: e.label, sub: '기록만 남아요 · 실적·적립 아님', state: 'CLICK' as const }));
  const list = tab === 'uses' ? uses : clicks;
  const icon = (st: Row['state']) =>
    st === 'CONFIRMED' ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : st === 'PENDING' ? <Clock3 className="h-5 w-5 text-sky-700" /> : st === 'CLICK' ? <MousePointerClick className="h-5 w-5 text-ink-3" /> : <XCircle className="h-5 w-5 text-ink-3" />;
  const label = { CONFIRMED: '직원 확인', PENDING: '확인 대기', REJECTED: '반려', REVERSED: '취소됨', CLICK: '클릭 기록' };
  return (
    <div>
      <BackHeader title="이용 내역" fallback="/my" />
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-4 md:px-5 md:pt-10">
        <h1 className="hidden text-[1.5rem] font-extrabold text-ink md:block">이용 내역</h1>
        <div className="mt-0 flex items-center justify-between gap-2 md:mt-4">
          <Segmented label="내역 종류" value={tab} onChange={setTab} options={[{ value: 'uses', label: '방문·구매', count: uses.length }, { value: 'clicks', label: '링크·예정 기록', count: clicks.length }]} />
          <Button size="sm" variant="secondary" onClick={() => setReport(true)}>
            구매 확인 요청
          </Button>
        </div>
        <p className="mt-3 text-[0.875rem] text-ink-3">직원이 확인한 이용만 스탬프·보상에 반영돼요. 외부 링크 클릭과 방문 예정은 기록만 남아요.</p>
        <ul className="mt-3 space-y-2" data-testid="activity-list">
          {list.length ? (
            list.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-cardline bg-white p-4">
                {icon(r.state)}
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-bold text-ink">{r.title}</p>
                  <p className="clamp-1 text-[0.875rem] text-ink-3">{r.sub}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  {r.state === 'CLICK' ? <StatusPill kind="neutral" label={label.CLICK} size="sm" /> : <StatusPill kind={statusOf.verification(r.state)} label={label[r.state]} size="sm" />}
                  <p className="text-[0.8125rem] text-ink-3">{fmtDate(r.at, { time: true })}</p>
                </div>
              </li>
            ))
          ) : (
            <Empty title="아직 내역이 없어요" body="매장에서 체크인하거나 회원번호를 보여주세요." action={<Link href="/checkin" className="font-semibold text-brand-700">방문 체크인</Link>} />
          )}
        </ul>
      </div>
      <PurchaseReportSheet open={report} onClose={() => setReport(false)} s={s} me={me} />
    </div>
  );
}
