'use client';
import { UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, Field, inputCls, PageSkeleton, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { customers, stampCount } from '@/lib/rules';
import { act } from '@/lib/store';
import { demoHash, normalizePhone } from '@/lib/util';

function Inner() {
  const { s, me } = useCustomer();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') ?? '/my';
  const run = useRun();
  const [phone, setPhone] = useState('');
  if (!s) return <PageSkeleton />;
  const go = (id: string) => {
    const ok = run(() => act((d, c) => D.login(d, c, id)), '로그인했어요.');
    if (ok !== undefined) router.push(next);
  };
  const demo = customers(s).filter((p) => p.isDemo && p.status === 'active').slice(0, 4);
  return (
    <div>
      <BackHeader title="로그인" />
      <div className="mx-auto max-w-md px-5 pb-10 pt-6 md:pt-10">
        <h1 className="text-[24px] font-extrabold tracking-tight text-ink">다시 만나서 반가워요</h1>
        {me && (
          <p className="mt-2 rounded-xl bg-brand-50 p-3 text-[13px] text-brand-800">
            현재 {me.name}님으로 로그인되어 있어요.{' '}
            <button className="font-bold underline" onClick={() => act((d) => D.logout(d))}>
              로그아웃
            </button>
          </p>
        )}
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const h = demoHash(`phone:${normalizePhone(phone)}`);
            const p = s.profiles.find((x) => x.phoneHash === h && x.role === 'customer' && x.status === 'active');
            if (!p) return run(() => { throw new Error('가입된 번호를 찾지 못했어요. 회원가입을 진행해 주세요.'); });
            go(p.id);
          }}
        >
          <Field label="휴대폰 번호" hint="DEMO: 번호 일치로 로그인합니다. 운영 시 인증번호(OTP)로 교체돼요.">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="010-0000-0000" className={inputCls} />
          </Field>
          <Button size="lg" full type="submit">
            로그인
          </Button>
        </form>
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-bold text-ink-2">시연용 계정으로 둘러보기</p>
            <StatusBadge status="DEMO" />
          </div>
          <div className="mt-2 space-y-2">
            {demo.map((p) => (
              <button key={p.id} onClick={() => go(p.id)} data-testid={`demo-login-${p.memberCode}`} className="press flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-line transition hover:bg-canvas">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-700">
                  <UserRound className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-ink">{p.name}</span>
                  <span className="block text-[12px] text-ink-3">
                    {p.memberCode} · 스탬프 {stampCount(s, p.id)}개
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-[13px] text-ink-3">
          처음이신가요?{' '}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-700">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
