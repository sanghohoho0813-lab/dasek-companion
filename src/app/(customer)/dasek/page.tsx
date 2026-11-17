'use client';
import { CalendarHeart, Camera, ChevronRight, Clock, Coffee, Hand, HeartHandshake, MapPin, Moon, ShieldCheck, Wifi } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AssetImage } from '@/components/art/AssetImage';
import { CatCoverCard, MenuCard, Rail, SectionHeader, SignatureCard, StoreInfoCard } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, EvidenceBadge, PageSkeleton, useRun } from '@/components/ui';
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
          <AssetImage slot="service_02_cafe" fallback={{ kind: 'space', variant: 0 }} alt="밝은 카페 내부 (샘플 사진)" className="aspect-[4/3] sm:aspect-[16/8] md:aspect-[16/5]" sampleBadge badgePosition="tr" priority sizes="(min-width: 1024px) 1100px, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent md:bg-gradient-to-r" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white md:inset-y-0 md:right-auto md:flex md:max-w-lg md:flex-col md:justify-center md:p-10">
            <p className="text-[13px] font-semibold text-white/90">고양이카페 · 음료 · 디저트</p>
            <h1 className="text-[30px] font-extrabold tracking-[-0.02em] md:text-[40px]">다색냥</h1>
            <p className="text-[15px] font-medium text-white/95 md:text-[17px]">{store.tagline}</p>
            <div className="mt-4 hidden gap-2 md:flex">
              <a href="#cats" className="inline-flex h-12 items-center rounded-2xl bg-white px-5 text-[15px] font-bold text-ink">
                고양이 먼저 보기
              </a>
              <a href="#visit" className="inline-flex h-12 items-center rounded-2xl bg-white/20 px-5 text-[15px] font-bold text-white backdrop-blur">
                방문 안내
              </a>
            </div>
          </div>
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
          {[
            { i: <Clock className="h-4 w-4" />, t: '21:00 영업 종료' },
            { i: <MapPin className="h-4 w-4" />, t: '향동천 산책길' },
            { i: <Coffee className="h-4 w-4" />, t: '기본 음료 머신 제공' },
            { i: <Wifi className="h-4 w-4" />, t: '무선 인터넷 · 포장' },
          ].map((x) => (
            <span key={x.t} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-canvas px-3.5 py-2 text-[13.5px] font-semibold text-ink-2">
              {x.i}
              {x.t}
            </span>
          ))}
        </div>
      </section>

      {/* 고양이 — Netflix식 사진 레일 (밝은 톤) */}
      <section id="cats" className="mt-8 scroll-mt-20 bg-[#F4F8F9] py-8 md:py-10" aria-labelledby="sec-friends">
        <div className="mx-auto max-w-6xl px-4 md:px-5">
          <SectionHeader id="sec-friends" eyebrow={`다색냥 친구들 ${cats.length}마리`} title="우리 고양이들을 만나보세요" sub="사진을 누르면 성격·좋아하는 것·교감 수칙을 볼 수 있어요" />
          <Rail label="고양이 프로필 카드">
            {cats.map((c) => (
              <CatCoverCard key={c.id} cat={c} photo={covers.get(c.id)?.[0]} size="lg" />
            ))}
          </Rail>
          {moments.length > 0 && (
            <div className="mt-7">
              <h3 className="mb-3 text-[17px] font-extrabold text-ink">오늘의 순간</h3>
              <Rail label="고양이 사진 모음">
                {moments.map(({ p, c }) => (
                  <Link key={p.id} href={`/dasek/cats/${c.id}`} className="group block w-[250px] shrink-0 snap-start md:w-[320px]">
                    <div className="zoom-img overflow-hidden rounded-[20px]">
                      <AssetImage slot={p.slot} dataUrl={p.dataUrl} fallback={p.art ?? c.coverArt} alt={p.alt} className="aspect-[16/10] w-full" sizes="(min-width: 768px) 320px, 250px" position="center 35%" />
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-[15px] font-bold text-ink">
                      {c.name} <ChevronRight className="h-4 w-4 text-ink-3 transition group-hover:translate-x-0.5" />
                    </p>
                    <p className="clamp-1 text-[13px] text-ink-3">{p.caption}</p>
                  </Link>
                ))}
              </Rail>
            </div>
          )}
          {cats.some((c) => c.isPlaceholder) && (
            <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-[13px] leading-relaxed text-ink-2">
              지금은 <b>예시 프로필과 샘플 사진</b>이에요. 실제 다색냥 고양이 수·이름·사진은 매장 확인 후 공개됩니다.
            </p>
          )}
        </div>
      </section>

      <section id="rules" className="mx-auto mt-9 max-w-6xl scroll-mt-20 px-4 md:px-5" aria-labelledby="sec-rules">
        <SectionHeader id="sec-rules" title="함께 지키는 교감 수칙" sub="고양이와 손님 모두 편안하도록" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {RULES.map((r) => (
            <div key={r.t} className="rounded-[20px] bg-sage-50 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-sage-600">
                <r.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[15px] font-bold leading-snug text-ink">{r.t}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{r.b}</p>
            </div>
          ))}
        </div>
        <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-ink-3">
          <ShieldCheck className="h-4 w-4" /> 매장 고양이의 건강 관리 기록은 공개하지 않아요.
        </p>
      </section>

      <section id="menu" className="mx-auto mt-9 max-w-6xl scroll-mt-20 px-4 md:px-5" aria-labelledby="sec-menu">
        <SectionHeader id="sec-menu" title="디저트·음료" sub="기본 음료는 머신으로, 추가 메뉴는 데스크에서 주문해요" />
        {signature && <SignatureCard item={signature} s={s} saved={favIds.has(signature.id)} onToggleSave={() => save(signature.id)} />}
        <Rail label="다색냥 메뉴" className="mt-5">
          {menu
            .filter((m) => !m.isSignature)
            .map((m) => (
              <MenuCard key={m.id} item={m} s={s} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
            ))}
        </Rail>
      </section>

      <section id="visit" className="mx-auto mt-9 max-w-6xl scroll-mt-20 px-4 md:px-5" aria-labelledby="sec-use">
        <SectionHeader id="sec-use" title="이용 · 방문 안내" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-line">
            <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink-3">
              이용요금 <EvidenceBadge ev={store.feeInfo.evidence} />
            </p>
            <p className="mt-1 text-[17px] font-bold text-ink">{store.feeInfo.value ?? '매장 문의'}</p>
            <p className="mt-1 text-[13px] text-ink-3">요금·기본 음료 포함 여부는 운영자 확인 후 안내돼요.</p>
          </div>
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-line">
            <p className="text-[13.5px] font-bold text-ink-3">음료·주문</p>
            <p className="mt-1 text-[17px] font-bold text-ink">기본 음료는 머신으로</p>
            <p className="mt-1 text-[13px] text-ink-3">추가 메뉴는 데스크에서 주문할 수 있어요.</p>
          </div>
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-line">
            <p className="text-[13.5px] font-bold text-ink-3">방문 적립</p>
            <p className="mt-1 text-[17px] font-bold text-ink">오늘 코드로 체크인</p>
            <p className="mt-1 text-[13px] text-ink-3">직원이 확인하면 스탬프 1개가 적립돼요.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <StoreInfoCard store={store} s={s} />
          <div className="flex flex-col justify-between overflow-hidden rounded-[24px] bg-brand-50">
            <AssetImage slot="cat_05_03" fallback={{ kind: 'space', variant: 1 }} alt="벤치에서 쉬는 고양이 (샘플 사진)" className="aspect-[16/9] w-full" sampleBadge badgePosition="tr" sizes="(min-width: 768px) 45vw, 100vw" position="center 40%" />
            <div className="p-5">
              <CalendarHeart className="h-6 w-6 text-brand-600" />
              <p className="mt-2 text-[18px] font-extrabold text-ink">방문할 예정이에요</p>
              <p className="mt-1 text-[14px] text-ink-2">방문 예정을 남기면 매장이 손님 흐름을 준비하는 데 참고해요. 예약 확정은 아니에요.</p>
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
