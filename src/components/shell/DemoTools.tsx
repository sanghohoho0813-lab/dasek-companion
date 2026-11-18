'use client';
/**
 * 시연 도구 (DEMO) — 휴대폰에서도 고객 ↔ 운영 AX 전환, PC 화면 미리보기, 데모 초기화를 할 수 있게 한다.
 * 데스크톱(≥1024px)에서는 같은 기능이 상단 바(Device Switch·운영 AX·초기화)에 있다.
 */
import { ChevronDown, Columns2, LayoutDashboard, Monitor, Presentation, RotateCcw, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DeviceSwitch, useDevice } from '@/components/device/Device';
import { Sheet, useToast } from '@/components/ui';
import { resetDemo } from '@/lib/store';
import { SHOW_DEMO_AX_ENTRY } from '@/lib/mode';
import { cx } from '@/lib/util';

export function DemoToolsSheet({ open, onClose, tone = 'brand' }: { open: boolean; onClose: () => void; tone?: 'brand' | 'ax' }) {
  const pathname = usePathname();
  const { desktop, phoneView, setPhoneView } = useDevice();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const onAx = pathname.startsWith('/ax');
  // 링크 이동 중에 시트를 닫으면 시트의 '뒤로가기 정리'가 이동을 취소하므로, 주소가 바뀐 뒤에 닫는다
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    closeRef.current();
  }, [pathname]);
  const btn = 'flex min-h-[64px] flex-col items-start justify-center gap-0.5 rounded-2xl px-4 py-3 text-left ring-1 transition';
  const on = 'bg-slate-900 text-white ring-slate-900';
  const off = 'bg-white text-slate-800 ring-slate-200 hover:bg-slate-50';

  return (
    <Sheet open={open} onClose={onClose} tone={tone} title="시연 메뉴" description="시연(DEMO)용 · 실제 매장 운영 화면에는 나타나지 않아요" size="sm" testId="demo-tools">
      <div className="space-y-5">
        <section>
          <p className="mb-2 text-[0.875rem] font-bold text-slate-500">화면 전환</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/" aria-current={!onAx ? 'page' : undefined} className={cx(btn, !onAx ? 'bg-brand-600 text-white ring-brand-600' : off)} data-testid="demo-to-customer">
              <span className="flex items-center gap-1.5 text-[1rem] font-bold">
                <Smartphone className="h-4 w-4" /> 고객 화면
              </span>
              <span className={cx('text-[0.875rem]', !onAx ? 'text-white' : 'text-slate-600')}>{!onAx ? '지금 보는 화면' : '메뉴·고양이·멤버십'}</span>
            </Link>
            {SHOW_DEMO_AX_ENTRY && (
              <Link href="/ax" aria-current={onAx ? 'page' : undefined} className={cx(btn, onAx ? on : off)} data-testid="demo-to-ax">
                <span className="flex items-center gap-1.5 text-[1rem] font-bold">
                  <LayoutDashboard className="h-4 w-4" /> 시연용 운영 AX
                </span>
                <span className={cx('text-[0.875rem]', onAx ? 'text-white' : 'text-slate-600')}>{onAx ? '지금 보는 화면' : '방문 확인·회원·혜택'}</span>
              </Link>
            )}
          </div>
          {SHOW_DEMO_AX_ENTRY && (
            <Link href="/demo" data-testid="demo-to-presentation" className="mt-2 flex min-h-[56px] items-center justify-between gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-left ring-1 ring-violet-200 hover:bg-violet-100">
              <span>
                <span className="flex items-center gap-1.5 text-[1rem] font-bold text-violet-900">
                  <Presentation className="h-4 w-4" /> 발표용 시연 모드
                </span>
                <span className="text-[0.875rem] text-violet-800">고객 → 직원 확인 → 보상 → 성과를 순서대로</span>
              </span>
              <span aria-hidden className="text-violet-800">›</span>
            </Link>
          )}
        </section>

        <section>
          <p className="mb-2 text-[0.875rem] font-bold text-slate-500">기기 보기</p>
          {desktop ? (
            <DeviceSwitch />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { v: 'mobile', id: 'demo-mobile', icon: Smartphone, t: '모바일', d: '지금 화면' },
                    { v: 'pc', id: 'demo-pc-preview', icon: Monitor, t: 'PC', d: '축소해 보기' },
                    { v: 'dual', id: 'demo-phone-dual', icon: Columns2, t: 'PC+모바일', d: '동시에 보기' },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => {
                      setPhoneView(o.v);
                      onClose();
                    }}
                    aria-pressed={phoneView === o.v}
                    className={cx(btn, 'px-3', phoneView === o.v ? on : off)}
                    data-testid={o.id}
                  >
                    <span className="flex items-center gap-1 text-[0.9375rem] font-bold">
                      <o.icon className="h-4 w-4 shrink-0" /> {o.t}
                    </span>
                    <span className={cx('text-[0.8125rem]', phoneView === o.v ? 'text-slate-200' : 'text-slate-500')}>{o.d}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[0.8438rem] leading-relaxed text-slate-600">PC+모바일은 두 화면을 한 화면에 줄여서 보여줘요. 두 손가락으로 벌리거나 ＋ 버튼으로 크게 볼 수 있어요.</p>
            </>
          )}
        </section>

        <section>
          <p className="mb-2 text-[0.875rem] font-bold text-slate-500">데이터</p>
          {confirmReset ? (
            <div className="rounded-2xl bg-amber-50 p-3.5">
              <p className="text-[0.8438rem] font-semibold text-amber-900">이 브라우저의 시연 기록(가입·쿠폰·확인 내역)을 처음 상태로 되돌릴까요?</p>
              <div className="mt-2.5 flex gap-2">
                <button onClick={() => setConfirmReset(false)} className="h-11 flex-1 rounded-xl bg-white text-[0.9375rem] font-bold text-slate-700 ring-1 ring-slate-200">
                  취소
                </button>
                <button
                  onClick={() => {
                    resetDemo();
                    setConfirmReset(false);
                    onClose();
                    toast('데모 데이터를 초기화했어요.');
                  }}
                  className="h-11 flex-1 rounded-xl bg-slate-900 text-[0.9375rem] font-bold text-white"
                  data-testid="demo-tools-reset-confirm"
                >
                  초기화
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-white text-[0.9375rem] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <RotateCcw className="h-4 w-4" /> 데모 데이터 초기화
            </button>
          )}
          <p className="mt-2 text-[0.8438rem] leading-relaxed text-slate-500">DEMO 데이터는 이 브라우저에만 저장돼요. 다른 휴대폰·PC에서 한 가입·체크인은 여기 보이지 않아요.</p>
        </section>
      </div>
    </Sheet>
  );
}

/** 시연 메뉴 열기 버튼 — 글자만 있는 배지로 오해하지 않게 버튼 모양(테두리·▼)으로 */
export function DemoToolsButton({ tone = 'brand', className, short }: { tone?: 'brand' | 'ax'; className?: string; /** 좁은 상단 바: 360px 대에서는 '시연' 만 */ short?: boolean }) {
  const [open, setOpen] = useState(false);
  const { inFrame } = useDevice();
  if (inFrame) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="시연 메뉴 열기 (화면 전환·PC 보기·초기화)"
        aria-haspopup="dialog"
        data-testid="demo-tools-open"
        className={cx('inline-flex h-11 shrink-0 items-center gap-0.5 whitespace-nowrap rounded-xl border border-amber-300 bg-amber-50 pl-2.5 pr-1.5 text-[0.8125rem] font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 active:scale-95', className)}
      >
        {short ? (
          <>
            <span className="min-[400px]:hidden">시연</span>
            <span className="hidden min-[400px]:inline">시연 메뉴</span>
          </>
        ) : (
          '시연 메뉴'
        )}
        <ChevronDown className="h-4 w-4" aria-hidden />
      </button>
      <DemoToolsSheet open={open} onClose={() => setOpen(false)} tone={tone} />
    </>
  );
}
