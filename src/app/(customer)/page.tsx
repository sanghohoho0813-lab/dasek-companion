'use client';
import { ArrowRight, Bell, CalendarCheck2, ChevronRight, Gift, MapPin, QrCode, Search, Stamp, Ticket, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AssetImage } from '@/components/art/AssetImage';
import { isLowResSlot } from '@/components/customer/CatGallery';
import { CatCoverCard, MenuCard, Rail, SectionHeader } from '@/components/customer/parts';
import { useCustomer } from '@/components/customer/Shell';
import { DemoToolsButton } from '@/components/shell/DemoTools';
import { ExpansionNav } from '@/components/shell/Expansion';
import { LogoMark } from '@/components/shell/Logo';
import { Disclosure, PageSkeleton, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { couponsFor, stampCount, stampRule } from '@/lib/rules';
import { act } from '@/lib/store';
import type { ArtSpec } from '@/lib/types';

const TILES: { label: string; href: string; slot: string; art: ArtSpec }[] = [
  { label: '샐러드', href: '/realsicdan?cat=rs_salad', slot: 'menu_m_salmon_poke', art: { kind: 'salad', variant: 0 } },
  { label: '도시락', href: '/realsicdan?cat=rs_box', slot: 'menu_m_diet_box', art: { kind: 'lunchbox', variant: 0 } },
  { label: '디저트', href: '/dasek#menu', slot: 'menu_m_pie120', art: { kind: 'pie', variant: 1 } },
  { label: '음료', href: '/dasek#menu', slot: 'menu_m_machine_drink', art: { kind: 'drink', variant: 1 } },
  { label: '고양이', href: '/dasek#cats', slot: 'cat_r02_01', art: { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'amber', pose: 'peek', bg: 2 } },
  { label: '간식', href: '/realsicdan?cat=rs_snack', slot: 'menu_m_greek_bowl', art: { kind: 'snack', variant: 0 } },
  { label: '매장 이용', href: '/dasek#visit', slot: 'brand_story_space', art: { kind: 'space', variant: 0 } },
];

/**
 * 고객 홈 (4차) — 첫 화면에서 '샐러드·도시락을 주문하거나 고양이카페를 알아볼 수 있다'가 바로 보이게.
 *  1 정체성  2 리얼식단·다색냥 진입  3 대표·인기 메뉴(4개)  4 고양이(4마리)  5 회원 혜택  6 방문·로드맵(짧게)
 *  추천 메뉴(왜?)는 리얼식단 화면, 매장 상세 정보는 다색냥 화면에 있다 — 같은 정보를 홈에 반복하지 않는다.
 */
export default function HomePage() {
  const { s, me } = useCustomer();
  const run = useRun();
  const router = useRouter();
  if (!s) return <PageSkeleton />;

  const published = s.menuItems.filter((m) => m.published);
  const signature = published.find((m) => m.isSignature);
  // 인기: 직원확인 구매 수 기준 (DEMO 집계)
  const pop = new Map<string, number>();
  for (const v of s.verifications.filter((x) => x.status === 'CONFIRMED')) for (const id of v.menuItemIds) pop.set(id, (pop.get(id) ?? 0) + 1);
  const popular = [...published].filter((m) => !m.isSignature).sort((a, b) => (pop.get(b.id) ?? 0) - (pop.get(a.id) ?? 0) || Number(a.isDemo) - Number(b.isDemo));
  const featured = [...(signature ? [signature] : []), ...popular].slice(0, 4);
  const cats = s.cats.filter((c) => c.published).sort((a, b) => a.sortOrder - b.sortOrder);
  const favIds = new Set(me ? s.favorites.filter((f) => f.userId === me.id).map((f) => f.menuItemId) : []);
  const rule = stampRule(s);
  const stamps = me ? stampCount(s, me.id) : 0;
  const usable = me ? couponsFor(s, me.id).filter((c) => c.status === 'ISSUED').length : 0;
  const unread = me ? s.notifications.filter((n) => n.userId === me.id && !n.readAt).length : 0;
  const signupRule = s.loyaltyRules.find((r) => r.kind === 'SIGNUP');
  const refRule = s.loyaltyRules.find((r) => r.kind === 'REFERRAL_REFERRER');
  const firstName = me?.name.replace(' (데모 고객)', '');
  const required = rule.stampsRequired ?? 10;
  const save = (id: string) => {
    if (!me) return router.push('/login?next=/');
    run(() => act((d, c) => D.toggleFavorite(d, c, me.id, id)), (on) => (on ? '메뉴를 저장했어요.' : '저장을 해제했어요.'));
  };

  return (
    <div className="reveal">
      {/* ── 모바일 상단 ─────────────────────── */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-white px-4 py-2 md:hidden">
        <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2" aria-label="다색컴패니언 홈">
          <LogoMark className="h-10 w-10" />
          <span className="min-w-0">
            <span className="block text-[1rem] font-extrabold leading-tight text-ink">다색컴패니언</span>
            <span className="flex items-center gap-1 whitespace-nowrap text-[0.875rem] font-semibold text-ink-3">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" /> 향동천 · 21시까지
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center">
          <DemoToolsButton />
          <Link href="/realsicdan?focus=search" aria-label="메뉴 검색" className="grid h-11 w-11 place-items-center rounded-full text-ink-2 active:bg-canvas">
            <Search className="h-[22px] w-[22px]" />
          </Link>
          <Link href={me ? '/my/inbox' : '/login'} aria-label={`알림 ${unread}개`} className="relative grid h-11 w-11 place-items-center rounded-full text-ink-2 active:bg-canvas">
            <Bell className="h-[22px] w-[22px]" />
            {unread > 0 && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-coral-600 ring-2 ring-white" />}
          </Link>
        </div>
      </div>

      {/* ── 1·2. 정체성 + 두 서비스 진입 ──────── */}
      <section className="mx-auto max-w-6xl px-4 pt-4 md:px-5 md:pt-7" aria-label="소개">
        <div className="md:card md:grid md:grid-cols-[1fr_1.1fr] md:overflow-hidden">
          <div className="hidden md:order-2 md:block">
            <AssetImage slot="hero_main" fallback={{ kind: 'space', variant: 1 }} alt="카페 테이블 위 라떼와 그래놀라 볼 (샘플 사진)" className="h-full min-h-[320px] w-full" sampleBadge badgePosition="tr" priority sizes="55vw" />
          </div>
          <div className="md:order-1 md:flex md:flex-col md:justify-center md:p-9">
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[0.8125rem] font-bold text-brand-700 ring-1 ring-inset ring-brand-200">리얼식단 × 다색냥</p>
            <h1 className="mt-2 text-[1.625rem] font-extrabold leading-[1.25] tracking-[-0.03em] text-ink md:mt-3 md:text-[2.5rem]">
              산책길에서 만나는
              <br />
              든든한 한 끼와 고양이
            </h1>
            <p className="mt-2 max-w-md text-[1rem] leading-relaxed text-ink-2">샐러드·도시락은 골라서 포장하고, 고양이카페는 미리 둘러보고 방문하세요.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4">
          {[
            { href: '/realsicdan', id: 'hero-realsicdan', title: '리얼식단', sub: '샐러드·도시락', slot: 'service_01_food', art: { kind: 'salad', variant: 1 } as ArtSpec },
            { href: '/dasek', id: 'hero-dasek', title: '다색냥', sub: '고양이카페', slot: 'cat_r01_01', art: { kind: 'space', variant: 0 } as ArtSpec },
          ].map((x) => (
            <Link key={x.href} href={x.href} data-testid={x.id} className="lift card group block overflow-hidden">
              {isLowResSlot(x.slot) ? (
                /* 실제 고양이 사진(저해상도 카드 촬영본): 넓게 늘리지 않고 흐린 배경 위 정사각형으로 */
                <span className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-200 md:aspect-[16/7]">
                  <AssetImage slot={x.slot} fallback={x.art} alt="" className="absolute inset-0" imgClassName="scale-110 blur-2xl opacity-70" sizes="200px" />
                  <span className="absolute inset-0 grid place-items-center p-3 md:p-4">
                    <AssetImage slot={x.slot} fallback={x.art} alt="다색냥 고양이 망고" className="aspect-square h-full max-h-[220px] rounded-2xl ring-4 ring-white" sizes="220px" priority />
                  </span>
                </span>
              ) : (
                <AssetImage slot={x.slot} fallback={x.art} alt={`${x.title} 대표 이미지 (샘플 사진)`} className="zoom-img aspect-[4/3] w-full md:aspect-[16/7]" sizes="50vw" sampleBadge badgePosition="tr" priority />
              )}
              <span className="flex items-center justify-between gap-2 px-3.5 py-3 md:px-5 md:py-4">
                <span className="min-w-0">
                  <span className="block text-[1.125rem] font-extrabold text-ink md:text-[1.375rem]">{x.title}</span>
                  <span className="block truncate text-[0.875rem] font-semibold text-ink-3 md:text-[0.9375rem]">{x.sub}</span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-hover:translate-x-0.5">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 카테고리 — 한 줄로 바로가기 */}
      <section className="mx-auto mt-5 max-w-6xl px-4 md:mt-8 md:px-5" aria-label="카테고리">
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:grid md:grid-cols-7 md:gap-4 md:px-0">
          {TILES.map((t) => (
            <Link key={t.label} href={t.href} className="group flex w-[64px] shrink-0 flex-col items-center gap-1.5 md:w-auto">
              <span className="block aspect-square w-full overflow-hidden rounded-[18px] ring-1 ring-cardline transition group-hover:ring-brand-300">
                <AssetImage slot={t.slot} fallback={t.art} alt="" className="zoom-img h-full w-full" sizes="(min-width: 768px) 140px, 64px" />
              </span>
              <span className="text-[0.875rem] font-semibold text-ink-2 group-hover:text-ink">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. 대표·인기 메뉴 4개 ───────────── */}
      <section className="mx-auto mt-8 max-w-6xl px-4 md:mt-12 md:px-5" aria-labelledby="sec-pop">
        <SectionHeader id="sec-pop" title="대표·인기 메뉴" sub="매장에서 확인된 구매가 많은 순 · DEMO 집계" href="/realsicdan" linkLabel="전체 메뉴" />
        <Rail label="대표·인기 메뉴">
          {featured.map((m, i) => (
            <MenuCard key={m.id} item={m} s={s} rank={m.isSignature ? undefined : signature ? i : i + 1} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
          ))}
        </Rail>
      </section>

      {/* ── 4. 고양이 4마리 ─────────────────── */}
      <section className="mt-8 bg-[#F4F8F9] py-7 md:mt-12 md:py-10" aria-labelledby="sec-cats">
        <div className="mx-auto max-w-6xl px-4 md:px-5">
          <SectionHeader id="sec-cats" eyebrow="다색냥" title="고양이 친구들" sub="눌러서 품종·성격을 확인해요" href="/dasek#cats" linkLabel="전체 보기" />
          <Rail label="고양이 목록">
            {cats.slice(0, 4).map((c) => (
              <CatCoverCard key={c.id} cat={c} photo={D.publishedCatPhotos(s, c.id)[0]} />
            ))}
          </Rail>
          {cats.some((c) => c.isPlaceholder) && <p className="mt-1.5 text-[0.875rem] text-ink-3">지금은 예시 프로필·샘플 사진이에요. 실제 정보는 매장 확인 후 공개돼요.</p>}
        </div>
      </section>

      {/* ── 5. 회원 혜택 (한 장으로) ───────────── */}
      <section className="mx-auto mt-8 max-w-6xl px-4 md:mt-12 md:px-5" aria-labelledby="sec-mem">
        <SectionHeader id="sec-mem" title={me ? `${firstName}님의 혜택` : '가입하면 받는 혜택'} href={me ? '/my' : '/membership'} linkLabel={me ? '내 정보' : '멤버십 안내'} />
        {me ? (
          <div className="grid grid-cols-3 gap-2 md:gap-3" data-testid="home-benefits">
            {[
              { href: '/my', icon: <Stamp className="h-5 w-5 text-brand-700" />, l: '스탬프', v: `${stamps % required}/${required}`, tone: 'border-brand-200 bg-brand-50' },
              { href: '/my/coupons', icon: <Ticket className="h-5 w-5 text-promo-600" />, l: '사용 가능 쿠폰', v: `${usable}장`, tone: 'border-amber-200 bg-promo-50' },
              { href: '/my/referral', icon: <Users className="h-5 w-5 text-sage-600" />, l: '친구 추천', v: refRule?.benefit ?? '안내', tone: 'border-emerald-200 bg-sage-50', long: true },
            ].map((x) => (
              <Link key={x.l} href={x.href} className={`lift flex min-w-0 flex-col gap-2 rounded-[18px] border p-3.5 md:p-5 ${x.tone}`}>
                {x.icon}
                <span className="min-w-0">
                  <span className="block truncate text-[0.875rem] font-semibold text-ink-2">{x.l}</span>
                  <span className={x.long ? 'block text-[0.9375rem] font-bold leading-snug text-ink' : 'block truncate text-[1.25rem] font-extrabold text-ink tabular md:text-[1.5rem]'}>{x.v}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-amber-200 bg-promo-50 p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[0.875rem] font-bold text-promo-600">
                  <Gift className="h-4 w-4" /> 첫 가입 혜택
                </p>
                <p className="mt-1 text-[1.5rem] font-extrabold leading-tight tracking-[-0.02em] text-ink">{signupRule?.benefit} 쿠폰</p>
                <p className="mt-1 text-[0.9375rem] text-ink-2">가입 즉시 쿠폰함에 들어가요 · 30초면 끝나요</p>
              </div>
              <Link href="/signup" className="press inline-flex h-12 items-center gap-1.5 rounded-2xl bg-ink px-5 text-[1rem] font-bold text-white transition hover:bg-ink-2">
                무료로 가입하기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-3 text-[0.875rem] font-semibold text-amber-900">혜택 내용은 운영자 확정 전 DEMO 예시예요.</p>
            <Disclosure label="스탬프·친구 추천 혜택 더 보기" openLabel="혜택 접기" className="mt-3">
              <ul className="grid gap-2 md:grid-cols-3">
                {[
                  { icon: <CalendarCheck2 className="h-5 w-5 text-brand-600" />, t: `스탬프 ${required}개 = ${rule.benefit}`, b: '직원이 방문·구매를 확인하면 매장별 하루 1개' },
                  { icon: <Users className="h-5 w-5 text-sage-600" />, t: `친구 추천 · ${refRule?.benefit}`, b: '친구의 첫 이용이 매장에서 확인되면 지급' },
                  { icon: <Gift className="h-5 w-5 text-promo-600" />, t: '저장한 메뉴 알림', b: '알림에 동의하면 저장한 메뉴 소식을 알려드려요' },
                ].map((x) => (
                  <li key={x.t} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-white p-4">
                    <span className="mt-0.5">{x.icon}</span>
                    <span>
                      <span className="block text-[0.9375rem] font-bold text-ink">{x.t}</span>
                      <span className="block text-[0.875rem] text-ink-3">{x.b}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Disclosure>
          </div>
        )}
      </section>

      {/* ── 6. 방문·앞으로 (짧게) ───────────── */}
      <section className="mx-auto mt-8 max-w-6xl px-4 md:mt-12 md:px-5" aria-label="방문 안내">
        <div className="card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-extrabold text-ink">방문하면 스탬프가 쌓여요</p>
            <p className="mt-0.5 text-[0.9375rem] text-ink-2">카운터의 &lsquo;오늘의 코드&rsquo;로 체크인 → 직원 확인 → 스탬프 +1</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Link href="/checkin" className="press inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 text-[0.9375rem] font-bold text-white hover:bg-brand-700">
              <QrCode className="h-4 w-4" /> 방문 체크인
            </Link>
            <Link href="/dasek#visit" className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-white px-4 text-[0.9375rem] font-bold text-ink ring-1 ring-inset ring-cardline hover:bg-canvas">
              위치·예약 안내
            </Link>
          </div>
        </div>
        {/* 추가 확장 예정 (대표 기획안) — 접어 둔 한 줄 */}
        <div className="mt-3">
          <ExpansionNav tone="brand" />
        </div>
      </section>
    </div>
  );
}
