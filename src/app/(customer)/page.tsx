'use client';
import { ArrowRight, Bell, CalendarCheck2, ChevronRight, Gift, MapPin, QrCode, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { LogoMark } from '@/components/shell/Logo';
import { CatCoverCard, MenuCard, Rail, SectionHeader, StampCard, StoreInfoCard, WhySheet } from '@/components/customer/parts';
import { useCustomer } from '@/components/customer/Shell';
import { PageSkeleton, StatusBadge, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { couponsFor, recommendMenus, stampCount, stampRule, storeOfBrand, type Recommendation } from '@/lib/rules';
import { act } from '@/lib/store';
import type { ArtSpec } from '@/lib/types';
import { cx } from '@/lib/util';
import { ROADMAP } from '@/lib/roadmap';

const TILES: { label: string; href: string; art: ArtSpec }[] = [
  { label: '샐러드', href: '/realsicdan?cat=rs_salad', art: { kind: 'salad', variant: 0 } },
  { label: '도시락', href: '/realsicdan?cat=rs_box', art: { kind: 'lunchbox', variant: 0 } },
  { label: '디저트', href: '/dasek#menu', art: { kind: 'pie', variant: 1 } },
  { label: '음료', href: '/dasek#menu', art: { kind: 'drink', variant: 1 } },
  { label: '고양이', href: '/dasek#cats', art: { kind: 'cat', coat: 'orange', pattern: 'tabby', eyes: 'amber', pose: 'peek', bg: 2 } },
  { label: '간식', href: '/realsicdan?cat=rs_snack', art: { kind: 'snack', variant: 0 } },
];

export default function HomePage() {
  const { s, me } = useCustomer();
  const run = useRun();
  const router = useRouter();
  const [why, setWhy] = useState<Recommendation | null>(null);
  if (!s) return <PageSkeleton />;

  const dasek = storeOfBrand(s, 'dasek');
  const rsItems = s.menuItems.filter((m) => m.published && m.brand === 'realsicdan').sort((a, b) => a.sortOrder - b.sortOrder);
  const dnItems = s.menuItems.filter((m) => m.published && m.brand === 'dasek').sort((a, b) => Number(b.isSignature) - Number(a.isSignature) || a.sortOrder - b.sortOrder);
  const cats = s.cats.filter((c) => c.published).sort((a, b) => a.sortOrder - b.sortOrder);
  const favIds = new Set(me ? s.favorites.filter((f) => f.userId === me.id).map((f) => f.menuItemId) : []);
  const recs = recommendMenus(s, me?.id ?? null, 4);
  const rule = stampRule(s);
  const stamps = me ? stampCount(s, me.id) : 0;
  const usable = me ? couponsFor(s, me.id).filter((c) => c.status === 'ISSUED').length : 0;
  const unread = me ? s.notifications.filter((n) => n.userId === me.id && !n.readAt).length : 0;
  const signupRule = s.loyaltyRules.find((r) => r.kind === 'SIGNUP');
  const refRule = s.loyaltyRules.find((r) => r.kind === 'REFERRAL_REFERRER');
  const save = (id: string) => {
    if (!me) return router.push('/login?next=/');
    run(() => act((d, c) => D.toggleFavorite(d, c, me.id, id)), (on) => (on ? '메뉴를 저장했어요.' : '저장을 해제했어요.'));
  };

  return (
    <div className="reveal">
      {/* Mobile top */}
      <div className="flex items-center justify-between px-4 pb-2 pt-3 md:hidden">
        <Link href="/" className="flex items-center gap-2" aria-label="다색컴패니언 홈">
          <LogoMark className="h-8 w-8" />
          <span>
            <span className="block text-[15px] font-extrabold leading-tight text-ink">다색컴패니언</span>
            <span className="flex items-center gap-0.5 text-[11.5px] font-semibold text-ink-3">
              <MapPin className="h-3 w-3" /> 향동천 산책길
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <StatusBadge status="DEMO" />
          <Link href={me ? '/my/inbox' : '/login'} aria-label={`알림 ${unread}개`} className="relative grid h-10 w-10 place-items-center rounded-full text-ink-2 active:bg-canvas">
            <Bell className="h-[22px] w-[22px]" />
            {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral-500" />}
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 md:px-5 md:pt-6">
        <div className="relative overflow-hidden rounded-[28px] bg-brand-50 md:grid md:grid-cols-[1.1fr_1fr] md:rounded-[32px]">
          <div className="relative z-10 p-6 pb-4 md:p-10">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[11.5px] font-bold text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> 리얼식단 × 다색냥 멤버십
            </p>
            <h1 className="mt-3 text-[27px] font-extrabold leading-[1.22] tracking-tight text-ink md:text-[40px]">
              가벼운 한 끼,
              <br />
              고양이와 쉬는 시간
            </h1>
            <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-ink-2 md:text-[15.5px]">식단 메뉴를 고르고, 다색냥 친구들을 만나고, 방문할수록 혜택이 쌓여요.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/realsicdan" data-testid="hero-realsicdan" className="press inline-flex h-12 items-center gap-1.5 rounded-2xl bg-brand-600 px-5 text-[15px] font-bold text-white shadow-sm transition hover:bg-brand-700">
                리얼식단 메뉴 보기 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dasek" data-testid="hero-dasek" className="press inline-flex h-12 items-center gap-1.5 rounded-2xl bg-white px-5 text-[15px] font-bold text-ink shadow-sm ring-1 ring-line transition hover:bg-canvas">
                다색냥 만나기
              </Link>
            </div>
          </div>
          <AssetImage slot="hero_main" fallback={{ kind: 'cat', coat: 'cream', pattern: 'point', eyes: 'blue', pose: 'loaf', bg: 2 }} alt="다색컴패니언 대표 이미지" className="aspect-[16/10] md:aspect-auto md:h-full" sampleBadge badgePosition="br" priority />
        </div>
      </section>

      {/* Category tiles */}
      <section className="mx-auto mt-6 max-w-6xl px-4 md:px-5" aria-label="카테고리">
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:grid md:grid-cols-6 md:px-0">
          {TILES.map((t) => (
            <Link key={t.label} href={t.href} className="group flex w-[76px] shrink-0 flex-col items-center gap-1.5 md:w-auto">
              <span className="lift zoom-img block aspect-square w-full overflow-hidden rounded-2xl ring-1 ring-line/60">
                <AssetImage fallback={t.art} alt="" className="h-full w-full" />
              </span>
              <span className="text-[12.5px] font-semibold text-ink-2 group-hover:text-ink">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto mt-8 max-w-6xl px-4 md:px-5">
        <SectionHeader title={me ? `${me.name.replace(' (데모 고객)', '')}님의 혜택` : '오늘의 혜택'} sub={me ? '확인된 방문·구매로 쌓이는 혜택' : '가입하면 바로 받을 수 있어요'} href="/membership" linkLabel="멤버십 안내" />
        {me ? (
          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
            <Link href="/my" className="block">
              <StampCard count={stamps} required={rule.stampsRequired ?? 10} compact />
            </Link>
            <Link href="/my/coupons" className="lift flex flex-col justify-between rounded-3xl bg-promo-50 p-5 ring-1 ring-promo-100">
              <Gift className="h-6 w-6 text-promo-600" />
              <div>
                <p className="mt-3 text-[13px] font-semibold text-promo-600">사용 가능한 쿠폰</p>
                <p className="text-[26px] font-extrabold tabular text-ink">{usable}장</p>
              </div>
            </Link>
            <Link href="/my/referral" className="lift flex flex-col justify-between rounded-3xl bg-sage-50 p-5 ring-1 ring-sage-100">
              <Users className="h-6 w-6 text-sage-600" />
              <div>
                <p className="mt-3 text-[13px] font-semibold text-sage-600">친구 추천</p>
                <p className="text-[15px] font-bold text-ink">친구 첫 이용 확인 시 {refRule?.benefit}</p>
              </div>
            </Link>
          </div>
        ) : (
          <Rail label="혜택 카드">
            {[
              { t: signupRule?.title ?? '첫 가입 쿠폰', b: signupRule?.benefit ?? '', tone: 'bg-promo-50 ring-promo-100', icon: <Gift className="h-6 w-6 text-promo-600" />, href: '/signup' },
              { t: '방문·구매 스탬프', b: `확인 ${rule.stampsRequired}개 = ${rule.benefit}`, tone: 'bg-brand-50 ring-brand-100', icon: <CalendarCheck2 className="h-6 w-6 text-brand-600" />, href: '/membership' },
              { t: '친구 추천', b: `친구 첫 이용 확인 시 ${refRule?.benefit}`, tone: 'bg-sage-50 ring-sage-100', icon: <Users className="h-6 w-6 text-sage-600" />, href: '/membership#referral' },
            ].map((x) => (
              <Link key={x.t} href={x.href} className={cx('lift flex w-[260px] shrink-0 snap-start flex-col justify-between rounded-3xl p-5 ring-1 md:w-auto md:flex-1', x.tone)}>
                {x.icon}
                <div className="mt-6">
                  <p className="text-[13px] font-semibold text-ink-3">{x.t}</p>
                  <p className="text-[16px] font-extrabold leading-snug text-ink">{x.b}</p>
                </div>
              </Link>
            ))}
          </Rail>
        )}
        <p className="mt-2 text-[11.5px] text-ink-4">혜택 내용은 운영자 확정 전 예시이며 변경될 수 있어요.</p>
      </section>

      {/* Realsicdan rail */}
      <section className="mx-auto mt-9 max-w-6xl px-4 md:px-5" aria-labelledby="sec-rs">
        <SectionHeader id="sec-rs" title="리얼식단" sub="가볍고 든든한 하루 한 끼" href="/realsicdan" />
        <Rail label="리얼식단 메뉴">
          {rsItems.map((m) => (
            <MenuCard key={m.id} item={m} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
          ))}
        </Rail>
      </section>

      {/* Cats rail */}
      <section className="mt-9 bg-gradient-to-b from-ivory-50 to-white py-7" aria-labelledby="sec-cats">
        <div className="mx-auto max-w-6xl px-4 md:px-5">
          <SectionHeader id="sec-cats" title="다색냥 친구들" sub="사진을 넘겨 보고 마음에 드는 친구를 만나보세요" href="/dasek#cats" />
          <Rail label="고양이 목록">
            {cats.map((c) => (
              <CatCoverCard key={c.id} cat={c} photo={s.catPhotos.find((p) => p.catId === c.id && p.status === 'PUBLISHED' && p.sortOrder === 0)} size="lg" />
            ))}
          </Rail>
          {cats.some((c) => c.isPlaceholder) && <p className="mt-1 text-[11.5px] text-ink-4">실제 고양이 이름·사진 확인 전이라 예시 프로필과 샘플 일러스트로 보여드려요.</p>}
        </div>
      </section>

      {/* Dasek menu */}
      <section className="mx-auto mt-6 max-w-6xl px-4 md:px-5" aria-labelledby="sec-dn">
        <SectionHeader id="sec-dn" title="다색냥 디저트·음료" sub="120겹파이와 함께하는 달콤한 휴식" href="/dasek#menu" />
        <Rail label="다색냥 메뉴">
          {dnItems.map((m) => (
            <MenuCard key={m.id} item={m} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
          ))}
        </Rail>
      </section>

      {/* Recommendations */}
      <section className="mx-auto mt-9 max-w-6xl px-4 md:px-5" aria-labelledby="sec-rec">
        <SectionHeader id="sec-rec" title={me ? '저장한 메뉴와 비슷한 메뉴' : '많이 찾는 메뉴'} sub="규칙 기반 추천 · 이유를 눌러 확인할 수 있어요" />
        <div className="grid gap-3 md:grid-cols-2">
          {recs.map((r) => (
            <div key={r.item.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line">
              <Link href={`/menu/${r.item.id}`} className="zoom-img block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl">
                <AssetImage slot={r.item.photoSlot} fallback={r.item.art} alt={r.item.name} className="h-full w-full" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/menu/${r.item.id}`} className="clamp-1 text-[15px] font-bold text-ink hover:underline">
                  {r.item.name}
                </Link>
                <p className="clamp-1 text-[12.5px] text-ink-3">{r.reasons[0]}</p>
              </div>
              <button onClick={() => setWhy(r)} className="shrink-0 rounded-full bg-canvas px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition hover:bg-line">
                왜?
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Visit */}
      <section className="mx-auto mt-9 grid max-w-6xl gap-4 px-4 md:grid-cols-[1fr_1.1fr] md:px-5">
        <div className="relative overflow-hidden rounded-3xl">
          <AssetImage slot="brand_story_space" fallback={{ kind: 'space', variant: 1 }} alt="매장 공간 이미지" className="aspect-[4/3] h-full w-full md:aspect-auto" sampleBadge />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-16 text-white">
            <p className="text-[12px] font-semibold text-white/85">방문하면 이렇게 적립돼요</p>
            <p className="mt-1 text-[17px] font-extrabold leading-snug">카운터의 오늘 코드로 체크인 → 직원 확인 → 스탬프 +1</p>
            <Link href="/checkin" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-[13.5px] font-bold text-ink">
              <QrCode className="h-4 w-4" /> 방문 체크인
            </Link>
          </div>
        </div>
        <StoreInfoCard store={dasek} s={s} />
      </section>

      {/* Roadmap teaser */}
      <section className="mx-auto mt-9 max-w-6xl px-4 md:px-5" aria-labelledby="sec-next">
        <SectionHeader id="sec-next" title="준비 중인 서비스" sub="아직 제공하지 않아요 · 관심을 남기면 우선 검토해요" href="/roadmap" linkLabel="전체 보기" />
        <div className="grid gap-3 md:grid-cols-3">
          {ROADMAP.slice(0, 3).map((r) => (
            <Link key={r.key} href={`/roadmap?item=${r.key}`} className="lift flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-xl" aria-hidden>
                {r.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[15px] font-bold text-ink">{r.title}</span>
                  <StatusBadge status="NEXT" label="준비 중" />
                </span>
                <span className="mt-0.5 block clamp-2 text-[12.5px] text-ink-3">{r.oneLine}</span>
              </span>
              <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-ink-4" />
            </Link>
          ))}
        </div>
      </section>

      {!me && (
        <section className="mx-auto mt-9 max-w-6xl px-4 md:px-5">
          <div className="flex flex-col items-start gap-4 rounded-3xl bg-ink p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-[20px] font-extrabold">가입하면 {signupRule?.benefit} 쿠폰</p>
              <p className="mt-1 text-[13.5px] text-white/75">둘러보기는 가입 없이도 가능해요. 저장·혜택·적립만 가입이 필요해요.</p>
            </div>
            <Link href="/signup" className="inline-flex h-12 items-center rounded-2xl bg-white px-5 text-[15px] font-bold text-ink">
              무료로 가입하기
            </Link>
          </div>
        </section>
      )}
      <WhySheet rec={why} onClose={() => setWhy(null)} />
    </div>
  );
}
