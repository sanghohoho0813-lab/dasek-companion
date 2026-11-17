'use client';
import { Info, Search, SlidersHorizontal, Store, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { MenuCard, MenuRow, Rail, SectionHeader, WhySheet } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, Chip, Empty, PageSkeleton, Sheet, Toggle, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { recommendMenus, storeOfBrand, type Recommendation } from '@/lib/rules';
import { act } from '@/lib/store';
import { cx } from '@/lib/util';

type Sort = 'recommend' | 'name' | 'price';

function Inner() {
  const { s, me } = useCustomer();
  const sp = useSearchParams();
  const router = useRouter();
  const run = useRun();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [cat, setCat] = useState<string>(sp.get('cat') ?? 'all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyPriced, setOnlyPriced] = useState(false);
  const [onlySaved, setOnlySaved] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>('recommend');
  const [why, setWhy] = useState<Recommendation | null>(null);

  const items = useMemo(() => {
    if (!s) return [];
    const favIds = new Set(me ? s.favorites.filter((f) => f.userId === me.id).map((f) => f.menuItemId) : []);
    let list = s.menuItems.filter((m) => m.published && m.brand === 'realsicdan');
    if (cat !== 'all') list = list.filter((m) => m.categoryId === cat);
    const term = q.trim().toLowerCase();
    if (term) list = list.filter((m) => `${m.name} ${m.summary} ${m.tags.join(' ')}`.toLowerCase().includes(term));
    if (onlyPriced) list = list.filter((m) => m.price != null && m.priceEvidence !== 'ASSUMPTION');
    if (onlySaved) list = list.filter((m) => favIds.has(m.id));
    if (tags.length) list = list.filter((m) => tags.every((t) => m.tags.includes(t)));
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    else if (sort === 'price') list = [...list].sort((a, b) => (a.price ?? 9e9) - (b.price ?? 9e9));
    else list = [...list].sort((a, b) => Number(a.isDemo) - Number(b.isDemo) || a.sortOrder - b.sortOrder); // 실제 확인된 메뉴 먼저
    return list;
  }, [s, me, cat, q, onlyPriced, onlySaved, tags, sort]);

  if (!s) return <PageSkeleton />;
  const cats = s.menuCategories.filter((c) => c.brand === 'realsicdan').sort((a, b) => a.sortOrder - b.sortOrder);
  const allTags = [...new Set(s.menuItems.filter((m) => m.brand === 'realsicdan').flatMap((m) => m.tags))];
  const favIds = new Set(me ? s.favorites.filter((f) => f.userId === me.id).map((f) => f.menuItemId) : []);
  const recent = me ? s.recentViews.filter((v) => v.userId === me.id).map((v) => s.menuItems.find((m) => m.id === v.menuItemId)).filter((m) => m && m.published).slice(0, 8) : [];
  const store = storeOfBrand(s, 'realsicdan');
  const activeFilters = Number(onlyPriced) + Number(onlySaved) + tags.length + (sort !== 'recommend' ? 1 : 0);
  const save = (id: string) => {
    if (!me) return router.push('/login?next=/realsicdan');
    run(() => act((d, c) => D.toggleFavorite(d, c, me.id, id)), (on) => (on ? '메뉴를 저장했어요.' : '저장을 해제했어요.'));
  };

  const pop = new Map<string, number>();
  for (const v of s.verifications.filter((x) => x.status === 'CONFIRMED')) for (const id of v.menuItemIds) pop.set(id, (pop.get(id) ?? 0) + 1);
  const all = s.menuItems.filter((m) => m.published && m.brand === 'realsicdan');
  const popular = [...all].sort((a, b) => (pop.get(b.id) ?? 0) - (pop.get(a.id) ?? 0)).slice(0, 5);
  const saved = all.filter((m) => favIds.has(m.id));
  const browsing = !q.trim() && cat === 'all' && activeFilters === 0;
  const recs = recommendMenus(s, me?.id ?? null, 6).filter((r) => r.item.brand === 'realsicdan').slice(0, 3);

  return (
    <div>
      <BackHeader title="리얼식단" />
      <section className="mx-auto max-w-6xl px-4 pt-3 md:px-5 md:pt-7">
        <div className="relative overflow-hidden rounded-[24px] md:rounded-[28px]">
          <AssetImage slot="service_01_food" fallback={{ kind: 'salad', variant: 1 }} alt="여러 가지 샐러드 재료 (샘플 사진)" className="aspect-[16/8] md:aspect-[16/4.6]" sampleBadge badgePosition="tr" priority sizes="(min-width: 1024px) 1100px, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-5 text-white md:justify-center md:p-9">
            <p className="text-[13px] font-semibold text-white/90">식단 · 샐러드 · 도시락</p>
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em] md:text-[38px]">리얼식단</h1>
            <p className="text-[14.5px] text-white/95 md:text-[16px]">{store.tagline}</p>
            <p className="mt-2 hidden items-center gap-1.5 text-[13px] font-semibold text-white/90 md:flex">
              <Store className="h-4 w-4" /> 매장 구매 가능 · 배달 채널 확인 중
            </p>
          </div>
        </div>
      </section>

      <div className="sticky top-14 z-10 mt-3 border-b border-line/60 bg-white/95 backdrop-blur md:top-16">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-5">
          <div className="flex gap-2">
            <label className="flex h-12 flex-1 items-center gap-2 rounded-2xl bg-canvas px-4 ring-1 ring-inset ring-line focus-within:ring-2 focus-within:ring-brand-200">
              <Search className="h-[18px] w-[18px] shrink-0 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="메뉴·재료 검색" aria-label="메뉴 검색" className="w-full bg-transparent text-[16px] outline-none placeholder:text-ink-4" />
              {q && (
                <button onClick={() => setQ('')} aria-label="검색어 지우기" className="grid h-8 w-8 place-items-center text-ink-3 hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <button onClick={() => setFilterOpen(true)} data-testid="filter-open" className={cx('relative inline-flex h-12 items-center gap-1.5 rounded-2xl px-4 text-[15px] font-semibold ring-1 ring-inset transition', activeFilters ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-white text-ink-2 ring-line hover:bg-canvas')}>
              <SlidersHorizontal className="h-4 w-4" /> 필터{activeFilters ? ` ${activeFilters}` : ''}
            </button>
          </div>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
            <Chip active={cat === 'all'} onClick={() => setCat('all')}>
              전체
            </Chip>
            {cats.map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                {c.name}
              </Chip>
            ))}
            {me && (
              <Chip active={onlySaved} onClick={() => setOnlySaved(!onlySaved)}>
                ♥ 저장한 메뉴
              </Chip>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-5 md:px-5">
        {browsing && (
          <>
            <section aria-labelledby="rs-pop">
              <SectionHeader id="rs-pop" title="인기 메뉴" sub="매장에서 확인된 구매가 많은 순 · DEMO 집계" />
              <Rail label="인기 메뉴">
                {popular.map((m, i) => (
                  <MenuCard key={m.id} item={m} s={s} rank={i + 1} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
                ))}
              </Rail>
            </section>
            {recs.length > 0 && (
              <section className="mt-8" aria-labelledby="rs-rec">
                <SectionHeader id="rs-rec" title={me ? '나에게 맞을 메뉴' : '이런 메뉴는 어때요'} sub="규칙 기반 추천 · 이유를 확인할 수 있어요" />
                <div className="grid gap-2.5 md:grid-cols-3">
                  {recs.map((r) => (
                    <MenuRow
                      key={r.item.id}
                      item={r.item}
                      sub={r.reasons[0]}
                      right={
                        <button onClick={() => setWhy(r)} className="shrink-0 rounded-full bg-canvas px-3.5 py-2 text-[13px] font-bold text-ink-2 hover:bg-line">
                          왜?
                        </button>
                      }
                    />
                  ))}
                </div>
              </section>
            )}
            {saved.length > 0 && (
              <section className="mt-8" aria-labelledby="rs-saved">
                <SectionHeader id="rs-saved" title="저장한 메뉴" href="/my/saved" />
                <Rail label="저장한 메뉴">
                  {saved.map((m) => (
                    <MenuCard key={m.id} item={m} s={s} saved onToggleSave={() => save(m.id)} />
                  ))}
                </Rail>
              </section>
            )}
            {recent.length > 0 && (
              <section className="mt-8">
                <SectionHeader title="최근 본 메뉴" />
                <Rail label="최근 본 메뉴">{recent.map((m) => m && <MenuCard key={m.id} item={m} s={s} saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />)}</Rail>
              </section>
            )}
          </>
        )}
        <section className={browsing ? 'mt-8' : ''}>
          <SectionHeader title={!browsing && q ? `'${q}' 검색 결과` : cat === 'all' ? '전체 메뉴' : cats.find((c) => c.id === cat)?.name ?? '메뉴'} sub={`${items.length}개 · 확인된 메뉴 먼저 보여드려요`} />
          {items.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4" data-testid="menu-grid">
              {items.map((m) => (
                <MenuCard key={m.id} item={m} s={s} layout="grid" saved={favIds.has(m.id)} onToggleSave={() => save(m.id)} />
              ))}
            </div>
          ) : (
            <Empty
              title="조건에 맞는 메뉴가 없어요"
              body="검색어나 필터를 바꿔 보세요."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQ('');
                    setCat('all');
                    setTags([]);
                    setOnlyPriced(false);
                    setOnlySaved(false);
                  }}
                >
                  조건 초기화
                </Button>
              }
            />
          )}
        </section>
        <p className="mt-6 flex items-start gap-1.5 rounded-2xl bg-canvas px-4 py-3 text-[13px] leading-relaxed text-ink-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
          영양성분·알레르기 정보는 매장 확인 전에는 표시하지 않아요. &lsquo;예시 메뉴&rsquo;와 &lsquo;예시가&rsquo;는 실제 메뉴 등록 전 시연용이에요.
        </p>
        <div className="mt-4 rounded-[24px] bg-white p-5 ring-1 ring-line">
          <p className="text-[17px] font-extrabold text-ink">주문 방법</p>
          <ul className="mt-3 space-y-3 text-[15px]">
            <li className="flex gap-2.5">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white">1</span>
              <span className="text-ink-2">매장(향동천 산책길, 다색냥 매장 내 판매로 확인 중)에서 직접 구매하세요.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white">2</span>
              <span className="text-ink-2">계산할 때 마이 &gt; 회원코드를 보여주면 직원 확인 후 스탬프가 적립돼요.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-line text-[12px] font-bold text-ink-3">3</span>
              <span className="text-ink-3">배달은 운영 중이지만 채널 링크는 확인 후 연결될 예정이에요.</span>
            </li>
          </ul>
        </div>
      </div>
      <WhySheet rec={why} onClose={() => setWhy(null)} />

      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="필터"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button
              variant="soft"
              onClick={() => {
                setTags([]);
                setOnlyPriced(false);
                setOnlySaved(false);
                setSort('recommend');
              }}
            >
              초기화
            </Button>
            <Button full onClick={() => setFilterOpen(false)}>
              {items.length}개 메뉴 보기
            </Button>
          </div>
        }
      >
        <p className="text-[12.5px] font-bold text-ink-3">정렬</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ['recommend', '기본순'],
              ['name', '이름순'],
              ['price', '가격 낮은순'],
            ] as [Sort, string][]
          ).map(([v, l]) => (
            <Chip key={v} active={sort === v} onClick={() => setSort(v)}>
              {l}
            </Chip>
          ))}
        </div>
        <p className="mt-5 text-[12.5px] font-bold text-ink-3">키워드</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {allTags.map((t) => (
            <Chip key={t} active={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>
              {t}
            </Chip>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px] font-semibold text-ink">확인된 가격이 있는 메뉴만</span>
            <Toggle checked={onlyPriced} onChange={setOnlyPriced} label="확인된 가격만" />
          </div>
          {me && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] font-semibold text-ink">저장한 메뉴만</span>
              <Toggle checked={onlySaved} onChange={setOnlySaved} label="저장한 메뉴만" />
            </div>
          )}
        </div>
        <p className="mt-5 rounded-xl bg-canvas p-3 text-[12px] text-ink-3">알레르기 성분 제외 필터는 매장의 원재료 정보가 확인된 뒤 제공돼요. 지금은 안전을 보장할 수 없어 제공하지 않습니다.</p>
      </Sheet>
    </div>
  );
}

export default function RealsicdanPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
