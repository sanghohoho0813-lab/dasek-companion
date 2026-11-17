'use client';
import { Check, ChevronRight, Copy, ExternalLink, Heart, Info, MapPin, Phone, Clock, Store as StoreIcon, Sparkles, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { Button, EvidenceBadge, Sheet, StatusBadge, useRun, useToast } from '@/components/ui';
import * as D from '@/lib/domain';
import { effectiveCouponStatus, type Recommendation } from '@/lib/rules';
import { act } from '@/lib/store';
import type { AppState, CafeCat, CatPhoto, CouponIssue, MenuItem, Profile, Store } from '@/lib/types';
import { cx, fmtDate, won } from '@/lib/util';

export function SectionHeader({ title, sub, href, linkLabel = '모두 보기', id }: { title: string; sub?: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-[19px] font-extrabold tracking-tight text-ink md:text-[22px]">
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-[13px] text-ink-3">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-3 py-1.5 text-[12.5px] font-semibold text-brand-700 transition hover:bg-brand-100">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function PriceText({ item, className }: { item: MenuItem; className?: string }) {
  if (item.price == null) return <span className={cx('text-[13px] font-semibold text-ink-3', className)}>가격 매장 확인</span>;
  const example = item.priceEvidence === 'ASSUMPTION';
  return (
    <span className={cx('inline-flex items-baseline gap-1', className)}>
      {example && <span className="text-[11px] font-semibold text-amber-700">예시가</span>}
      <span className="tabular text-[15px] font-bold text-ink">{won(item.price)}</span>
    </span>
  );
}

export function MenuCard({ item, saved, onToggleSave, layout = 'rail' }: { item: MenuItem; saved?: boolean; onToggleSave?: () => void; layout?: 'rail' | 'grid' }) {
  return (
    <div className={cx('group relative', layout === 'rail' ? 'w-[200px] shrink-0 snap-start md:w-[232px]' : 'w-full')}>
      <Link href={`/menu/${item.id}`} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
        <div className="lift zoom-img overflow-hidden rounded-2xl bg-white ring-1 ring-line/70">
          <AssetImage slot={item.photoSlot} fallback={item.art} alt={`${item.name} 이미지`} className="aspect-[4/3] w-full" sampleBadge={!item.photoSlot} />
          <div className="p-3">
            <div className="flex items-center gap-1.5">
              {item.isSignature && <span className="rounded-md bg-coral-50 px-1.5 py-0.5 text-[10.5px] font-bold text-coral-600">대표</span>}
              {item.isDemo && <StatusBadge status="DEMO" label="예시 메뉴" />}
            </div>
            <p className="mt-1 clamp-1 text-[15px] font-bold text-ink">{item.name}</p>
            <p className="clamp-1 text-[12.5px] text-ink-3">{item.summary}</p>
            <PriceText item={item} className="mt-1.5" />
          </div>
        </div>
      </Link>
      {onToggleSave && (
        <button
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? `${item.name} 저장 해제` : `${item.name} 저장`}
          className={cx('absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition active:scale-90', saved ? 'text-coral-500' : 'text-ink-3 hover:text-coral-500')}
        >
          <Heart className="h-[18px] w-[18px]" fill={saved ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}

export function CatCoverCard({ cat, photo, size = 'md' }: { cat: CafeCat; photo?: CatPhoto; size?: 'md' | 'lg' }) {
  return (
    <Link
      href={`/dasek/cats/${cat.id}`}
      className={cx('group block shrink-0 snap-start rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400', size === 'lg' ? 'w-[176px] md:w-[220px]' : 'w-[148px] md:w-[184px]')}
      aria-label={`${cat.name} 프로필 보기`}
    >
      <div className="lift zoom-img relative overflow-hidden rounded-[22px] bg-white ring-1 ring-line/70">
        <AssetImage slot={photo?.slot} dataUrl={photo?.dataUrl} fallback={photo?.art ?? cat.coverArt} alt={photo?.alt ?? `${cat.name}`} className="aspect-[3/4] w-full" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent p-3 pt-10">
          <p className="text-[16px] font-extrabold text-white drop-shadow">{cat.name}</p>
          <p className="clamp-1 text-[11.5px] text-white/90">{cat.personality.slice(0, 2).join(' · ')}</p>
        </div>
        {cat.isPlaceholder && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-ink-3">예시 프로필</span>}
      </div>
    </Link>
  );
}

export function Rail({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  return (
    <div role="region" aria-label={label} className={cx('-mx-4 flex snap-x-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 no-scrollbar md:-mx-5 md:scroll-px-5 md:px-5', className)}>
      {children}
    </div>
  );
}

export function StampCard({ count, required, compact }: { count: number; required: number; compact?: boolean }) {
  const inCycle = count % required;
  return (
    <div className={cx('rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 text-white', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12.5px] font-semibold text-white/80">다색컴패니언 스탬프</p>
          <p className="mt-0.5 text-[22px] font-extrabold tabular">
            {inCycle} <span className="text-[15px] font-semibold text-white/70">/ {required}</span>
          </p>
        </div>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-semibold">누적 {count}개</span>
      </div>
      <div className={cx('mt-3 grid grid-cols-5 gap-2', required > 10 && 'grid-cols-6')} aria-label={`스탬프 ${inCycle}개 / ${required}개`}>
        {Array.from({ length: required }).map((_, i) => (
          <span key={i} className={cx('grid aspect-square place-items-center rounded-full text-[11px] font-bold transition', i < inCycle ? 'bg-white text-brand-700' : 'border border-dashed border-white/40 text-white/40')}>
            {i < inCycle ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-white/80">직원이 방문·구매를 확인하면 매장별 하루 1개 적립돼요. 링크 클릭·자가신고만으로는 적립되지 않아요.</p>
    </div>
  );
}

export function CouponCard({ c, onOpen }: { c: CouponIssue; onOpen?: () => void }) {
  const st = effectiveCouponStatus(c);
  const usable = st === 'ISSUED';
  const label = { ISSUED: '사용 가능', REDEEMED: '사용 완료', EXPIRED: '기간 만료', CANCELLED: '취소됨' }[st];
  return (
    <button onClick={onOpen} disabled={!onOpen} className={cx('press flex w-full items-stretch overflow-hidden rounded-2xl text-left ring-1 transition', usable ? 'bg-white ring-line hover:ring-brand-200' : 'bg-canvas ring-line/60')}>
      <div className={cx('grid w-16 shrink-0 place-items-center', usable ? 'bg-promo-100 text-promo-600' : 'bg-line/60 text-ink-4')}>
        <Ticket className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1 border-l border-dashed border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cx('text-[11.5px] font-bold', usable ? 'text-brand-700' : 'text-ink-4')}>{label}</span>
          {c.isDemo && <StatusBadge status="DEMO" />}
        </div>
        <p className={cx('mt-0.5 text-[15px] font-bold', usable ? 'text-ink' : 'text-ink-3')}>{c.benefit}</p>
        <p className="text-[12px] text-ink-3">
          {c.title} · {usable ? `${fmtDate(c.expiresAt)}까지` : st === 'REDEEMED' ? `${fmtDate(c.redeemedAt)} 사용` : fmtDate(c.expiresAt)}
        </p>
      </div>
      {onOpen && usable && <ChevronRight className="mr-3 h-5 w-5 self-center text-ink-4" />}
    </button>
  );
}

export function CouponDetailSheet({ c, onClose }: { c: CouponIssue | null; onClose: () => void }) {
  return (
    <Sheet open={!!c} onClose={onClose} title={c?.benefit ?? ''} description={c?.title} size="sm">
      {c && (
        <div className="text-center">
          <p className="text-[13px] text-ink-3">계산할 때 직원에게 이 화면을 보여주세요</p>
          <div className="mx-auto mt-3 rounded-2xl bg-canvas px-4 py-5">
            <p className="text-[12px] font-semibold text-ink-3">쿠폰 코드</p>
            <p className="mt-1 font-mono text-[28px] font-extrabold tracking-[0.12em] text-ink">{c.code}</p>
          </div>
          <dl className="mt-4 space-y-1.5 text-left text-[13px]">
            <div className="flex justify-between">
              <dt className="text-ink-3">유효기간</dt>
              <dd className="font-semibold text-ink">{fmtDate(c.expiresAt)}까지</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-3">발급 사유</dt>
              <dd className="font-semibold text-ink">{c.source}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-left text-[12px] leading-relaxed text-amber-900">혜택 내용은 운영자 확정 전 예시입니다. 사용 처리는 매장 직원이 운영 화면에서 진행합니다.</p>
        </div>
      )}
    </Sheet>
  );
}

export function LoginGate({ title = '로그인이 필요해요', body = '가입하면 혜택 쿠폰과 스탬프를 받을 수 있어요.', next }: { title?: string; body?: string; next?: string }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <div className="rounded-3xl bg-gradient-to-br from-brand-50 via-white to-sage-50 p-6 text-center ring-1 ring-line">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-card">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="mt-3 text-[17px] font-extrabold text-ink">{title}</p>
      <p className="mt-1 text-[13.5px] text-ink-3">{body}</p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href={`/signup${q}`} className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-[14.5px] font-bold text-white shadow-sm transition hover:bg-brand-700">
          가입하고 혜택 받기
        </Link>
        <Link href={`/login${q}`} className="inline-flex h-11 items-center rounded-xl bg-white px-4 text-[14.5px] font-semibold text-ink ring-1 ring-line transition hover:bg-canvas">
          로그인
        </Link>
      </div>
    </div>
  );
}

/** 매장 정보 — 확인 상태(근거)를 함께 표시 */
export function StoreInfoCard({ store, s }: { store: Store; s: AppState }) {
  const toast = useToast();
  const me = s.session.customerId;
  const rows: { icon: React.ReactNode; label: string; value: string | null; ev: Store['address']['evidence']; extra?: React.ReactNode }[] = [
    { icon: <MapPin className="h-4 w-4" />, label: '주소', value: store.address.value, ev: store.address.evidence },
    { icon: <StoreIcon className="h-4 w-4" />, label: '찾아오는 길', value: store.directions.value, ev: store.directions.evidence },
    { icon: <Clock className="h-4 w-4" />, label: '영업시간', value: store.hours.value, ev: store.hours.evidence },
    { icon: <Phone className="h-4 w-4" />, label: '전화', value: store.phone.value, ev: store.phone.evidence },
  ];
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-line">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-extrabold text-ink">{store.name} 매장 안내</p>
        <StatusBadge status="DEMO" label="정보 확인 중" />
      </div>
      <dl className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3">
            <span className="mt-0.5 text-ink-3">{r.icon}</span>
            <div className="min-w-0 flex-1">
              <dt className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
                {r.label} <EvidenceBadge ev={r.ev} />
              </dt>
              <dd className="mt-0.5 text-[14px] font-medium text-ink">{r.value ?? '운영자 확인 후 안내 예정'}</dd>
            </div>
            {r.label === '주소' && r.value && (
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(r.value!.replace(/\s*\(.*\)$/, '')).then(
                    () => toast('주소를 복사했어요.'),
                    () => toast('복사하지 못했어요.', 'error'),
                  );
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-3 transition hover:bg-canvas"
                aria-label="주소 복사"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
            {r.label === '전화' && r.value && (
              <a href={`tel:${r.value.replace(/[^0-9]/g, '')}`} className="shrink-0 rounded-full bg-canvas px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition hover:bg-line">
                전화
              </a>
            )}
          </div>
        ))}
      </dl>
      {store.amenities.value && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {store.amenities.value.map((a) => (
            <span key={a} className="rounded-full bg-canvas px-2.5 py-1 text-[12px] font-medium text-ink-2">
              {a}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {store.reservationUrl.value ? (
          <a
            href={store.reservationUrl.value}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => act((d, c) => D.recordLinkClick(d, c, me, 'reservation', store.id, '네이버 예약 링크 열기'))}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-xl bg-brand-600 text-[14px] font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            예약하기 <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="inline-flex h-11 items-center justify-center rounded-xl bg-canvas text-[13px] font-semibold text-ink-4">예약 채널 확인 중</span>
        )}
        <Link href={`/checkin?store=${store.id}`} className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-50 text-[14px] font-bold text-brand-700 transition hover:bg-brand-100">
          방문 체크인
        </Link>
      </div>
      {store.reservationUrl.value && <p className="mt-2 text-[11.5px] text-ink-4">예약은 외부(네이버) 페이지에서 확정돼요. 이 앱은 예약을 확정하지 않습니다.</p>}
    </div>
  );
}

export function WhySheet({ rec, onClose }: { rec: Recommendation | null; onClose: () => void }) {
  return (
    <Sheet open={!!rec} onClose={onClose} title="왜 추천했나요?" description="규칙 기반 추천 — AI 모델을 사용하지 않았어요" size="sm">
      {rec && (
        <div className="space-y-4 text-[14px]">
          <div>
            <p className="text-[12px] font-bold text-ink-3">사용한 정보</p>
            <p className="mt-1 text-ink-2">{rec.used.join(' · ')}</p>
          </div>
          <div>
            <p className="text-[12px] font-bold text-ink-3">추천 이유</p>
            <ul className="mt-1 space-y-1">
              {rec.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-[13px] text-amber-900">
            <p className="font-bold">주의</p>
            <p className="mt-0.5">{rec.caution}</p>
          </div>
          <div>
            <p className="text-[12px] font-bold text-ink-3">다음 행동</p>
            <p className="mt-1 text-ink-2">{rec.next}</p>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/** 구매 확인 요청 (자가신고 → 직원 확인 대기) */
export function PurchaseReportSheet({ open, onClose, s, me, preset }: { open: boolean; onClose: () => void; s: AppState; me: Profile | null; preset?: string }) {
  const run = useRun();
  const router = useRouter();
  const [storeId, setStoreId] = useState(preset ? (s.menuItems.find((m) => m.id === preset)?.storeId ?? 'store_dasek') : 'store_dasek');
  const [items, setItems] = useState<string[]>(preset ? [preset] : []);
  const [note, setNote] = useState('');
  const list = s.menuItems.filter((m) => m.published && m.storeId === storeId);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="구매 확인 요청"
      description="직원이 확인하면 스탬프·추천 보상에 반영돼요. 확인 전에는 '요청됨' 상태로만 표시됩니다."
      testId="purchase-sheet"
      footer={
        me ? (
          <Button
            full
            size="lg"
            data-testid="purchase-submit"
            onClick={() => {
              const r = run(() => act((d, c) => D.selfReportPurchase(d, c, me.id, storeId, items, note)), '확인 요청을 보냈어요. 직원 확인을 기다려 주세요.');
              if (r) {
                onClose();
                setItems([]);
                setNote('');
              }
            }}
          >
            확인 요청 보내기
          </Button>
        ) : (
          <Button full size="lg" onClick={() => router.push('/login?next=/my/activity')}>
            로그인하고 요청하기
          </Button>
        )
      }
    >
      <p className="text-[12.5px] font-bold text-ink-3">구매한 매장</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {s.stores.map((st) => (
          <button
            key={st.id}
            onClick={() => {
              setStoreId(st.id);
              setItems([]);
            }}
            aria-pressed={storeId === st.id}
            className={cx('h-11 rounded-xl text-[14px] font-bold ring-1 transition', storeId === st.id ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-2 ring-line hover:bg-canvas')}
          >
            {st.name}
          </button>
        ))}
      </div>
      <p className="mt-4 text-[12.5px] font-bold text-ink-3">구매한 메뉴 (선택)</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {list.map((m) => {
          const on = items.includes(m.id);
          return (
            <button key={m.id} aria-pressed={on} onClick={() => setItems(on ? items.filter((x) => x !== m.id) : [...items, m.id])} className={cx('rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 transition', on ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-white text-ink-2 ring-line')}>
              {on && '✓ '}
              {m.name}
            </button>
          );
        })}
      </div>
      <label className="mt-4 block">
        <span className="text-[12.5px] font-bold text-ink-3">메모 (선택)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} placeholder="예: 포장 구매, 오후 3시쯤" className="mt-2 h-11 w-full rounded-xl border border-line px-3.5 text-[14.5px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
      </label>
      <p className="mt-3 flex gap-1.5 text-[12px] text-ink-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        매장에서 회원코드를 보여주면 직원이 바로 확인할 수도 있어요.
      </p>
    </Sheet>
  );
}
