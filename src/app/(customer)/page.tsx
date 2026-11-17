'use client';
import { ArrowRight, Bell, CalendarCheck2, ChevronRight, Clock, Gift, MapPin, QrCode, Search, Ticket, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { CatCoverCard, MenuCard, MenuRow, Rail, SectionHeader, SignatureCard, StampCard, StoreInfoCard, WhySheet } from '@/components/customer/parts';
import { useCustomer } from '@/components/customer/Shell';
import { DemoToolsButton } from '@/components/shell/DemoTools';
import { LogoMark } from '@/components/shell/Logo';
import { PageSkeleton, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { ROADMAP_GROUPS } from '@/lib/roadmap';
import { couponsFor, recommendMenus, stampCount, stampRule, storeOfBrand, type Recommendation } from '@/lib/rules';
import { act } from '@/lib/store';
import type { ArtSpec } from '@/lib/types';

const TILES: { label: string; href: string; slot: string; art: ArtSpec }[] = [
  { label: '샐러드', href: '/realsicdan?cat=rs_salad', slot: 'menu_m_salmon_poke', art: { kind: 'salad', variant: 0 } },
  { label: '도시락', href: '/realsicdan?cat=rs_box', slot: 'menu_m_diet_box', art: { kind: 'lunchbox', variant: 0 } },
  { label: '디저트', href: '/dasek#menu', slot: 'menu_m_pie120', art: { kind: 'pie', variant: 1 } },
  { label: '음료', href: '/dasek#menu', slot: 'menu_m_machine_drink', art: { kind: 'drink', variant: 1 } },
  { label: '고양이', href: '/dasek#cats', slot: 'cat_05_01', art: { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'amber', pose: 'peek', bg: 2 } },
  { label: '간식', href: '/realsicdan?cat=rs_snack', slot: 'menu_m_greek_bowl', art: { kind: 'snack', variant: 0 } },
  { label: '매장 이용', href: '/dasek#visit', slot: 'brand_story_space', art: { kind: 'space', variant: 0 } },
];

export default function HomePage() {
  const { s, me } = useCustomer();
  const run = useRun();
  const router = useRouter();
  const [why, setWhy] = useState<Recommendation | null>(null);
  if (!s) return <PageSkeleton />;

  const dasek = storeOfBrand(s, 'dasek');
  const published = s.menuItems.filter((m) => m.published);
  const signature = published.find((m) => m.isSignature);
  // 인기: 직원확인 구매 수 기준 (DEMO 집계)
  const pop = new Map<string, number>();
  for (const v of s.verifications.filter((x) => x.status === 'CONFIRMED')) for (const id of v.menuItemIds) pop.set(id, (pop.get(id) ?? 0) + 1);
  const popular = [...published].filter((m) => !m.isSignature).sort((a, b) => (pop.get(b.id) ?? 0) - (pop.get(a.id) ?? 0) || Number(a.isDemo) - Number(b.isDemo));
  const cats = s.cats.filter((c) => c.published).sort((a, b) => a.sortOrder - b.sortOrder);
  const favIds = new Set(me ? s.favorites.filter((f) => f.userId === me.id).map((f) => f.menuItemId) : []);
  const recs = recommendMenus(s, me?.id ?? null, 3);
  const rule = stampRule(s);
  const stamps = me ? stampCount(s, me.id) : 0;
  const usable = me ? couponsFor(s, me.id).filter((c) => c.status === 'ISSUED').length : 0;
  const unread = me ? s.notifications.filter((n) => n.userId === me.id && !n.readAt).length : 0;
  const signupRule = s.loyaltyRules.find((r) => r.kind === 'SIGNUP');
  const refRule = s.loyaltyRules.find((r) => r.kind === 'REFERRAL_REFERRER');
  const firstName = me?.name.replace(' (데모 고객)', '');
  const save = (id: string) => {
    if (!me) return router.push('/login?next=/');
    run(() => act((d, c) => D.toggleFavorite(d, c, me.id, id)), (on) => (on ? '메뉴를 저장했어요.' : '저장을 해제했어요.'));
  };

  return (
    <div className="reveal">
      {/* ── 모바일 상단 ─────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 px-4 pb-2.5 pt-3 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="다색컴패니언 홈">
            <LogoMark className="h-9 w-9" />
            <span className="min-w-0">
              <span className="block text-[16px] font-extrabold leading-tight text-ink">다색컴패니언</span>
              <span className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-3">
                <MapPin className="h-3.5 w-3.5 text-brand-600" /> 향동천 산책길 · 21시까지
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <DemoToolsButton />
            <Link href={me ? '/my/inbox' : '/login'} aria-label={`알림 ${unread}개`} className="relative grid h-11 w-11 place-items-center rounded-full text-ink-2 active:bg-canvas">
              <Bell className="h-[23px] w-[23px]" />
              {unread > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-coral-500" />}
            </Link>
          </div>
        </div>
        <Link href="/realsicdan" className="mt-2.5 flex h-12 items-center gap-2 rounded-2xl bg-canvas px-4 text-[15px] text-ink-3 ring-1 ring-inset ring-line">
          <Search className="h-[18px] w-[18px]" /> 샐러드, 도시락, 디저트 검색
        </Link>
      </div>

      {/* ── A. Hero ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pt-2 md:px-5 md:pt-7" aria-label="소개">
        <div className="grid gap-3 md:grid-cols-[1.35fr_1fr] md:gap-4">
          <div className="relative overflow-hidden rounded-[28px] bg-ink">
            <AssetImage slot="hero_main" fallback={{ kind: 'space', variant: 1 }} alt="카페 테이블 위 라떼와 그래놀라 볼 (샘플 사진)" className="aspect-[1/1.02] w-full sm:aspect-[16/11] md:aspect-auto md:h-full md:min-h-[440px]" sampleBadge badgePosition="tr" priority sizes="(min-width: 768px) 60vw, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-9">
              <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[13px] font-bold text-white backdrop-blur">리얼식단 × 다색냥</p>
              <h1 className="mt-3 text-[30px] font-extrabold leading-[1.18] tracking-[-0.03em] text-white md:text-[44px]">
                산책길에서 만나는
                <br />
                든든한 한 끼와 고양이
              </h1>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/90 md:text-[16px]">샐러드·도시락으로 가볍게 먹고, 고양이 친구들과 쉬어 가세요. 올 때마다 스탬프가 쌓여요.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/realsicdan" data-testid="hero-realsicdan" className="press inline-flex h-[52px] items-center gap-1.5 rounded-2xl bg-white px-5 text-[16px] font-bold text-ink shadow-sm transition hover:bg-brand-50">
                  메뉴 보기 <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dasek" data-testid="hero-dasek" className="press inline-flex h-[52px] items-center gap-1.5 rounded-2xl bg-brand-600 px-5 text-[16px] font-bold text-white transition hover:bg-brand-700">
                  다색냥 만나기
                </Link>
              </div>
            </div>
          </div>
          {/* 두 서비스 진입 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4">
            {[
              { href: '/realsicdan', title: '리얼식단', sub: '샐러드 · 도시락 · 간식', slot: 'service_01_food', art: { kind: 'salad', variant: 1 } as ArtSpec },
              { href: '/dasek', title: '다색냥', sub: '고양이카페 · 음료 · 디저트', slot: 'cat_05_01', art: { kind: 'space', variant: 0 } as ArtSpec },
            ].map((x) => (
              <Link key={x.href} href={x.href} className="group relative block overflow-hidden rounded-[24px]">
                <AssetImage slot={x.slot} fallback={x.art} alt={`${x.title} 대표 이미지 (샘플 사진)`} className="zoom-img aspect-[5/4] w-full md:aspect-auto md:h-full md:min-h-[212px]" sizes="(min-width: 768px) 40vw, 50vw" sampleBadge badgePosition="tr" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <span className="min-w-0">
                    <span className="block text-[19px] font-extrabold text-white md:text-[22px]">{x.title}</span>
                    <span className="hidden text-[13px] font-medium text-white/90 sm:block">{x.sub}</span>
                  </span>
                  <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-full bg-white/95 text-ink transition group-hover:translate-x-0.5 sm:grid">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── B. 카테고리 ─────────────────────── */}
      <section className="mx-auto mt-6 max-w-6xl px-4 md:mt-8 md:px-5" aria-label="카테고리">
        <div className="-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:grid md:grid-cols-7 md:gap-4 md:px-0">
          {TILES.map((t) => (
            <Link key={t.label} href={t.href} className="group flex w-[70px] shrink-0 flex-col items-center gap-2 md:w-auto">
              <span className="block aspect-square w-full overflow-hidden rounded-[20px] ring-1 ring-line/60 transition group-hover:ring-brand-300">
                <AssetImage slot={t.slot} fallback={t.art} alt="" className="zoom-img h-full w-full" sizes="(min-width: 768px) 140px, 70px" />
              </span>
              <span className="text-[13.5px] font-semibold text-ink-2 group-hover:text-ink">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── C. 대표 메뉴 + 인기 메뉴 ─────────── */}
      {signature && (
        <section className="mx-auto mt-9 max-w-6xl px-4 md:mt-12 md:px-5" aria-labelledby="sec-sig">
          <SectionHeader id="sec-sig" eyebrow="확인된 가격" title="다색냥 대표 디저트" sub="매장에서 바로 살 수 있어요" />
          <SignatureCard item={signature} s={s} saved={favIds.has(signature.id)} onToggleSave={() => save(signature.id)} />
        </section>
      )}

      <section className="mx-auto mt-9 max-w-6xl px-4 md:mt-12 md:px-5" aria-labelledby="sec-pop">
        <SectionHeader id="sec-pop" title="지금 많이 찾는 메뉴" sub="매장에서 확인된 구매가 많은 순 · DEMO 집계" href="/realsicdan" />
        <Rail label="인기 메뉴">
          {popular.slice(0, 8).map((m, i) => (
            <MenuCard key={m.id} item={m} s={s} rank={i < 3 ? i + 1 : undefined} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
          ))}
        </Rail>
      </section>

      {/* ── D. 고양이 갤러리 ────────────────── */}
      <section className="mt-9 bg-[#F4F8F9] py-8 md:mt-12 md:py-10" aria-labelledby="sec-cats">
        <div className="mx-auto max-w-6xl px-4 md:px-5">
          <SectionHeader id="sec-cats" eyebrow="다색냥" title="고양이 친구들을 만나보세요" sub="사진을 넘겨 보고, 눌러서 프로필을 확인하세요" href="/dasek#cats" linkLabel="전체 보기" />
          <Rail label="고양이 목록">
            {cats.map((c) => (
              <CatCoverCard key={c.id} cat={c} photo={D.publishedCatPhotos(s, c.id)[0]} size="lg" />
            ))}
          </Rail>
          {cats.some((c) => c.isPlaceholder) && <p className="mt-2 text-[13px] text-ink-3">지금은 예시 프로필과 샘플 사진이에요. 실제 다색냥 고양이 정보는 매장 확인 후 공개됩니다.</p>}
        </div>
      </section>

      {/* ── E. 멤버십 ───────────────────────── */}
      <section className="mx-auto mt-9 max-w-6xl px-4 md:mt-12 md:px-5" aria-labelledby="sec-mem">
        <SectionHeader id="sec-mem" title={me ? `${firstName}님의 혜택` : '가입하면 받는 혜택'} sub={me ? '확인된 방문·구매로 쌓여요' : '둘러보기는 가입 없이도 가능해요'} href="/membership" linkLabel="멤버십 안내" />
        {me ? (
          <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr]">
            <Link href="/my" className="block">
              <StampCard count={stamps} required={rule.stampsRequired ?? 10} compact />
            </Link>
            <Link href="/my/coupons" className="lift flex flex-col justify-between rounded-[24px] bg-promo-50 p-5">
              <Ticket className="h-7 w-7 text-promo-600" />
              <div className="mt-6">
                <p className="text-[14px] font-semibold text-promo-600">사용 가능한 쿠폰</p>
                <p className="text-[28px] font-extrabold tabular text-ink">{usable}장</p>
              </div>
            </Link>
            <Link href="/my/referral" className="lift flex flex-col justify-between rounded-[24px] bg-sage-50 p-5">
              <Users className="h-7 w-7 text-sage-600" />
              <div className="mt-6">
                <p className="text-[14px] font-semibold text-sage-600">친구 추천</p>
                <p className="text-[16px] font-bold leading-snug text-ink">친구 첫 이용이 확인되면 {refRule?.benefit}</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] bg-promo-50 md:grid md:grid-cols-[1fr_1.2fr]">
            <div className="p-6 md:p-8">
              <p className="inline-flex items-center gap-1.5 text-[13px] font-bold text-promo-600">
                <Gift className="h-4 w-4" /> 첫 가입 혜택
              </p>
              <p className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-ink">{signupRule?.benefit} 쿠폰</p>
              <p className="mt-1 text-[14px] text-ink-2">가입 즉시 쿠폰함에 들어가요 · 30초면 끝나요</p>
              <Link href="/signup" className="press mt-5 inline-flex h-12 items-center gap-1.5 rounded-2xl bg-ink px-5 text-[15px] font-bold text-white transition hover:bg-ink-2">
                무료로 가입하기 <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-[12px] font-medium text-amber-800">혜택 내용은 운영자 확정 전 DEMO 예시예요.</p>
            </div>
            <ul className="grid gap-2 p-4 pt-0 md:grid-cols-1 md:p-6 md:pl-0">
              {[
                { icon: <CalendarCheck2 className="h-5 w-5 text-brand-600" />, t: `스탬프 ${rule.stampsRequired}개 = ${rule.benefit}`, b: '직원이 방문·구매를 확인하면 매장별 하루 1개' },
                { icon: <Users className="h-5 w-5 text-sage-600" />, t: `친구 추천 · ${refRule?.benefit}`, b: '친구의 첫 이용이 매장에서 확인되면 지급' },
                { icon: <Gift className="h-5 w-5 text-promo-600" />, t: '저장한 메뉴 알림', b: '알림에 동의하면 저장한 메뉴 소식을 알려드려요' },
              ].map((x) => (
                <li key={x.t} className="flex items-start gap-3 rounded-2xl bg-white p-4">
                  <span className="mt-0.5">{x.icon}</span>
                  <span>
                    <span className="block text-[15px] font-bold text-ink">{x.t}</span>
                    <span className="block text-[13px] text-ink-3">{x.b}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── 추천 (규칙 기반) ─────────────────── */}
      <section className="mx-auto mt-9 max-w-6xl px-4 md:mt-12 md:px-5" aria-labelledby="sec-rec">
        <SectionHeader id="sec-rec" title={me ? '저장한 메뉴와 비슷해요' : '처음이라면 이 메뉴'} sub="규칙 기반 추천 · '왜?'를 누르면 이유를 볼 수 있어요" href="/realsicdan" linkLabel="전체 메뉴" />
        <div className="grid gap-2.5 md:grid-cols-3">
          {recs.map((r) => (
            <MenuRow
              key={r.item.id}
              item={r.item}
              sub={r.reasons[0]}
              right={
                <button onClick={() => setWhy(r)} className="shrink-0 rounded-full bg-canvas px-3.5 py-2 text-[13px] font-bold text-ink-2 transition hover:bg-line">
                  왜?
                </button>
              }
            />
          ))}
        </div>
      </section>

      {/* ── F. 매장 방문 ────────────────────── */}
      <section className="mx-auto mt-9 max-w-6xl px-4 md:mt-12 md:px-5" aria-labelledby="sec-visit">
        <SectionHeader id="sec-visit" title="방문하기 전에" sub="위치 · 운영시간 · 예약 · 적립 방법" />
        <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
          <div className="relative overflow-hidden rounded-[24px]">
            <AssetImage slot="brand_story_space" fallback={{ kind: 'space', variant: 1 }} alt="카페 테이블 (샘플 사진)" className="aspect-[16/10] h-full w-full md:aspect-auto md:min-h-[360px]" sampleBadge badgePosition="tr" sizes="(min-width: 768px) 45vw, 100vw" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16 text-white">
              <p className="text-[13px] font-semibold text-white/85">방문하면 이렇게 적립돼요</p>
              <ol className="mt-1.5 space-y-1 text-[15px] font-bold">
                <li>1. 카운터의 &lsquo;오늘의 코드&rsquo;로 체크인</li>
                <li>2. 직원이 확인하면 스탬프 +1</li>
              </ol>
              <Link href="/checkin" className="press mt-3 inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-4 text-[14px] font-bold text-ink">
                <QrCode className="h-4 w-4" /> 방문 체크인
              </Link>
            </div>
          </div>
          <StoreInfoCard store={dasek} s={s} />
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-canvas p-4 text-[14px] leading-relaxed text-ink-2">
          <Clock className="mt-1 h-4 w-4 shrink-0 text-ink-3" />
          <p>
            고양이가 쉬고 있을 땐 깨우지 않기, 억지로 안지 않기, 사람 음식 주지 않기 — 교감 수칙은{' '}
            <Link href="/dasek#rules" className="font-bold text-brand-700 underline-offset-2 hover:underline">
              다색냥 페이지
            </Link>
            에서 확인하세요.
          </p>
        </div>
      </section>

      {/* ── G. 미래 웰니스 (작게) ───────────── */}
      <section className="mx-auto mt-9 max-w-6xl px-4 md:mt-12 md:px-5" aria-labelledby="sec-next">
        <div className="rounded-[24px] border border-dashed border-violet-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id="sec-next" className="flex items-center gap-2 text-[16px] font-extrabold text-ink">
              앞으로 준비하는 서비스 <StatusBadge status="NEXT" label="개발 예정" />
            </p>
            <Link href="/roadmap" className="inline-flex items-center text-[14px] font-bold text-violet-700">
              자세히 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
            {ROADMAP_GROUPS.map((g) => (
              <Link key={g.key} href={`/roadmap#${g.key}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-violet-50 px-3.5 py-2 text-[13.5px] font-semibold text-violet-800 transition hover:bg-violet-100">
                <span aria-hidden>{g.emoji}</span> {g.title}
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-ink-3">아직 제공하지 않는 서비스예요. 관심을 남기면 어떤 것부터 만들지 정하는 데 참고해요.</p>
        </div>
      </section>
      <WhySheet rec={why} onClose={() => setWhy(null)} />
    </div>
  );
}
