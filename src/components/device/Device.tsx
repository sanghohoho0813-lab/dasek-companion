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
  /** 실제 휴대폰·태블릿(＜1024px)에서 PC 화면(1280px)을 축소해 미리보기 */
  pcPreview: boolean;
  setPcPreview: (v: boolean) => void;
  /** 휴대폰에서 보는 방식: 실제 모바일 / PC 축소 / PC+모바일 동시 (확대·축소해서 보기) */
  phoneView: PhoneView;
  setPhoneView: (v: PhoneView) => void;
}
export type PhoneView = 'mobile' | 'pc' | 'dual';
const Ctx = createContext<DeviceCtx>({ mode: 'pc', setMode: () => {}, inFrame: false, desktop: false, compact: false, pcPreview: false, setPcPreview: () => {}, phoneView: 'mobile', setPhoneView: () => {} });
const MOBILE_KEY = 'dasek:mobile-pc-preview';
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
  const [phoneView, setPhoneViewState] = useState<PhoneView>('mobile');

  useEffect(() => {
    const framed = window.self !== window.top;
    setInFrame(framed);
    if (framed) document.documentElement.dataset.frame = 'mobile';
    try {
      const saved = window.localStorage.getItem(KEY) as DeviceMode | null;
      if (saved === 'pc' || saved === 'mobile' || saved === 'dual') setModeState(saved);
      const pv = window.sessionStorage.getItem(MOBILE_KEY);
      if (!framed && (pv === 'pc' || pv === 'dual')) setPhoneViewState(pv);
      else if (!framed && pv === '1') setPhoneViewState('pc');
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

  const setPhoneView = useCallback((v: PhoneView) => {
    setPhoneViewState(v);
    try {
      // 휴대폰 미리보기는 탭(세션) 동안만 유지 — 새로 열면 항상 실제 모바일 화면부터
      if (v !== 'mobile') window.sessionStorage.setItem(MOBILE_KEY, v);
      else window.sessionStorage.removeItem(MOBILE_KEY);
    } catch {
      /* noop */
    }
  }, []);
  const setPcPreview = useCallback((v: boolean) => setPhoneView(v ? 'pc' : 'mobile'), [setPhoneView]);

  const effective: DeviceMode = inFrame || !desktop ? 'pc' : mode;
  useEffect(() => {
    document.documentElement.dataset.dual = effective === 'dual' ? 'true' : 'false';
  }, [effective]);

  const pv: PhoneView = desktop || inFrame ? 'mobile' : phoneView;
  return (
    <Ctx.Provider value={{ mode: effective, setMode, inFrame, desktop, compact: effective === 'dual', pcPreview: pv === 'pc', setPcPreview, phoneView: pv, setPhoneView }}>{children}</Ctx.Provider>
  );
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

export function DeviceSwitch({ tone = 'ax', className, iconOnly }: { tone?: 'ax' | 'brand'; className?: string; iconOnly?: 'below-2xl' | 'always' }) {
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
          title={o.label}
          aria-label={o.label}
          onClick={() => setMode(o.v)}
          className={cx(
            'inline-flex h-8 items-center gap-1 rounded-md px-2 text-[0.8125rem] font-semibold transition duration-150',
            mode === o.v ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900',
          )}
        >
          {o.icon}
          <span className={cx(iconOnly === 'always' && 'sr-only', iconOnly === 'below-2xl' && 'sr-only 2xl:not-sr-only')}>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** 같은 앱·같은 Route를 iframe으로 띄우고 부모 ↔ iframe Route를 양방향 동기화 */
function useSyncedFrame() {
  const pathname = usePathname();
  const router = useRouter();
  const ref = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => {
    const p = currentPath();
    return `${p}${p.includes('?') ? '&' : '?'}frame=mobile`;
  });
  const lastFromFrame = useRef<string | null>(null);

  // 부모 → Frame
  useEffect(() => {
    const path = currentPath();
    if (lastFromFrame.current === path) {
      lastFromFrame.current = null; // 루프 방지: Frame에서 온 이동은 되돌려 보내지 않음
      return;
    }
    ref.current?.contentWindow?.postMessage({ type: MSG_NAV, path }, window.location.origin);
  }, [pathname]);

  // Frame → 부모
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.type !== MSG_ROUTE || typeof e.data.path !== 'string') return;
      if (e.data.path === currentPath()) return;
      lastFromFrame.current = e.data.path;
      router.push(e.data.path);
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, [router]);
  return { ref, src };
}

function PhoneFrame({ label }: { label: string }) {
  const { ref, src } = useSyncedFrame();
  return (
    <div className="flex flex-col items-center">
      <div
        data-testid="device-frame"
        className="relative rounded-[46px] bg-[#111418] p-[9px] shadow-[0_30px_60px_-20px_rgba(15,30,40,.45)] ring-1 ring-black/40"
        style={{ height: 'min(862px, calc(100dvh - 92px))' }}
      >
        <iframe ref={ref} src={src} title={`${label} — 모바일 390px 실제 화면`} className="h-full w-[390px] rounded-[38px] bg-white" />
      </div>
      <p className="mt-2 text-[0.8125rem] font-medium text-slate-500">390 × {`실제 Viewport`} · 같은 Route · 같은 Data</p>
    </div>
  );
}

const PC_WIDTH = 1280;

/** 휴대폰에서 PC 화면 미리보기: 같은 앱을 1280px iframe으로 렌더링하고 화면 폭에 맞게 축소 */
function PcPreview({ label }: { label: string }) {
  const { setPcPreview } = useDevice();
  const { ref, src } = useSyncedFrame();
  const [box, setBox] = useState({ w: 390, h: 700 });
  useEffect(() => {
    const on = () => setBox({ w: window.innerWidth, h: window.innerHeight - 52 });
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const scale = box.w / PC_WIDTH;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#F3F6F8]" data-testid="pc-preview">
      <div className="flex h-[52px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3">
        <p className="min-w-0 truncate text-[0.8125rem] font-semibold text-slate-700">
          <Monitor className="mr-1 inline h-4 w-4 align-[-3px]" />
          PC 화면 미리보기 <span className="font-normal text-slate-500">· {label} · {PC_WIDTH}px 축소</span>
        </p>
        <button onClick={() => setPcPreview(false)} data-testid="pc-preview-close" className="inline-flex h-11 shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-3 text-[0.8125rem] font-bold text-white">
          <Smartphone className="h-4 w-4" /> 모바일로
        </button>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <iframe
          ref={ref}
          src={src}
          title={`${label} — PC ${PC_WIDTH}px 화면 축소 미리보기`}
          className="absolute left-0 top-0 origin-top-left border-0 bg-white"
          style={{ width: PC_WIDTH, height: box.h / scale, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}

const PHONE_W = 390;
const PHONE_H = 844;

/**
 * 휴대폰에서 PC+모바일 동시 보기 — 같은 앱을 PC(1280px)·모바일(390px) 두 iframe 으로 띄우고 화면에 맞게 축소.
 * 세로: 위 PC · 아래 모바일 / 가로: 왼쪽 PC · 오른쪽 모바일. 두 손가락 확대 또는 [＋] 로 키워서 보고, 끌어서 이동.
 */
function PhoneDual({ label }: { label: string }) {
  const { setPhoneView } = useDevice();
  const pc = useSyncedFrame();
  const mo = useSyncedFrame();
  const [box, setBox] = useState({ w: 390, h: 740 });
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const on = () => setBox({ w: window.innerWidth, h: window.innerHeight - 52 });
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const gap = 8;
  const portrait = box.h >= box.w;
  // 기본(100%) 배치: 두 화면이 한 화면에 모두 들어오게
  let pcW: number, pcH: number, moS: number;
  if (portrait) {
    pcW = box.w - gap * 2;
    pcH = Math.round((box.h - gap * 3 - 44) * 0.46);
    moS = Math.min((box.h - gap * 3 - pcH - 44) / PHONE_H, (box.w - gap * 2) / PHONE_W); // 두 화면 제목줄(22px×2)
  } else {
    moS = (box.h - gap * 2 - 22) / PHONE_H;
    pcW = box.w - gap * 3 - PHONE_W * moS;
    pcH = box.h - gap * 2 - 22;
  }
  const pcS = (pcW / PC_WIDTH) * zoom;
  const ms = moS * zoom;
  const pcBox = { w: pcW * zoom, h: pcH * zoom };
  const moBox = { w: PHONE_W * ms, h: PHONE_H * ms };
  const pane = (title: string, w: number, h: number, node: React.ReactNode) => (
    <div className="shrink-0">
      <p className="mb-1 h-[18px] text-[0.75rem] font-bold text-slate-600">{title}</p>
      <div className="relative overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-300" style={{ width: w, height: h }}>
        {node}
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#E9EEF2]" data-testid="phone-dual">
      <div className="flex h-[52px] shrink-0 items-center justify-between gap-1.5 border-b border-slate-200 bg-white px-2">
        <p className="min-w-0 truncate pl-1 text-[0.8125rem] font-semibold text-slate-700">
          <Columns2 className="mr-1 inline h-4 w-4 align-[-3px]" />
          PC+모바일 <span className="font-normal text-slate-500">· {label}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))} disabled={zoom <= 1} aria-label="축소" className="grid h-11 w-11 place-items-center rounded-lg text-[1.25rem] font-bold text-slate-700 ring-1 ring-slate-200 disabled:opacity-40">
            −
          </button>
          <span className="w-11 text-center text-[0.8125rem] font-bold tabular-nums text-slate-700" data-testid="phone-dual-zoom">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.5))} disabled={zoom >= 3} aria-label="확대" className="grid h-11 w-11 place-items-center rounded-lg text-[1.25rem] font-bold text-slate-700 ring-1 ring-slate-200 disabled:opacity-40">
            ＋
          </button>
          <button onClick={() => setPhoneView('mobile')} data-testid="phone-dual-close" className="ml-1 inline-flex h-11 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[0.8125rem] font-bold text-white">
            <Smartphone className="h-4 w-4" /> 닫기
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain" data-testid="phone-dual-canvas">
        <div className={cx('flex w-max p-2', portrait ? 'flex-col gap-2' : 'flex-row items-start gap-2')}>
          {pane(
            'PC 화면 (1280px)',
            pcBox.w,
            pcBox.h,
            <iframe ref={pc.ref} src={pc.src} title={`${label} — PC ${PC_WIDTH}px 화면`} data-testid="phone-dual-pc" className="absolute left-0 top-0 origin-top-left border-0 bg-white" style={{ width: PC_WIDTH, height: pcBox.h / pcS, transform: `scale(${pcS})` }} />,
          )}
          {pane(
            '모바일 화면 (390px)',
            moBox.w,
            moBox.h,
            <iframe ref={mo.ref} src={mo.src} title={`${label} — 모바일 390px 화면`} data-testid="phone-dual-mobile" className="absolute left-0 top-0 origin-top-left border-0 bg-white" style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${ms})` }} />,
          )}
        </div>
        <p className="px-3 pb-4 text-[0.8125rem] leading-relaxed text-slate-600">두 손가락으로 벌리거나 ＋ 를 눌러 크게 보고, 끌어서 옮겨 보세요. 한쪽에서 화면을 옮기면 다른 쪽도 같은 화면으로 따라가요.</p>
      </div>
    </div>
  );
}

/** 앱 전체를 감싸는 Stage: PC / Mobile 단독 / PC+Mobile 병렬 / (휴대폰) PC 미리보기 */
export function DeviceStage({ children, label }: { children: React.ReactNode; label: string }) {
  const { mode, phoneView } = useDevice();
  if (phoneView === 'pc') return <PcPreview label={label} />;
  if (phoneView === 'dual') return <PhoneDual label={label} />;
  if (mode === 'pc') return <>{children}</>;
  if (mode === 'mobile')
    return (
      <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_50%_-10%,#E6F4F8,transparent),#F3F6F8]">
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
          <p className="text-[0.8125rem] font-semibold text-slate-700">
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
