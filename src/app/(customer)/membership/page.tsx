'use client';
import { BadgeCheck, CalendarCheck2, Gift, Lock, Users } from 'lucide-react';
import Link from 'next/link';
import { AssetImage } from '@/components/art/AssetImage';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { PageSkeleton, StatusBadge } from '@/components/ui';

export default function MembershipPage() {
  const { s, me } = useCustomer();
  if (!s) return <PageSkeleton />;
  const r = (k: string) => s.loyaltyRules.find((x) => x.kind === k);
  const stamp = r('STAMP');
  const items = [
    { icon: Gift, t: '첫 가입 혜택', b: r('SIGNUP')?.benefit, d: `가입 즉시 쿠폰 발급 · ${r('SIGNUP')?.validDays}일 사용` },
    { icon: CalendarCheck2, t: `스탬프 ${stamp?.stampsRequired}개 보상`, b: stamp?.benefit, d: '직원이 확인한 방문·구매마다 매장별 하루 1개' },
    { icon: Users, t: '친구 추천', b: r('REFERRAL_REFERRER')?.benefit, d: '친구의 첫 이용이 매장에서 확인된 뒤 지급' },
  ];
  return (
    <div>
      <BackHeader title="멤버십" />
      <div className="mx-auto max-w-4xl px-4 pb-10 pt-4 md:px-5 md:pt-10">
        <div className="overflow-hidden rounded-[28px] bg-brand-50 md:grid md:grid-cols-2">
          <div className="p-6 md:p-10">
            <StatusBadge status="DEMO" label="혜택 예시 · 운영자 확정 전" />
            <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-ink md:text-[34px]">자주 올수록
              <br />더 챙겨주는 멤버십</h1>
            <p className="mt-2 text-[14px] text-ink-2">리얼식단과 다색냥, 어느 쪽을 이용해도 하나의 스탬프로 모여요.</p>
            {!me && (
              <Link href="/signup" className="mt-5 inline-flex h-12 items-center rounded-2xl bg-brand-600 px-5 text-[15px] font-bold text-white">
                무료로 가입하기
              </Link>
            )}
          </div>
          <AssetImage slot="service_03_membership" fallback={{ kind: 'snack', variant: 1 }} alt="멤버십 이미지" className="aspect-[16/10] md:aspect-auto md:h-full" sampleBadge />
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {items.map((x) => (
            <div key={x.t} className="rounded-3xl bg-white p-5 ring-1 ring-line">
              <x.icon className="h-6 w-6 text-brand-600" />
              <p className="mt-3 text-[13px] font-semibold text-ink-3">{x.t}</p>
              <p className="text-[17px] font-extrabold text-ink">{x.b}</p>
              <p className="mt-1 text-[12.5px] text-ink-3">{x.d}</p>
            </div>
          ))}
        </div>
        <section id="referral" className="mt-8 scroll-mt-20 rounded-3xl bg-canvas p-6">
          <p className="flex items-center gap-1.5 text-[16px] font-extrabold text-ink">
            <BadgeCheck className="h-5 w-5 text-brand-600" /> 적립·보상 기준
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-ink-2">
            <li>적립은 매장 직원이 방문·구매를 확인한 경우에만 이뤄져요. 외부 링크 클릭이나 자가신고만으로는 적립되지 않아요.</li>
            <li>같은 매장은 하루에 스탬프 1개까지 적립돼요.</li>
            <li>친구 추천 보상은 친구의 첫 이용 확인 후 지급되며, 자기 추천·중복 계정은 제외돼요.</li>
            <li>환불·취소된 이용의 스탬프와 사용 전 보상은 취소될 수 있어요.</li>
          </ul>
        </section>
        <section className="mt-4 flex items-start gap-3 rounded-3xl bg-white p-6 ring-1 ring-line">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
          <div>
            <p className="flex items-center gap-2 text-[15.5px] font-extrabold text-ink">
              유료 멤버십·방문 패스 <StatusBadge status="NEXT" label="준비 중" />
            </p>
            <p className="mt-1 text-[13px] text-ink-3">정기픽업·방문 패스 수요를 확인하고 있어요. 지금은 결제를 받지 않아요.</p>
            <Link href="/roadmap?item=subscription_pickup" className="mt-2 inline-block text-[13px] font-semibold text-brand-700">
              관심 남기기 →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
