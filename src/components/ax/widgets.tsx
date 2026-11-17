'use client';
import { ArrowRight, Check, Clock3, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, CountUp, Sheet, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import type { Kpis, Mission } from '@/lib/rules';
import { getMenuItem, getProfile } from '@/lib/rules';
import { opAct } from '@/lib/store';
import type { AdminTask, AppState } from '@/lib/types';
import { cx, relTime } from '@/lib/util';
import { Locked, Tag } from './Shell';

export function MoneyKpiCards({ k }: { k: Kpis }) {
  const cards = [
    {
      kind: 'COST',
      color: '#5B8DEF',
      title: '확인 요청 처리 시간',
      value: k.costMedianMinutes,
      unit: '분',
      fmt: (n: number) => Math.round(n).toString(),
      note: `중앙값 · 최근 30일 ${k.costSample}건`,
      measure: '체크인/구매 확인 요청 → 직원 처리 시각',
    },
    {
      kind: 'REVENUE',
      color: '#D79A43',
      title: '30일 재방문·재구매율',
      value: k.revenueRepeatRate == null ? null : k.revenueRepeatRate * 100,
      unit: '%',
      fmt: (n: number) => n.toFixed(0),
      note: `확인 이용 고객 ${k.revenueRepeatDen}명 중 2회 이상 ${k.revenueRepeatNum}명`,
      measure: '직원확인 방문·구매만 집계 (클릭·자가신고 제외)',
    },
    {
      kind: 'SCALE',
      color: '#3C9A75',
      title: '운영자 1인당 활성 고객',
      value: k.scaleActivePerOperator,
      unit: '명',
      fmt: (n: number) => n.toFixed(1),
      note: `30일 활성 ${k.activeCustomers}명 ÷ 운영 인원 ${k.operatorCount}명`,
      measure: '같은 인력으로 관리 가능한 확인 고객 수',
    },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3" data-testid="money-kpis">
      {cards.map((c) => (
        <div key={c.kind} className="lift min-w-0 overflow-hidden rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 md:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.14em]" style={{ color: c.color }}>
              {c.kind} KPI
            </span>
            <StatusBadge status="DEMO" />
          </div>
          <p className="mt-2 text-[13.5px] font-semibold text-slate-600">{c.title}</p>
          <p className="mt-1 text-[30px] font-extrabold leading-none tracking-tight text-slate-900 tabular">
            {c.value == null ? '—' : <CountUp value={c.value} format={c.fmt} />}
            <span className="ml-1 text-[15px] font-bold text-slate-400">{c.value == null ? '측정 대기' : c.unit}</span>
          </p>
          <p className="mt-2 text-[12px] text-slate-500">{c.note}</p>
          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11.5px]">
            <Tag tone="amber">Baseline UNKNOWN</Tag>
            <span className="min-w-0 truncate text-slate-400">{c.measure}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MissionList({ missions, canManage }: { missions: Mission[]; canManage: boolean }) {
  if (!missions.length) return <p className="rounded-xl bg-slate-50 p-4 text-[13px] text-slate-500">지금 급한 일이 없어요. 고객 화면에서 체크인·구매 요청을 만들어 흐름을 확인해 보세요.</p>;
  return (
    <ol className="space-y-2">
      {missions.map((m, i) => (
        <li key={m.key}>
          <Link href={m.route} className="lift group flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-transparent hover:bg-white hover:ring-slate-200">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ax-primary text-[13px] font-extrabold text-white">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-[14.5px] font-bold text-slate-900">{m.title}</span>
                {m.managerOnly && !canManage && <Tag>책임자 권한</Tag>}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-slate-500">{m.detail}</span>
              <span className="mt-1 block text-[11.5px] text-slate-400">남는 실증 기록: {m.proof}</span>
            </span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function DailyChart({ data }: { data: { day: string; visits: number; purchases: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.visits + d.purchases));
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label="최근 14일 직원확인 방문·구매 수">
        {data.map((d) => {
          const total = d.visits + d.purchases;
          return (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="flex origin-bottom animate-growy flex-col justify-end overflow-hidden rounded-t-md" style={{ height: `${(total / max) * 100}%` }}>
                <div className="bg-[#3C9A75]" style={{ height: total ? `${(d.purchases / total) * 100}%` : 0 }} />
                <div className="bg-[#5B8DEF]" style={{ height: total ? `${(d.visits / total) * 100}%` : 0 }} />
              </div>
              {total === 0 && <div className="h-[3px] rounded bg-slate-100" />}
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white group-hover:block">
                방문 {d.visits} · 구매 {d.purchases}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] text-slate-400 tabular">
        <span>{data[0]?.day.slice(5)}</span>
        <span>오늘</span>
      </div>
      <div className="mt-2 flex gap-3 text-[11.5px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#5B8DEF]" /> 확인 방문
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#3C9A75]" /> 확인 구매
        </span>
      </div>
    </div>
  );
}

export function EvidenceBars({ levels }: { levels: Record<'LINK_CLICK' | 'SELF_REPORT' | 'STAFF_CONFIRMED' | 'POS_VERIFIED', number> }) {
  const rows = [
    { k: 'LINK_CLICK', l: '링크 클릭', d: '의향 신호 — 실적 아님', c: '#CBD5E1' },
    { k: 'SELF_REPORT', l: '자가신고·체크인 요청', d: '확인 전 — 실적 아님', c: '#94A3B8' },
    { k: 'STAFF_CONFIRMED', l: '직원 확인', d: 'KPI 집계 기준', c: '#3C9A75' },
    { k: 'POS_VERIFIED', l: 'POS 검증', d: '연동권 확인 전 — 미연결', c: '#0E7663' },
  ] as const;
  const max = Math.max(1, ...Object.values(levels));
  return (
    <ul className="space-y-3" data-testid="evidence-levels">
      {rows.map((r) => (
        <li key={r.k}>
          <div className="flex items-baseline justify-between text-[12.5px]">
            <span className="font-semibold text-slate-700">{r.l}</span>
            <span className="font-bold text-slate-900 tabular">{levels[r.k]}</span>
          </div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full origin-left animate-grow rounded-full" style={{ width: `${(levels[r.k] / max) * 100}%`, background: r.c }} />
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">{r.d}</p>
        </li>
      ))}
    </ul>
  );
}

/** 확인 큐 한 줄 + 처리 */
export function QueueRow({ s, t, canVerify, compact }: { s: AppState; t: AdminTask; canVerify: boolean; compact?: boolean }) {
  const run = useRun();
  const [reject, setReject] = useState(false);
  const [confirmBuy, setConfirmBuy] = useState(false);
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const user = getProfile(s, t.userId);
  const store = s.stores.find((x) => x.id === t.storeId);
  const v = t.type === 'VERIFY_PURCHASE' ? s.verifications.find((x) => x.id === t.refId) : null;
  const items = v?.menuItemIds.map((i) => getMenuItem(s, i)?.name).filter(Boolean).join(', ');
  const isVerify = t.type === 'VERIFY_CHECKIN' || t.type === 'VERIFY_PURCHASE';
  const wait = Math.round((Date.now() - new Date(t.createdAt).getTime()) / 60000);
  const approve = () => {
    if (t.type === 'VERIFY_CHECKIN') run(() => opAct((d, c) => D.decideCheckin(d, c, t.refId, true)), '방문을 확인했어요. 스탬프·추천 보상이 반영됐어요.');
    else setConfirmBuy(true);
  };
  return (
    <li className={cx('flex flex-col gap-3 rounded-xl bg-white p-3.5 ring-1 ring-slate-200/70 transition hover:ring-slate-300 sm:flex-row sm:items-center', compact && 'p-3')} data-testid="queue-row">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold', t.type === 'VERIFY_CHECKIN' ? 'bg-[#5B8DEF1F] text-[#3F6FD8]' : 'bg-[#3C9A751F] text-[#2F7F61]')}>{user?.name.slice(0, 1) ?? '·'}</span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 text-[14px] font-bold text-slate-900">
            {user ? <Link href={`/ax/members/${user.id}`} className="hover:underline">{user.name}</Link> : t.title}
            {user && <span className="text-[12px] font-semibold text-slate-400">{user.memberCode}</span>}
            <Tag tone={t.type === 'VERIFY_CHECKIN' ? 'blue' : t.type === 'VERIFY_PURCHASE' ? 'green' : 'violet'}>
              {{ VERIFY_CHECKIN: '방문 체크인', VERIFY_PURCHASE: '구매 확인', PHOTO_REVIEW: '사진 승인', CUSTOMER_REQUEST: '고객 요청', REFERRAL_REVIEW: '보상 검토', REORDER_REVIEW: '재구매' }[t.type]}
            </Tag>
          </p>
          <p className="mt-0.5 text-[12.5px] text-slate-500">
            {store?.name ?? ''} {items ? `· ${items}` : ''} {v?.note ? `· "${v.note}"` : ''} {!isVerify ? t.title : ''}
          </p>
          <p className={cx('mt-0.5 flex items-center gap-1 text-[11.5px]', wait > 30 ? 'font-semibold text-red-600' : 'text-slate-400')}>
            <Clock3 className="h-3 w-3" /> {relTime(t.createdAt)} 요청 {wait > 30 && '· 대기 길어짐'}
          </p>
        </div>
      </div>
      {isVerify ? (
        canVerify ? (
          <div className="flex shrink-0 gap-2">
            <Button tone="ax" variant="outline" size="sm" onClick={() => setReject(true)} data-testid="queue-reject">
              <X className="h-3.5 w-3.5" /> 반려
            </Button>
            <Button tone="ax" size="sm" onClick={approve} data-testid="queue-approve">
              <Check className="h-3.5 w-3.5" /> 확인
            </Button>
          </div>
        ) : (
          <Locked reason="확인 권한 없음" />
        )
      ) : (
        <Link href={t.type === 'PHOTO_REVIEW' ? '/ax/content?tab=photos' : t.userId ? `/ax/members/${t.userId}` : '/ax/rewards?tab=referrals'} className="shrink-0 text-[12.5px] font-semibold text-ax-primary hover:underline">
          처리하러 가기 →
        </Link>
      )}
      <Sheet
        open={reject}
        onClose={() => setReject(false)}
        tone="ax"
        title="반려 사유"
        description="고객에게 사유가 알림으로 전달돼요."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setReject(false)}>
              취소
            </Button>
            <Button
              tone="ax"
              variant="danger"
              onClick={() => {
                const ok = run(() => opAct((d, c) => (t.type === 'VERIFY_CHECKIN' ? D.decideCheckin(d, c, t.refId, false, reason) : D.decidePurchase(d, c, t.refId, false, { reason }))), '반려했어요.');
                if (ok !== undefined) setReject(false);
              }}
            >
              반려하기
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          {['매장 방문 확인 불가', '구매 기록 없음', '중복 요청', '다른 매장 요청'].map((r) => (
            <button key={r} onClick={() => setReason(r)} className={cx('rounded-full px-3 py-1.5 text-[12.5px] font-semibold ring-1', reason === r ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200')}>
              {r}
            </button>
          ))}
        </div>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="직접 입력" className="mt-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-ax-primary" />
      </Sheet>
      <Sheet
        open={confirmBuy}
        onClose={() => setConfirmBuy(false)}
        tone="ax"
        title="구매 확인"
        description={`${user?.name} · ${store?.name}${items ? ` · ${items}` : ''}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setConfirmBuy(false)}>
              취소
            </Button>
            <Button
              tone="ax"
              data-testid="purchase-confirm"
              onClick={() => {
                const n = amount.trim() ? Number(amount.replace(/[^0-9]/g, '')) : null;
                const ok = run(() => opAct((d, c) => D.decidePurchase(d, c, t.refId, true, { amount: n })), '구매를 확인했어요. 스탬프·추천 보상이 반영됐어요.');
                if (ok !== undefined) setConfirmBuy(false);
              }}
            >
              확인 완료
            </Button>
          </div>
        }
      >
        <label className="block text-[13px] font-semibold text-slate-600">
          결제 금액 (선택)
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="예: 4500" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-ax-primary" />
        </label>
        <p className="mt-2 text-[12px] text-slate-500">영수증·카운터 기록으로 확인한 경우에만 확인해 주세요. 금액은 매출 귀속 분석에 쓰이며, 모르면 비워 두세요.</p>
      </Sheet>
    </li>
  );
}
