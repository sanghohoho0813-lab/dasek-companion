'use client';
/**
 * 발표용 시연 모드 (/demo) — 투자자·심사(TIPS 등) 발표에서 '고객 → 직원 확인 → 보상 → 성과 기록' 순환을 순서대로 보여준다.
 *  · 왼쪽: 단계·발표 멘트·실행 버튼·지금 숫자 / 오른쪽: 고객 화면(휴대폰)과 운영 AX(PC)를 나란히(같은 앱·같은 데이터)
 *  · 실행 버튼은 실제 도메인 로직(가입·체크인·직원 확인·알림 발송)을 그대로 호출한다 — 가짜 애니메이션 아님
 *  · 데이터는 이 브라우저의 DEMO 저장소를 쓴다. '처음부터'는 시연 데이터를 초기화한다.
 */
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LayoutDashboard, Monitor, Play, RotateCcw, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogoMark } from '@/components/shell/Logo';
import { ExpansionOverview } from '@/components/shell/Expansion';
import { Button, Sheet, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { couponsFor, stampCount } from '@/lib/rules';
import { dispatch, resetDemo, useAppState } from '@/lib/store';
import type { AppState } from '@/lib/types';
import { cx, dailyCheckinCode, nowIso } from '@/lib/util';

const DEMO_NAME = '시연 고객';
const REFERRER = '하늘';
const STORE = 'store_dasek';
const MSG_NAV = 'dasek:navigate';

type Step = {
  key: string;
  title: string;
  say: string[];
  point: string;
  customer: string;
  ax: string;
  action?: { label: string; done: (s: AppState) => boolean; run: () => string };
  extra?: 'expansion';
};

const demoUser = (s: AppState) => s.profiles.find((p) => p.name === DEMO_NAME && p.role === 'customer' && p.status === 'active') ?? null;
const ctxOf = (actorId: string | null, actorRole: 'customer' | 'staff' | 'manager'): D.Ctx => ({ now: nowIso(), actorId, actorRole, isDemo: true });

const STEPS: Step[] = [
  {
    key: 'intro',
    title: '다색컴패니언은 무엇인가',
    say: ['리얼식단(샐러드·도시락)과 다색냥(고양이카페)을 함께 쓰는 고객 앱과, 매장이 쓰는 운영관리 프로그램입니다.', '고객 화면과 운영 화면이 같은 데이터로 연결돼 있습니다.'],
    point: '한 번 오고 끝나는 매장 → 다시 오게 만드는 매장',
    customer: '/',
    ax: '/ax',
  },
  {
    key: 'explore',
    title: '고객이 메뉴와 고양이를 둘러봅니다',
    say: ['사진 중심으로 메뉴와 고양이 25마리를 둘러보고, 마음에 드는 메뉴를 저장합니다.', '가입하지 않아도 둘러볼 수 있습니다.'],
    point: '방문 전 기대감 → 첫 방문 전환',
    customer: '/dasek',
    ax: '/ax/content',
  },
  {
    key: 'signup',
    title: '친구 추천 코드로 가입',
    say: ['기존 회원(하늘)의 추천 코드로 가입하면, 바로 가입 쿠폰이 쿠폰함에 들어갑니다.', '추천한 친구의 보상은 아직 ‘대기’ — 첫 방문이 확인돼야 지급됩니다.'],
    point: '추천 보상은 실제 방문 확인 후에만 → 허수 가입 방지',
    customer: '/my/coupons',
    ax: '/ax/members',
    action: {
      label: '시연 고객으로 가입하기',
      done: (s) => !!demoUser(s),
      run: () =>
        dispatch((d) => {
          const ref = d.profiles.find((p) => p.name.startsWith(REFERRER) && p.role === 'customer')?.referralCode ?? undefined;
          D.signup(d, ctxOf(null, 'customer'), {
            name: DEMO_NAME,
            phone: '',
            consents: { terms: true, privacy: true, age14: true, marketing_inapp: true, marketing_push: false, marketing_kakao: false },
            referralCode: ref,
            preferredBrands: ['dasek', 'realsicdan'],
          });
          return '가입 완료 — 가입 쿠폰이 발급되고 추천 보상은 대기 중이에요.';
        }),
    },
  },
  {
    key: 'checkin',
    title: '매장에 와서 체크인',
    say: ['카운터의 ‘오늘의 코드’를 입력하면 방문 확인 요청이 운영 화면으로 바로 들어갑니다.', '아직 스탬프는 쌓이지 않습니다 — 직원 확인이 필요합니다.'],
    point: '링크 클릭·자가신고는 실적이 아님 → 근거 있는 숫자',
    customer: '/my/activity',
    ax: '/ax',
    action: {
      label: '오늘의 코드로 체크인',
      done: (s) => { const u = demoUser(s); return !!u && s.checkins.some((c) => c.userId === u.id); },
      run: () =>
        dispatch((d) => {
          const u = demoUser(d);
          if (!u) throw new D.DomainError('먼저 ‘가입’ 단계를 실행해 주세요.');
          D.submitCheckin(d, ctxOf(u.id, 'customer'), u.id, STORE, dailyCheckinCode(STORE));
          return '체크인 요청 완료 — 운영 화면 ‘지금 처리할 일’에 들어갔어요.';
        }),
    },
  },
  {
    key: 'confirm',
    title: '직원이 한 번 눌러 확인',
    say: ['직원은 운영 화면 첫 화면에서 ‘방문 확인’을 한 번 누릅니다. (오른쪽 화면에서 직접 눌러도 됩니다)', '그 순간 고객 스탬프 +1, 추천한 친구 보상 확정, 성과 기록이 동시에 남습니다.'],
    point: '버튼 1번 = 고객 혜택 + 추천 보상 + 실증 데이터',
    customer: '/my',
    ax: '/ax',
    action: {
      label: '직원으로 방문 확인',
      done: (s) => { const u = demoUser(s); return !!u && s.checkins.some((c) => c.userId === u.id && c.status === 'CONFIRMED'); },
      run: () =>
        dispatch((d) => {
          const u = demoUser(d);
          const c = u && d.checkins.find((x) => x.userId === u.id && x.status === 'PENDING');
          if (!c) throw new D.DomainError('확인할 체크인이 없어요. ‘체크인’ 단계를 먼저 실행해 주세요.');
          D.decideCheckin(d, ctxOf('op_staff', 'staff'), c.id, true);
          return '방문 확인 — 스탬프 +1, 추천 보상 확정, 성과 기록이 남았어요.';
        }),
    },
  },
  {
    key: 'owner',
    title: '대표가 보는 성과 기록',
    say: ['방금 일이 ‘요청 → 결정 → 승인 → 조치 → 결과’ 순서로 기록됩니다.', '확인된 이용만 집계하고, 클릭·자가신고는 섞지 않습니다. 지금 숫자는 모두 DEMO입니다.'],
    point: '12주 실증 → 재방문율·처리시간·1인당 관리 고객',
    customer: '/my/referral',
    ax: '/ax/evidence',
  },
  {
    key: 'revisit',
    title: '다시 오게 만드는 알림',
    say: ['알림에 동의한 고객에게 보낼 문안을 규칙이 만들고, 책임자가 승인해야 발송됩니다.', '성과는 발송 수가 아니라 이후 ‘확인된 방문’으로만 셉니다.'],
    point: '사람이 승인하는 자동화 → 과발송·민원 방지',
    customer: '/my/inbox',
    ax: '/ax/campaigns',
    action: {
      label: '책임자로 승인·발송',
      done: (s) => s.campaigns.some((c) => c.name === '시연 재방문 안내' && c.status === 'SENT'),
      run: () =>
        dispatch((d) => {
          const ctx = ctxOf('op_manager', 'manager');
          const c = D.createCampaign(d, ctx, { name: '시연 재방문 안내', segment: 'ALL_CONSENTED', channel: 'IN_APP', title: '이번 주 다색냥 새 친구 소개', body: '고양이 친구들의 새 사진이 올라왔어요. 방문하면 스탬프가 쌓여요.' });
          D.approveAndSendCampaign(d, ctx, c.id);
          return '승인·발송 완료 — 알림 동의 고객의 알림함에 들어갔어요.';
        }),
    },
  },
  {
    key: 'next',
    title: '다음 단계: 통합 웰니스 플랫폼',
    say: ['지금은 매장 매출을 회원·혜택·방문 확인으로 연결하는 단계입니다.', '대표 기획안의 다음 단계: AI 푸드 웰니스(리얼식단)와 AI 멘탈·펫 웰니스(다색냥), 구독·커머스.'],
    point: '현재 = 검증 가능한 운영 데이터 / 확장 = 아직 개발 전(계획)',
    customer: '/roadmap#expansion',
    ax: '/ax/why#expansion',
    extra: 'expansion',
  },
];

/** 같은 앱을 iframe 으로 띄우고, 부모가 주소를 바꾸면 따라간다 */
function Frame({ path, width, height, scale, title, testId }: { path: string; width: number; height: number; scale: number; title: string; testId: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => `${path}${path.includes('?') ? '&' : '?'}frame=demo`);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.contentWindow?.postMessage({ type: MSG_NAV, path }, window.location.origin);
  }, [path]);
  return (
    <div className="overflow-hidden rounded-[18px] bg-white shadow-[0_20px_40px_-20px_rgba(15,30,40,.45)] ring-1 ring-slate-300" style={{ width: width * scale, height: height * scale }} data-testid={testId}>
      <iframe ref={ref} src={src} title={title} className="origin-top-left border-0 bg-white" style={{ width, height, transform: `scale(${scale})` }} />
    </div>
  );
}

export default function DemoPage() {
  const s = useAppState();
  const run = useRun();
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [view, setView] = useState<'customer' | 'ax'>('customer');
  const [focus, setFocus] = useState<'both' | 'customer' | 'ax'>('both');
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1000, h: 700 });
  const step = STEPS[i];

  useEffect(() => {
    const p = Number(new URLSearchParams(window.location.search).get('step'));
    if (p >= 1 && p <= STEPS.length) setI(p - 1);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(i + 1));
    window.history.replaceState(null, '', url);
  }, [i]);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback((n: number) => setI((v) => Math.max(0, Math.min(STEPS.length - 1, v + n))), []);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select, [role="dialog"]')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [go]);

  const numbers = useMemo(() => {
    if (!s) return null;
    const u = demoUser(s);
    const ref = u ? s.referrals.find((r) => r.refereeId === u.id) : null;
    return {
      user: u,
      stamps: u ? stampCount(s, u.id) : null,
      coupons: u ? couponsFor(s, u.id).filter((c) => c.status === 'ISSUED').length : null,
      referral: ref ? ({ PENDING: '대기', QUALIFIED: '검토', REWARDED: '확정', REJECTED: '반려', REVERSED: '회수' } as const)[ref.status] : null,
      queue: s.tasks.filter((t) => t.status === 'OPEN' && (t.type === 'VERIFY_CHECKIN' || t.type === 'VERIFY_PURCHASE')).length,
      proofs: s.proofEvents.length,
    };
  }, [s]);

  // 화면 배치: 휴대폰(390×844)과 PC(1280×800)를 남는 공간에 맞춰 축소
  const H = Math.max(360, box.h - 28);
  const phoneScale = Math.min(focus === 'customer' ? 1.15 : 1, H / 844);
  const pcScale = focus === 'ax' ? Math.min(box.w / 1280, H / 720) : Math.min((box.w - 390 * phoneScale - 24) / 1280, H / 720);
  const pcH = Math.round(H / Math.max(0.3, pcScale));

  if (!s || !numbers) return <div className="grid min-h-dvh place-items-center text-slate-500">시연 준비 중…</div>;
  const done = step.action?.done(s) ?? false;

  return (
    <div className="flex min-h-dvh flex-col bg-[#EEF2F5] text-slate-900 lg:h-dvh lg:overflow-hidden" data-testid="demo-mode">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5 lg:h-16 lg:flex-nowrap lg:py-0">
        <Link href="/" className="flex min-h-11 items-center gap-2" aria-label="다색컴패니언 고객 화면으로">
          <LogoMark className="h-9 w-9" />
          <span className="leading-tight">
            <span className="block text-[1rem] font-extrabold">다색컴패니언 시연</span>
            <span className="block text-[0.8125rem] font-semibold text-slate-500">고객 앱 + 매장 운영관리(AX) · 같은 데이터</span>
          </span>
        </Link>
        <StatusBadge status="DEMO" />
        <div className="ml-auto flex items-center gap-1.5">
          <Button tone="ax" variant="ghost" onClick={() => setNotes((v) => !v)} aria-pressed={notes} data-testid="demo-notes-toggle">
            {notes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} 발표 메모
          </Button>
          <Button tone="ax" variant="outline" onClick={() => setConfirmReset(true)} data-testid="demo-restart">
            <RotateCcw className="h-4 w-4" /> 처음부터
          </Button>
          <Link href="/ax" className="hidden h-11 items-center gap-1 rounded-xl px-3 lg:h-10 text-[0.9375rem] font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 md:inline-flex">
            <LayoutDashboard className="h-4 w-4" /> 운영 AX
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 왼쪽: 진행 */}
        <aside className="shrink-0 border-b border-slate-200 bg-white lg:flex lg:w-[400px] lg:flex-col lg:border-b-0 lg:border-r">
          <ol className="flex gap-1.5 overflow-x-auto px-4 pt-3 no-scrollbar lg:gap-1" aria-label="시연 단계">
            {STEPS.map((st, n) => {
              const ok = st.action?.done(s);
              return (
                <li key={st.key}>
                  <button
                    onClick={() => setI(n)}
                    aria-current={n === i ? 'step' : undefined}
                    title={st.title}
                    className={cx('grid h-11 w-11 place-items-center rounded-full text-[0.9375rem] font-bold ring-1 ring-inset transition lg:h-10 lg:w-10', n === i ? 'bg-slate-900 text-white ring-slate-900' : ok ? 'bg-emerald-50 text-emerald-800 ring-emerald-300' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50')}
                  >
                    {ok && n !== i ? <Check className="h-4 w-4" /> : n + 1}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3" data-testid="demo-step">
            <p className="text-[0.875rem] font-bold text-slate-500">
              {i + 1} / {STEPS.length}
            </p>
            <h1 className="mt-0.5 text-[1.5rem] font-extrabold leading-tight tracking-tight">{step.title}</h1>
            {notes && (
              <ul className="mt-3 space-y-2" data-testid="demo-say">
                {step.say.map((x) => (
                  <li key={x} className="text-[1rem] leading-relaxed text-slate-700">
                    {x}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-[0.9375rem] font-semibold text-violet-900">💡 {step.point}</p>

            {step.action && (
              <div className="mt-4">
                <Button
                  tone="ax"
                  size="lg"
                  full
                  disabled={done}
                  onClick={() => run(step.action!.run, (msg) => msg)}
                  data-testid="demo-action"
                >
                  {done ? <Check className="h-5 w-5" /> : <Play className="h-5 w-5" />} {done ? '완료됨' : step.action.label}
                </Button>
                {step.key === 'confirm' && !done && <p className="mt-2 text-[0.875rem] text-slate-600">오른쪽 운영 화면의 &lsquo;방문 확인&rsquo;을 직접 눌러도 같은 결과예요.</p>}
              </div>
            )}

            {step.extra === 'expansion' && (
              <div className="mt-4">
                <ExpansionOverview dense />
              </div>
            )}

            {/* 지금 숫자 — 실행할 때마다 바뀐다 */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5" data-testid="demo-numbers">
              <p className="text-[0.875rem] font-bold text-slate-500">지금 숫자 (DEMO · 실시간)</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[0.9375rem]">
                <div>
                  <dt className="text-slate-500">시연 고객</dt>
                  <dd className="font-bold">{numbers.user ? `${numbers.user.name} · ${numbers.user.memberCode}` : '가입 전'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">스탬프</dt>
                  <dd className="font-bold tabular" data-testid="demo-stamps">{numbers.stamps ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">사용 가능 쿠폰</dt>
                  <dd className="font-bold tabular">{numbers.coupons ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">추천 보상({REFERRER})</dt>
                  <dd className="font-bold" data-testid="demo-referral">{numbers.referral ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">확인 대기</dt>
                  <dd className="font-bold tabular" data-testid="demo-queue">{numbers.queue}건</dd>
                </div>
                <div>
                  <dt className="text-slate-500">성과 기록</dt>
                  <dd className="font-bold tabular">{numbers.proofs}건</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="flex shrink-0 gap-2 border-t border-slate-200 p-3">
            <Button tone="ax" variant="outline" className="flex-1" onClick={() => go(-1)} disabled={i === 0} data-testid="demo-prev">
              <ArrowLeft className="h-4 w-4" /> 이전
            </Button>
            <Button tone="ax" className="flex-[2]" onClick={() => go(1)} disabled={i === STEPS.length - 1} data-testid="demo-next">
              다음 <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </aside>

        {/* 오른쪽: 고객 화면 + 운영 AX (같은 데이터) */}
        <section className="min-h-0 min-w-0 flex-1 p-3 lg:p-4" aria-label="시연 화면">
          <div className="mb-2 flex gap-1.5 lg:hidden">
            {(
              [
                ['customer', '고객 화면', Smartphone],
                ['ax', '운영 AX', Monitor],
              ] as const
            ).map(([v, l, Icon]) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={cx('inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[0.9375rem] font-bold ring-1 ring-inset', view === v ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300')}>
                <Icon className="h-4 w-4" /> {l}
              </button>
            ))}
          </div>
          <div className="mb-2 hidden items-center justify-end gap-1 lg:flex" role="group" aria-label="화면 크게 보기">
            {(
              [
                ['both', '둘 다'],
                ['customer', '고객 화면 크게'],
                ['ax', '운영 AX 크게'],
              ] as const
            ).map(([v, l]) => (
              <button key={v} onClick={() => setFocus(v)} aria-pressed={focus === v} data-testid={`demo-focus-${v}`} className={cx('inline-flex h-9 items-center rounded-lg px-3 text-[0.875rem] font-bold ring-1 ring-inset', focus === v ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50')}>
                {l}
              </button>
            ))}
          </div>
          <div ref={stage} className="hidden h-[calc(100%-2.75rem)] items-start justify-center gap-6 lg:flex">
            <div className={cx('text-center', focus === 'ax' && 'hidden')}>
              <Frame path={step.customer} width={390} height={844} scale={phoneScale} title="고객 화면 (휴대폰)" testId="demo-frame-customer" />
              <p className="mt-1.5 text-[0.8125rem] font-semibold text-slate-600">고객 화면 · 휴대폰</p>
            </div>
            <div className={cx('text-center', focus === 'customer' && 'hidden')}>
              <Frame path={step.ax} width={1280} height={pcH} scale={Math.max(0.3, pcScale)} title="운영 AX (PC)" testId="demo-frame-ax" />
              <p className="mt-1.5 text-[0.8125rem] font-semibold text-slate-600">매장 운영관리(AX) · PC</p>
            </div>
          </div>
          <div className="lg:hidden">
            <iframe key={view + (view === 'customer' ? step.customer : step.ax)} src={`${view === 'customer' ? step.customer : step.ax}${(view === 'customer' ? step.customer : step.ax).includes('?') ? '&' : '?'}frame=demo`} title={view === 'customer' ? '고객 화면' : '운영 AX'} className="h-[75dvh] w-full rounded-2xl border-0 bg-white ring-1 ring-slate-300" />
          </div>
        </section>
      </div>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        tone="ax"
        size="sm"
        title="처음부터 다시 시연할까요?"
        description="이 브라우저의 시연 데이터(가입·체크인·알림)가 처음 상태로 돌아갑니다. 테마·글자 크기는 유지돼요."
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setConfirmReset(false)}>
              취소
            </Button>
            <Button
              tone="ax"
              data-testid="demo-restart-confirm"
              onClick={() => {
                resetDemo();
                dispatch((d) => {
                  d.settings.customerOnboarded = true;
                  d.settings.axTutorialDone = true;
                });
                setConfirmReset(false);
                setI(0);
              }}
            >
              처음부터
            </Button>
          </div>
        }
      >
        <span />
      </Sheet>
    </div>
  );
}

