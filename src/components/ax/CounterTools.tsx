'use client';
import { Search, Ticket } from 'lucide-react';
import { useState } from 'react';
import { Button, Sheet, axInputCls, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { memberNo } from '@/lib/labels';
import { customers, effectiveCouponStatus } from '@/lib/rules';
import { opAct } from '@/lib/store';
import type { AppState } from '@/lib/types';
import { cx, fmtDate } from '@/lib/util';

/** 카운터: 회원번호로 바로 구매 확인 등록 */
export function CounterPurchase({ s, open, onClose, presetUserId }: { s: AppState; open: boolean; onClose: () => void; presetUserId?: string }) {
  const run = useRun();
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState<string | null>(presetUserId ?? null);
  const [storeId, setStoreId] = useState('store_dasek');
  const [items, setItems] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const match = customers(s).filter((p) => p.status === 'active' && code.trim().length >= 2 && (p.memberCode.toLowerCase().includes(code.trim().toLowerCase()) || p.name.includes(code.trim())));
  const user = s.profiles.find((p) => p.id === userId);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      tone="ax"
      title="카운터 구매 확인 등록"
      description="고객이 보여준 회원번호로 찾아 바로 확인 처리해요. (직원 확인 = 핵심 지표 집계 기준)"
      testId="counter-sheet"
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ax" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            tone="ax"
            disabled={!user}
            data-testid="counter-submit"
            onClick={() => {
              const n = amount.trim() ? Number(amount.replace(/[^0-9]/g, '')) : null;
              const ok = run(() => opAct((d, c) => D.staffRecordPurchase(d, c, user!.id, storeId, items, n)), `${user?.name}님 구매를 확인했어요.`);
              if (ok) {
                onClose();
                setItems([]);
                setAmount('');
                setCode('');
                if (!presetUserId) setUserId(null);
              }
            }}
          >
            구매 확인
          </Button>
        </div>
      }
    >
      {!presetUserId && (
        <>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-ax-primary">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="회원번호(숫자 4자리) 또는 이름" className="h-11 w-full bg-transparent text-[0.9375rem] outline-none placeholder:text-slate-500" data-testid="counter-search" autoFocus />
          </label>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
            {match.slice(0, 6).map((p) => (
              <li key={p.id}>
                <button onClick={() => setUserId(p.id)} className={cx('flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[0.9375rem] transition', userId === p.id ? 'bg-ax-soft font-bold text-slate-900' : 'hover:bg-slate-50')}>
                  <span>{p.name}</span>
                  <span className="text-[0.8125rem] text-slate-500">회원번호 {memberNo(p.memberCode)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {user && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[0.875rem] font-semibold text-slate-700">선택: {user.name} (회원번호 {memberNo(user.memberCode)})</p>}
      <p className="mt-4 text-[0.8438rem] font-bold text-slate-500">매장</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {s.stores.map((st) => (
          <button key={st.id} onClick={() => { setStoreId(st.id); setItems([]); }} className={cx('h-10 rounded-lg text-[0.9375rem] font-bold ring-1', storeId === st.id ? 'bg-ax-primary text-white ring-ax-primary' : 'bg-white text-slate-600 ring-slate-200')}>
            {st.name}
          </button>
        ))}
      </div>
      <p className="mt-4 text-[0.8438rem] font-bold text-slate-500">메뉴 (선택)</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {s.menuItems
          .filter((m) => m.storeId === storeId && m.published)
          .map((m) => {
            const on = items.includes(m.id);
            return (
              <button key={m.id} onClick={() => setItems(on ? items.filter((x) => x !== m.id) : [...items, m.id])} className={cx('rounded-full px-2.5 py-1 text-[0.8438rem] font-semibold ring-1', on ? 'bg-ax-soft text-slate-900 ring-slate-300' : 'bg-white text-slate-600 ring-slate-200')}>
                {on && '✓ '}
                {m.name}
              </button>
            );
          })}
      </div>
      <label className="mt-4 block text-[0.8438rem] font-bold text-slate-500">
        결제 금액 (선택)
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="예: 9000" className={cx(axInputCls, 'mt-1.5')} />
      </label>
    </Sheet>
  );
}

/** 카운터: 쿠폰 코드로 사용 처리 */
export function CouponRedeem({ s, open, onClose }: { s: AppState; open: boolean; onClose: () => void }) {
  const run = useRun();
  const [code, setCode] = useState('');
  // 쿠폰번호는 앞의 'DC-' 없이 입력해도 찾을 수 있게
  const norm = (x: string) => x.trim().toUpperCase().replace(/^DC-/, '');
  const c = norm(code) ? s.coupons.find((x) => norm(x.code) === norm(code)) : undefined;
  const user = c ? s.profiles.find((p) => p.id === c.userId) : null;
  const st = c ? effectiveCouponStatus(c) : null;
  return (
    <Sheet open={open} onClose={onClose} tone="ax" title="쿠폰 사용 처리" description="고객 화면의 쿠폰번호를 입력하세요." size="sm" testId="redeem-sheet">
      <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-ax-primary">
        <Ticket className="h-4 w-4 text-slate-500" />
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="쿠폰번호 6자리" className="w-full font-mono text-[1rem] tracking-wider outline-none" data-testid="redeem-code" autoFocus />
      </label>
      {code.length >= 6 && !c && <p className="mt-2 text-[0.8438rem] text-red-600">해당 번호의 쿠폰이 없어요.</p>}
      {c && (
        <div className="mt-3 rounded-xl bg-slate-50 p-4">
          <p className="text-[1rem] font-bold text-slate-900">{c.benefit}</p>
          <p className="text-[0.8438rem] text-slate-500">
            {user?.name} · {c.title} · {fmtDate(c.expiresAt)}까지
          </p>
          <p className="mt-1 text-[0.8438rem] font-semibold">상태: {{ ISSUED: '사용 가능', REDEEMED: '이미 사용됨', EXPIRED: '기간 만료', CANCELLED: '취소됨' }[st!]}</p>
          <Button
            tone="ax"
            full
            className="mt-3"
            disabled={st !== 'ISSUED'}
            data-testid="redeem-submit"
            onClick={() => {
              const ok = run(() => opAct((d, ctx) => D.redeemCoupon(d, ctx, c.id)), '쿠폰을 사용 처리했어요.');
              if (ok !== undefined) {
                setCode('');
                onClose();
              }
            }}
          >
            사용 처리
          </Button>
        </div>
      )}
    </Sheet>
  );
}
