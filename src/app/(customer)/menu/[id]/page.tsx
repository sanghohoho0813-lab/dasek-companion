'use client';
import { AlertTriangle, Heart, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AssetImage, menuSlots } from '@/components/art/AssetImage';
import { ChannelList, MenuRow, PriceText, PurchaseReportSheet, SectionHeader, WhySheet } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, Empty, EvidenceBadge, PageSkeleton, Sheet, StatusBadge, useRun, useToast } from '@/components/ui';
import * as D from '@/lib/domain';
import { getMenuItem, getStore, recommendMenus, type Recommendation } from '@/lib/rules';
import { act } from '@/lib/store';
import { cx } from '@/lib/util';

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { s, me } = useCustomer();
  const run = useRun();
  const toast = useToast();
  const router = useRouter();
  const [orderOpen, setOrderOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [why, setWhy] = useState<Recommendation | null>(null);
  const viewed = useRef(false);

  useEffect(() => {
    if (!s || viewed.current) return;
    const item = getMenuItem(s, id);
    if (!item) return;
    viewed.current = true;
    act((d, c) => D.recordMenuView(d, c, d.session.customerId, id));
  }, [s, id]);

  if (!s) return <PageSkeleton />;
  const item = getMenuItem(s, id);
  if (!item || !item.published)
    return (
      <div className="mx-auto max-w-lg p-6">
        <Empty title="메뉴를 찾을 수 없어요" body="판매가 종료되었거나 주소가 바뀌었을 수 있어요." action={<Link href="/realsicdan" className="font-semibold text-brand-700">메뉴 목록으로</Link>} />
      </div>
    );
  const store = getStore(s, item.storeId)!;
  const saved = !!me && s.favorites.some((f) => f.userId === me.id && f.menuItemId === item.id);
  const recs = recommendMenus(s, me?.id ?? null, 8).filter((r) => r.item.id !== item.id).slice(0, 3);
  const cat = s.menuCategories.find((c) => c.id === item.categoryId);
  const pop = s.verifications.filter((v) => v.status === 'CONFIRMED' && v.menuItemIds.includes(item.id)).length;
  const toggleSave = () => {
    if (!me) return router.push(`/login?next=/menu/${item.id}`);
    run(() => act((d, c) => D.toggleFavorite(d, c, me.id, item.id)), (on) => (on ? '저장했어요. 내 정보 > 저장한 메뉴에서 볼 수 있어요.' : '저장을 해제했어요.'));
  };

  return (
    <div>
      <BackHeader
        title={item.name}
        fallback={item.brand === 'dasek' ? '/dasek' : '/realsicdan'}
        right={
          <button
            aria-label="공유"
            onClick={() => {
              const url = window.location.href.replace(/[?&]frame=mobile/, '');
              if (navigator.share) navigator.share({ title: item.name, url }).catch(() => {});
              else navigator.clipboard?.writeText(url).then(() => toast('링크를 복사했어요.'));
            }}
            className="grid h-11 w-11 place-items-center rounded-full text-ink-2 active:bg-canvas"
          >
            <Share2 className="h-5 w-5" />
          </button>
        }
      />
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[1.05fr_1fr] md:gap-12 md:px-5 md:pt-8">
        <div className="md:sticky md:top-24 md:self-start">
          <AssetImage slots={menuSlots(item)} dataUrl={item.photoDataUrl} fallback={item.art} alt={`${item.name} 사진`} className="aspect-square w-full md:rounded-[32px]" sampleBadge badgePosition="br" priority sizes="(min-width: 768px) 50vw, 100vw" />
          {item.isDemo && <p className="mx-4 mt-2 text-[0.8438rem] text-ink-3 md:mx-0">예시 메뉴의 샘플 사진이에요. 실제 판매 메뉴와 다를 수 있어요.</p>}
        </div>
        <div className="min-w-0 px-4 pt-5 md:px-0 md:pt-1">
          <nav className="hidden text-[0.8125rem] font-medium text-ink-3 md:block" aria-label="경로">
            <Link href={item.brand === 'dasek' ? '/dasek' : '/realsicdan'} className="hover:text-ink">
              {store.name}
            </Link>{' '}
            / {cat?.name}
          </nav>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.isSignature && <span className="rounded-lg bg-coral-600 px-2 py-1 text-[0.8125rem] font-bold text-white">대표 메뉴</span>}
            {item.isDemo ? <StatusBadge status="DEMO" label="예시 메뉴" /> : <EvidenceBadge ev={item.evidence} />}
            <span className="text-[0.8125rem] font-semibold text-ink-3">
              {store.name} · {cat?.name}
            </span>
          </div>
          <h1 className="mt-2 text-[1.75rem] font-extrabold leading-tight tracking-[-0.025em] text-ink md:text-[2.25rem]">{item.name}</h1>
          <p className="mt-1.5 text-[1rem] leading-relaxed text-ink-2">{item.summary}</p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <PriceText item={item} size="lg" />
            {item.price != null && item.priceEvidence === 'USER_PROVIDED' && <span className="text-[0.8125rem] text-ink-3">공개 메뉴 정보 기준 · 매장 사정에 따라 달라질 수 있어요</span>}
            {item.price == null && <span className="text-[0.8125rem] text-ink-3">가격은 매장에서 확인해 주세요</span>}
          </div>
          {pop > 0 && <p className="mt-1 text-[0.8125rem] font-semibold text-sage-600">매장에서 확인된 구매 {pop}건 (DEMO 집계)</p>}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span key={t} className="rounded-full bg-canvas px-3 py-1.5 text-[0.8125rem] font-medium text-ink-2">
                #{t}
              </span>
            ))}
          </div>

          <div className="mt-6 hidden gap-2 md:flex md:flex-wrap">
            <Button size="lg" variant="outline" onClick={toggleSave} aria-pressed={saved} data-testid="save-menu">
              <Heart className={cx('h-5 w-5', saved && 'text-coral-500')} fill={saved ? 'currentColor' : 'none'} /> {saved ? '저장됨' : '저장'}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setReportOpen(true)} data-testid="report-purchase">
              구매했어요 · 적립 요청
            </Button>
          </div>

          <section className="mt-7" aria-labelledby="buy-how">
            <h2 id="buy-how" className="text-[1.125rem] font-extrabold text-ink">
              어떻게 살 수 있나요?
            </h2>
            <p className="mb-3 mt-0.5 text-[0.8438rem] text-ink-3">확인된 채널만 &lsquo;가능&rsquo;으로 표시해요. 이 앱에서 결제·주문 확정은 하지 않아요.</p>
            <ChannelList s={s} item={item} me={me?.id ?? null} />
          </section>

          <section className="mt-7">
            <h2 className="text-[1.125rem] font-extrabold text-ink">메뉴 정보</h2>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{item.description}</p>
            <dl className="mt-3 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="text-[0.875rem] font-semibold text-ink-3">영양 정보</dt>
                <dd className="text-right text-[0.9062rem] font-semibold text-ink">
                  {item.nutritionStatus === 'VERIFIED' && item.nutrition ? `${item.nutrition.kcal}kcal · 단백질 ${item.nutrition.protein}g` : '영양정보 미확인'}
                  {item.nutritionStatus !== 'VERIFIED' && <span className="mt-0.5 block text-[0.8438rem] font-normal text-ink-3">검증된 성분표가 없어 수치를 표시하지 않아요</span>}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="text-[0.875rem] font-semibold text-ink-3">알레르기</dt>
                <dd className="text-right text-[0.9062rem] font-semibold text-ink">
                  {item.allergenStatus === 'VERIFIED' ? item.allergens.join(', ') || '표시 대상 없음' : '정보 미확인'}
                  <span className="mt-0.5 block text-[0.8438rem] font-normal text-ink-3">주문 전 매장에 꼭 확인해 주세요</span>
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <dt className="text-[0.875rem] font-semibold text-ink-3">정보 출처</dt>
                <dd className="max-w-[62%] text-right text-[0.8125rem] text-ink-2">{item.source}</dd>
              </div>
            </dl>
            {item.allergenStatus !== 'VERIFIED' && (
              <p className="mt-3 flex gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-[0.8438rem] leading-relaxed text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                알레르기가 있다면 원재료와 교차 접촉 여부를 매장에서 직접 확인해 주세요. 이 앱은 안전을 보장하지 않아요.
              </p>
            )}
          </section>

          {recs.length > 0 && (
            <section className="mt-10">
              <SectionHeader title="함께 보면 좋은 메뉴" sub="규칙 기반 추천" />
              <div className="space-y-2.5">
                {recs.map((r) => (
                  <MenuRow
                    key={r.item.id}
                    item={r.item}
                    sub={r.reasons[0]}
                    right={
                      <button onClick={() => setWhy(r)} className="inline-flex h-11 shrink-0 items-center rounded-full bg-canvas px-4 text-[0.875rem] font-bold text-ink-2 ring-1 ring-inset ring-cardline hover:bg-line">
                        왜?
                      </button>
                    }
                  />
                ))}
              </div>
            </section>
          )}
          <div className="h-32 md:h-10" />
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-[calc(67px+max(12px,env(safe-area-inset-bottom)))] z-20 border-t border-line bg-white px-4 py-2.5 md:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <button onClick={toggleSave} aria-pressed={saved} aria-label={saved ? '저장 해제' : '저장'} data-testid="save-menu-m" className={cx('grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl ring-1 transition active:scale-95', saved ? 'bg-coral-50 text-coral-500 ring-coral-50' : 'bg-white text-ink-2 ring-line')}>
            <Heart className="h-[22px] w-[22px]" fill={saved ? 'currentColor' : 'none'} />
          </button>
          <Button size="lg" variant="secondary" className="h-[52px]" onClick={() => setReportOpen(true)} data-testid="report-purchase-m">
            구매했어요
          </Button>
          <Button size="lg" className="h-[52px] flex-1" onClick={() => setOrderOpen(true)}>
            구매 방법 보기
          </Button>
        </div>
      </div>

      <Sheet open={orderOpen} onClose={() => setOrderOpen(false)} title="구매 방법" description={`${item.name} · ${store.name}`}>
        <ChannelList s={s} item={item} me={me?.id ?? null} />
        <p className="mt-3 text-[0.8125rem] text-ink-3">외부 링크를 연 것만으로는 구매로 기록되지 않아요. 구매 후 &lsquo;구매했어요&rsquo;로 적립을 요청하거나 매장에서 회원번호를 보여주세요.</p>
      </Sheet>
      <PurchaseReportSheet open={reportOpen} onClose={() => setReportOpen(false)} s={s} me={me} preset={item.id} />
      <WhySheet rec={why} onClose={() => setWhy(null)} />
    </div>
  );
}
