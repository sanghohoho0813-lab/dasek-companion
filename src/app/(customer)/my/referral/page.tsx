'use client';
import { Copy, Share2, ShieldCheck } from 'lucide-react';
import { LoginGate } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, Empty, PageSkeleton, useToast } from '@/components/ui';
import * as D from '@/lib/domain';
import { getProfile } from '@/lib/rules';
import { act } from '@/lib/store';
import { cx, fmtDate, maskName } from '@/lib/util';

const ST: Record<string, { l: string; c: string }> = {
  PENDING: { l: '가입함 · 첫 이용 확인 대기', c: 'bg-brand-50 text-brand-700' },
  QUALIFIED: { l: '첫 이용 확인됨', c: 'bg-emerald-50 text-emerald-700' },
  REWARDED: { l: '보상 확정', c: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { l: '보상 대상 아님', c: 'bg-slate-100 text-slate-500' },
  REVERSED: { l: '이용 취소 · 검토 중', c: 'bg-amber-50 text-amber-800' },
};

export default function ReferralPage() {
  const { s, me } = useCustomer();
  const toast = useToast();
  if (!s) return <PageSkeleton />;
  if (!me) return <div className="mx-auto max-w-md p-5"><LoginGate next="/my/referral" /></div>;
  const rule = s.loyaltyRules.find((r) => r.kind === 'REFERRAL_REFERRER');
  const refereeRule = s.loyaltyRules.find((r) => r.kind === 'REFERRAL_REFEREE');
  const list = s.referrals.filter((r) => r.referrerId === me.id);
  const ledger = s.ledger.filter((l) => l.userId === me.id && l.kind === 'REFERRAL_REWARD');
  const link = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${me.referralCode}` : '';
  const share = async () => {
    act((d, c) => D.track(d, c, me.id, 'referral_share', me.referralCode, '추천 링크 공유'));
    if (navigator.share) {
      try {
        await navigator.share({ title: '다색컴패니언', text: `리얼식단·다색냥 멤버십 — 추천 코드 ${me.referralCode}`, url: link });
        return;
      } catch {
        /* 취소 */
      }
    }
    navigator.clipboard?.writeText(link).then(() => toast('추천 링크를 복사했어요.'), () => toast('복사하지 못했어요.', 'error'));
  };
  return (
    <div>
      <BackHeader title="친구 추천" fallback="/my" />
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-5 md:px-5 md:pt-10">
        <div className="rounded-3xl bg-gradient-to-br from-sage-50 to-brand-50 p-6">
          <p className="text-[13px] font-semibold text-sage-600">친구 추천</p>
          <p className="mt-1 text-[21px] font-extrabold leading-snug text-ink">
            친구의 첫 이용이 확인되면
            <br />
            {rule?.benefit}
          </p>
          <p className="mt-1 text-[13px] text-ink-2">친구는 가입 시 {refereeRule?.benefit} 쿠폰을 받아요.</p>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white p-4">
            <div>
              <p className="text-[12px] font-semibold text-ink-3">내 추천 코드</p>
              <p className="font-mono text-[26px] font-extrabold tracking-[0.18em] text-ink" data-testid="my-ref-code">
                {me.referralCode}
              </p>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(me.referralCode ?? '').then(() => toast('코드를 복사했어요.'))} aria-label="코드 복사" className="grid h-10 w-10 place-items-center rounded-full bg-canvas text-ink-2 hover:bg-line">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <Button size="lg" full className="mt-3" onClick={share}>
            <Share2 className="h-4 w-4" /> 추천 링크 공유하기
          </Button>
        </div>

        <h2 className="mt-8 text-[17px] font-extrabold text-ink">내가 추천한 친구</h2>
        <div className="mt-3 space-y-2">
          {list.length ? (
            list.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-line">
                <div>
                  <p className="text-[14.5px] font-bold text-ink">{maskName(getProfile(s, r.refereeId)?.name.replace(' (데모 고객)', '') ?? '회원')}</p>
                  <p className="text-[12px] text-ink-3">{fmtDate(r.createdAt)} 가입</p>
                </div>
                <span className={cx('rounded-full px-2.5 py-1 text-[12px] font-bold', ST[r.status].c)}>{ST[r.status].l}</span>
              </div>
            ))
          ) : (
            <Empty title="아직 추천한 친구가 없어요" body="링크를 공유하면 친구가 가입할 때 코드가 자동으로 입력돼요." />
          )}
        </div>
        {ledger.length > 0 && (
          <>
            <h2 className="mt-8 text-[17px] font-extrabold text-ink">보상 내역</h2>
            <ul className="mt-3 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
              {ledger.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-[13.5px]">
                  <span className="text-ink-2">{l.label}</span>
                  <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-bold', l.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : l.status === 'EXPECTED' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500')}>
                    {{ CONFIRMED: '확정', EXPECTED: '예정', REVERSED: '취소' }[l.status]}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-8 rounded-2xl bg-canvas p-4 text-[12.5px] leading-relaxed text-ink-3">
          <p className="flex items-center gap-1.5 font-bold text-ink-2">
            <ShieldCheck className="h-4 w-4" /> 추천 보상 기준
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>보상은 친구의 가입이 아니라 매장에서 직원이 확인한 첫 이용 후 지급돼요.</li>
            <li>자기 자신 추천·같은 번호 중복 가입은 보상 대상이 아니에요.</li>
            <li>친구의 이용이 환불·취소되면 사용 전 보상은 함께 취소될 수 있어요.</li>
            <li>보상 내용은 운영자 확정 전 예시이며 변경될 수 있어요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
