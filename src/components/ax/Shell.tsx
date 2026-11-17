'use client';
import {
  BarChart3,
  BookOpenText,
  ClipboardCheck,
  Gift,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  Repeat2,
  RotateCcw,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCog,
  Users,
  UtensilsCrossed,
  X,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { DeviceSwitch, useDevice } from '@/components/device/Device';
import { LogoMark } from '@/components/shell/Logo';
import { Button, Sheet, StatusBadge, useToast } from '@/components/ui';
import { can as canFn, type Permission } from '@/lib/permissions';
import { getProfile } from '@/lib/rules';
import { dispatch, resetDemo, useAppState } from '@/lib/store';
import type { AppState, Profile } from '@/lib/types';
import { cx } from '@/lib/util';

export function useOperator(): { s: AppState | null; op: Profile | null; can: (p: Permission) => boolean } {
  const s = useAppState();
  const op = s ? getProfile(s, s.session.operatorId) : null;
  return { s, op, can: (p) => !!op && canFn(op.role, p) };
}

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: (s: AppState) => number };
type NavGroup = { key: string; label: string; hue: string; items: NavItem[] };

export const AX_NAV: NavGroup[] = [
  {
    key: 'ops',
    label: '운영',
    hue: '#5B8DEF',
    items: [
      { href: '/ax', label: '대시보드', icon: LayoutDashboard },
      { href: '/ax/coach', label: '오늘 할 일 · AX Coach', icon: ListChecks },
      { href: '/ax/queue', label: '방문·구매 확인', icon: ClipboardCheck, badge: (s) => s.tasks.filter((t) => t.status === 'OPEN').length },
    ],
  },
  {
    key: 'growth',
    label: '고객·매출',
    hue: '#D79A43',
    items: [
      { href: '/ax/members', label: '회원·동의', icon: Users },
      { href: '/ax/content', label: '메뉴·고양이 콘텐츠', icon: UtensilsCrossed },
      { href: '/ax/rewards', label: '쿠폰·추천·보상', icon: Gift },
      { href: '/ax/campaigns', label: '캠페인', icon: Megaphone },
    ],
  },
  {
    key: 'intel',
    label: 'AX·성과',
    hue: '#3C9A75',
    items: [
      { href: '/ax/analytics', label: '고객 행동·전환', icon: BarChart3 },
      { href: '/ax/reorder', label: '추천·재구매', icon: Repeat2 },
      { href: '/ax/evidence', label: 'Proof · 12주 실증', icon: ShieldCheck },
    ],
  },
  {
    key: 'sys',
    label: '관리',
    hue: '#718096',
    items: [
      { href: '/ax/settings', label: '설정·역할·데이터', icon: Settings },
      { href: '/ax/why', label: 'Why AX · 로드맵', icon: BookOpenText },
    ],
  },
];

const isActive = (pathname: string, href: string) => (href === '/ax' ? pathname === '/ax' : pathname.startsWith(href));

function NavList({ s, collapsed, onNavigate }: { s: AppState; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="운영 메뉴" className="space-y-5">
      {AX_NAV.map((g) => (
        <div key={g.key}>
          {!collapsed && <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ax-shell-muted">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = isActive(pathname, it.href);
              const n = it.badge?.(s) ?? 0;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    title={collapsed ? it.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'group relative flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-[13.5px] font-semibold transition duration-150',
                      active ? 'bg-ax-shell-hover/[.10] text-ax-shell-fg' : 'text-ax-shell-fg/80 hover:bg-ax-shell-hover/[.06] hover:text-ax-shell-fg',
                      collapsed && 'justify-center',
                    )}
                  >
                    {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full" style={{ background: g.hue }} />}
                    <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg transition" style={{ background: `${g.hue}${active ? '33' : '1F'}`, color: g.hue }}>
                      <it.icon className="h-4 w-4" />
                    </span>
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{it.label}</span>}
                    {n > 0 && (
                      <span className={cx('grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10.5px] font-bold text-white', collapsed && 'absolute right-0.5 top-0.5 h-4 min-w-4')}>{n}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function RoleSwitch({ s }: { s: AppState }) {
  const toast = useToast();
  const op = getProfile(s, s.session.operatorId)!;
  return (
    <div role="radiogroup" aria-label="역할 미리보기" data-testid="role-switch" className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
      {(['op_manager', 'op_staff'] as const).map((id) => {
        const p = getProfile(s, id)!;
        const on = op.id === id;
        return (
          <button
            key={id}
            role="radio"
            aria-checked={on}
            onClick={() => {
              dispatch((d) => void (d.session.operatorId = id));
              toast(`${p.role === 'manager' ? '운영 책임자' : '매장 직원'} 권한으로 보는 중`, 'info');
            }}
            className={cx('inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-semibold transition', on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
          >
            {p.role === 'manager' ? '책임자' : '직원'}
          </button>
        );
      })}
    </div>
  );
}

const TUTORIAL = [
  { t: '오늘 할 일부터 보세요', b: 'AX Coach가 지금 처리하면 매출·재방문에 가장 도움이 되는 일 1~3개를 골라 줍니다.', href: '/ax/coach' },
  { t: '방문·구매 확인이 핵심이에요', b: '고객이 체크인하거나 구매 확인을 요청하면 이 큐에 들어옵니다. 직원이 확인해야 스탬프·추천 보상이 지급되고 실증 기록(Proof)이 남아요.', href: '/ax/queue' },
  { t: '숫자는 근거 수준을 구분해요', b: '링크 클릭·자가신고·직원확인·POS를 섞지 않습니다. 실적 KPI에는 직원확인 이상만 들어가요.', href: '/ax/analytics' },
  { t: '발송은 사람이 승인해요', b: '재구매 안내·캠페인은 규칙이 후보를 만들고, 운영 책임자가 승인한 것만 수신 동의 고객에게 앱 알림으로 갑니다.', href: '/ax/campaigns' },
  { t: '설정에서 테마·권한·데이터 상태를 관리해요', b: '7개 테마, 직원/책임자 권한 미리보기, 매장 정보의 확인 상태를 바꿀 수 있어요.', href: '/ax/settings' },
];

function Tutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (open) setI(0);
  }, [open]);
  const step = TUTORIAL[i];
  return (
    <Sheet
      open={open}
      onClose={onClose}
      tone="ax"
      title={step.t}
      description={`운영 AX 둘러보기 ${i + 1} / ${TUTORIAL.length}`}
      size="sm"
      testId="ax-tutorial"
      footer={
        <div className="flex items-center justify-between">
          <Button tone="ax" variant="ghost" onClick={onClose}>
            닫기
          </Button>
          <div className="flex gap-2">
            {i > 0 && (
              <Button tone="ax" variant="outline" onClick={() => setI(i - 1)}>
                이전
              </Button>
            )}
            <Button tone="ax" onClick={() => (i < TUTORIAL.length - 1 ? setI(i + 1) : onClose())}>
              {i < TUTORIAL.length - 1 ? '다음' : '시작하기'}
            </Button>
          </div>
        </div>
      }
    >
      <p className="text-[14.5px] leading-relaxed text-slate-700">{step.b}</p>
      <Link href={step.href} onClick={onClose} className="mt-3 inline-block text-[13px] font-semibold text-ax-primary underline-offset-2 hover:underline">
        이 화면 열기 →
      </Link>
    </Sheet>
  );
}

const TutorialCtx = createContext<() => void>(() => {});
export const useOpenTutorial = () => useContext(TutorialCtx);

export function AxShell({ children }: { children: React.ReactNode }) {
  const { s, op } = useOperator();
  const pathname = usePathname();
  const { compact, inFrame } = useDevice();
  const toast = useToast();
  const [drawer, setDrawer] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [reset, setReset] = useState(false);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (s && !s.settings.axTutorialDone && !inFrame && !navigator.webdriver) setTutorial(true);
  }, [s, inFrame]);
  const closeTutorial = () => {
    setTutorial(false);
    dispatch((d) => void (d.settings.axTutorialDone = true));
  };

  const title = AX_NAV.flatMap((g) => g.items).find((i) => isActive(pathname, i.href))?.label ?? '운영 AX';

  return (
    <TutorialCtx.Provider value={() => setTutorial(true)}>
      <div className="min-h-dvh bg-[#F6F7F9] text-slate-900">
        {/* Desktop sidebar */}
        <aside className={cx('fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-black/5 bg-ax-shell lg:flex', compact ? 'w-[72px]' : 'w-[248px]')} data-testid="ax-sidebar">
          <Link href="/ax" className={cx('flex h-16 shrink-0 items-center gap-2.5', compact ? 'justify-center' : 'px-5')}>
            <LogoMark className="h-8 w-8" />
            {!compact && (
              <span className="leading-none">
                <span className="block text-[15px] font-extrabold tracking-tight text-ax-shell-fg">다색컴패니언</span>
                <span className="mt-1 block text-[10px] font-bold tracking-[0.2em] text-ax-shell-muted">BUSINESS AX</span>
              </span>
            )}
          </Link>
          <div className={cx('min-h-0 flex-1 overflow-y-auto pb-4 no-scrollbar', compact ? 'px-2' : 'px-3')}>{s && <NavList s={s} collapsed={compact} />}</div>
          {!compact && (
            <div className="border-t border-black/5 p-3">
              <Link href="/" data-testid="surface-to-customer" className="flex items-center gap-2 rounded-xl px-2 py-2 text-[13px] font-semibold text-ax-shell-fg/80 transition hover:bg-ax-shell-hover/[.06] hover:text-ax-shell-fg">
                <Smartphone className="h-4 w-4" /> 고객 플랫폼 보기
              </Link>
            </div>
          )}
        </aside>

        <div className={cx(compact ? 'lg:pl-[72px]' : 'lg:pl-[248px]')}>
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
            <div className="flex h-14 items-center gap-2 px-3 md:h-16 md:px-6">
              <button onClick={() => setDrawer(true)} aria-label="메뉴 열기" data-testid="ax-menu" className="grid h-10 w-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="hidden text-[11.5px] font-semibold text-slate-500 md:block">다색냥 · 리얼식단 매장 운영</p>
                <h1 className="truncate text-[16px] font-extrabold tracking-tight text-slate-900 md:text-[18px]">{title}</h1>
              </div>
              <StatusBadge status="DEMO" className="hidden sm:inline-flex" />
              {s && <RoleSwitch s={s} />}
              <div className={cx('hidden items-center gap-2', compact ? '2xl:flex' : 'xl:flex')}>
                <Link href="/" className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12.5px] font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">
                  <Smartphone className="h-3.5 w-3.5" /> 고객 화면
                </Link>
              </div>
              <DeviceSwitch />
              <button onClick={() => setTutorial(true)} aria-label="둘러보기 다시 보기" className="hidden h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 md:grid">
                <HelpCircle className="h-[18px] w-[18px]" />
              </button>
              <button onClick={() => setReset(true)} aria-label="데모 초기화" className="hidden h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 md:grid">
                <RotateCcw className="h-[18px] w-[18px]" />
              </button>
            </div>
            {op?.role === 'staff' && (
              <div className="flex items-center gap-2 border-t border-amber-200/70 bg-amber-50 px-4 py-1.5 text-[12px] font-medium text-amber-900 md:px-6">
                <UserCog className="h-3.5 w-3.5" /> 매장 직원 권한으로 보는 중 — 규칙 변경·캠페인 승인·쿠폰 취소는 잠겨 있어요.
              </div>
            )}
          </header>

          <main key={pathname} className="route-in mx-auto max-w-[1360px] px-3 pb-28 pt-4 md:px-6 md:pt-6 lg:pb-12">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav aria-label="운영 하단 메뉴" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="grid grid-cols-5 pb-safe pt-1">
            {[
              { href: '/ax', label: '대시보드', icon: LayoutDashboard },
              { href: '/ax/queue', label: '확인 큐', icon: ClipboardCheck },
              { href: '/ax/coach', label: '오늘 할 일', icon: Sparkles },
              { href: '/ax/members', label: '회원', icon: Users },
            ].map((n) => {
              const active = isActive(pathname, n.href);
              const badge = n.href === '/ax/queue' && s ? s.tasks.filter((t) => t.status === 'OPEN').length : 0;
              return (
                <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className="press relative flex flex-col items-center gap-0.5 py-1.5">
                  <n.icon className={cx('h-[22px] w-[22px]', active ? 'text-ax-primary' : 'text-slate-400')} />
                  <span className={cx('text-[10.5px] font-semibold', active ? 'text-slate-900' : 'text-slate-500')}>{n.label}</span>
                  {badge > 0 && <span className="absolute right-[22%] top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{badge}</span>}
                </Link>
              );
            })}
            <button onClick={() => setDrawer(true)} className="press flex flex-col items-center gap-0.5 py-1.5">
              <Menu className="h-[22px] w-[22px] text-slate-400" />
              <span className="text-[10.5px] font-semibold text-slate-500">더보기</span>
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        {drawer && s && (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="운영 메뉴">
            <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-[320px] animate-drawer-in flex-col bg-ax-shell shadow-2xl">
              <div className="flex h-14 items-center justify-between px-4">
                <span className="flex items-center gap-2">
                  <LogoMark className="h-7 w-7" />
                  <span className="text-[14px] font-extrabold text-ax-shell-fg">Business AX</span>
                </span>
                <button onClick={() => setDrawer(false)} aria-label="메뉴 닫기" className="grid h-9 w-9 place-items-center rounded-lg text-ax-shell-fg/80 hover:bg-ax-shell-hover/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                <NavList s={s} onNavigate={() => setDrawer(false)} />
              </div>
              <div className="space-y-1 border-t border-black/5 p-3">
                <Link href="/" className="flex items-center gap-2 rounded-xl px-2 py-2 text-[13px] font-semibold text-ax-shell-fg/80">
                  <Smartphone className="h-4 w-4" /> 고객 플랫폼 보기
                </Link>
                <button
                  onClick={() => {
                    setDrawer(false);
                    setTutorial(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-[13px] font-semibold text-ax-shell-fg/80"
                >
                  <HelpCircle className="h-4 w-4" /> 둘러보기
                </button>
                <button
                  onClick={() => {
                    setDrawer(false);
                    setReset(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-[13px] font-semibold text-ax-shell-fg/80"
                >
                  <RotateCcw className="h-4 w-4" /> 데모 초기화
                </button>
              </div>
            </div>
          </div>
        )}

        <Tutorial open={tutorial} onClose={closeTutorial} />
        <Sheet
          open={reset}
          onClose={() => setReset(false)}
          tone="ax"
          title="데모 데이터를 초기화할까요?"
          description="이 브라우저의 시연 기록이 처음 상태로 돌아갑니다. 테마·글자 크기 설정은 유지됩니다."
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button tone="ax" variant="ghost" onClick={() => setReset(false)}>
                취소
              </Button>
              <Button
                tone="ax"
                data-testid="demo-reset-confirm"
                onClick={() => {
                  resetDemo();
                  setReset(false);
                  toast('데모 데이터를 초기화했어요.');
                }}
              >
                초기화
              </Button>
            </div>
          }
        >
          <span />
        </Sheet>
      </div>
    </TutorialCtx.Provider>
  );
}

/* ── AX 공통 UI ───────────────────────────────────── */
export function Panel({ title, sub, action, children, className, id, testId }: { title?: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string; testId?: string }) {
  return (
    <section id={id} data-testid={testId} className={cx('rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.04)] ring-1 ring-slate-200/70 md:p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-extrabold tracking-tight text-slate-900">{title}</h2>}
            {sub && <p className="mt-0.5 text-[12.5px] text-slate-500">{sub}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Locked({ reason }: { reason: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11.5px] font-semibold text-slate-500" title={reason}>
      <ShieldCheck className="h-3.5 w-3.5" /> {reason}
    </span>
  );
}

export function PageIntro({ title, body, right }: { title: string; body: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:mb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900 md:text-[22px]">{title}</h2>
        <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-slate-500">{body}</p>
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Tag({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'violet' }) {
  const t = { slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', amber: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-700', violet: 'bg-violet-50 text-violet-700' }[tone];
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold', t)}>{children}</span>;
}
