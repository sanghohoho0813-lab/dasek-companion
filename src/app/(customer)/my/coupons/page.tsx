'use client';
import { Ticket } from 'lucide-react';
import { useState } from 'react';
import { CouponCard, CouponDetailSheet, LoginGate } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Empty, PageSkeleton, Segmented } from '@/components/ui';
import { couponsFor } from '@/lib/rules';
import type { CouponIssue } from '@/lib/types';

export default function CouponsPage() {
  const { s, me } = useCustomer();
  const [tab, setTab] = useState<'usable' | 'used' | 'void'>('usable');
  const [open, setOpen] = useState<CouponIssue | null>(null);
  if (!s) return <PageSkeleton />;
  if (!me) return <div className="mx-auto max-w-md p-5"><LoginGate next="/my/coupons" /></div>;
  const all = couponsFor(s, me.id);
  const list = all.filter((c) => (tab === 'usable' ? c.status === 'ISSUED' : tab === 'used' ? c.status === 'REDEEMED' : c.status === 'EXPIRED' || c.status === 'CANCELLED'));
  return (
    <div>
      <BackHeader title="쿠폰함" fallback="/my" />
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-4 md:px-5 md:pt-10">
        <h1 className="hidden text-[1.5rem] font-extrabold text-ink md:block">쿠폰함</h1>
        <div className="md:mt-4">
          <Segmented
            label="쿠폰 상태"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'usable', label: '사용 가능', count: all.filter((c) => c.status === 'ISSUED').length },
              { value: 'used', label: '사용 완료', count: all.filter((c) => c.status === 'REDEEMED').length },
              { value: 'void', label: '만료·취소', count: all.filter((c) => c.status === 'EXPIRED' || c.status === 'CANCELLED').length },
            ]}
          />
        </div>
        <div className="mt-4 space-y-2.5" data-testid="coupon-list">
          {list.length ? list.map((c) => <CouponCard key={c.id} c={c} onOpen={c.status === 'ISSUED' ? () => setOpen(c) : undefined} />) : <Empty icon={<Ticket className="h-8 w-8" />} title="해당하는 쿠폰이 없어요" body="방문·구매가 확인되면 스탬프가 쌓이고, 보상 쿠폰이 발급돼요." />}
        </div>
      </div>
      <CouponDetailSheet c={open} onClose={() => setOpen(null)} />
    </div>
  );
}
