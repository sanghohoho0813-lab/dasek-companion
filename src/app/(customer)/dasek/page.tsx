'use client';
import { CalendarHeart, Camera, Coffee, Hand, HeartHandshake, Info, Moon, ShieldCheck, Wifi } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AssetImage } from '@/components/art/AssetImage';
import { CatCoverCard, MenuCard, Rail, SectionHeader, StoreInfoCard } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, EvidenceBadge, PageSkeleton, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { storeOfBrand } from '@/lib/rules';
import { act } from '@/lib/store';
import Link from 'next/link';

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
  const pub = s.catPhotos.filter((p) => p.status === 'PUBLISHED' && cats.some((c) => c.id === p.catId));
  const strip = [...pub].sort((a, b) => a.sortOrder - b.sortOrder || a.catId.localeCompare(b.catId)).filter((p) => p.sortOrder > 0).slice(0, 10);
  const menu = s.menuItems.filter((m) => m.published && m.brand === 'dasek').sort((a, b) => Number(b.isSignature) - Number(a.isSignature) || a.sortOrder - b.sortOrder);
  const favIds = new Set(me ? s.favorites.filter((f) => f.userId === me.id).map((f) => f.menuItemId) : []);
  const save = (id: string) => {
    if (!me) return router.push('/login?next=/dasek');
    run(() => act((d, c) => D.toggleFavorite(d, c, me.id, id)), (on) => (on ? '메뉴를 저장했어요.' : '저장을 해제했어요.'));
  };

  return (
    <div>
      <BackHeader title="다색냥" />
      <section className="mx-auto max-w-6xl md:px-5 md:pt-6">
        <div className="relative overflow-hidden md:rounded-[28px]">
          <AssetImage slot="service_02_cafe" fallback={{ kind: 'space', variant: 0 }} alt="다색냥 매장 분위기 이미지" className="aspect-[16/9] md:aspect-[16/5]" sampleBadge badgePosition="tr" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white md:p-8">
            <p className="text-[12.5px] font-semibold text-white/85">고양이카페 · 음료 · 디저트</p>
            <h1 className="text-[28px] font-extrabold tracking-tight md:text-[36px]">다색냥</h1>
            <p className="text-[14px] text-white/90">{store.tagline}</p>
          </div>
        </div>
        <div className="-mx-0 flex gap-2 overflow-x-auto px-4 pt-4 no-scrollbar md:px-0">
          {[
            { i: <Moon className="h-3.5 w-3.5" />, t: '21:00 영업 종료' },
            { i: <Info className="h-3.5 w-3.5" />, t: '향동천 산책길' },
            { i: <Coffee className="h-3.5 w-3.5" />, t: '기본 음료 머신 제공' },
            { i: <Wifi className="h-3.5 w-3.5" />, t: '무선 인터넷' },
          ].map((x) => (
            <span key={x.t} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-canvas px-3 py-1.5 text-[12.5px] font-semibold text-ink-2">
              {x.i}
              {x.t}
            </span>
          ))}
        </div>
      </section>

      <section id="cats" className="mx-auto mt-8 max-w-6xl scroll-mt-20 px-4 md:px-5" aria-labelledby="sec-friends">
        <SectionHeader id="sec-friends" title="우리 고양이들을 만나보세요" sub={`다색냥 친구들 ${cats.length}마리 · 사진을 눌러 프로필을 볼 수 있어요`} />
        <Rail label="고양이 프로필 카드">
          {cats.map((c) => (
            <CatCoverCard key={c.id} cat={c} photo={pub.find((p) => p.catId === c.id && p.sortOrder === 0)} size="lg" />
          ))}
        </Rail>
        {cats.some((c) => c.isPlaceholder) && <p className="mt-1 text-[11.5px] text-ink-4">실제 고양이 수·이름·사진은 매장 확인 후 교체됩니다. 지금은 예시 프로필이에요.</p>}
      </section>

      {strip.length > 0 && (
        <section className="mx-auto mt-8 max-w-6xl px-4 md:px-5" aria-labelledby="sec-moments">
          <SectionHeader id="sec-moments" title="오늘의 냥스타그램" sub="친구들의 순간을 넘겨 보세요" />
          <Rail label="고양이 사진 모음">
            {strip.map((p) => {
              const cat = cats.find((c) => c.id === p.catId)!;
              return (
                <Link key={p.id} href={`/dasek/cats/${cat.id}`} className="group block w-[240px] shrink-0 snap-start md:w-[300px]">
                  <div className="lift zoom-img overflow-hidden rounded-2xl ring-1 ring-line/70">
                    <AssetImage slot={p.slot} dataUrl={p.dataUrl} fallback={p.art!} alt={p.alt} className="aspect-[16/10] w-full" />
                  </div>
                  <p className="mt-2 text-[13.5px] font-bold text-ink">{cat.name}</p>
                  <p className="clamp-1 text-[12px] text-ink-3">{p.caption}</p>
                </Link>
              );
            })}
          </Rail>
        </section>
      )}

      <section className="mx-auto mt-8 max-w-6xl px-4 md:px-5" aria-labelledby="sec-rules">
        <SectionHeader id="sec-rules" title="함께 지키는 교감 수칙" sub="고양이와 손님 모두 편안하도록" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {RULES.map((r) => (
            <div key={r.t} className="rounded-2xl bg-sage-50 p-4">
              <r.icon className="h-5 w-5 text-sage-600" />
              <p className="mt-2 text-[14px] font-bold text-ink">{r.t}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-3">{r.b}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11.5px] text-ink-4">
          <ShieldCheck className="h-3.5 w-3.5" /> 매장 고양이의 건강 관리 기록은 공개하지 않아요.
        </p>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 md:px-5" aria-labelledby="sec-use">
        <SectionHeader id="sec-use" title="이용 안내" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-3">
              이용요금 <EvidenceBadge ev={store.feeInfo.evidence} />
            </p>
            <p className="mt-1 text-[15px] font-bold text-ink">{store.feeInfo.value ?? '매장 문의'}</p>
            <p className="mt-0.5 text-[12px] text-ink-3">요금·기본 음료 포함 여부는 운영자 확인 후 안내돼요.</p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="text-[13px] font-bold text-ink-3">음료</p>
            <p className="mt-1 text-[15px] font-bold text-ink">기본 음료는 머신으로 제공</p>
            <p className="mt-0.5 text-[12px] text-ink-3">추가 메뉴는 데스크에서 주문할 수 있어요.</p>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="text-[13px] font-bold text-ink-3">방문 적립</p>
            <p className="mt-1 text-[15px] font-bold text-ink">오늘 코드로 체크인</p>
            <p className="mt-0.5 text-[12px] text-ink-3">직원이 확인하면 스탬프 1개가 적립돼요.</p>
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto mt-8 max-w-6xl scroll-mt-20 px-4 md:px-5" aria-labelledby="sec-menu">
        <SectionHeader id="sec-menu" title="디저트·음료" sub="대표 메뉴 120겹파이" />
        <Rail label="다색냥 메뉴">
          {menu.map((m) => (
            <MenuCard key={m.id} item={m} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
          ))}
        </Rail>
      </section>

      <section className="mx-auto mt-8 grid max-w-6xl gap-4 px-4 md:grid-cols-[1.1fr_1fr] md:px-5">
        <StoreInfoCard store={store} s={s} />
        <div className="flex flex-col justify-between rounded-3xl bg-brand-50 p-5">
          <div>
            <CalendarHeart className="h-6 w-6 text-brand-600" />
            <p className="mt-3 text-[17px] font-extrabold text-ink">방문할 예정이에요</p>
            <p className="mt-1 text-[13.5px] text-ink-2">방문 예정을 남기면 매장이 손님 흐름을 준비하는 데 참고해요. 예약 확정은 아니에요.</p>
          </div>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => run(() => act((d, c) => D.recordVisitIntent(d, c, me?.id ?? null, store.id)), '방문 예정을 남겼어요. 매장에서 체크인하면 적립돼요.')}
          >
            <HeartHandshake className="h-4 w-4" /> 방문 예정 남기기
          </Button>
        </div>
      </section>
    </div>
  );
}
