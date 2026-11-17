'use client';
/**
 * 운영 AX 홈 — 실제 매장 업무 우선순위
 *  ① 지금 처리할 일  ② 오늘 매장 현황  ③ 다음 행동  ④ 분석·실증
 */
import { AlertTriangle, ArrowRight, BarChart3, ClipboardCheck, Gift, Image as ImageIcon, KeyRound, PlusCircle, Repeat2, ShieldCheck, Ticket, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CounterPurchase, CouponRedeem } from '@/components/ax/CounterTools';
import { Panel, Tag, useOperator } from '@/components/ax/Shell';
import { DailyChart, EvidenceBars, MissionList, MoneyKpiCards, QueueRow } from '@/components/ax/widgets';
import { Button, PageSkeleton } from '@/components/ui';
import { coachMissions, computeKpis, computeReorderCandidates, contentFixes, dailyVerified, DELAY_MINUTES, evidenceLevels, funnel, segmentMembers, todayStats, urgentWork } from '@/lib/rules';
import { cx, dailyCheckinCode, fmtDate } from '@/lib/util';

function Tier({ n, title, sub, children, action }: { n: number; title: string; sub: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section aria-labelledby={`tier-${n}`} className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.8125rem] font-bold tracking-[0.12em] text-slate-500">{['', '① 지금', '② 오늘', '③ 다음', '④ 분석'][n]}</p>
          <h2 id={`tier-${n}`} className="text-[1.1875rem] font-extrabold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="text-[0.875rem] text-slate-500">{sub}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, sub, icon, tone }: { label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="ax-card min-w-0 p-4">
      <div className="flex items-center gap-2">
        <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg', tone)}>{icon}</span>
        <span className="text-[0.875rem] font-semibold text-slate-600">{label}</span>
      </div>
      <p data-stat-value className="mt-2 text-[1.625rem] font-extrabold leading-none tracking-tight text-slate-900 tabular">{value}</p>
      {sub && <p className="mt-1.5 text-[0.8125rem] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function AxDashboard() {
  const { s, can } = useOperator();
  const [counter, setCounter] = useState(false);
  const [redeem, setRedeem] = useState(false);
  if (!s) return <PageSkeleton />;
  const now = new Date();
  const u = urgentWork(s, now);
  const t = todayStats(s, now);
  const k = computeKpis(s);
  const f = funnel(s);
  const missions = coachMissions(s);
  const fixes = contentFixes(s);
  const reorder = s.reorderCandidates.filter((c) => c.status === 'SUGGESTED').length + computeReorderCandidates(s, now).length;
  const lapsed = segmentMembers(s, 'LAPSED_30', now).length;
  const newNo = segmentMembers(s, 'NEW_NO_VISIT', now).length;
  const queue = [...u.verify].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const otherCount = u.requests.length + u.rewardReview.length + u.photos.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.9375rem] font-medium text-slate-600">
          {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' })} · 데이터 기준 {fmtDate(now.toISOString(), { time: true })}
        </p>
        <span className="text-[0.875rem] text-slate-500">모든 숫자는 DEMO 시드 기반 — 실제 실적이 아닙니다</span>
      </div>

      {/* ① 지금 처리할 일 */}
      <Tier
        n={1}
        title="지금 처리할 일"
        sub="손님이 카운터 앞에서 기다리는 일부터 — 확인해야 스탬프·추천 보상이 지급돼요"
        action={
          <div className="hidden gap-2 md:flex">
            <Button tone="ax" variant="outline" onClick={() => setRedeem(true)}>
              <Ticket className="h-4 w-4" /> 쿠폰 사용
            </Button>
            <Button tone="ax" onClick={() => setCounter(true)} disabled={!can('purchase.create')}>
              <PlusCircle className="h-4 w-4" /> 회원코드로 구매 등록
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4" data-testid="urgent-summary">
          {[
            { l: '방문·구매 확인 대기', v: u.verify.length, href: '/ax/queue', icon: ClipboardCheck, hot: u.verify.length > 0 },
            { l: `${DELAY_MINUTES}분 넘게 지연`, v: u.delayed.length, href: '/ax/queue', icon: AlertTriangle, hot: u.delayed.length > 0, danger: true },
            { l: '고객 요청·보상 검토', v: u.requests.length + u.rewardReview.length, href: '/ax/queue?tab=other', icon: Users, hot: u.requests.length + u.rewardReview.length > 0 },
            { l: '사진 공개 승인', v: u.photos.length, href: '/ax/content?tab=photos', icon: ImageIcon, hot: u.photos.length > 0 },
          ].map((x) => (
            <Link key={x.l} href={x.href} className={cx('lift flex min-h-[76px] items-center gap-3 rounded-2xl border p-3.5 shadow-[0_1px_2px_rgba(15,23,42,.05)]', x.hot ? (x.danger ? 'border-red-300 bg-red-50' : 'border-ax-primary/40 bg-white') : 'border-axline bg-white')}>
              <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', x.hot ? (x.danger ? 'bg-red-100 text-red-700' : 'bg-ax-soft text-ax-primary') : 'bg-slate-100 text-slate-500')}>
                <x.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className={cx('block text-[1.5rem] font-extrabold leading-none tabular', x.hot && x.danger ? 'text-red-700' : 'text-slate-900')}>{x.v}</span>
                <span className="mt-1 block text-[0.875rem] font-semibold leading-tight text-slate-700">{x.l}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Panel title={`확인 대기 ${queue.length}건`} sub="오래 기다린 순 · 버튼 한 번으로 처리" action={<Link href="/ax/queue" className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-[0.875rem] font-bold text-ax-primary hover:underline lg:min-h-9">전체 큐</Link>}>
            {queue.length ? (
              <ul className="space-y-2">
                {queue.slice(0, 5).map((task) => (
                  <QueueRow key={task.id} s={s} t={task} canVerify={can('queue.verify')} compact />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-slate-50 p-4 text-[0.9375rem] text-slate-600">대기 중인 확인 요청이 없어요. 👍</p>
            )}
            {otherCount > 0 && (
              <Link href="/ax/queue?tab=other" className="mt-2 flex min-h-11 items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-[0.9375rem] font-semibold text-violet-800 hover:bg-violet-100">
                사진·고객 요청·보상 검토 {otherCount}건도 기다리고 있어요 <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </Panel>
          <div className="space-y-4">
            <Panel title="오늘의 체크인 코드" sub="카운터에 게시 · 매일 자동 변경" testId="today-codes">
              <div className="grid grid-cols-2 gap-2">
                {s.stores.map((st) => (
                  <div key={st.id} className="ax-well p-3 text-center">
                    <p className="text-[0.875rem] font-semibold text-slate-600">{st.name}</p>
                    <p className="mt-1 font-mono text-[1.75rem] font-extrabold tracking-[0.2em] text-slate-900" data-testid={`code-${st.id}`}>
                      {dailyCheckinCode(st.id)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 flex items-start gap-1.5 text-[0.875rem] text-slate-600">
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" /> 코드가 맞아도 직원 확인 전에는 적립되지 않아요.
              </p>
            </Panel>
            <div className="grid grid-cols-2 gap-2 md:hidden">
              <Button tone="ax" variant="outline" className="h-12" onClick={() => setRedeem(true)}>
                <Ticket className="h-4 w-4" /> 쿠폰 사용
              </Button>
              <Button tone="ax" className="h-12" onClick={() => setCounter(true)} disabled={!can('purchase.create')}>
                <PlusCircle className="h-4 w-4" /> 구매 등록
              </Button>
            </div>
            {u.expiringCoupons > 0 && (
              <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[0.9375rem] font-semibold text-amber-900">
                <Gift className="h-4 w-4" /> 3일 안에 만료되는 쿠폰 {u.expiringCoupons}장 — 방문 시 안내해 주세요
              </p>
            )}
          </div>
        </div>
      </Tier>

      {/* ② 오늘 매장 현황 */}
      <Tier n={2} title="오늘 매장 현황" sub="직원이 확인한 이용만 집계 · 클릭·자가신고는 제외">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6" data-testid="today-stats">
          <Stat label="확인된 구매" value={t.purchasesToday} sub="오늘" icon={<ClipboardCheck className="h-4 w-4" />} tone="bg-[#E3F3EC] text-[#1F6648]" />
          <Stat label="확인된 방문" value={t.visitsToday} sub="오늘" icon={<ClipboardCheck className="h-4 w-4" />} tone="bg-[#E6EEFC] text-[#2A55B0]" />
          <Stat label="신규 회원" value={t.newMembersToday} sub="오늘 가입" icon={<UserPlus className="h-4 w-4" />} tone="bg-[#FBF0DD] text-[#8A5A12]" />
          <Stat label="재이용 고객" value={t.returningToday} sub="오늘 · 누적 2회 이상" icon={<Repeat2 className="h-4 w-4" />} tone="bg-violet-50 text-violet-700" />
          <Stat label="확인 매출 (입력분)" value={`${t.amountToday.toLocaleString()}원`} sub="오늘 · 직원 입력 금액만" icon={<BarChart3 className="h-4 w-4" />} tone="bg-slate-100 text-slate-600" />
          <Stat label="최근 7일 확인 매출" value={`${t.amount7.toLocaleString()}원`} sub={`구매 ${t.purchases7}건 중 금액 입력 ${t.purchasesWithAmount7}건`} icon={<BarChart3 className="h-4 w-4" />} tone="bg-slate-100 text-slate-600" />
        </div>
        <Panel title="회원 전환" sub="가입 → 첫 확인 이용 → 재이용 · 추천">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              ['가입 회원', f.signedUp, null],
              ['첫 확인 이용', f.firstUse, f.signedUp],
              ['2회 이상 이용', f.repeat, f.firstUse],
              ['추천 → 보상 확정', `${f.referred} → ${f.referralRewarded}`, null],
            ].map(([l, v, base]) => (
              <div key={String(l)} className="ax-well p-3.5">
                <p className="text-[0.875rem] font-semibold text-slate-600">{l}</p>
                <p className="mt-1 text-[1.375rem] font-extrabold text-slate-900 tabular">{v}</p>
                {typeof v === 'number' && typeof base === 'number' && base > 0 && <p className="text-[0.875rem] text-slate-500">이전 단계의 {Math.round((v / base) * 100)}%</p>}
              </div>
            ))}
          </div>
        </Panel>
      </Tier>

      {/* ③ 다음 행동 */}
      <Tier n={3} title="다음 행동" sub="오늘 손님 응대 후 시간이 날 때 — 재방문·콘텐츠·캠페인">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Panel title="AX Coach 우선순위" sub="규칙으로 고른 1~3개 · 처리하면 실증 기록이 남아요" action={<Link href="/ax/coach" className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-[0.875rem] font-bold text-ax-primary hover:underline lg:min-h-9">전체</Link>}>
            <MissionList missions={missions} canManage={can('campaign.approve')} />
          </Panel>
          <div className="space-y-4">
            <Panel title="재방문 기회">
              <ul className="space-y-2 text-[0.9375rem]">
                <li>
                  <Link href="/ax/reorder" className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-semibold text-slate-800 hover:bg-slate-100">
                    저장했지만 구매 없는 고객 · 재구매 안내 후보 <span className="text-[1.0625rem] font-extrabold tabular">{reorder}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/ax/campaigns?segment=LAPSED_30" className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-semibold text-slate-800 hover:bg-slate-100">
                    30일 이상 미방문 (알림 동의) <span className="text-[1.0625rem] font-extrabold tabular">{lapsed}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/ax/campaigns?segment=NEW_NO_VISIT" className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-semibold text-slate-800 hover:bg-slate-100">
                    가입 후 첫 이용 없음 (알림 동의) <span className="text-[1.0625rem] font-extrabold tabular">{newNo}</span>
                  </Link>
                </li>
              </ul>
            </Panel>
            <Panel title="고객 화면 콘텐츠 채우기" sub="실제 정보로 바꿀수록 고객이 믿고 방문해요">
              {fixes.length ? (
                <ul className="space-y-1.5" data-testid="content-fixes">
                  {fixes.map((x) => (
                    <li key={x.key}>
                      <Link href={x.route} className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 py-2 text-[0.9375rem] font-medium text-slate-700 hover:bg-slate-50">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {x.label}
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[0.875rem] text-slate-500">채워야 할 콘텐츠가 없어요.</p>
              )}
            </Panel>
          </div>
        </div>
      </Tier>

      {/* ④ 분석·실증 */}
      <Tier n={4} title="분석 · 실증" sub="Money KPI · 근거 수준 · 실증 기록 — 주간 점검용" action={<Link href="/ax/evidence" className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-[0.875rem] font-bold text-ax-primary hover:underline lg:min-h-9">Proof·12주 실증</Link>}>
        <MoneyKpiCards k={k} />
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="최근 14일 확인 이용" className="xl:col-span-2">
            <DailyChart data={dailyVerified(s)} />
          </Panel>
          <Panel title="근거 수준 (30일)" sub="클릭·자가신고는 실적에 섞지 않아요">
            <EvidenceBars levels={evidenceLevels(s)} />
          </Panel>
        </div>
        <Panel title="최근 실증 기록 (Proof Event)" sub="Trigger → 결정 → 승인 → 조치 → 결과" action={<Link href="/ax/evidence" className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-[0.875rem] font-bold text-ax-primary hover:underline lg:min-h-9">전체</Link>}>
          <ul className="divide-y divide-slate-100">
            {s.proofEvents.slice(0, 5).map((p) => (
              <li key={p.proof_event_id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <ShieldCheck className="hidden h-4 w-4 shrink-0 text-[#3C9A75] sm:block" />
                <Tag tone="green">{p.event_type}</Tag>
                <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-slate-700">
                  {p.trigger} → {p.result}
                </span>
                <span className="shrink-0 text-[0.875rem] text-slate-500">
                  {p.decision_method} · {fmtDate(p.created_at, { time: true })}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </Tier>

      <CounterPurchase s={s} open={counter} onClose={() => setCounter(false)} />
      <CouponRedeem s={s} open={redeem} onClose={() => setRedeem(false)} />
    </div>
  );
}
