'use client';
import { CheckCircle2, Clock3, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { LoginGate } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, PageSkeleton, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { act } from '@/lib/store';
import type { VisitCheckin } from '@/lib/types';
import { cx, dayKey, fmtDate } from '@/lib/util';

function Inner() {
  const { s, me } = useCustomer();
  const sp = useSearchParams();
  const run = useRun();
  const [storeId, setStoreId] = useState(sp.get('store') ?? 'store_dasek');
  const [code, setCode] = useState(sp.get('code') ?? '');
  const [result, setResult] = useState<VisitCheckin | null>(null);
  if (!s) return <PageSkeleton />;
  const today = me ? s.checkins.filter((c) => c.userId === me.id && c.dayKey === dayKey()) : [];
  const latest = result ? s.checkins.find((c) => c.id === result.id) ?? result : null;

  return (
    <div>
      <BackHeader title="방문 체크인" />
      <div className="mx-auto max-w-md px-5 pb-10 pt-6 md:pt-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <QrCode className="h-7 w-7" />
        </div>
        <h1 className="mt-3 text-center text-[1.5rem] font-extrabold text-ink">방문 체크인</h1>
        <p className="mt-1 text-center text-[0.8438rem] text-ink-3">카운터에 있는 '오늘의 코드' 4자리를 입력하세요. 직원이 확인하면 스탬프가 적립돼요.</p>
        {!me ? (
          <div className="mt-6">
            <LoginGate title="체크인은 회원만 할 수 있어요" next={`/checkin?store=${storeId}${code ? `&code=${code}` : ''}`} />
          </div>
        ) : latest ? (
          <div className="mt-8 rounded-3xl bg-white p-6 text-center ring-1 ring-line" data-testid="checkin-result">
            {latest.status === 'CONFIRMED' ? <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-500" /> : <Clock3 className="mx-auto h-11 w-11 text-brand-500" />}
            <p className="mt-3 text-[1.125rem] font-extrabold text-ink">{latest.status === 'CONFIRMED' ? '방문이 확인되었어요!' : latest.status === 'REJECTED' ? '확인이 반려되었어요' : '직원 확인을 기다리고 있어요'}</p>
            <p className="mt-1 text-[0.8125rem] text-ink-3">{latest.status === 'PENDING' ? '카운터에 말씀해 주시면 바로 확인해 드려요.' : latest.rejectReason ?? '스탬프가 적립되었어요.'}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Link href="/my" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 text-[0.875rem] font-bold text-white">
                내 스탬프 보기
              </Link>
              <Link href="/dasek#cats" className="inline-flex h-11 items-center justify-center rounded-xl bg-canvas text-[0.875rem] font-bold text-ink">
                고양이 보러 가기
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {s.stores.map((st) => (
                <button key={st.id} onClick={() => setStoreId(st.id)} aria-pressed={storeId === st.id} className={cx('h-12 rounded-2xl text-[0.9062rem] font-bold ring-1 transition', storeId === st.id ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-2 ring-line')}>
                  {st.name}
                </button>
              ))}
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              inputMode="numeric"
              aria-label="오늘의 코드 4자리"
              placeholder="0000"
              data-testid="checkin-code"
              className="h-16 w-full rounded-2xl border border-line text-center font-mono text-[1.875rem] font-extrabold tracking-[0.5em] text-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
            <Button
              size="lg"
              full
              disabled={code.length !== 4}
              data-testid="checkin-submit"
              onClick={() => {
                const r = run(() => act((d, c) => D.submitCheckin(d, c, me.id, storeId, code)), '체크인을 요청했어요.');
                if (r) setResult(r);
              }}
            >
              체크인 요청
            </Button>
            {today.length > 0 && (
              <div className="rounded-2xl bg-canvas p-3 text-[0.8438rem] text-ink-3">
                오늘 체크인 기록:{' '}
                {today.map((t) => `${s.stores.find((x) => x.id === t.storeId)?.name} ${fmtDate(t.createdAt, { time: true }).split(' ')[1]} (${{ PENDING: '확인 대기', CONFIRMED: '확인됨', REJECTED: '반려', REVERSED: '취소' }[t.status]})`).join(', ')}
              </div>
            )}
            <p className="text-[0.8125rem] leading-relaxed text-ink-3">코드는 매일 바뀌어요. 같은 매장은 하루 한 번만 적립되고, 직원 확인 전에는 '대기' 상태예요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
