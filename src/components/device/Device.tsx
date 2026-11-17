'use client';
/**
 * Device View — [PC] [Mobile] [PC+Mobile]  (Unified v4.1 P0)
 * - Mobile은 같은 앱·같은 Route를 390px iframe에서 실제 렌더링한다(스크린샷/복제 UI 아님).
 * - 같은 Origin이므로 localStorage(DEMO 저장소)·세션을 그대로 공유한다.
 * - PC ↔ Mobile Route는 postMessage로 양방향 동기화, iframe 안에서는 Device View를 만들지 않는다(재귀 차단).
 */
import { Columns2, Monitor, Smartphone } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/util';

export type DeviceMode = 'pc' | 'mobile' | 'dual';
const KEY = 'dasek:device-view';
const MSG_ROUTE = 'dasek:route';
const MSG_NAV = 'dasek:navigate';

interface DeviceCtx {
  mode: DeviceMode;
  setMode: (m: DeviceMode) => void;
  inFrame: boolean;
  desktop: boolean; // ≥1024px 실제 데스크톱
  compact: boolean; // Dual에서 PC 영역이 좁아진 상태
}
const Ctx = createContext<DeviceCtx>({ mode: 'pc', setMode: () => {}, inFrame: false, desktop: false, compact: false });
export const useDevice = () => useContext(Ctx);

function currentPath() {
  const sp = new URLSearchParams(window.location.search);
  sp.delete('frame');
  const q = sp.toString();
  return `${window.location.pathname}${q ? `?${q}` : ''}`;
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DeviceMode>('pc');
  const [inFrame, setInFrame] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const framed = window.self !== window.top;
    setInFrame(framed);
    if (framed) document.documentElement.dataset.frame = 'mobile';
    try {
      const saved = window.localStorage.getItem(KEY) as DeviceMode | null;
      if (saved === 'pc' || saved === 'mobile' || saved === 'dual') setModeState(saved);
    } catch {
      /* noop */
    }
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const setMode = useCallback((m: DeviceMode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(KEY, m);
    } catch {
      /* noop */
    }
  }, []);

  const effective: DeviceMode = inFrame || !desktop ? 'pc' : mode;
  useEffect(() => {
    document.documentElement.dataset.dual = effective === 'dual' ? 'true' : 'false';
  }, [effective]);

  return <Ctx.Provider value={{ mode: effective, setMode, inFrame, desktop, compact: effective === 'dual' }}>{children}</Ctx.Provider>;
}

/** iframe 내부: 자신의 Route를 부모에 알리고, 부모의 이동 지시를 따른다 */
export function FrameSync() {
  const { inFrame } = useDevice();
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (!inFrame) return;
    window.parent.postMessage({ type: MSG_ROUTE, path: currentPath() }, window.location.origin);
  }, [inFrame, pathname]);
  useEffect(() => {
    if (!inFrame) return;
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      if (e.data?.type === MSG_NAV && typeof e.data.path === 'string' && e.data.path !== currentPath()) router.push(e.data.path);
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [inFrame, router]);
  return null;
}

export function DeviceSwitch({ tone = 'ax', className }: { tone?: 'ax' | 'brand'; className?: string }) {
  const { mode, setMode, desktop, inFrame } = useDevice();
  if (inFrame || !desktop) return null;
  const opts: { v: DeviceMode; label: string; icon: React.ReactNode }[] = [
    { v: 'pc', label: 'PC', icon: <Monitor className="h-3.5 w-3.5" /> },
    { v: 'mobile', label: 'Mobile', icon: <Smartphone className="h-3.5 w-3.5" /> },
    { v: 'dual', label: 'PC+Mobile', icon: <Columns2 className="h-3.5 w-3.5" /> },
  ];
  return (
    <div role="radiogroup" aria-label="기기 보기" data-testid="device-switch" className={cx('inline-flex items-center gap-0.5 rounded-lg p-0.5', tone === 'ax' ? 'bg-slate-100' : 'bg-canvas ring-1 ring-line', className)}>
      {opts.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={mode === o.v}
          data-testid={`device-${o.v}`}
          onClick={() => setMode(o.v)}
          className={cx(
            'inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-semibold transition duration-150',
            mode === o.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PhoneFrame({ label }: { label: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => {
    const p = currentPath();
    return `${p}${p.includes('?') ? '&' : '?'}frame=mobile`;
  });
  const lastFromFrame = useRef<string | null>(null);

  // PC → Mobile
  useEffect(() => {
    const path = currentPath();
    if (lastFromFrame.current === path) {
      lastFromFrame.current = null; // 루프 방지: Frame에서 온 이동은 되돌려 보내지 않음
      return;
    }
    ref.current?.contentWindow?.postMessage({ type: MSG_NAV, path }, window.location.origin);
  }, [pathname]);

  // Mobile → PC
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.type !== MSG_ROUTE || typeof e.data.path !== 'string') return;
      lastFromFrame.current = e.data.path;
      if (e.data.path !== currentPath()) router.push(e.data.path);
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [router]);

  return (
    <div className="flex flex-col items-center">
      <div
        data-testid="device-frame"
        className="relative rounded-[46px] bg-[#111418] p-[9px] shadow-[0_30px_60px_-20px_rgba(15,30,40,.45)] ring-1 ring-black/40"
        style={{ height: 'min(862px, calc(100dvh - 92px))' }}
      >
        <div className="absolute left-1/2 top-[14px] z-10 h-[22px] w-[96px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
        <iframe ref={ref} src={src} title={`${label} — 모바일 390px 실제 화면`} className="h-full w-[390px] rounded-[38px] bg-white" />
      </div>
      <p className="mt-2 text-[11.5px] font-medium text-slate-500">390 × {`실제 Viewport`} · 같은 Route · 같은 Data</p>
    </div>
  );
}

/** 앱 전체를 감싸는 Stage: PC / Mobile 단독 / PC+Mobile 병렬 */
export function DeviceStage({ children, label }: { children: React.ReactNode; label: string }) {
  const { mode } = useDevice();
  if (mode === 'pc') return <>{children}</>;
  if (mode === 'mobile')
    return (
      <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_50%_-10%,#E6F4F8,transparent),#F3F6F8]">
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/80 px-5 backdrop-blur">
          <p className="text-[13px] font-semibold text-slate-700">
            모바일 미리보기 <span className="ml-1 font-normal text-slate-500">— {label}</span>
          </p>
          <DeviceSwitch />
        </div>
        <div className="flex justify-center px-4 py-5">
          <PhoneFrame label={label} />
        </div>
      </div>
    );
  return (
    <div className="flex min-h-dvh w-full" data-testid="dual-view">
      <div className="min-w-0 flex-1 overflow-x-clip" style={{ flexBasis: '67%' }}>
        {children}
      </div>
      <aside className="sticky top-0 flex h-dvh w-[33%] min-w-[430px] max-w-[470px] shrink-0 flex-col items-center justify-center border-l border-slate-200 bg-[#F3F6F8] px-3" aria-label="모바일 동시 보기">
        <PhoneFrame label={label} />
      </aside>
    </div>
  );
}
