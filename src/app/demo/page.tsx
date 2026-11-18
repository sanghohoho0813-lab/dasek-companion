'use client';
/**
 * 발표용 시연 모드 (/demo) — 6차
 *  시나리오 A: 신규 고객 확보 → 방문 → 혜택 → 성과   (3~6단계)
 *  시나리오 B: 고객 관심 → 후속 안내 → 승인 → 알림 → 반응 (7단계)
 *  · 오른쪽: 고객 앱(휴대폰)과 운영 AX(PC)를 같은 브라우저·같은 저장소로 나란히 — 서버 동기화가 아님
 *  · 실행 버튼은 domain.ts 의 실제 규칙을 호출한다. 이미 실행한 동작은 다시 실행되지 않는다(중복 보상 0).
 *  · 앞 단계를 건너뛰면 실행 대신 '먼저 할 일'을 안내한다. 새로고침해도 단계(?step)와 데이터가 남는다.
 */
import { AlertCircle, ArrowLeft, ArrowRight, Check, Eye, EyeOff, LayoutDashboard, Link2, Monitor, Play, RotateCcw, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LogoMark } from '@/components/shell/Logo';
import { Button, Sheet, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { campaignResults, couponsFor, stampCount, todayStats } from '@/lib/rules';
import { NOT_YET, STAGES } from '@/lib/stages';
import { dispatch, getState, resetDemo, useAppState } from '@/lib/store';
import type { AppState } from '@/lib/types';
import { cx, dailyCheckinCode, nowIso } from '@/lib/util';

const DEMO_NAME = '시연 고객';
const REFERRER = '하늘';
const STORE = 'store_dasek';
const MENU = 'm_chicken_salad';
const CAMPAIGN = '시연 관심 안내';
const MSG_NAV = 'dasek:navigate';

type Who = '고객' | '직원' | '책임자';
type Action = { key: string; who: Who; label: string; done: (s: AppState) => boolean; requires?: string; run: () => string; after?: (s: AppState) => { customer?: string; ax?: string } };
type Step = { key: string; scene?: 'A' | 'B'; title: string; say: string; point: string; customer: (s: AppState) => string; ax: (s: AppState) => string; actions?: Action[]; extra?: 'stages' | 'proof' | 'campaign' };

const demoUser = (s: AppState) => s.profiles.find((p) => p.name === DEMO_NAME && p.role === 'customer' && p.status === 'active') ?? null;
const ctxOf = (actorId: string | null, actorRole: 'customer' | 'staff' | 'manager'): D.Ctx => ({ now: nowIso(), actorId, actorRole, isDemo: true });
const demoCampaign = (s: AppState) => s.campaigns.find((c) => c.name === CAMPAIGN && c.status === 'SENT') ?? null;
const demoNote = (s: AppState) => {
  const u = demoUser(s);
  const c = demoCampaign(s);
  return u && c ? s.notifications.find((n) => n.userId === u.id && n.campaignId === c.id) ?? null : null;
};

/** 모든 실행은 '아직 안 했을 때만' — 같은 버튼을 여러 번 눌러도 한 번만 반영 */
const once = (done: (s: AppState) => boolean, fn: (d: AppState) => string) => () =>
  dispatch((d) => {
    if (done(d)) return '이미 실행된 단계예요. 다시 반영하지 않았어요.';
    return fn(d);
  });

const A_SIGNUP: Action = {
  key: 'signup',
  who: '고객',
  label: '추천 코드로 가입하기',
  done: (s) => !!demoUser(s),
  run: once(
    (s) => !!demoUser(s),
    (d) => {
      const ref = d.profiles.find((p) => p.name.startsWith(REFERRER) && p.role === 'customer')?.referralCode ?? undefined;
      D.signup(d, ctxOf(null, 'customer'), { name: DEMO_NAME, phone: '', consents: { terms: true, privacy: true, age14: true, marketing_inapp: true, marketing_push: false, marketing_kakao: false }, referralCode: ref, preferredBrands: ['dasek', 'realsicdan'] });
      return '가입 완료 — 가입 쿠폰 발급, 추천 보상은 대기 중';
    },
  ),
  after: () => ({ customer: '/my/coupons', ax: '/ax/members' }),
};
const A_CHECKIN: Action = {
  key: 'checkin',
  who: '고객',
  label: '오늘의 코드로 체크인',
  requires: 'signup',
  done: (s) => { const u = demoUser(s); return !!u && s.checkins.some((c) => c.userId === u.id); },
  run: once(
    (s) => { const u = demoUser(s); return !!u && s.checkins.some((c) => c.userId === u.id); },
    (d) => {
      const u = demoUser(d)!;
      D.submitCheckin(d, ctxOf(u.id, 'customer'), u.id, STORE, dailyCheckinCode(STORE));
      return '체크인 요청 — 운영 AX 확인 대기에 들어갔어요';
    },
  ),
};
const A_CONFIRM: Action = {
  key: 'confirm',
  who: '직원',
  label: '직원으로 방문 확인',
  requires: 'checkin',
  done: (s) => { const u = demoUser(s); return !!u && s.checkins.some((c) => c.userId === u.id && c.status === 'CONFIRMED'); },
  run: once(
    (s) => { const u = demoUser(s); return !!u && s.checkins.some((c) => c.userId === u.id && c.status === 'CONFIRMED'); },
    (d) => {
      const u = demoUser(d)!;
      const c = d.checkins.find((x) => x.userId === u.id && x.status === 'PENDING');
      if (!c) throw new D.DomainError('확인할 체크인이 없어요.');
      D.decideCheckin(d, ctxOf('op_staff', 'staff'), c.id, true);
      return '방문 확인 — 스탬프 +1, 추천 보상 확정, 성과 기록 저장';
    },
  ),
};
const B_SAVE: Action = {
  key: 'save',
  who: '고객',
  label: '닭가슴살 샐러드 저장',
  requires: 'signup',
  done: (s) => { const u = demoUser(s); return !!u && s.favorites.some((f) => f.userId === u.id && f.menuItemId === MENU); },
  run: once(
    (s) => { const u = demoUser(s); return !!u && s.favorites.some((f) => f.userId === u.id && f.menuItemId === MENU); },
    (d) => {
      const u = demoUser(d)!;
      D.toggleFavorite(d, ctxOf(u.id, 'customer'), u.id, MENU);
      return '메뉴 저장 — 운영 AX 회원 화면에 관심으로 표시돼요';
    },
  ),
  after: (s) => ({ customer: `/menu/${MENU}`, ax: demoUser(s) ? `/ax/members/${demoUser(s)!.id}` : '/ax/members' }),
};
const B_SEND: Action = {
  key: 'send',
  who: '책임자',
  label: '관심 안내 승인·발송',
  requires: 'save',
  done: (s) => !!demoCampaign(s),
  run: once(
    (s) => !!demoCampaign(s),
    (d) => {
      const ctx = ctxOf('op_manager', 'manager');
      const c = D.createCampaign(d, ctx, { name: CAMPAIGN, segment: 'RECENT_INTEREST', channel: 'IN_APP', ...D.campaignTemplate('RECENT_INTEREST') });
      D.approveAndSendCampaign(d, ctx, c.id);
      const sent = d.campaigns.find((x) => x.id === c.id)!;
      return `승인·발송 — 수신 동의 ${sent.recipients}명에게 앱 알림${sent.excludedDuplicates ? ` (중복 ${sent.excludedDuplicates}명 제외)` : ''}`;
    },
  ),
  after: () => ({ customer: '/my/inbox', ax: '/ax/campaigns' }),
};
const B_OPEN: Action = {
  key: 'open',
  who: '고객',
  label: '알림 눌러 메뉴 보기',
  requires: 'send',
  done: (s) => !!demoNote(s)?.readAt,
  run: once(
    (s) => !!demoNote(s)?.readAt,
    (d) => {
      const u = demoUser(d)!;
      const n = demoNote(d);
      if (!n) throw new D.DomainError('시연 고객에게 온 알림이 없어요.');
      const ctx = ctxOf(u.id, 'customer');
      D.markNotificationRead(d, ctx, n.id);
      const m = /^\/menu\/(.+)$/.exec(n.link ?? '')?.[1];
      if (m) D.recordMenuView(d, ctx, u.id, m);
      return '알림 확인 → 메뉴 조회 기록 (방문 실적은 아직 0 — 직원 확인 전)';
    },
  ),
  after: (s) => ({ customer: demoNote(s)?.link ?? '/my/inbox', ax: '/ax/campaigns' }),
};
const ALL_ACTIONS = [A_SIGNUP, A_CHECKIN, A_CONFIRM, B_SAVE, B_SEND, B_OPEN];

const STEPS: Step[] = [
  {
    key: 'intro',
    title: '다색컴패니언은 무엇인가',
    say: '리얼식단·다색냥 손님이 쓰는 앱과, 매장이 손님·방문·재방문을 관리하는 운영 프로그램이 하나로 이어져 있습니다.',
    point: '한 번 오고 끝나는 매장 → 다시 오게 만드는 매장',
    customer: () => '/',
    ax: () => '/ax',
  },
  {
    key: 'explore',
    title: '손님이 메뉴와 고양이를 둘러봅니다',
    say: '다색냥 실제 고양이 14마리(매장 카드 기준)와 리얼식단 메뉴를 사진으로 둘러봅니다. 가입하지 않아도 볼 수 있어요.',
    point: '방문 전 기대감 → 첫 방문',
    customer: () => '/dasek',
    ax: () => '/ax/content?tab=cats',
  },
  {
    key: 'signup',
    scene: 'A',
    title: '친구 추천으로 가입',
    say: `기존 회원(${REFERRER})의 추천 코드로 가입하면 바로 가입 쿠폰이 들어오고, 운영 AX 회원 목록에 새 회원이 생깁니다.`,
    point: '추천 보상은 실제 방문 확인 뒤에만 → 허수 가입 방지',
    customer: (s) => (demoUser(s) ? '/my/coupons' : `/signup?ref=${s.profiles.find((p) => p.name.startsWith(REFERRER))?.referralCode ?? ''}`),
    ax: () => '/ax/members',
    actions: [A_SIGNUP],
  },
  {
    key: 'checkin',
    scene: 'A',
    title: '매장에 와서 체크인',
    say: '카운터의 오늘의 코드를 입력하면 고객 화면에는 ‘확인 대기’, 운영 AX 에는 확인할 일이 하나 늘어납니다. 아직 방문 실적은 아닙니다.',
    point: '자가신고만으로는 실적이 아님 → 근거 있는 숫자',
    customer: () => '/my/activity',
    ax: () => '/ax',
    actions: [A_CHECKIN],
  },
  {
    key: 'confirm',
    scene: 'A',
    title: '직원이 한 번 눌러 확인',
    say: '직원이 ‘방문 확인’을 누르는 순간 손님 스탬프, 추천한 친구의 보상, 성과 기록이 함께 바뀝니다. 오른쪽 AX 화면에서 직접 눌러도 같습니다.',
    point: '버튼 1번 = 손님 혜택 + 추천 보상 + 성과 기록',
    customer: () => '/my',
    ax: () => '/ax',
    actions: [A_CONFIRM],
  },
  {
    key: 'proof',
    scene: 'A',
    title: '운영 AX 에 남은 결과',
    say: '방금 일이 이 회원의 이용 기록과 ‘요청 → 결정 → 승인 → 조치 → 결과’ 성과 기록으로 남습니다. 숫자는 모두 DEMO입니다.',
    point: '직원이 확인한 것만 실적 — 클릭·자가신고는 신호로만',
    customer: () => '/my/activity',
    ax: (s) => (demoUser(s) ? `/ax/members/${demoUser(s)!.id}` : '/ax/evidence'),
    extra: 'proof',
  },
  {
    key: 'revisit',
    scene: 'B',
    title: '관심 → 안내 → 다시 방문',
    say: '손님이 메뉴를 저장하면 운영 AX 가 ‘최근 관심 회원’으로 묶어 안내를 제안하고, 책임자가 승인해야 앱 알림이 나갑니다.',
    point: '사람이 승인하는 규칙 기반 안내 — 클릭은 신호, 방문은 직원 확인 때만 실적',
    customer: () => '/realsicdan',
    ax: (s) => (demoUser(s) ? `/ax/members/${demoUser(s)!.id}` : '/ax/campaigns'),
    actions: [B_SAVE, B_SEND, B_OPEN],
    extra: 'campaign',
  },
  {
    key: 'next',
    title: '지금 · 다음 · 이후',
    say: '지금은 고객과 운영이 이어지는 구조를 확인하는 DEMO입니다. 실제 매장 운영과 AI·구독·커머스는 이 데이터 위에서 단계적으로 갑니다.',
    point: '오늘 쌓는 확인 이용·관심 기록 = 다음 사업의 근거',
    customer: () => '/roadmap#expansion',
    ax: () => '/ax/why#expansion',
    extra: 'stages',
  },
];

function metrics(s: AppState) {
  const u = demoUser(s);
  const ref = u ? s.referrals.find((r) => r.refereeId === u.id) : null;
  const c = demoCampaign(s);
  return {
    user: u,
    stamps: u ? stampCount(s, u.id) : null,
    coupons: u ? couponsFor(s, u.id).filter((x) => x.status === 'ISSUED').length : null,
    referral: ref ? ({ PENDING: '대기', QUALIFIED: '검토', REWARDED: '확정', REJECTED: '반려', REVERSED: '회수' } as const)[ref.status] : null,
    queue: s.tasks.filter((t) => t.status === 'OPEN' && (t.type === 'VERIFY_CHECKIN' || t.type === 'VERIFY_PURCHASE')).length,
    visitsToday: todayStats(s, new Date()).visitsToday,
    unread: u ? s.notifications.filter((n) => n.userId === u.id && !n.readAt).length : null,
    campaign: c ? campaignResults(s, c.id) : null,
  };
}

/** 같은 앱을 iframe 으로 — 부모가 주소를 바꾸면 따라간다. 처음 불러오는 동안은 자리(Skeleton)를 보여준다 */
function Frame({ path, width, height, scale, title, testId, kind }: { path: string; width: number; height: number; scale: number; title: string; testId: string; kind: 'phone' | 'pc' }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => `${path}${path.includes('?') ? '&' : '?'}frame=demo`);
  const [loaded, setLoaded] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.contentWindow?.postMessage({ type: MSG_NAV, path }, window.location.origin);
  }, [path]);
  return (
    <div
      className={cx('relative overflow-hidden bg-white shadow-[0_24px_48px_-24px_rgba(15,30,40,.5)]', kind === 'phone' ? 'rounded-[30px] ring-[6px] ring-[#15191d]' : 'rounded-[14px] ring-1 ring-slate-300')}
      style={{ width: width * scale, height: height * scale }}
      data-testid={testId}
      data-loaded={loaded || undefined}
    >
      {kind === 'pc' && (
        <div className="absolute inset-x-0 top-0 z-10 flex h-6 items-center gap-1.5 bg-slate-100 px-3" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
      )}
      <iframe ref={ref} src={src} title={title} onLoad={() => setLoaded(true)} className="origin-top-left border-0 bg-white" style={{ width, height: kind === 'pc' ? height - 24 / scale : height, transform: `scale(${scale})`, marginTop: kind === 'pc' ? 24 : 0 }} />
      {!loaded && (
        <div className="absolute inset-0 z-20 animate-pulse bg-white p-6" aria-hidden>
          <div className="h-6 w-1/2 rounded bg-slate-200" />
          <div className="mt-4 h-32 rounded-xl bg-slate-100" />
          <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
        </div>
      )}
    </div>
  );
}

/** 값이 바뀌었을 때만 잠깐 강조 (값 자체는 실제 상태에서 읽는다 — 애니메이션이 값을 만들지 않음) */
function Val({ v, testId }: { v: React.ReactNode; testId?: string }) {
  const prev = useRef(v);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (prev.current !== v) setN((x) => x + 1);
    prev.current = v;
  }, [v]);
  return (
    <dd key={n} className={cx('rounded-md text-[1.25rem] font-extrabold tabular text-slate-900', n > 0 && 'flash-change')} data-testid={testId} data-changed={n > 0 || undefined}>
      {v ?? '—'}
    </dd>
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
  const [override, setOverride] = useState<{ customer?: string; ax?: string }>({});
  const [before, setBefore] = useState<ReturnType<typeof metrics> | null>(null);
  const [resume, setResume] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1000, h: 700 });
  const step = STEPS[i];

  useEffect(() => {
    const p = Number(new URLSearchParams(window.location.search).get('step'));
    if (p >= 1 && p <= STEPS.length) setI(p - 1);
    else setResume(true); // 저장된 시연 기록이 있으면 아래에서 안내
    // 발표용 자산 미리 불러오기 (실제 고양이 대표 사진·메뉴)
    ['/assets/cat_r01_01.jpg', '/assets/cat_r02_01.jpg', '/assets/cat_r03_01.jpg', '/assets/cat_r04_01.jpg'].forEach((src) => {
      const im = new Image();
      im.src = src;
    });
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(i + 1));
    window.history.replaceState(null, '', url);
    setOverride({});
    setBefore(null);
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
      if (document.querySelector('[role="dialog"]') || (e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(1);
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [go]);

  const m = useMemo(() => (s ? metrics(s) : null), [s]);
  if (!s || !m) return <div className="grid min-h-dvh place-items-center text-slate-600">시연 준비 중…</div>;

  const H = Math.max(360, box.h - 28);
  const phoneScale = Math.min(focus === 'customer' ? 1.15 : 1, H / 844);
  const pcScale = focus === 'ax' ? Math.min(box.w / 1280, H / 760) : Math.min((box.w - 390 * phoneScale - 40) / 1280, H / 760);
  const pcH = Math.round(H / Math.max(0.3, pcScale));
  const customerPath = override.customer ?? step.customer(s);
  const axPath = override.ax ?? step.ax(s);
  const doneCount = ALL_ACTIONS.filter((a) => a.done(s)).length;
  const nextUndone = STEPS.findIndex((st) => st.actions?.some((a) => !a.done(s)));
  const actionOf = (key: string) => ALL_ACTIONS.find((a) => a.key === key)!;
  const stepOfAction = (key: string) => STEPS.findIndex((st) => st.actions?.some((a) => a.key === key));

  const exec = (a: Action) => {
    const snap = metrics(s);
    const r = run(a.run, (msg) => msg);
    if (r !== undefined) {
      setBefore(snap);
      const nav = a.after?.(getState()); // 실행 직후 상태로 경로 계산
      if (nav) setOverride((o) => ({ ...o, ...nav }));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#EEF2F5] text-slate-900 lg:h-dvh lg:overflow-hidden" data-testid="demo-mode">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 lg:h-16 lg:flex-nowrap lg:py-0">
        <Link href="/" className="flex min-h-11 items-center gap-2" aria-label="다색컴패니언 고객 화면으로">
          <LogoMark className="h-9 w-9" />
          <span className="leading-tight">
            <span className="block text-[1rem] font-extrabold">다색컴패니언 시연</span>
            <span className="block text-[0.8125rem] font-semibold text-slate-600">손님 앱 + 매장 운영 AX · 한 브라우저 안에서 같은 데이터</span>
          </span>
        </Link>
        <StatusBadge status="DEMO" />
        {/* 진행률 */}
        <div className="order-last flex w-full items-center gap-2 lg:order-none lg:ml-6 lg:w-auto lg:flex-1" aria-label={`진행 ${i + 1} / ${STEPS.length}`}>
          {/* 휴대폰: 누르지 않는 진행 막대 (이동은 이전·다음 버튼) */}
          <div className="flex flex-1 gap-1 lg:hidden" aria-hidden>
            {STEPS.map((st, n) => (
              <span key={st.key} className={cx('h-2 flex-1 rounded-full', n < i ? 'bg-slate-700' : n === i ? 'bg-ax-primary' : 'bg-slate-300')} />
            ))}
          </div>
          <div className="hidden flex-1 gap-1 lg:flex" data-testid="demo-progress">
            {STEPS.map((st, n) => (
              <button
                key={st.key}
                onClick={() => setI(n)}
                aria-current={n === i ? 'step' : undefined}
                aria-label={`${n + 1}단계 ${st.title}`}
                title={st.title}
                className="group hidden h-9 flex-1 items-center lg:flex"
              >
                <span className={cx('h-2 w-full rounded-full transition', n < i ? 'bg-slate-700' : n === i ? 'bg-ax-primary ring-2 ring-ax-primary/30' : 'bg-slate-300 group-hover:bg-slate-400')} />
              </button>
            ))}
          </div>
          <span className="shrink-0 text-[0.9375rem] font-bold tabular text-slate-700">
            {i + 1} / {STEPS.length}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <Button tone="ax" variant="ghost" onClick={() => setNotes((v) => !v)} aria-pressed={notes} data-testid="demo-notes-toggle">
            {notes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} 발표 메모
          </Button>
          <Button tone="ax" variant="outline" onClick={() => setConfirmReset(true)} data-testid="demo-restart">
            <RotateCcw className="h-4 w-4" /> 처음부터
          </Button>
          <Link href="/ax" className="hidden h-11 items-center gap-1 rounded-xl px-3 text-[0.9375rem] font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 md:inline-flex lg:h-10">
            <LayoutDashboard className="h-4 w-4" /> 운영 AX
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 왼쪽: 지금 보여줄 것 */}
        <aside className="shrink-0 border-b border-slate-200 bg-white lg:flex lg:w-[420px] lg:flex-col lg:border-b-0 lg:border-r">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4" data-testid="demo-step">
            {resume && doneCount > 0 && (
              <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[0.9375rem] text-sky-900" data-testid="demo-resume">
                이전 시연 기록이 남아 있어요 (실행 {doneCount}/{ALL_ACTIONS.length}).
                <div className="mt-2 flex gap-2">
                  <Button tone="ax" size="sm" onClick={() => { setResume(false); setI(nextUndone >= 0 ? nextUndone : STEPS.length - 1); }}>
                    이어서 하기
                  </Button>
                  <Button tone="ax" size="sm" variant="outline" onClick={() => { setResume(false); setConfirmReset(true); }}>
                    처음부터
                  </Button>
                </div>
              </div>
            )}
            <p className="flex items-center gap-2 text-[0.9375rem] font-bold text-slate-600">
              {i + 1}단계
              {step.scene && <span className={cx('rounded-md px-2 py-0.5 text-[0.8125rem] font-bold', step.scene === 'A' ? 'bg-sky-100 text-sky-900' : 'bg-violet-100 text-violet-900')}>{step.scene === 'A' ? '시나리오 A · 새 손님 → 방문 → 혜택' : '시나리오 B · 관심 → 안내 → 재방문'}</span>}
            </p>
            <h1 className="mt-1 text-[1.625rem] font-extrabold leading-tight tracking-tight">{step.title}</h1>
            {notes && (
              <p className="mt-2.5 text-[1.0625rem] leading-relaxed text-slate-700" data-testid="demo-say">
                {step.say}
              </p>
            )}
            <p className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-[0.9375rem] font-semibold text-violet-900">💡 {step.point}</p>

            {/* 실행 버튼 — 순서대로, 이미 한 것은 완료 표시 */}
            {step.actions && (
              <ol className="mt-4 space-y-2" data-testid="demo-actions">
                {step.actions.map((a, n) => {
                  const done = a.done(s);
                  const missing = a.requires && !actionOf(a.requires).done(s) ? actionOf(a.requires) : null;
                  return (
                    <li key={a.key}>
                      <Button
                        tone="ax"
                        size="lg"
                        full
                        variant={done ? 'outline' : 'primary'}
                        disabled={done || !!missing}
                        onClick={() => exec(a)}
                        data-testid={step.actions!.length === 1 ? 'demo-action' : `demo-action-${a.key}`}
                      >
                        {done ? <Check className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        <span className="text-[0.8125rem] font-bold opacity-90">{step.actions!.length > 1 ? `${n + 1}. ` : ''}{a.who}</span> {done ? `${a.label} — 완료` : a.label}
                      </Button>
                      {missing && !done && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.875rem] text-amber-900" data-testid="demo-requires">
                          <AlertCircle className="h-4 w-4" /> 먼저 &lsquo;{missing.label}&rsquo;을 실행해야 해요.
                          {stepOfAction(missing.key) !== i && (
                            <button className="inline-flex min-h-11 items-center font-bold underline lg:min-h-0" onClick={() => setI(stepOfAction(missing.key))}>
                              {stepOfAction(missing.key) + 1}단계로 이동
                            </button>
                          )}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            {step.key === 'confirm' && !A_CONFIRM.done(s) && A_CHECKIN.done(s) && <p className="mt-2 text-[0.875rem] text-slate-600">오른쪽 운영 AX 의 &lsquo;방문 확인&rsquo;을 직접 눌러도 같은 결과예요.</p>}

            {/* 핵심 장면: 실행 전 → 후 (실제 상태 비교) */}
            {before && (
              <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3.5" data-testid="demo-change">
                <p className="text-[0.9375rem] font-bold text-emerald-900">방금 바뀐 것</p>
                <ul className="mt-1.5 space-y-1 text-[1rem]">
                  {(
                    [
                      ['스탬프', before.stamps, m.stamps],
                      ['사용 가능 쿠폰', before.coupons, m.coupons],
                      [`추천 보상(${REFERRER})`, before.referral, m.referral],
                      ['확인 대기', before.queue, m.queue],
                      ['오늘 확인된 방문', before.visitsToday, m.visitsToday],
                      ['안 읽은 알림', before.unread, m.unread],
                    ] as [string, unknown, unknown][]
                  )
                    .filter(([, a, b]) => a !== b)
                    .map(([l, a, b]) => (
                      <li key={l} className="flex items-center justify-between gap-2">
                        <span className="text-slate-700">{l}</span>
                        <span className="font-extrabold tabular">
                          <span className="text-slate-500">{String(a ?? '—')}</span> → <span className="text-emerald-800">{String(b ?? '—')}</span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {step.extra === 'proof' && m.user && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5" data-testid="demo-proof">
                <p className="text-[0.9375rem] font-bold text-slate-700">이 손님 관련 성과 기록</p>
                <ul className="mt-1.5 space-y-1.5">
                  {s.proofEvents
                    .filter((p) => p.user_id === m.user!.id || (p.data_source ?? '').includes(m.user!.id))
                    .slice(0, 4)
                    .map((p) => (
                      <li key={p.proof_event_id} className="text-[0.9375rem]">
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[0.8125rem] font-bold text-emerald-900 ring-1 ring-inset ring-emerald-200">{p.decision_method === 'RULE+HUMAN' ? '직원 확인' : p.decision_method}</span> {p.result}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {step.extra === 'campaign' && m.campaign && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5" data-testid="demo-campaign">
                <p className="text-[0.9375rem] font-bold text-slate-700">알림 결과 — 신호와 실적을 나눠서</p>
                <dl className="mt-2 grid grid-cols-4 gap-1.5 text-center">
                  {[
                    ['발송', m.campaign.sent],
                    ['확인', m.campaign.opened],
                    ['후속 행동', m.campaign.followUps],
                    ['확인 방문', m.campaign.confirmedUses],
                  ].map(([l, v]) => (
                    <div key={String(l)} className={cx('rounded-lg border p-1.5', l === '확인 방문' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50')}>
                      <dt className="text-[0.8125rem] font-semibold text-slate-600">{l}</dt>
                      <Val v={v as number} testId={`demo-campaign-${l}`} />
                    </div>
                  ))}
                </dl>
                <p className="mt-2 text-[0.875rem] text-slate-600">알림 확인·메뉴 조회는 신호예요. 다시 방문해 직원이 확인해야 &lsquo;확인 방문&rsquo;이 늘어요.</p>
              </div>
            )}

            {step.extra === 'stages' && (
              <div className="mt-4 space-y-2.5" data-testid="demo-stages">
                {STAGES.map((g) => (
                  <details key={g.key} open={g.key !== 'next'} className={cx('rounded-xl border p-3', g.key === 'now' ? 'border-emerald-200 bg-emerald-50' : g.key === 'next' ? 'border-sky-200 bg-sky-50' : 'border-violet-200 bg-violet-50')}>
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2">
                      <span className="text-[1rem] font-extrabold text-slate-900">{g.label}</span>
                      <span className="text-[0.8125rem] font-bold text-slate-600">{g.status}</span>
                    </summary>
                    <p className="text-[0.875rem] text-slate-700">{g.summary}</p>
                    <ul className="mt-1.5 space-y-1">
                      {g.items.map((it) => (
                        <li key={it.title} className="text-[0.9375rem] text-slate-800">
                          · {it.title}
                          {it.link && <span className="block pl-3 text-[0.8125rem] text-slate-600">← {it.link}</span>}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
                <p className="text-[0.875rem] text-slate-600">지금 없는 것: {NOT_YET.join(' · ')}</p>
              </div>
            )}

            {/* 연결 확인 — 실제 상태에서 읽는 숫자 */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5" data-testid="demo-numbers">
              <p className="flex items-center gap-1.5 text-[0.875rem] font-bold text-slate-600">
                <Link2 className="h-4 w-4" /> 손님 화면 ↔ 운영 AX 같은 데이터 (DEMO)
              </p>
              <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-2">
                <div className="col-span-3">
                  <dt className="text-[0.875rem] text-slate-600">시연 손님</dt>
                  <dd className="text-[1rem] font-bold">{m.user ? `${m.user.name} · ${m.user.memberCode}` : '가입 전'}</dd>
                </div>
                <div>
                  <dt className="text-[0.875rem] text-slate-600">스탬프</dt>
                  <Val v={m.stamps} testId="demo-stamps" />
                </div>
                <div>
                  <dt className="text-[0.875rem] text-slate-600">쿠폰</dt>
                  <Val v={m.coupons} testId="demo-coupons" />
                </div>
                <div>
                  <dt className="text-[0.875rem] text-slate-600">추천 보상</dt>
                  <Val v={m.referral} testId="demo-referral" />
                </div>
                <div>
                  <dt className="text-[0.875rem] text-slate-600">확인 대기</dt>
                  <Val v={`${m.queue}건`} testId="demo-queue" />
                </div>
                <div>
                  <dt className="text-[0.875rem] text-slate-600">오늘 확인 방문</dt>
                  <Val v={m.visitsToday} testId="demo-visits" />
                </div>
                <div>
                  <dt className="text-[0.875rem] text-slate-600">안 읽은 알림</dt>
                  <Val v={m.unread} testId="demo-unread" />
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

        {/* 오른쪽: 손님 앱 + 운영 AX */}
        <section className="min-h-0 min-w-0 flex-1 p-3 lg:p-4" aria-label="시연 화면">
          <div className="mb-2 flex gap-1.5 lg:hidden">
            {(
              [
                ['customer', '손님 앱', Smartphone],
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
                ['customer', '손님 앱 크게'],
                ['ax', '운영 AX 크게'],
              ] as const
            ).map(([v, l]) => (
              <button key={v} onClick={() => setFocus(v)} aria-pressed={focus === v} data-testid={`demo-focus-${v}`} className={cx('inline-flex h-9 items-center rounded-lg px-3 text-[0.875rem] font-bold ring-1 ring-inset', focus === v ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50')}>
                {l}
              </button>
            ))}
          </div>
          <div ref={stage} className="hidden h-[calc(100%-2.75rem)] items-start justify-center gap-5 lg:flex">
            <div className={cx('text-center', focus === 'ax' && 'hidden')}>
              <Frame path={customerPath} width={390} height={844} scale={phoneScale} title="손님 앱 (휴대폰)" testId="demo-frame-customer" kind="phone" />
              <p className="mt-2 text-[0.875rem] font-bold text-slate-700">손님 앱 · 휴대폰</p>
            </div>
            {focus === 'both' && (
              <div className="flex flex-col items-center justify-center self-center text-slate-500" aria-hidden>
                <Link2 className="h-5 w-5" />
                <span className="mt-1 text-[0.8125rem] font-bold [writing-mode:vertical-rl]">같은 데이터</span>
              </div>
            )}
            <div className={cx('text-center', focus === 'customer' && 'hidden')}>
              <Frame path={axPath} width={1280} height={pcH} scale={Math.max(0.3, pcScale)} title="매장 운영 AX (PC)" testId="demo-frame-ax" kind="pc" />
              <p className="mt-2 text-[0.875rem] font-bold text-slate-700">매장 운영 AX · PC</p>
            </div>
          </div>
          <div className="lg:hidden">
            <iframe key={view + (view === 'customer' ? customerPath : axPath)} src={`${view === 'customer' ? customerPath : axPath}${(view === 'customer' ? customerPath : axPath).includes('?') ? '&' : '?'}frame=demo`} title={view === 'customer' ? '손님 앱' : '운영 AX'} className="h-[75dvh] w-full rounded-2xl border-0 bg-white ring-1 ring-slate-300" />
          </div>
        </section>
      </div>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        tone="ax"
        size="sm"
        title="처음부터 다시 시연할까요?"
        description="이 브라우저의 다색컴패니언 시연 데이터만 처음 상태로 돌아갑니다. 테마·글자 크기와 다른 사이트 정보는 그대로예요."
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
                setResume(false);
                setI(0);
                setOverride({ customer: '/', ax: '/ax' });
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
