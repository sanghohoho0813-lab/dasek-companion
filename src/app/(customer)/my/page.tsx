'use client';
import { Bell, ChevronRight, Clock3, Heart, LogOut, Receipt, Settings2, Sparkles, Ticket, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { LoginGate, PurchaseReportSheet, StampCard } from '@/components/customer/parts';
import { useCustomer } from '@/components/customer/Shell';
import { DemoToolsButton } from '@/components/shell/DemoTools';
import { Button, PageSkeleton } from '@/components/ui';
import * as D from '@/lib/domain';
import { couponsFor, stampCount, stampRule, verifiedUses } from '@/lib/rules';
import { act } from '@/lib/store';
import { cx } from '@/lib/util';

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

  const tiles = [
    { href: '/my/coupons', icon: Ticket, label: '쿠폰', value: `${usable}장`, tone: 'bg-promo-50 text-promo-600' },
    { href: '/my/referral', icon: Users, label: '친구 추천', value: refs.length ? `${refs.length}명` : '공유', tone: 'bg-sage-50 text-sage-600' },
    { href: '/my/saved', icon: Heart, label: '저장 메뉴', value: `${saved}개`, tone: 'bg-coral-50 text-coral-600' },
    { href: '/my/inbox', icon: Bell, label: '알림', value: unread ? `새 ${unread}` : '0', tone: 'bg-brand-50 text-brand-700' },
  ];
  const links = [
    { href: '/my/activity', icon: Receipt, label: '이용 내역', meta: pending ? `확인 대기 ${pending}건` : `확인된 이용 ${uses.length}회` },
    { href: '/membership', icon: Sparkles, label: '멤버십 혜택 안내', meta: '' },
    { href: '/roadmap?item=paid_membership', icon: Sparkles, label: '유료 멤버십 · 정기픽업', meta: '개발 예정' },
    { href: '/my/settings', icon: Settings2, label: '동의·개인정보 설정', meta: '' },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-5 md:px-5 md:pt-10">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">마이</h1>
        <DemoToolsButton />
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
      <div className="mt-3 grid grid-cols-4 gap-2" data-testid="my-tiles">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="press flex flex-col items-center gap-1.5 rounded-[20px] bg-white py-3.5 ring-1 ring-line transition hover:ring-brand-200">
            <span className={cx('grid h-10 w-10 place-items-center rounded-full', t.tone)}>
              <t.icon className="h-5 w-5" />
            </span>
            <span className="text-[12.5px] font-semibold text-ink-3">{t.label}</span>
            <span className="text-[15px] font-extrabold text-ink tabular">{t.value}</span>
          </Link>
        ))}
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
              <span className={cx('text-[13px]', l.meta === '개발 예정' ? 'font-bold text-violet-700' : 'text-ink-3')}>{l.meta}</span>
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
