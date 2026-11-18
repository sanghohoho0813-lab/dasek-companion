'use client';
/**
 * 운영 AX 홈 (4차) — 1초 안에 '무엇을 하는 프로그램인지'와 '지금 무엇을 누를지'
 *  · 정체성 한 줄 → ① 지금 처리할 일(한 번에 확인) → ② 오늘 현황 3개 → 빠른 업무
 *  · 나머지(전체 현황·추천 업무·분석)는 요약 후 펼치기/상세 화면으로 단계 공개
 *  · 직원: 확인·회원·쿠폰 중심 / 책임자: + 다시 올 고객·분석·성과
 */
import { AlertTriangle, ArrowRight, BarChart3, ClipboardCheck, Gift, Image as ImageIcon, KeyRound, Megaphone, PlusCircle, Repeat2, Search, ShieldCheck, Ticket, UserPlus, Users, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CounterPurchase, CouponRedeem } from '@/components/ax/CounterTools';
import { Panel, Tag, useOperator } from '@/components/ax/Shell';
import { DailyChart, EvidenceBars, MissionList, MoneyKpiCards, QueueRow } from '@/components/ax/widgets';
import { useDevice } from '@/components/device/Device';
import { Disclosure, PageSkeleton, Sheet } from '@/components/ui';
import { coachMissions, computeKpis, computeReorderCandidates, contentFixes, dailyVerified, DELAY_MINUTES, evidenceLevels, funnel, segmentMembers, todayStats, urgentWork } from '@/lib/rules';
import { methodLabel, proofLabel } from '@/lib/labels';
import { cx, dailyCheckinCode, fmtDate } from '@/lib/util';

function SectionTitle({ n, title, right }: { n: number; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={`tier-${n}`} className="text-[1.125rem] font-extrabold tracking-tight text-slate-900 md:text-[1.1875rem]">
        {title}
      </h2>
      {right}
    </div>
  );
}

const MoreLink = ({ href, children, testId }: { href: string; children: React.ReactNode; testId?: string }) => (
  <Link href={href} data-testid={testId} className="-mr-2 inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg px-2 text-[0.9375rem] font-bold text-ax-primary hover:underline lg:min-h-9">
    {children} <ArrowRight className="h-4 w-4" />
  </Link>
);

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

/** 자동 생성 문장 안의 영문 표기를 화면용 한글로 */
const ko = (t: string) => t.replace(/\(RULE\)/g, '(규칙)').replace(/\(HUMAN\)/g, '(직원 확인)').replace(/POS/g, '계산대(POS)').replace(/^세그먼트:/, '알림 대상:');

type QA = { key: string; label: string; icon: React.ComponentType<{ className?: string }>; href?: string; onClick?: () => void; tone: string; disabled?: boolean };

export default function AxDashboard() {
  const { s, op, can } = useOperator();
  const { desktop } = useDevice();
  const [counter, setCounter] = useState(false);
  const [redeem, setRedeem] = useState(false);
  const [codes, setCodes] = useState(false);
  if (!s || !op) return <PageSkeleton />;
  const now = new Date();
  const manager = op.role === 'manager';
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
  const oldestMin = queue[0] ? Math.round((now.getTime() - new Date(queue[0].createdAt).getTime()) / 60000) : 0;
  const lastRecord = s.auditLogs.reduce<string | null>((m, a) => (!m || a.at > m ? a.at : m), null);
  const shown = desktop ? 4 : 2;

  const quick: QA[] = [
    { key: 'members', label: '회원 검색', icon: Search, href: '/ax/members?focus=search', tone: 'bg-[#E6EEFC] text-[#2A55B0]' },
    { key: 'coupon', label: '쿠폰 사용', icon: Ticket, onClick: () => setRedeem(true), tone: 'bg-[#FBF0DD] text-[#8A5A12]', disabled: !can('coupon.redeem') },
    { key: 'purchase', label: '구매 등록', icon: PlusCircle, onClick: () => setCounter(true), tone: 'bg-[#E3F3EC] text-[#1F6648]', disabled: !can('purchase.create') },
    { key: 'codes', label: '체크인 코드', icon: KeyRound, onClick: () => setCodes(true), tone: 'bg-slate-100 text-slate-700' },
    { key: 'content', label: '메뉴·사진', icon: UtensilsCrossed, href: '/ax/content', tone: 'bg-orange-50 text-orange-800' },
    manager ? { key: 'campaign', label: '고객 알림', icon: Megaphone, href: '/ax/campaigns', tone: 'bg-violet-50 text-violet-800' } : { key: 'rewards', label: '쿠폰·혜택', icon: Gift, href: '/ax/rewards', tone: 'bg-violet-50 text-violet-800' },
  ];

  const codeCards = (
    <div className="grid grid-cols-2 gap-2" data-testid="today-codes">
      {s.stores.map((st) => (
        <div key={st.id} className="ax-well p-3 text-center">
          <p className="text-[0.875rem] font-semibold text-slate-600">{st.name}</p>
          <p className="mt-1 font-mono text-[1.75rem] font-extrabold tracking-[0.2em] text-slate-900" data-testid={`code-${st.id}`}>
            {dailyCheckinCode(st.id)}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5 md:space-y-6">
      {/* 정체성 — 이 프로그램이 무엇인지 한 줄로 */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1" data-testid="ax-identity">
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-bold tracking-[0.04em] text-ax-primary">
            다색컴패니언 BUSINESS AX<span className="font-semibold text-slate-500 md:hidden"> · DEMO 데이터</span>
          </p>
          <p className="mt-0.5 text-[0.9375rem] font-semibold leading-snug text-slate-800 md:text-[1rem]">리얼식단·다색냥 손님의 방문·구매·혜택·재방문을 한곳에서 관리합니다.</p>
        </div>
        <p className="hidden text-[0.8125rem] text-slate-500 md:block" data-testid="data-basis">
          <b className="font-semibold text-slate-700">DEMO 시연 데이터</b> · 실제 매출 아님
          {lastRecord ? <span className="hidden md:inline"> · 마지막 시연 기록 {fmtDate(lastRecord, { time: true })}</span> : null}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
        {/* ① 지금 처리할 일 */}
        <section aria-labelledby="tier-1" className="ax-card min-w-0 p-4 md:p-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="tier-1" className="text-[1.125rem] font-extrabold tracking-tight text-slate-900 md:text-[1.1875rem]">
              지금 처리할 일
            </h2>
            <p data-testid="urgent-count" className="shrink-0 text-slate-900">
              <span className="text-[2rem] font-extrabold leading-none tracking-tight tabular">{u.verify.length}</span>
              <span className="ml-1 text-[1rem] font-bold">건 확인 대기</span>
            </p>
          </div>
          {queue.length ? (
            <ul className="space-y-2">
              {queue.slice(0, shown).map((task) => (
                <QueueRow key={task.id} s={s} t={task} canVerify={can('queue.verify')} compact mini={!desktop} />
              ))}
            </ul>
          ) : (
            <p className="ax-well p-4 text-[0.9375rem] text-slate-600">지금 확인할 요청이 없어요.</p>
          )}
          {/* 그 밖에 기다리는 일 — 숨기지 않고 한 줄에 */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link href="/ax/queue" data-testid="queue-all" className={cx('flex min-h-11 min-w-0 items-center justify-between gap-1 rounded-xl border px-3 text-[0.9375rem] font-bold hover:bg-slate-50', u.delayed.length ? 'border-red-300 bg-red-50 text-red-800' : 'border-axline text-slate-800')}>
              <span className="truncate">
                {u.delayed.length ? <AlertTriangle className="mr-1 inline h-4 w-4 align-[-3px]" /> : null}
                전체 {queue.length}건{queue.length ? ` · 최장 ${oldestMin}분` : ''}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
            {otherCount > 0 ? (
              <Link href="/ax/queue?tab=other" className="flex min-h-11 min-w-0 items-center justify-between gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 text-[0.9375rem] font-semibold text-violet-800 hover:bg-violet-100">
                <span className="flex min-w-0 items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 shrink-0" /> <span className="truncate">사진·요청 {otherCount}건</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : (
              <span />
            )}
            {u.expiringCoupons > 0 && (
              <p className="col-span-2 flex min-h-11 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-[0.9375rem] font-semibold text-amber-900">
                <Gift className="h-4 w-4 shrink-0" /> <span className="truncate">3일 안에 끝나는 쿠폰 {u.expiringCoupons}장 — 방문 시 안내</span>
              </p>
            )}
          </div>
          {u.delayed.length > 0 && <p className="mt-2 text-[0.875rem] font-semibold text-red-700">{DELAY_MINUTES}분 넘게 기다린 요청 {u.delayed.length}건이 있어요.</p>}
        </section>

        <div className="min-w-0 space-y-4">
          {/* ② 오늘 매장 현황 — 3개만, 나머지는 펼치기 */}
          <section aria-labelledby="tier-2" className="ax-card p-4 md:p-5">
            <SectionTitle n={2} title="오늘 매장 현황" right={<span className="text-[0.8125rem] font-semibold text-slate-500">직원 확인 기준 · DEMO</span>} />
            <div className="grid grid-cols-3 gap-2" data-testid="kpi-strip">
              {[
                { l: '확인 구매', v: `${t.purchasesToday}`, unit: '건' },
                { l: '신규 회원', v: `${t.newMembersToday}`, unit: '명' },
                { l: '확인 매출', v: t.amountToday >= 10000 ? `${Math.round(t.amountToday / 1000) / 10}` : t.amountToday.toLocaleString(), unit: t.amountToday >= 10000 ? '만원' : '원' },
              ].map((x) => (
                <div key={x.l} className="ax-well min-w-0 px-3 py-2.5">
                  <p className="truncate text-[0.875rem] font-semibold text-slate-600">{x.l}</p>
                  <p className="mt-0.5 whitespace-nowrap text-slate-900">
                    <span className="text-[1.75rem] font-extrabold leading-none tracking-tight tabular">{x.v}</span>
                    <span className="ml-0.5 text-[0.875rem] font-bold text-slate-600">{x.unit}</span>
                  </p>
                </div>
              ))}
            </div>
            <Disclosure tone="ax" label="전체 현황 보기" openLabel="전체 현황 접기" hint="방문·7일 매출 등" className="mt-3" testId="today-more">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3" data-testid="today-stats">
                <Stat label="확인된 구매" value={t.purchasesToday} sub="오늘" icon={<ClipboardCheck className="h-4 w-4" />} tone="bg-[#E3F3EC] text-[#1F6648]" />
                <Stat label="확인된 방문" value={t.visitsToday} sub="오늘" icon={<ClipboardCheck className="h-4 w-4" />} tone="bg-[#E6EEFC] text-[#2A55B0]" />
                <Stat label="신규 회원" value={t.newMembersToday} sub="오늘 가입" icon={<UserPlus className="h-4 w-4" />} tone="bg-[#FBF0DD] text-[#8A5A12]" />
                <Stat label="재이용 고객" value={t.returningToday} sub="오늘 · 누적 2회 이상" icon={<Repeat2 className="h-4 w-4" />} tone="bg-violet-50 text-violet-700" />
                <Stat label="확인 매출 (입력분)" value={`${t.amountToday.toLocaleString()}원`} sub="오늘 · 직원 입력 금액만" icon={<BarChart3 className="h-4 w-4" />} tone="bg-slate-100 text-slate-600" />
                <Stat label="최근 7일 확인 매출" value={`${t.amount7.toLocaleString()}원`} sub={`구매 ${t.purchases7}건 중 금액 입력 ${t.purchasesWithAmount7}건`} icon={<BarChart3 className="h-4 w-4" />} tone="bg-slate-100 text-slate-600" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ['가입 회원', f.signedUp, null],
                  ['첫 확인 이용', f.firstUse, f.signedUp],
                  ['2회 이상 이용', f.repeat, f.firstUse],
                  ['추천 → 보상 확정', `${f.referred} → ${f.referralRewarded}`, null],
                ].map(([l, v, base]) => (
                  <div key={String(l)} className="ax-well p-3">
                    <p className="text-[0.875rem] font-semibold text-slate-600">{l}</p>
                    <p className="mt-1 text-[1.25rem] font-extrabold text-slate-900 tabular">{v}</p>
                    {typeof v === 'number' && typeof base === 'number' && base > 0 && <p className="text-[0.8125rem] text-slate-500">이전 단계의 {Math.round((v / base) * 100)}%</p>}
                  </div>
                ))}
              </div>
            </Disclosure>
          </section>

          {/* 빠른 업무 */}
          <section aria-labelledby="quick-title" className="ax-card p-4 md:p-5" data-testid="quick-actions">
            <h2 id="quick-title" className="mb-3 text-[1.125rem] font-extrabold tracking-tight text-slate-900">
              빠른 업무
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {quick.map((q) => {
                const inner = (
                  <>
                    <span className={cx('grid h-10 w-10 place-items-center rounded-xl', q.tone)}>
                      <q.icon className="h-5 w-5" />
                    </span>
                    <span className="text-[0.9375rem] font-bold leading-tight text-slate-800">{q.label}</span>
                  </>
                );
                const cls = 'flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-xl border border-axline bg-white px-1 py-2 text-center transition hover:border-slate-400 hover:bg-slate-50 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60';
                return q.href ? (
                  <Link key={q.key} href={q.href} className={cls} data-testid={`qa-${q.key}`}>
                    {inner}
                  </Link>
                ) : (
                  <button key={q.key} onClick={q.onClick} disabled={q.disabled} className={cls} data-testid={`qa-${q.key}`}>
                    {inner}
                  </button>
                );
              })}
            </div>
          </section>

          {/* PC 에서는 체크인 코드를 바로 보이게 (카운터 옆 모니터) */}
          {desktop && (
            <Panel title="오늘의 체크인 코드" sub="카운터에 게시 · 매일 자동 변경 · 직원 확인 전에는 적립 안 됨">
              {codeCards}
            </Panel>
          )}
        </div>
      </div>

      {/* ③ 다음 행동 — 미리보기 2건 + 전체 */}
      <section aria-labelledby="tier-3">
        <SectionTitle n={3} title="다음 행동" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="오늘 추천 업무" sub="규칙으로 고른 할 일 · 처리하면 성과 기록이 남아요" action={<MoreLink href="/ax/coach">전체 {missions.length}건</MoreLink>}>
            <MissionList missions={missions.slice(0, 2)} canManage={can('campaign.approve')} />
          </Panel>
          <div className="space-y-4">
            {manager && (
              <Panel title="다시 올 고객" sub="알림 수신에 동의한 고객만">
                <ul className="space-y-2 text-[0.9375rem]">
                  {[
                    { href: '/ax/reorder', l: '메뉴를 저장했지만 아직 구매 안 함', n: reorder },
                    { href: '/ax/campaigns?segment=LAPSED_30', l: '30일 넘게 방문 없음', n: lapsed },
                    { href: '/ax/campaigns?segment=NEW_NO_VISIT', l: '가입 후 첫 이용 없음', n: newNo },
                  ].map((x) => (
                    <li key={x.href}>
                      <Link href={x.href} className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-semibold text-slate-800 hover:bg-slate-100">
                        {x.l} <span className="text-[1.125rem] font-extrabold tabular">{x.n}명</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            <div className="ax-card p-4 md:p-5">
              <Disclosure tone="ax" label="고객 화면 채우기" hint={fixes.length ? `${fixes.length}개 남음` : '완료'} defaultOpen={false}>
                {fixes.length ? (
                  <ul className="space-y-1" data-testid="content-fixes">
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
                  <p className="text-[0.875rem] text-slate-500" data-testid="content-fixes">
                    채워야 할 콘텐츠가 없어요.
                  </p>
                )}
              </Disclosure>
            </div>
          </div>
        </div>
      </section>

      {/* ④ 분석 · 성과 — 책임자만, 요약 후 펼치기 */}
      {manager && (
        <section aria-labelledby="tier-4" className="ax-card p-4 md:p-5">
          <SectionTitle n={4} title="분석 · 성과" right={<span className="text-[0.8125rem] font-semibold text-slate-500">주간 점검용 · DEMO</span>} />
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: '확인 처리 시간', v: k.costMedianMinutes == null ? '측정 대기' : `${k.costMedianMinutes}분`, href: '/ax/evidence' },
              { l: '30일 재이용률', v: k.revenueRepeatRate == null ? '측정 대기' : `${Math.round(k.revenueRepeatRate * 100)}%`, href: '/ax/analytics' },
              { l: '운영자 1인당 고객', v: k.scaleActivePerOperator == null ? '측정 대기' : `${k.scaleActivePerOperator.toFixed(1)}명`, href: '/ax/analytics' },
            ].map((x) => (
              <Link key={x.l} href={x.href} className="ax-well min-w-0 px-3 py-2.5 hover:bg-white">
                <p className="truncate text-[0.875rem] font-semibold text-slate-600">{x.l}</p>
                <p className="mt-0.5 truncate text-[1.25rem] font-extrabold text-slate-900 tabular">{x.v}</p>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <MoreLink href="/ax/analytics">고객 이용 분석</MoreLink>
            <MoreLink href="/ax/reorder">다시 올 고객 찾기</MoreLink>
            <MoreLink href="/ax/evidence">성과 기록</MoreLink>
          </div>
          <Disclosure tone="ax" label="그래프·성과 기록 자세히 보기" openLabel="자세히 접기" className="mt-2" testId="insight-more">
            <div className="space-y-4">
              <MoneyKpiCards k={k} />
              <div className="grid gap-4 xl:grid-cols-3">
                <Panel title="최근 14일 확인 이용" className="xl:col-span-2">
                  <DailyChart data={dailyVerified(s)} />
                </Panel>
                <Panel title="근거 수준 (30일)" sub="클릭·자가신고는 실적에 섞지 않아요">
                  <EvidenceBars levels={evidenceLevels(s)} />
                </Panel>
              </div>
              <Panel title="최근 성과 기록" sub="요청 → 결정 → 승인 → 조치 → 결과">
                <ul className="divide-y divide-slate-100">
                  {s.proofEvents.slice(0, 5).map((p) => (
                    <li key={p.proof_event_id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                      <ShieldCheck className="hidden h-4 w-4 shrink-0 text-[#23704F] sm:block" />
                      <Tag tone="green">{proofLabel(p.event_type)}</Tag>
                      <span className="min-w-0 flex-1 truncate text-[0.9375rem] text-slate-700">
                        {ko(p.trigger)} → {ko(p.result)}
                      </span>
                      <span className="shrink-0 text-[0.875rem] text-slate-500">
                        {methodLabel(p.decision_method)} · {fmtDate(p.created_at, { time: true })}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </Disclosure>
        </section>
      )}

      {!manager && (
        <p className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.9375rem] text-slate-600">
          <Users className="h-4 w-4 shrink-0" /> 분석·성과 화면은 메뉴의 &lsquo;분석·성과&rsquo;에서 볼 수 있어요.
        </p>
      )}

      <Sheet open={codes} onClose={() => setCodes(false)} tone="ax" title="오늘의 체크인 코드" description="카운터에 게시 · 매일 자동 변경 · 직원 확인 전에는 적립되지 않아요" size="sm" testId="codes-sheet">
        {codeCards}
      </Sheet>
      <CounterPurchase s={s} open={counter} onClose={() => setCounter(false)} />
      <CouponRedeem s={s} open={redeem} onClose={() => setRedeem(false)} />
    </div>
  );
}
