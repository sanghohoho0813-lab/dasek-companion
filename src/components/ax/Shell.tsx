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
  Store,
  Sparkles,
  UserCog,
  Users,
  UtensilsCrossed,
  X,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DeviceSwitch, useDevice } from '@/components/device/Device';
import { DemoToolsButton } from '@/components/shell/DemoTools';
import { ExpansionNav } from '@/components/shell/Expansion';
import { LiveClock } from '@/components/shell/LiveClock';
import { LogoMark } from '@/components/shell/Logo';
import { Button, Sheet, StatusBadge, useToast } from '@/components/ui';
import { can as canFn, type Permission } from '@/lib/permissions';
import { getProfile, operatorIdentity } from '@/lib/rules';
import { dispatch, resetDemo, useAppState } from '@/lib/store';
import type { AppState, Profile } from '@/lib/types';
import { cx } from '@/lib/util';

export function useOperator(): { s: AppState | null; op: Profile | null; can: (p: Permission) => boolean } {
  const s = useAppState();
  const op = s ? getProfile(s, s.session.operatorId) : null;
  return { s, op, can: (p) => !!op && canFn(op.role, p) };
}

type NavItem = { href: string; label: string; title?: string; icon: React.ComponentType<{ className?: string }>; badge?: (s: AppState) => number };
type NavGroup = { key: string; label: string; hue: string; items: NavItem[] };

/** 메뉴 이름은 매장에서 쓰는 말로. 기술 용어(AX Coach·Proof 등)는 각 화면 안 설명과 'Why AX'에 남긴다 */
export const AX_NAV: NavGroup[] = [
  {
    key: 'ops',
    label: '매일 하는 일',
    hue: '#5B8DEF',
    items: [
      { href: '/ax', label: '오늘의 매장', title: '오늘의 매장 운영', icon: LayoutDashboard },
      { href: '/ax/queue', label: '방문·구매 확인', icon: ClipboardCheck, badge: (s) => s.tasks.filter((t) => t.status === 'OPEN').length },
      { href: '/ax/coach', label: '오늘 추천 업무', icon: ListChecks },
    ],
  },
  {
    key: 'growth',
    label: '고객·혜택',
    hue: '#D79A43',
    items: [
      { href: '/ax/members', label: '회원 관리', icon: Users },
      { href: '/ax/content', label: '메뉴·고양이 사진', icon: UtensilsCrossed },
      { href: '/ax/rewards', label: '쿠폰·혜택', icon: Gift },
      { href: '/ax/campaigns', label: '고객 알림 보내기', icon: Megaphone },
    ],
  },
  {
    key: 'intel',
    label: '분석·성과',
    hue: '#3C9A75',
    items: [
      { href: '/ax/analytics', label: '고객 이용 분석', icon: BarChart3 },
      { href: '/ax/reorder', label: '다시 올 고객 찾기', icon: Repeat2 },
      { href: '/ax/evidence', label: '성과 기록', icon: ShieldCheck },
    ],
  },
  {
    key: 'sys',
    label: '관리',
    hue: '#718096',
    items: [
      { href: '/ax/settings', label: '설정·권한', icon: Settings },
      { href: '/ax/why', label: '서비스 소개·로드맵', icon: BookOpenText },
    ],
  },
];

const isActive = (pathname: string, href: string) => (href === '/ax' ? pathname === '/ax' : pathname.startsWith(href));

function NavList({ s, collapsed, onNavigate }: { s: AppState; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [bar, setBar] = useState({ top: 0, h: 0 });
  useLayoutEffect(() => {
    const nav = navRef.current;
    const a = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!nav || !a) return setBar({ top: 0, h: 0 });
    const nr = nav.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    setBar({ top: ar.top - nr.top + 8, h: ar.height - 16 });
  }, [pathname, collapsed]);
  return (
    <nav aria-label="운영 메뉴" className="relative space-y-5" ref={navRef}>
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 w-1 rounded-r-full bg-ax-highlight transition-[transform,height,opacity] duration-200 ease-out"
        style={{ transform: `translateY(${bar.top}px)`, height: bar.h, opacity: bar.h ? 1 : 0 }}
      />
      {AX_NAV.map((g) => (
        <div key={g.key}>
          {!collapsed && (
            <p className="mb-1.5 flex items-center gap-2 px-2.5 text-[0.8125rem] font-bold tracking-[0.04em] text-ax-shell-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: g.hue }} aria-hidden />
              {g.label}
            </p>
          )}
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
                      'group relative flex min-h-11 items-center gap-3 rounded-xl px-2.5 py-1.5 text-[0.9375rem] transition duration-150',
                      active ? 'bg-ax-shell-hover/[.12] font-bold text-ax-shell-fg' : 'font-semibold text-ax-shell-fg/85 hover:bg-ax-shell-hover/[.07] hover:text-ax-shell-fg',
                      collapsed && 'justify-center',
                    )}
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition duration-150 group-hover:scale-105" style={{ background: `${g.hue}${active ? '38' : '24'}`, color: g.hue }}>
                      <it.icon className="h-[18px] w-[18px]" />
                    </span>
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{it.label}</span>}
                    {n > 0 && (
                      <span data-badge aria-label={`대기 ${n}건`} className={cx('grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1.5 text-[0.8125rem] font-bold text-white tabular-nums', collapsed && 'absolute right-0 top-0 h-5 min-w-5 text-[0.75rem]')}>{n}</span>
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

function RoleSwitch({ s, onShell }: { s: AppState; onShell?: boolean }) {
  const toast = useToast();
  const op = getProfile(s, s.session.operatorId)!;
  return (
    <div role="radiogroup" aria-label="역할 미리보기 (DEMO)" data-testid="role-switch" className={cx('inline-flex items-center gap-0.5 rounded-lg p-0.5', onShell ? 'w-full bg-ax-shell-hover/[.10]' : 'bg-slate-100')}>
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
            className={cx(
              'inline-flex h-11 items-center justify-center gap-1 rounded-md px-2.5 text-[0.875rem] font-semibold transition lg:h-9',
              onShell && 'flex-1',
              on ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : onShell ? 'text-ax-shell-fg hover:bg-ax-shell-hover/[.08]' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {p.role === 'manager' ? '책임자' : '직원'}
          </button>
        );
      })}
    </div>
  );
}

/** 로그인 사용자처럼 보이는 프로필 — 이름·직함은 프로필 데이터, 역할은 현재 미리보기 역할. 서버 인증 전이므로 DEMO 를 함께 표시 */
function OperatorCard({ op, compact }: { op: Profile; compact?: boolean }) {
  const id = operatorIdentity(op);
  return (
    <Link
      href="/ax/settings?tab=roles"
      data-testid="operator-profile"
      title={compact ? `${id.displayName} · ${id.roleLabel} · DEMO` : undefined}
      aria-label={`${id.displayName}, ${id.roleLabel}, DEMO 계정 — 역할·권한 설정 열기`}
      className={cx('flex min-h-11 items-center gap-3 rounded-xl transition hover:bg-ax-shell-hover/[.08]', compact ? 'justify-center p-1' : 'px-2 py-2')}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ax-primary text-[1rem] font-extrabold text-white ring-2 ring-ax-shell-hover/20">{id.initial}</span>
      {!compact && (
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[0.9375rem] font-bold text-ax-shell-fg" data-testid="operator-name">
            {id.displayName}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ax-shell-muted">
            {id.roleLabel}
            {id.isDemo && <StatusBadge status="DEMO" />}
          </span>
        </span>
      )}
    </Link>
  );
}

const Credit = ({ className }: { className?: string }) => (
  <p data-testid="maker-credit" className={cx('text-[0.8125rem] font-medium text-ax-shell-muted', className)}>
    제작 · 미래에이아이랩
  </p>
);

/** 운영 AX → 고객 화면 (고객 플랫폼 색 = 청록) */
function ToCustomerButton({ className, label = '고객 화면 보기', short }: { className?: string; label?: string; short?: string }) {
  return (
    <Link
      href="/"
      data-testid="to-customer"
      aria-label="고객 화면 보기 (고객 플랫폼으로 전환)"
      className={cx('inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-[0.9375rem] font-bold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 lg:h-10', className)}
    >
      <Store className="h-[18px] w-[18px]" aria-hidden />
      {short ? (
        <>
          <span className="min-[400px]:hidden">{short}</span>
          <span className="hidden min-[400px]:inline">{label}</span>
        </>
      ) : (
        label
      )}
    </Link>
  );
}

const TUTORIAL = [
  { t: '이 화면은 매장 운영관리 프로그램이에요', b: '리얼식단·다색냥의 고객 방문·구매·회원 혜택을 한곳에서 관리합니다. 첫 화면에서 지금 확인할 요청과 오늘 현황을 먼저 보여 드려요.', href: '/ax' },
  { t: '방문·구매 확인이 가장 중요해요', b: '고객이 체크인하거나 구매 확인을 요청하면 이 목록에 들어와요. 직원이 확인해야 스탬프·친구 추천 보상이 지급되고 성과 기록이 남아요.', href: '/ax/queue' },
  { t: '오늘 추천 업무를 참고하세요', b: '규칙으로 고른 1~3개의 할 일이에요. 재방문·콘텐츠 보완 등 지금 하면 도움이 되는 일을 알려 줍니다.', href: '/ax/coach' },
  { t: '알림 발송은 책임자가 승인해요', b: '다시 올 고객 안내·고객 알림은 규칙이 대상을 고르고, 운영 책임자가 승인한 것만 수신 동의 고객에게 앱 알림으로 가요.', href: '/ax/campaigns' },
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
      description={`둘러보기 ${i + 1} / ${TUTORIAL.length}`}
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
      <p className="text-[1rem] leading-relaxed text-slate-700">{step.b}</p>
      <Link href={step.href} onClick={onClose} className="mt-3 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-ax-primary underline-offset-2 hover:underline">
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
  const { compact, inFrame, desktop } = useDevice();
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

  const item = AX_NAV.flatMap((g) => g.items).find((i) => isActive(pathname, i.href));
  const title = item?.title ?? item?.label ?? '매장 운영';
  // 역할 미리보기 위치: PC(넓은 사이드바) → 사이드바 프로필 아래, PC 동시보기(좁은 사이드바) → 헤더, 모바일 → 메뉴(Drawer)
  const roleInSidebar = desktop && !compact && !inFrame;
  const roleInHeader = desktop && (compact || inFrame);

  return (
    <TutorialCtx.Provider value={() => setTutorial(true)}>
      <div className="min-h-dvh bg-[#F4F6F8] text-slate-900" data-surface="ax">
        {/* PC 사이드바: 위 로고 · 가운데 메뉴(따로 스크롤) · 아래 고객 화면·프로필·제작 표기(항상 보임) */}
        <aside className={cx('fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-black/10 bg-ax-shell lg:flex', compact ? 'w-[76px]' : 'w-[264px]')} data-testid="ax-sidebar">
          <Link href="/ax" className={cx('flex h-16 shrink-0 items-center gap-2.5', compact ? 'justify-center' : 'px-5')} aria-label="다색컴패니언 BUSINESS AX — 오늘의 매장">
            <LogoMark className="h-11 w-11 lg:h-8 lg:w-8" />
            {!compact && (
              <span className="leading-none">
                <span className="block text-[1rem] font-extrabold tracking-tight text-ax-shell-fg">다색컴패니언</span>
                <span className="mt-1 block text-[0.8125rem] font-bold tracking-[0.14em] text-ax-shell-muted">BUSINESS AX</span>
              </span>
            )}
          </Link>
          <div className={cx('min-h-0 flex-1 overflow-y-auto pb-4 no-scrollbar', compact ? 'px-2' : 'px-3')}>
            {s && <NavList s={s} collapsed={compact} />}
            {/* 추가 확장 예정 (대표 기획안) — 평소엔 접혀 있음 */}
            <div className="mt-5">
              <ExpansionNav tone="shell" compact={compact} />
            </div>
          </div>
          <div className={cx('shrink-0 space-y-2 border-t border-black/10', compact ? 'px-2 py-3' : 'p-3')} data-testid="sidebar-footer">
            {compact ? (
              <Link href="/" data-testid="surface-to-customer" title="고객 화면 보기" aria-label="고객 화면 보기" className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white hover:bg-brand-700">
                <Store className="h-5 w-5" />
              </Link>
            ) : (
              <Link href="/" data-testid="surface-to-customer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 text-[0.9375rem] font-bold text-white shadow-sm transition hover:bg-brand-700">
                <Store className="h-[18px] w-[18px]" /> 고객 화면 보기
              </Link>
            )}
            {op && <OperatorCard op={op} compact={compact} />}
            {roleInSidebar && s && <RoleSwitch s={s} onShell />}
            {!compact && <Credit className="px-2 pt-0.5" />}
          </div>
        </aside>

        <div className={cx(compact ? 'lg:pl-[76px]' : 'lg:pl-[264px]')}>
          <header className="sticky top-0 z-20 border-b border-axline bg-white">
            <div className="flex h-14 items-center gap-2 px-3 md:h-16 md:px-6">
              <button onClick={() => setDrawer(true)} aria-label="메뉴 열기" data-testid="ax-menu" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h1 className="truncate text-[1.125rem] font-extrabold leading-tight tracking-tight text-slate-900 md:text-[1.25rem]">{title}</h1>
                <p className="mt-0.5 hidden truncate text-[0.8125rem] font-semibold text-slate-500 md:block">리얼식단 · 다색냥 고객·매장 운영관리</p>
              </div>
              <LiveClock variant="pill" className="hidden lg:inline-flex" />
              <ToCustomerButton className="hidden md:inline-flex" label="고객 화면 보기" />
              <ToCustomerButton className="md:hidden" label="고객 화면" short="고객" />
              <DemoToolsButton tone="ax" className="lg:hidden" />
              {roleInHeader && s && <RoleSwitch s={s} />}
              <DeviceSwitch className="hidden lg:inline-flex" iconOnly={!compact ? 'below-2xl' : 'always'} />
              <button onClick={() => setTutorial(true)} aria-label="둘러보기 다시 보기" className="hidden h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:grid">
                <HelpCircle className="h-[18px] w-[18px]" />
              </button>
              <button onClick={() => setReset(true)} aria-label="데모 초기화" className="hidden h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:grid">
                <RotateCcw className="h-[18px] w-[18px]" />
              </button>
            </div>
            {/* 휴대폰·태블릿: 날짜·시각은 따로 한 줄 (제목·버튼과 겹치지 않게) */}
            <div className="flex h-8 items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 md:px-6 lg:hidden" data-testid="clock-row">
              <LiveClock />
              <span className="truncate text-[0.8125rem] font-semibold text-slate-500">{op ? operatorIdentity(op).roleLabel : ''} · DEMO</span>
            </div>
            {op?.role === 'staff' && (
              <div className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-[0.875rem] font-medium text-amber-900 md:px-6">
                <UserCog className="h-4 w-4 shrink-0" /> 매장 직원 권한으로 보는 중 — 규칙 변경·캠페인 승인·쿠폰 취소는 잠겨 있어요.
              </div>
            )}
          </header>

          <main key={pathname} className="route-in mx-auto max-w-[1360px] px-3 pb-28 pt-3 md:px-6 md:pt-6 lg:pb-12">
            {children}
          </main>
        </div>

        {/* 모바일 하단 메뉴 — 자주 쓰는 4개 + 더보기 */}
        <nav aria-label="운영 하단 메뉴" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white lg:hidden">
          <div className="grid grid-cols-5 pb-safe pt-1">
            {[
              { href: '/ax', label: '홈', icon: LayoutDashboard },
              { href: '/ax/queue', label: '확인', icon: ClipboardCheck },
              { href: '/ax/members', label: '회원', icon: Users },
              { href: '/ax/coach', label: '추천 업무', icon: Sparkles },
            ].map((n) => {
              const active = isActive(pathname, n.href);
              const badge = n.href === '/ax/queue' && s ? s.tasks.filter((t) => t.status === 'OPEN').length : 0;
              return (
                <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} aria-label={badge ? `${n.label} (대기 ${badge}건)` : undefined} className="press relative flex flex-col items-center gap-0.5 py-1.5">
                  <n.icon className={cx('h-[22px] w-[22px]', active ? 'text-ax-primary' : 'text-slate-500')} />
                  <span className={cx('text-[0.8125rem]', active ? 'font-bold text-slate-900' : 'font-semibold text-slate-600')}>{n.label}</span>
                  {badge > 0 && <span data-badge aria-hidden className="absolute right-[18%] top-0 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[0.75rem] font-bold text-white ring-2 ring-white">{badge}</span>}
                </Link>
              );
            })}
            <button onClick={() => setDrawer(true)} className="press flex flex-col items-center gap-0.5 py-1.5" aria-haspopup="dialog">
              <Menu className="h-[22px] w-[22px] text-slate-500" />
              <span className="text-[0.8125rem] font-semibold text-slate-600">더보기</span>
            </button>
          </div>
        </nav>

        {/* 모바일 메뉴(Drawer) — 메뉴는 따로 스크롤, 아래에 프로필·역할·제작 표기 */}
        {drawer && s && (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="운영 메뉴">
            <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-[330px] animate-drawer-in flex-col bg-ax-shell shadow-2xl" data-testid="ax-drawer">
              <div className="flex h-16 shrink-0 items-center justify-between px-4">
                <span className="flex items-center gap-2.5">
                  <LogoMark className="h-9 w-9" />
                  <span className="leading-none">
                    <span className="block text-[1rem] font-extrabold text-ax-shell-fg">다색컴패니언</span>
                    <span className="mt-1 block text-[0.8125rem] font-bold tracking-[0.14em] text-ax-shell-muted">BUSINESS AX</span>
                  </span>
                </span>
                <button onClick={() => setDrawer(false)} aria-label="메뉴 닫기" className="grid h-11 w-11 place-items-center rounded-lg text-ax-shell-fg hover:bg-ax-shell-hover/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                <NavList s={s} onNavigate={() => setDrawer(false)} />
                <div className="mt-5">
                  <ExpansionNav tone="shell" onNavigate={() => setDrawer(false)} />
                </div>
                <div className="mt-5 space-y-0.5 border-t border-black/10 pt-3">
                  <button
                    onClick={() => {
                      setDrawer(false);
                      setTutorial(true);
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 text-[0.9375rem] font-semibold text-ax-shell-fg"
                  >
                    <HelpCircle className="h-5 w-5" /> 둘러보기
                  </button>
                  <button
                    onClick={() => {
                      setDrawer(false);
                      setReset(true);
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 text-[0.9375rem] font-semibold text-ax-shell-fg"
                  >
                    <RotateCcw className="h-5 w-5" /> 데모 초기화
                  </button>
                </div>
              </div>
              <div className="shrink-0 space-y-2 border-t border-black/10 p-3 pb-safe">
                <Link href="/" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-white">
                  <Store className="h-[18px] w-[18px]" /> 고객 화면 보기
                </Link>
                {op && <OperatorCard op={op} />}
                <RoleSwitch s={s} onShell />
                <Credit className="px-2" />
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
/** 업무 카드 — 실선 테두리 + 절제된 그림자(.ax-card), 제목 18px · 설명 14px */
export function Panel({ title, sub, action, children, className, id, testId }: { title?: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string; testId?: string }) {
  return (
    <section id={id} data-testid={testId} className={cx('ax-card min-w-0 p-4 md:p-5', className)}>
      {(title || action) && (
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0 flex-[1_1_14rem]">
            {title && <h2 className="ax-h2">{title}</h2>}
            {sub && <p className="mt-0.5 text-[0.875rem] leading-snug text-slate-500">{sub}</p>}
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
    <span data-badge className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[0.875rem] font-semibold text-slate-600 ring-1 ring-inset ring-slate-200" title={reason}>
      <ShieldCheck className="h-4 w-4" /> {reason}
    </span>
  );
}

/**
 * 화면 머리 (4차) — 제목은 상단 헤더에 이미 있으므로 다시 크게 쓰지 않는다(스크린리더용 h2 만).
 * 한 줄 요약을 먼저, 긴 설명(기술 용어 포함)은 '설명 더보기'로 단계 공개.
 */
export function PageIntro({ title, body, more, right }: { title: string; body: string; more?: string; right?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 md:mb-5">
      <div className="min-w-0 flex-[1_1_20rem]">
        <h2 className="sr-only">{title}</h2>
        <p className="max-w-3xl text-[0.9375rem] font-medium leading-relaxed text-slate-700 md:text-[1rem]">
          {body}
          {more && (
            <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="ml-1.5 inline-flex min-h-11 items-center align-middle text-[0.875rem] font-bold text-ax-primary underline-offset-2 hover:underline lg:min-h-0">
              {open ? '설명 접기' : '설명 더보기'}
            </button>
          )}
        </p>
        {more && open && <p className="mt-1.5 max-w-3xl rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.875rem] leading-relaxed text-slate-600">{more}</p>}
      </div>
      {right && <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Tag({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'violet' }) {
  const t = { slate: 'bg-slate-100 text-slate-700 ring-slate-200', green: 'bg-emerald-50 text-emerald-800 ring-emerald-200', blue: 'bg-sky-50 text-sky-800 ring-sky-200', amber: 'bg-amber-50 text-amber-900 ring-amber-200', red: 'bg-red-50 text-red-800 ring-red-200', violet: 'bg-violet-50 text-violet-800 ring-violet-200' }[tone];
  return <span data-badge className={cx('inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[0.8125rem] font-semibold ring-1 ring-inset', t)}>{children}</span>;
}
