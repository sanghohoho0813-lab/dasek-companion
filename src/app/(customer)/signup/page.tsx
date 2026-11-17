'use client';
import { Check, ChevronDown, Gift, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, Field, inputCls, PageSkeleton, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { couponsFor } from '@/lib/rules';
import { act } from '@/lib/store';
import type { BrandId } from '@/lib/types';
import { cx } from '@/lib/util';

const CONSENTS = [
  { key: 'terms', label: '[필수] 서비스 이용약관 동의', required: true, desc: '회원 혜택·스탬프·쿠폰 제공을 위한 기본 약관입니다. (초안 — 운영자 법률 검토 전)' },
  { key: 'privacy', label: '[필수] 개인정보 수집·이용 동의', required: true, desc: '수집: 이름(닉네임), 휴대폰 번호(선택·중복가입 방지용 해시와 뒤 4자리만 저장), 이용 기록. 목적: 회원 식별·혜택 지급·부정 이용 방지. 보관: 탈퇴 시까지(법정 보관 항목 제외).' },
  { key: 'age14', label: '[필수] 만 14세 이상입니다', required: true, desc: '만 14세 미만은 법정대리인 동의 절차가 준비되기 전까지 가입할 수 없어요.' },
  { key: 'marketing_inapp', label: '[선택] 앱 안 혜택 알림 받기', required: false, desc: '저장한 메뉴·재방문 혜택 등을 앱 알림함으로 받아요. 언제든 마이 > 동의 설정에서 끌 수 있어요.' },
  { key: 'marketing_push', label: '[선택] 푸시 알림 받기 (준비 중)', required: false, desc: '푸시 발송 인프라가 준비되기 전까지 실제로 발송하지 않아요.' },
  { key: 'marketing_kakao', label: '[선택] 카카오 알림 받기 (준비 중)', required: false, desc: '채널·요금·정책 확인 전까지 실제로 발송하지 않아요.' },
] as const;
type ConsentKey = (typeof CONSENTS)[number]['key'];

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const run = useRun();
  const { s, me } = useCustomer();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [brands, setBrands] = useState<BrandId[]>(['realsicdan', 'dasek']);
  const [ref, setRef] = useState(sp.get('ref') ?? '');
  const [c, setC] = useState<Record<ConsentKey, boolean>>({ terms: false, privacy: false, age14: false, marketing_inapp: false, marketing_push: false, marketing_kakao: false });
  const [open, setOpen] = useState<string | null>(null);
  const [done, setDone] = useState<{ referral: { status: string; reason?: string } | null } | null>(null);
  const [touched, setTouched] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const next = sp.get('next');

  useEffect(() => {
    if (sp.get('ref')) setRef(sp.get('ref')!.toUpperCase());
  }, [sp]);

  if (!s) return <PageSkeleton />;
  if (me && !done)
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-[16px] font-bold text-ink">이미 로그인되어 있어요</p>
        <Link href="/my" className="mt-3 inline-block font-semibold text-brand-700">
          마이로 이동
        </Link>
      </div>
    );

  if (done && me) {
    const coupons = couponsFor(s, me.id);
    return (
      <div className="mx-auto max-w-md px-5 pb-10 pt-10 text-center" data-testid="signup-done">
        <div className="mx-auto grid h-16 w-16 animate-scale-in place-items-center rounded-3xl bg-brand-50 text-brand-600">
          <PartyPopper className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-[24px] font-extrabold text-ink">{me.name}님, 환영해요!</h1>
        <p className="mt-1 text-[14px] text-ink-3">회원코드 {me.memberCode} — 매장에서 보여주면 적립돼요.</p>
        <div className="mt-6 space-y-2 text-left">
          {coupons.map((x) => (
            <div key={x.id} className="flex items-center gap-3 rounded-2xl bg-promo-50 p-4">
              <Gift className="h-5 w-5 shrink-0 text-promo-600" />
              <div>
                <p className="text-[14.5px] font-bold text-ink">{x.benefit}</p>
                <p className="text-[12px] text-ink-3">{x.title} 발급 완료</p>
              </div>
            </div>
          ))}
          {done.referral && (
            <p className={cx('rounded-2xl p-3 text-[13px]', done.referral.status === 'PENDING' ? 'bg-sage-50 text-sage-600' : 'bg-amber-50 text-amber-900')}>
              {done.referral.status === 'PENDING' ? '추천 코드가 적용됐어요. 첫 이용이 매장에서 확인되면 추천한 친구에게 보상이 지급돼요.' : `추천 코드가 적용되지 않았어요: ${done.referral.reason}`}
            </p>
          )}
        </div>
        <div className="mt-6 grid gap-2">
          <Button size="lg" onClick={() => router.push(next ?? '/')}>
            {next ? '하던 일 계속하기' : '홈으로'}
          </Button>
          <Button size="lg" variant="soft" onClick={() => router.push('/my')}>
            마이에서 혜택 보기
          </Button>
        </div>
      </div>
    );
  }

  const requiredOk = c.terms && c.privacy && c.age14;
  const allOn = CONSENTS.every((x) => c[x.key]);
  const submit = () => {
    setTouched(true);
    if (!name.trim() || !requiredOk) return;
    const r = run(() =>
      act((d, ctx) =>
        D.signup(d, ctx, { name, phone, consents: c, referralCode: ref || undefined, preferredBrands: brands }),
      ),
    );
    if (r) setDone({ referral: r.referral });
  };

  return (
    <div>
      <BackHeader title="회원가입" />
      <div className="mx-auto max-w-md px-5 pb-10 pt-6 md:pt-10">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">가입하고 혜택 받기</h1>
        <p className="mt-1 text-[15px] text-ink-2">이름만 입력하면 30초면 끝나요.</p>
        <div className="mt-4 flex items-center gap-3 rounded-[20px] bg-promo-50 p-3 pr-4">
          <AssetImage slot="menu_m_pie120" fallback={{ kind: 'pie', variant: 0 }} alt="" className="h-16 w-16 shrink-0 rounded-2xl" sizes="64px" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-promo-600">가입 즉시 발급</p>
            <p className="text-[17px] font-extrabold leading-snug text-ink">{s.loyaltyRules.find((r) => r.kind === 'SIGNUP')?.benefit} 쿠폰</p>
            <p className="text-[12px] text-amber-800">DEMO 예시 혜택 · 운영자 확정 전</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="이름 또는 닉네임" required error={touched && !name.trim() ? '이름을 입력해 주세요.' : undefined}>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoComplete="nickname" placeholder="매장에서 불러드릴 이름" className={inputCls} data-testid="signup-name" />
          </Field>
          <Field label="휴대폰 번호 (선택)" hint="중복 가입 방지용으로만 쓰여요. 원본 번호는 저장하지 않아요.">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" className={inputCls} data-testid="signup-phone" />
          </Field>
          {refOpen || ref ? (
            <Field label="추천 코드 (선택)" hint={ref ? '친구가 보낸 링크로 들어와 자동 입력됐어요.' : '친구가 알려준 코드를 입력하세요.'}>
              <input value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} maxLength={8} placeholder="예: AB3CD" className={cx(inputCls, 'uppercase tracking-widest')} data-testid="signup-ref" />
            </Field>
          ) : (
            <button type="button" onClick={() => setRefOpen(true)} className="text-[14px] font-bold text-brand-700">
              + 친구에게 받은 추천 코드가 있어요
            </button>
          )}
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-2">관심 있는 서비스 (선택 · 맞춤 안내에만 사용)</p>
            <div className="flex gap-2">
              {(
                [
                  ['realsicdan', '리얼식단'],
                  ['dasek', '다색냥'],
                ] as [BrandId, string][]
              ).map(([v, l]) => {
                const on = brands.includes(v);
                return (
                  <button key={v} type="button" aria-pressed={on} onClick={() => setBrands(on ? brands.filter((b) => b !== v) : [...brands, v])} className={cx('inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[14.5px] font-bold ring-1 transition', on ? 'bg-brand-50 text-brand-800 ring-brand-300' : 'bg-white text-ink-2 ring-line hover:bg-canvas')}>
                    {on && <Check className="h-4 w-4" strokeWidth={3} />}
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl ring-1 ring-line">
          <label className="flex cursor-pointer items-center gap-3 border-b border-line p-4">
            <input
              type="checkbox"
              checked={allOn}
              onChange={(e) => setC(Object.fromEntries(CONSENTS.map((x) => [x.key, e.target.checked])) as Record<ConsentKey, boolean>)}
              className="h-5 w-5 accent-brand-600"
            />
            <span className="text-[15px] font-bold text-ink">전체 동의 (선택 항목 포함)</span>
          </label>
          <button type="button" onClick={() => setC({ ...c, terms: true, privacy: true, age14: true })} className="w-full border-b border-line px-4 py-3 text-left text-[14px] font-semibold text-brand-700 hover:bg-canvas">
            필수 항목만 한 번에 동의하기
          </button>
          <ul className="divide-y divide-line/70">
            {CONSENTS.map((x) => (
              <li key={x.key} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <input id={`c-${x.key}`} type="checkbox" checked={c[x.key]} onChange={(e) => setC({ ...c, [x.key]: e.target.checked })} className="h-5 w-5 accent-brand-600" data-testid={`consent-${x.key}`} />
                  <label htmlFor={`c-${x.key}`} className={cx('flex-1 cursor-pointer text-[13.5px]', x.required ? 'font-semibold text-ink' : 'text-ink-2')}>
                    {x.label}
                  </label>
                  <button type="button" onClick={() => setOpen(open === x.key ? null : x.key)} aria-expanded={open === x.key} aria-label={`${x.label} 내용 보기`} className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-canvas">
                    <ChevronDown className={cx('h-4 w-4 transition', open === x.key && 'rotate-180')} />
                  </button>
                </div>
                {open === x.key && <p className="mt-2 rounded-xl bg-canvas p-3 text-[12.5px] leading-relaxed text-ink-3">{x.desc}</p>}
              </li>
            ))}
          </ul>
        </div>
        {touched && !requiredOk && <p className="mt-2 text-[12.5px] font-medium text-red-600">필수 항목에 동의해 주세요.</p>}

        <Button size="lg" full className="mt-6" onClick={submit} data-testid="signup-submit">
          가입하고 쿠폰 받기
        </Button>
        <p className="mt-3 text-center text-[13px] text-ink-3">
          이미 회원인가요?{' '}
          <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-brand-700">
            로그인
          </Link>
        </p>
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">DEMO 단계: 가입 정보는 이 브라우저에만 저장되며, 운영 전환 시 휴대폰 본인확인(Supabase Auth)으로 교체됩니다.</p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
