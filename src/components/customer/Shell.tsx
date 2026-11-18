'use client';
import { Bell, Cat, ChevronLeft, Home, LayoutDashboard, RotateCcw, Salad, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DeviceSwitch, useDevice } from '@/components/device/Device';
import { DemoToolsButton } from '@/components/shell/DemoTools';
import { Wordmark } from '@/components/shell/Logo';
import { Button, Sheet, StatusBadge, useToast } from '@/components/ui';
import { getProfile } from '@/lib/rules';
import { dispatch, resetDemo, useAppState } from '@/lib/store';
import type { AppState, Profile } from '@/lib/types';
import { SHOW_DEMO_AX_ENTRY } from '@/lib/mode';
import { cx } from '@/lib/util';

export function useCustomer(): { s: AppState | null; me: Profile | null } {
  const s = useAppState();
  const me = s ? getProfile(s, s.session.customerId) : null;
  return { s, me: me && me.role === 'customer' && me.status !== 'anonymized' ? me : null };
}

const NAV = [
  { href: '/', label: '홈', icon: Home, match: (p: string) => p === '/' },
  { href: '/realsicdan', label: '리얼식단', icon: Salad, match: (p: string) => p.startsWith('/realsicdan') || p.startsWith('/menu') },
  { href: '/dasek', label: '다색냥', icon: Cat, match: (p: string) => p.startsWith('/dasek') },
  { href: '/my', label: '마이', icon: UserRound, match: (p: string) => p.startsWith('/my') || p === '/login' || p === '/signup' },
];

function DemoBar() {
  const { inFrame, desktop } = useDevice();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  if (inFrame || !desktop) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex min-h-11 max-w-6xl items-center justify-between gap-3 px-5 py-1 text-[0.875rem] text-amber-900">
        <div className="flex min-w-0 items-center gap-2">
          <StatusBadge status="DEMO" />
          <span className="truncate">시연용 데이터입니다. 실제 고양이·메뉴·혜택은 운영자 확인 후 교체됩니다.</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DeviceSwitch tone="brand" />
          {SHOW_DEMO_AX_ENTRY && (
            <Link href="/ax" data-testid="surface-to-ax" title="시연용 — 실제 운영에서는 인증된 직원·관리자에게만 보입니다" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 font-bold text-white shadow-sm transition hover:bg-slate-700">
              <LayoutDashboard className="h-4 w-4" /> 시연용 AX 보기
            </Link>
          )}
          <button onClick={() => setConfirm(true)} className="inline-flex h-8 items-center gap-1 rounded-md px-2 font-semibold text-amber-900 transition hover:bg-amber-100">
            <RotateCcw className="h-3.5 w-3.5" /> 데모 초기화
          </button>
        </div>
      </div>
      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="데모 데이터를 처음 상태로 되돌릴까요?"
        description="이 브라우저에 저장된 시연 기록(가입·쿠폰·확인 내역)이 초기화됩니다. 실제 운영 데이터에는 영향이 없습니다."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                resetDemo();
                setConfirm(false);
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
  );
}

function DesktopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { s, me } = useCustomer();
  const { compact } = useDevice();
  const unread = me && s ? s.notifications.filter((n) => n.userId === me.id && !n.readAt).length : 0;
  const [q, setQ] = useState('');
  return (
    <header className="sticky top-0 z-30 hidden border-b border-line bg-white md:block">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link href="/" aria-label="다색컴패니언 홈" className="inline-flex min-h-11 shrink-0 items-center">
          <Wordmark compact={compact} />
        </Link>
        <nav className="flex items-center gap-1" aria-label="주요 메뉴">
          {[...NAV.slice(1, 3), { href: '/membership', label: '멤버십', match: (p: string) => p.startsWith('/membership') }].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={n.match(pathname) ? 'page' : undefined}
              className={cx('inline-flex h-11 items-center rounded-lg px-3.5 text-[0.9375rem] transition', n.match(pathname) ? 'bg-brand-50 font-bold text-brand-700' : 'font-semibold text-ink-2 hover:bg-canvas hover:text-ink')}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form
          role="search"
          className={cx('ml-auto items-center', compact ? 'hidden xl:flex' : 'hidden lg:flex')}
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/realsicdan?q=${encodeURIComponent(q)}`);
          }}
        >
          <label className="flex h-11 w-64 items-center gap-2 rounded-full bg-canvas px-3.5 ring-1 ring-inset ring-cardline focus-within:ring-2 focus-within:ring-brand-200">
            <Search className="h-4 w-4 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="메뉴 검색" aria-label="메뉴 검색" className="w-full bg-transparent text-[0.9375rem] outline-none placeholder:text-ink-3" />
          </label>
        </form>
        <div className={cx('flex items-center gap-1.5', compact ? 'ml-auto xl:ml-0' : 'ml-auto lg:ml-0')}>
          {me && (
            <Link href="/my/inbox" aria-label={`알림 ${unread}개`} className="relative grid h-11 w-11 place-items-center rounded-full text-ink-2 transition hover:bg-canvas">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span data-badge className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral-600 px-1 text-[0.75rem] font-bold text-white ring-2 ring-white">{unread}</span>}
            </Link>
          )}
          {me ? (
            <Link href="/my" className="inline-flex h-11 items-center gap-2 rounded-full bg-canvas pl-1.5 pr-3.5 text-[0.9375rem] font-semibold text-ink ring-1 ring-inset ring-cardline transition hover:bg-line">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-[0.875rem] font-bold text-white">{me.name.slice(0, 1)}</span>
              마이
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login" className="inline-flex h-11 items-center rounded-full px-4 text-[0.9375rem] font-semibold text-ink-2 transition hover:bg-canvas">
                로그인
              </Link>
              <Link href="/signup" className="inline-flex h-11 items-center rounded-full bg-brand-600 px-4 text-[0.9375rem] font-bold text-white shadow-sm transition hover:bg-brand-700">
                가입하고 혜택 받기
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { s, me } = useCustomer();
  const unread = me && s ? s.notifications.filter((n) => n.userId === me.id && !n.readAt).length : 0;
  return (
    <nav aria-label="하단 메뉴" className="fixed inset-x-0 bottom-0 z-30 border-t border-cardline bg-white md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 pb-safe pt-1.5">
        {NAV.map((n) => {
          const active = n.match(pathname);
          const Icon = n.icon;
          return (
            <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} className="group flex flex-col items-center gap-0.5 py-1 press">
              <span className={cx('relative grid h-8 w-14 place-items-center rounded-full transition duration-150', active ? 'bg-brand-100 text-brand-700' : 'text-ink-3 group-active:bg-canvas')}>
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.9} />
                {n.href === '/my' && unread > 0 && <span className="absolute right-3 top-0.5 h-2.5 w-2.5 rounded-full bg-coral-600 ring-2 ring-white" />}
              </span>
              <span className={cx('text-[0.8125rem]', active ? 'font-bold text-brand-700' : 'font-semibold text-ink-3')}>{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** 모바일 서브페이지 상단 (뒤로가기 + 제목) */
export function BackHeader({ title, right, fallback = '/' }: { title: string; right?: React.ReactNode; fallback?: string }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-line bg-white px-2 md:hidden">
      <button
        aria-label="뒤로"
        onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
        className="grid h-11 w-11 place-items-center rounded-full text-ink transition active:bg-canvas"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <p className="min-w-0 flex-1 truncate text-[1.0625rem] font-bold text-ink">{title}</p>
      <div className="flex items-center gap-1 pr-1">
        <DemoToolsButton label="DEMO" className="px-2" />
        {right}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-canvas pb-28 md:pb-10">
      <div className="mx-auto max-w-6xl px-5 py-8 text-[0.875rem] leading-relaxed text-ink-3">
        <div className="-mx-2 flex flex-wrap items-center gap-x-0.5 gap-y-0">
          <span className="px-2 font-bold text-ink-2">다색컴패니언</span>
          <Link href="/membership" className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-ink-2 hover:bg-white hover:text-ink">
            멤버십 안내
          </Link>
          <Link href="/roadmap" className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-ink-2 hover:bg-white hover:text-ink">
            준비 중인 서비스
          </Link>
          <Link href="/privacy" className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-ink-2 hover:bg-white hover:text-ink">
            개인정보 처리 안내(초안)
          </Link>
          <Link href="/credits" className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-ink-2 hover:bg-white hover:text-ink">
            샘플 사진 출처
          </Link>
          {SHOW_DEMO_AX_ENTRY && (
            <Link href="/ax" className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-ink-2 hover:bg-white hover:text-ink">
              매장 운영자(시연)
            </Link>
          )}
        </div>
        <p className="mt-3">리얼식단 · 다색냥 — 사업자 정보와 운영 주체는 운영자 확인 후 표기됩니다.</p>
        <p>현재 화면은 DEMO 데이터로 동작하며, 결제·예약 확정은 이 앱에서 처리하지 않습니다. 외부 예약은 각 채널에서 확정됩니다.</p>
      </div>
    </footer>
  );
}

function Onboarding() {
  const { s } = useCustomer();
  const { inFrame } = useDevice();
  const pathname = usePathname();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (s && !s.settings.customerOnboarded && pathname === '/' && !inFrame && !navigator.webdriver) setOpen(true);
  }, [s, pathname, inFrame]);
  const close = () => {
    setOpen(false);
    dispatch((d) => {
      d.settings.customerOnboarded = true;
    });
  };
  const steps = [
    { t: '리얼식단 메뉴를 둘러보고 저장해요', b: '샐러드·도시락·간식을 사진으로 보고, 마음에 드는 메뉴는 저장해 두세요.' },
    { t: '다색냥 친구들을 미리 만나요', b: '고양이별 사진을 넘겨 보고, 성격과 교감 수칙을 확인한 뒤 방문하세요.' },
    { t: '방문·구매가 확인되면 혜택이 쌓여요', b: '매장에서 체크인하거나 회원코드를 보여주면 직원 확인 후 스탬프가 적립됩니다.' },
  ];
  return (
    <Sheet
      open={open}
      onClose={close}
      title={steps[step].t}
      description={`${step + 1} / ${steps.length}`}
      size="sm"
      testId="customer-onboarding"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={close}>
            건너뛰기
          </Button>
          <Button onClick={() => (step < steps.length - 1 ? setStep(step + 1) : close())}>{step < steps.length - 1 ? '다음' : '시작하기'}</Button>
        </div>
      }
    >
      <p className="text-[0.9375rem] leading-relaxed text-ink-2">{steps[step].b}</p>
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span key={i} className={cx('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-brand-600' : 'w-1.5 bg-line')} />
        ))}
      </div>
    </Sheet>
  );
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-white">
      <DemoBar />
      <DesktopHeader />
      <main key={pathname} className="route-in pb-24 md:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <Onboarding />
    </div>
  );
}
