'use client';
import { CalendarHeart, Camera, ChevronRight, Clock, Coffee, Hand, HeartHandshake, MapPin, Moon, ShieldCheck, Wifi } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { CatCoverCard, MenuCard, Rail, SectionHeader, SignatureCard, StoreInfoCard } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, Disclosure, EvidenceBadge, PageSkeleton, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { storeOfBrand } from '@/lib/rules';
import { act } from '@/lib/store';

const RULES = [
  { icon: Moon, t: '자는 친구는 깨우지 않아요', b: '고양이가 쉬고 있을 땐 조용히 바라봐 주세요.' },
  { icon: Hand, t: '억지로 안지 않아요', b: '먼저 다가올 때까지 기다리면 더 친해져요.' },
  { icon: Coffee, t: '음식은 사람 것만', b: '사람 음식·음료를 고양이에게 주지 않아요. 간식은 직원 안내에 따라요.' },
  { icon: Camera, t: '플래시 없이 촬영', b: '강한 빛은 고양이에게 스트레스가 될 수 있어요.' },
];

export default function DasekPage() {
  const { s, me } = useCustomer();
  const run = useRun();
  const router = useRouter();
  const [allCats, setAllCats] = useState(false);
  if (!s) return <PageSkeleton />;
  const store = storeOfBrand(s, 'dasek');
  const cats = s.cats.filter((c) => c.published).sort((a, b) => a.sortOrder - b.sortOrder);
  const covers = new Map(cats.map((c) => [c.id, D.publishedCatPhotos(s, c.id)]));
  // 오늘의 순간: 고양이별 대표 외 사진을 번갈아 배치
  const moments = cats.flatMap((c) => (covers.get(c.id) ?? []).slice(1, 3).map((p) => ({ p, c }))).sort((a, b) => a.p.sortOrder - b.p.sortOrder);
  const menu = s.menuItems.filter((m) => m.published && m.brand === 'dasek').sort((a, b) => Number(b.isSignature) - Number(a.isSignature) || a.sortOrder - b.sortOrder);
  const signature = menu.find((m) => m.isSignature);
  const favIds = new Set(me ? s.favorites.filter((f) => f.userId === me.id).map((f) => f.menuItemId) : []);
  const save = (id: string) => {
    if (!me) return router.push('/login?next=/dasek');
    run(() => act((d, c) => D.toggleFavorite(d, c, me.id, id)), (on) => (on ? '메뉴를 저장했어요.' : '저장을 해제했어요.'));
  };

  return (
    <div>
      <BackHeader title="다색냥" />
      {/* 소개 */}
      <section className="mx-auto max-w-6xl px-4 pt-3 md:px-5 md:pt-7">
        <div className="relative overflow-hidden rounded-[24px] md:rounded-[28px]">
          <AssetImage slot="service_02_cafe" fallback={{ kind: 'space', variant: 0 }} alt="밝은 카페 내부 (샘플 사진)" className="aspect-[16/9] sm:aspect-[16/8] md:aspect-[16/5]" sampleBadge badgePosition="tr" priority sizes="(min-width: 1024px) 1100px, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/70 md:via-black/35" />
          <div data-on-media className="absolute inset-x-0 bottom-0 p-5 text-white [text-shadow:0_1px_2px_rgba(0,0,0,.3)] md:inset-y-0 md:right-auto md:flex md:max-w-lg md:flex-col md:justify-center md:p-10">
            <p className="text-[0.875rem] font-semibold text-white">고양이카페 · 음료 · 디저트</p>
            <h1 className="text-[1.875rem] font-extrabold tracking-[-0.02em] md:text-[2.5rem]">다색냥</h1>
            <p className="text-[1rem] font-semibold text-white md:text-[1.0625rem]">{store.tagline}</p>
            <div className="mt-4 hidden gap-2 md:flex">
              <a href="#cats" className="inline-flex h-12 items-center rounded-2xl bg-white px-5 text-[0.9375rem] font-bold text-ink [text-shadow:none]">
                고양이 먼저 보기
              </a>
              <a href="#visit" className="inline-flex h-12 items-center rounded-2xl bg-ink px-5 text-[0.9375rem] font-bold text-white ring-1 ring-inset ring-white/40">
                방문 안내
              </a>
            </div>
          </div>
        </div>
        {/* 모바일: 주요 행동 2개를 바로 (고양이 보기 · 방문·예약 안내) */}
        <div className="mt-3 grid grid-cols-2 gap-2 md:hidden">
          <a href="#cats" className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand-600 text-[1rem] font-bold text-white">
            고양이 보기
          </a>
          <a href="#visit" className="inline-flex h-12 items-center justify-center rounded-2xl bg-white text-[1rem] font-bold text-ink ring-1 ring-inset ring-cardline">
            방문·예약 안내
          </a>
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
          {[
            { i: <Clock className="h-4 w-4" />, t: '21:00 영업 종료' },
            { i: <MapPin className="h-4 w-4" />, t: '향동천 산책길' },
            { i: <Coffee className="h-4 w-4" />, t: '기본 음료 머신 제공' },
            { i: <Wifi className="h-4 w-4" />, t: '무선 인터넷 · 포장' },
          ].map((x) => (
            <span key={x.t} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-canvas px-3.5 py-2 text-[0.875rem] font-semibold text-ink-2 ring-1 ring-inset ring-line">
              {x.i}
              {x.t}
            </span>
          ))}
        </div>
      </section>

      {/* 고양이 — Netflix식 사진 레일 (밝은 톤) */}
      <section id="cats" className="mt-8 scroll-mt-20 bg-[#F4F8F9] py-8 md:py-10" aria-labelledby="sec-friends">
        <div className="mx-auto max-w-6xl px-4 md:px-5">
          <SectionHeader id="sec-friends" eyebrow={`다색냥 친구들 ${cats.length}마리`} title="우리 고양이들을 만나보세요" sub="사진을 누르면 성격·좋아하는 것을 볼 수 있어요" />
          {allCats ? (
            /* 전체 보기: 25마리를 한눈에 — 격자 */
            <ul className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" data-testid="cats-grid" aria-label={`고양이 ${cats.length}마리 전체`}>
              {cats.map((c) => (
                <li key={c.id}>
                  <CatCoverCard cat={c} photo={covers.get(c.id)?.[0]} fluid />
                </li>
              ))}
            </ul>
          ) : (
            <Rail label="고양이 프로필 카드">
              {cats.slice(0, 4).map((c) => (
                <CatCoverCard key={c.id} cat={c} photo={covers.get(c.id)?.[0]} size="lg" />
              ))}
            </Rail>
          )}
          {cats.length > 4 && (
            <button type="button" aria-expanded={allCats} onClick={() => setAllCats((v) => !v)} data-testid="cats-show-all" className="mt-3 flex h-11 w-full items-center justify-center rounded-2xl bg-white text-[0.9375rem] font-bold text-ink ring-1 ring-inset ring-cardline hover:bg-canvas md:w-auto md:px-6">
              {allCats ? '대표 고양이만 보기' : `전체 ${cats.length}마리 보기`}
            </button>
          )}
          {moments.length > 0 && (
            <div className="mt-7">
              <h3 className="mb-3 text-[1.0625rem] font-extrabold text-ink">오늘의 순간</h3>
              <Rail label="고양이 사진 모음">
                {moments.map(({ p, c }) => (
                  <Link key={p.id} href={`/dasek/cats/${c.id}`} className="group block w-[250px] shrink-0 snap-start md:w-[320px]">
                    <div className="zoom-img overflow-hidden rounded-[20px]">
                      <AssetImage slot={p.slot} dataUrl={p.dataUrl} fallback={p.art ?? c.coverArt} alt={p.alt} className="aspect-[16/10] w-full" sizes="(min-width: 768px) 320px, 250px" position="center 35%" />
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[0.9375rem] font-bold text-ink">
                      {c.name} <ChevronRight className="h-4 w-4 text-ink-3 transition group-hover:translate-x-0.5" />
                    </p>
                    <p className="clamp-1 text-[0.875rem] text-ink-3">{p.caption}</p>
                  </Link>
                ))}
              </Rail>
            </div>
          )}
          {cats.some((c) => c.isPlaceholder) && (
            <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-[0.875rem] leading-relaxed text-ink-2">
              지금은 <b>예시 프로필과 샘플 사진</b>이에요. 실제 다색냥 고양이 수·이름·사진은 매장 확인 후 공개됩니다.
            </p>
          )}
        </div>
      </section>

      <section id="rules" className="mx-auto mt-9 max-w-6xl scroll-mt-20 px-4 md:px-5" aria-labelledby="sec-rules">
        <SectionHeader id="sec-rules" title="함께 지키는 교감 수칙" sub="고양이와 손님 모두 편안하도록" />
        {/* 핵심 수칙은 항상 보이게, 이유 설명은 펼치기 */}
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-4" data-testid="rules-core">
          {RULES.map((r) => (
            <li key={r.t} className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-sage-50 p-3">
              <r.icon className="h-5 w-5 shrink-0 text-sage-600" />
              <span className="text-[0.9375rem] font-bold leading-snug text-ink">{r.t}</span>
            </li>
          ))}
        </ul>
        <Disclosure label="수칙마다 이유 보기" openLabel="이유 접기" className="mt-2.5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {RULES.map((r) => (
            <div key={r.t} className="rounded-[20px] bg-sage-50 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-sage-600">
                <r.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[0.9375rem] font-bold leading-snug text-ink">{r.t}</p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-2">{r.b}</p>
            </div>
          ))}
        </div>
        </Disclosure>
        <p className="mt-2.5 flex items-center gap-1.5 text-[0.875rem] text-ink-3">
          <ShieldCheck className="h-4 w-4" /> 매장 고양이의 건강 관리 기록은 공개하지 않아요.
        </p>
      </section>

      <section id="menu" className="mx-auto mt-9 max-w-6xl scroll-mt-20 px-4 md:px-5" aria-labelledby="sec-menu">
        <SectionHeader id="sec-menu" title="디저트·음료" sub="기본 음료는 머신으로, 추가 메뉴는 데스크에서 주문해요" />
        {signature && (
          <div className="hidden md:block">
            <SignatureCard item={signature} s={s} saved={favIds.has(signature.id)} onToggleSave={() => save(signature.id)} />
          </div>
        )}
        {/* 휴대폰: 대표 디저트도 같은 줄의 첫 카드로 (큰 카드 반복 없이) */}
        <Rail label="다색냥 메뉴" className="md:mt-5">
          {menu.map((m) => (
            <div key={m.id} className={m.isSignature ? 'md:hidden' : 'contents'}>
              <MenuCard item={m} s={s} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
            </div>
          ))}
        </Rail>
      </section>

      <section id="visit" className="mx-auto mt-9 max-w-6xl scroll-mt-20 px-4 md:px-5" aria-labelledby="sec-use">
        <SectionHeader id="sec-use" title="이용 · 방문 안내" />
        <div className="card grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="p-4 md:p-5">
            <p className="flex items-center gap-1.5 text-[0.875rem] font-bold text-ink-3">
              이용요금 <EvidenceBadge ev={store.feeInfo.evidence} />
            </p>
            <p className="mt-1 text-[1.0625rem] font-bold text-ink">{store.feeInfo.value ?? '매장 문의'}</p>
            <p className="mt-1 text-[0.875rem] text-ink-3">요금·기본 음료 포함 여부는 운영자 확인 후 안내돼요.</p>
          </div>
          <div className="p-4 md:p-5">
            <p className="text-[0.875rem] font-bold text-ink-3">음료·주문</p>
            <p className="mt-1 text-[1.0625rem] font-bold text-ink">기본 음료는 머신으로</p>
            <p className="mt-1 text-[0.875rem] text-ink-3">추가 메뉴는 데스크에서 주문할 수 있어요.</p>
          </div>
          <div className="p-4 md:p-5">
            <p className="text-[0.875rem] font-bold text-ink-3">방문 적립</p>
            <p className="mt-1 text-[1.0625rem] font-bold text-ink">오늘 코드로 체크인</p>
            <p className="mt-1 text-[0.875rem] text-ink-3">직원이 확인하면 스탬프 1개가 적립돼요.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <StoreInfoCard store={store} s={s} />
          <div className="flex flex-col justify-between overflow-hidden rounded-[24px] border border-brand-200 bg-brand-50">
            <AssetImage slot="cat_05_03" fallback={{ kind: 'space', variant: 1 }} alt="벤치에서 쉬는 고양이 (샘플 사진)" className="hidden aspect-[16/9] w-full md:block" sampleBadge badgePosition="tr" sizes="45vw" position="center 40%" />
            <div className="p-5">
              <CalendarHeart className="h-6 w-6 text-brand-600" />
              <p className="mt-2 text-[1.125rem] font-extrabold text-ink">방문할 예정이에요</p>
              <p className="mt-1 text-[0.875rem] text-ink-2">방문 예정을 남기면 매장이 손님 흐름을 준비하는 데 참고해요. 예약 확정은 아니에요.</p>
              <Button className="mt-4" size="lg" variant="outline" onClick={() => run(() => act((d, c) => D.recordVisitIntent(d, c, me?.id ?? null, store.id)), '방문 예정을 남겼어요. 매장에서 체크인하면 적립돼요.')}>
                <HeartHandshake className="h-4 w-4" /> 방문 예정 남기기
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
