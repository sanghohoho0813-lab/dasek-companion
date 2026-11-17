'use client';
import { Bell, ChevronRight, Clock3, Heart, LogOut, Receipt, Settings2, Sparkles, Ticket, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { LoginGate, PurchaseReportSheet, StampCard } from '@/components/customer/parts';
import { useCustomer } from '@/components/customer/Shell';
import { Button, PageSkeleton, StatusBadge } from '@/components/ui';
import * as D from '@/lib/domain';
import { couponsFor, stampCount, stampRule, verifiedUses } from '@/lib/rules';
import { act } from '@/lib/store';

export default function MyPage() {
  const { s, me } = useCustomer();
  const [report, setReport] = useState(false);
  if (!s) return <PageSkeleton />;
  if (!me)
    return (
      <div className="mx-auto max-w-md px-5 pt-8">
        <h1 className="mb-5 text-[24px] font-extrabold text-ink">마이</h1>
        <LoginGate next="/my" />
        <Link href="/membership" className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-line">
          <span className="text-[14.5px] font-semibold text-ink">멤버십 혜택 알아보기</span>
          <ChevronRight className="h-4 w-4 text-ink-4" />
        </Link>
      </div>
    );
  const rule = stampRule(s);
  const coupons = couponsFor(s, me.id);
  const usable = coupons.filter((c) => c.status === 'ISSUED').length;
  const uses = verifiedUses(s, me.id);
  const pending = s.checkins.filter((c) => c.userId === me.id && c.status === 'PENDING').length + s.verifications.filter((v) => v.userId === me.id && v.status === 'PENDING').length;
  const unread = s.notifications.filter((n) => n.userId === me.id && !n.readAt).length;
  const saved = s.favorites.filter((f) => f.userId === me.id).length;
  const refs = s.referrals.filter((r) => r.referrerId === me.id);

  const links = [
    { href: '/my/coupons', icon: Ticket, label: '쿠폰함', meta: `${usable}장 사용 가능` },
    { href: '/my/referral', icon: Users, label: '친구 추천', meta: refs.length ? `${refs.length}명 추천` : '코드 공유하기' },
    { href: '/my/activity', icon: Receipt, label: '이용 내역', meta: pending ? `확인 대기 ${pending}건` : `확인된 이용 ${uses.length}회` },
    { href: '/my/saved', icon: Heart, label: '저장한 메뉴', meta: `${saved}개` },
    { href: '/my/inbox', icon: Bell, label: '알림함', meta: unread ? `새 알림 ${unread}개` : '모두 읽음' },
    { href: '/my/settings', icon: Settings2, label: '동의·개인정보 설정', meta: '' },
    { href: '/roadmap', icon: Sparkles, label: '준비 중인 서비스', meta: '관심 남기기' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-5 md:px-5 md:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-extrabold text-ink">마이</h1>
        <StatusBadge status="DEMO" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-5 ring-1 ring-line" data-testid="member-card">
          <p className="text-[13px] text-ink-3">반가워요</p>
          <p className="text-[20px] font-extrabold text-ink">{me.name}님</p>
          <div className="mt-4 rounded-2xl bg-canvas p-4 text-center">
            <p className="text-[12px] font-semibold text-ink-3">매장에서 보여주세요 · 회원코드</p>
            <p className="mt-1 font-mono text-[30px] font-extrabold tracking-[0.14em] text-ink" data-testid="member-code">
              {me.memberCode}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/checkin" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 text-[14px] font-bold text-white">
              방문 체크인
            </Link>
            <Button variant="secondary" size="lg" className="h-11 text-[14px]" onClick={() => setReport(true)} data-testid="my-report">
              구매 확인 요청
            </Button>
          </div>
        </div>
        <StampCard count={stampCount(s, me.id)} required={rule.stampsRequired ?? 10} />
      </div>
      {pending > 0 && (
        <Link href="/my/activity" className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-[13.5px] font-semibold text-brand-800">
          <Clock3 className="h-4 w-4" /> 직원 확인을 기다리는 요청이 {pending}건 있어요
          <ChevronRight className="ml-auto h-4 w-4" />
        </Link>
      )}
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center gap-3 px-4 py-4 transition hover:bg-canvas">
              <l.icon className="h-5 w-5 text-ink-3" />
              <span className="flex-1 text-[15px] font-semibold text-ink">{l.label}</span>
              <span className="text-[12.5px] text-ink-3">{l.meta}</span>
              <ChevronRight className="h-4 w-4 text-ink-4" />
            </Link>
          </li>
        ))}
      </ul>
      <button onClick={() => act((d) => D.logout(d))} className="mt-4 flex items-center gap-2 px-2 py-2 text-[13.5px] font-semibold text-ink-3 hover:text-ink">
        <LogOut className="h-4 w-4" /> 로그아웃
      </button>
      <PurchaseReportSheet open={report} onClose={() => setReport(false)} s={s} me={me} />
    </div>
  );
}
