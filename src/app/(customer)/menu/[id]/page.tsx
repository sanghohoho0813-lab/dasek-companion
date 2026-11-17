'use client';
import { AlertTriangle, Heart, Info, Share2, ShoppingBag, Store as StoreIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { PriceText, PurchaseReportSheet, SectionHeader, WhySheet } from '@/components/customer/parts';
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
  const recs = recommendMenus(s, me?.id ?? null, 6).filter((r) => r.item.id !== item.id && r.item.brand === item.brand).slice(0, 3);
  const cat = s.menuCategories.find((c) => c.id === item.categoryId);
  const toggleSave = () => {
    if (!me) return router.push(`/login?next=/menu/${item.id}`);
    run(() => act((d, c) => D.toggleFavorite(d, c, me.id, item.id)), (on) => (on ? '저장했어요. 마이 > 저장한 메뉴에서 볼 수 있어요.' : '저장을 해제했어요.'));
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
            className="grid h-10 w-10 place-items-center rounded-full text-ink-2 active:bg-canvas"
          >
            <Share2 className="h-5 w-5" />
          </button>
        }
      />
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-2 md:gap-10 md:px-5 md:pt-8">
        <div className="md:sticky md:top-24 md:self-start">
          <AssetImage slot={item.photoSlot} fallback={item.art} alt={`${item.name} 이미지`} className="aspect-square w-full md:rounded-[28px]" sampleBadge priority />
        </div>
        <div className="px-4 pt-5 md:px-0 md:pt-0">
          <nav className="hidden text-[12.5px] text-ink-3 md:block" aria-label="경로">
            <Link href={item.brand === 'dasek' ? '/dasek' : '/realsicdan'} className="hover:text-ink">
              {store.name}
            </Link>{' '}
            / {cat?.name}
          </nav>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.isSignature && <span className="rounded-md bg-coral-50 px-1.5 py-0.5 text-[11px] font-bold text-coral-600">대표 메뉴</span>}
            {item.isDemo ? <StatusBadge status="DEMO" label="예시 메뉴" /> : <EvidenceBadge ev={item.evidence} />}
            <span className="text-[12px] font-semibold text-ink-3">{store.name} · {cat?.name}</span>
          </div>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-ink md:text-[32px]">{item.name}</h1>
          <p className="mt-1 text-[15px] text-ink-2">{item.summary}</p>
          <div className="mt-3 flex items-center gap-2">
            <PriceText item={item} className="[&>span:last-child]:text-[22px]" />
            {item.price != null && item.priceEvidence === 'USER_PROVIDED' && <span className="text-[11.5px] text-ink-4">공개 메뉴 정보 기준</span>}
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span key={t} className="rounded-full bg-canvas px-2.5 py-1 text-[12px] font-medium text-ink-2">
                #{t}
              </span>
            ))}
          </div>
          <p className="mt-5 text-[14.5px] leading-relaxed text-ink-2">{item.description}</p>

          <dl className="mt-5 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
            <div className="flex items-start justify-between gap-3 p-4">
              <dt className="text-[13px] font-semibold text-ink-3">영양 정보</dt>
              <dd className="text-right text-[13.5px] font-semibold text-ink">
                {item.nutritionStatus === 'VERIFIED' && item.nutrition ? `${item.nutrition.kcal}kcal · 단백질 ${item.nutrition.protein}g` : '영양정보 미확인'}
                {item.nutritionStatus !== 'VERIFIED' && <span className="mt-0.5 block text-[11.5px] font-normal text-ink-3">검증된 성분표가 없어 수치를 표시하지 않아요</span>}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <dt className="text-[13px] font-semibold text-ink-3">알레르기</dt>
              <dd className="text-right text-[13.5px] font-semibold text-ink">
                {item.allergenStatus === 'VERIFIED' ? item.allergens.join(', ') || '표시 대상 없음' : '정보 미확인'}
                <span className="mt-0.5 block text-[11.5px] font-normal text-ink-3">주문 전 매장에 꼭 확인해 주세요</span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <dt className="text-[13px] font-semibold text-ink-3">정보 출처</dt>
              <dd className="max-w-[60%] text-right text-[12.5px] text-ink-2">{item.source}</dd>
            </div>
          </dl>
          {item.allergenStatus !== 'VERIFIED' && (
            <p className="mt-3 flex gap-1.5 rounded-xl bg-amber-50 px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              알레르기가 있다면 원재료와 교차 접촉 여부를 매장에서 직접 확인해 주세요. 이 앱은 안전을 보장하지 않아요.
            </p>
          )}

          <div className="mt-6 hidden gap-2 md:flex">
            <Button size="lg" variant="outline" onClick={toggleSave} aria-pressed={saved} data-testid="save-menu">
              <Heart className={cx('h-5 w-5', saved && 'text-coral-500')} fill={saved ? 'currentColor' : 'none'} /> {saved ? '저장됨' : '저장'}
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setOrderOpen(true)}>
              <ShoppingBag className="h-5 w-5" /> 주문·구매 방법
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setReportOpen(true)} data-testid="report-purchase">
              구매했어요
            </Button>
          </div>

          {recs.length > 0 && (
            <div className="mt-10">
              <SectionHeader title="함께 보면 좋은 메뉴" sub="규칙 기반 추천" />
              <div className="space-y-2">
                {recs.map((r) => (
                  <div key={r.item.id} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-line">
                    <Link href={`/menu/${r.item.id}`} className="block h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <AssetImage slot={r.item.photoSlot} fallback={r.item.art} alt={r.item.name} className="h-full w-full" />
                    </Link>
                    <Link href={`/menu/${r.item.id}`} className="min-w-0 flex-1">
                      <p className="clamp-1 text-[14.5px] font-bold text-ink">{r.item.name}</p>
                      <p className="clamp-1 text-[12px] text-ink-3">{r.reasons[0]}</p>
                    </Link>
                    <button onClick={() => setWhy(r)} className="rounded-full bg-canvas px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:bg-line">
                      왜?
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="h-28 md:h-10" />
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-[68px] z-20 border-t border-line/70 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md gap-2">
          <button onClick={toggleSave} aria-pressed={saved} aria-label={saved ? '저장 해제' : '저장'} data-testid="save-menu-m" className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 transition active:scale-95', saved ? 'bg-coral-50 text-coral-500 ring-coral-50' : 'bg-white text-ink-2 ring-line')}>
            <Heart className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
          </button>
          <Button size="lg" variant="secondary" onClick={() => setReportOpen(true)} data-testid="report-purchase-m">
            구매했어요
          </Button>
          <Button size="lg" className="flex-1" onClick={() => setOrderOpen(true)}>
            주문·구매 방법
          </Button>
        </div>
      </div>

      <Sheet open={orderOpen} onClose={() => setOrderOpen(false)} title="주문·구매 방법" description={`${item.name} · ${store.name}`}>
        <div className="space-y-3">
          <div className="rounded-2xl bg-brand-50 p-4">
            <p className="flex items-center gap-1.5 text-[14.5px] font-bold text-brand-800">
              <StoreIcon className="h-4 w-4" /> 매장에서 구매
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-brand-800/80">{store.address.value ?? '매장 주소 확인 중'} · 계산할 때 마이 &gt; 회원코드를 보여주면 바로 적립돼요.</p>
          </div>
          {[
            { label: '온라인 주문', f: store.orderUrl, kind: 'order' as const },
            { label: '배달 주문', f: store.deliveryUrl, kind: 'order' as const },
          ].map((x) =>
            x.f.value ? (
              <a
                key={x.label}
                href={x.f.value}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => act((d, c) => D.recordLinkClick(d, c, me?.id ?? null, 'order', store.id, `${x.label} 링크 열기`))}
                className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-line"
              >
                <span className="text-[14.5px] font-bold text-ink">{x.label}</span>
                <span className="text-[12px] text-ink-3">외부 페이지 · 결제는 외부에서</span>
              </a>
            ) : (
              <div key={x.label} className="flex items-center justify-between rounded-2xl bg-canvas p-4">
                <span className="text-[14.5px] font-bold text-ink-3">{x.label}</span>
                <span className="text-[12px] text-ink-4">채널 확인 후 연결 예정</span>
              </div>
            ),
          )}
          <p className="flex gap-1.5 text-[12px] text-ink-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> 외부 링크를 연 것만으로는 구매로 기록되지 않아요. 구매 후 '구매했어요'로 확인을 요청하세요.
          </p>
        </div>
      </Sheet>
      <PurchaseReportSheet open={reportOpen} onClose={() => setReportOpen(false)} s={s} me={me} preset={item.id} />
      <WhySheet rec={why} onClose={() => setWhy(null)} />
    </div>
  );
}
