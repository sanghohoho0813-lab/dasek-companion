'use client';
/**
 * 시연 도구 (DEMO) — 휴대폰에서도 고객 ↔ 운영 AX 전환, PC 화면 미리보기, 데모 초기화를 할 수 있게 한다.
 * 데스크톱(≥1024px)에서는 같은 기능이 상단 바(Device Switch·운영 AX·초기화)에 있다.
 */
import { Columns2, LayoutDashboard, Monitor, RotateCcw, Smartphone, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DeviceSwitch, useDevice } from '@/components/device/Device';
import { Sheet, useToast } from '@/components/ui';
import { resetDemo } from '@/lib/store';
import { cx } from '@/lib/util';

export function DemoToolsSheet({ open, onClose, tone = 'brand' }: { open: boolean; onClose: () => void; tone?: 'brand' | 'ax' }) {
  const pathname = usePathname();
  const { desktop, pcPreview, setPcPreview } = useDevice();
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
    <Sheet open={open} onClose={onClose} tone={tone} title="시연 도구" description="DEMO 전용 · 실제 운영 화면에는 나타나지 않아요" size="sm" testId="demo-tools">
      <div className="space-y-5">
        <section>
          <p className="mb-2 text-[13px] font-bold text-slate-500">화면 전환</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/" aria-current={!onAx ? 'page' : undefined} className={cx(btn, !onAx ? on : off)} data-testid="demo-to-customer">
              <span className="flex items-center gap-1.5 text-[15px] font-bold">
                <Smartphone className="h-4 w-4" /> 고객 플랫폼
              </span>
              <span className={cx('text-[12px]', !onAx ? 'text-white/75' : 'text-slate-500')}>메뉴·고양이·멤버십</span>
            </Link>
            <Link href="/ax" aria-current={onAx ? 'page' : undefined} className={cx(btn, onAx ? on : off)} data-testid="demo-to-ax">
              <span className="flex items-center gap-1.5 text-[15px] font-bold">
                <LayoutDashboard className="h-4 w-4" /> 운영 AX
              </span>
              <span className={cx('text-[12px]', onAx ? 'text-white/75' : 'text-slate-500')}>확인 큐·회원·실증</span>
            </Link>
          </div>
        </section>

        <section>
          <p className="mb-2 text-[13px] font-bold text-slate-500">기기 보기</p>
          {desktop ? (
            <DeviceSwitch />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setPcPreview(false); onClose(); }} aria-pressed={!pcPreview} className={cx(btn, !pcPreview ? on : off)} data-testid="demo-mobile">
                  <span className="flex items-center gap-1.5 text-[15px] font-bold">
                    <Smartphone className="h-4 w-4" /> 모바일 화면
                  </span>
                  <span className={cx('text-[12px]', !pcPreview ? 'text-white/75' : 'text-slate-500')}>지금 보는 실제 화면</span>
                </button>
                <button onClick={() => { setPcPreview(true); onClose(); }} aria-pressed={pcPreview} className={cx(btn, pcPreview ? on : off)} data-testid="demo-pc-preview">
                  <span className="flex items-center gap-1.5 text-[15px] font-bold">
                    <Monitor className="h-4 w-4" /> PC 화면
                  </span>
                  <span className={cx('text-[12px]', pcPreview ? 'text-white/75' : 'text-slate-500')}>1280px를 축소해 보기</span>
                </button>
              </div>
              <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-slate-600">
                <Columns2 className="mt-0.5 h-4 w-4 shrink-0" />
                PC+Mobile 동시 보기는 두 화면을 나란히 놓아야 해서 PC나 가로로 둔 태블릿(폭 1024px 이상)에서 사용할 수 있어요.
              </p>
            </>
          )}
        </section>

        <section>
          <p className="mb-2 text-[13px] font-bold text-slate-500">데이터</p>
          {confirmReset ? (
            <div className="rounded-2xl bg-amber-50 p-3.5">
              <p className="text-[13.5px] font-semibold text-amber-900">이 브라우저의 시연 기록(가입·쿠폰·확인 내역)을 처음 상태로 되돌릴까요?</p>
              <div className="mt-2.5 flex gap-2">
                <button onClick={() => setConfirmReset(false)} className="h-10 flex-1 rounded-xl bg-white text-[14px] font-bold text-slate-700 ring-1 ring-slate-200">
                  취소
                </button>
                <button
                  onClick={() => {
                    resetDemo();
                    setConfirmReset(false);
                    onClose();
                    toast('데모 데이터를 초기화했어요.');
                  }}
                  className="h-10 flex-1 rounded-xl bg-slate-900 text-[14px] font-bold text-white"
                  data-testid="demo-tools-reset-confirm"
                >
                  초기화
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-white text-[14.5px] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              <RotateCcw className="h-4 w-4" /> 데모 데이터 초기화
            </button>
          )}
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">DEMO 데이터는 이 브라우저에만 저장돼요. 다른 휴대폰·PC에서 한 가입·체크인은 여기 보이지 않아요.</p>
        </section>
      </div>
    </Sheet>
  );
}

/** 'DEMO' 배지 모양의 시연 도구 열기 버튼 */
export function DemoToolsButton({ tone = 'brand', className, label = 'DEMO' }: { tone?: 'brand' | 'ax'; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const { inFrame } = useDevice();
  if (inFrame) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="시연 도구 열기 (화면 전환·PC 보기·초기화)"
        data-testid="demo-tools-open"
        className={cx('inline-flex h-9 items-center gap-1 rounded-lg bg-amber-50 px-2.5 text-[12px] font-bold tracking-wide text-amber-800 ring-1 ring-inset ring-amber-200 transition active:scale-95', className)}
      >
        <Wrench className="h-3.5 w-3.5" /> {label}
      </button>
      <DemoToolsSheet open={open} onClose={() => setOpen(false)} tone={tone} />
    </>
  );
}
