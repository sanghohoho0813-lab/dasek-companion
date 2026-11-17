'use client';
import { Check, ChevronRight, Clock, Copy, ExternalLink, Heart, Info, MapPin, Phone, ShoppingBag, Sparkles, Store as StoreIcon, Ticket, Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AssetImage, menuSlots } from '@/components/art/AssetImage';
import { Button, EvidenceBadge, Sheet, StatusBadge, useRun, useToast } from '@/components/ui';
import * as D from '@/lib/domain';
import { effectiveCouponStatus, type Recommendation } from '@/lib/rules';
import { act } from '@/lib/store';
import type { AppState, CafeCat, CatPhoto, CouponIssue, MenuItem, Profile, Store } from '@/lib/types';
import { cx, fmtDate, won } from '@/lib/util';

/* ── 섹션 제목 ─────────────────────────────────────── */
export function SectionHeader({ title, sub, href, linkLabel = '전체 보기', id, eyebrow }: { title: string; sub?: string; href?: string; linkLabel?: string; id?: string; eyebrow?: string }) {
  return (
    <div className="mb-3.5 flex items-end justify-between gap-3 md:mb-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-0.5 text-[12px] font-bold tracking-wide text-brand-600">{eyebrow}</p>}
        <h2 id={id} className="text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-ink md:text-[24px]">
          {title}
        </h2>
        {sub && <p className="mt-1 text-[14px] leading-snug text-ink-3">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 py-1.5 text-[14px] font-bold text-brand-700 transition hover:text-brand-800">
          {linkLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/* ── 가격·주문 채널 ─────────────────────────────────── */
export function PriceText({ item, className, size = 'md' }: { item: MenuItem; className?: string; size?: 'md' | 'lg' }) {
  if (item.price == null) return <span className={cx('text-[14px] font-semibold text-ink-3', className)}>가격 매장 확인</span>;
  const example = item.priceEvidence === 'ASSUMPTION';
  return (
    <span className={cx('inline-flex items-baseline gap-1.5', className)}>
      <span className={cx('tabular font-extrabold tracking-[-0.01em] text-ink', size === 'lg' ? 'text-[26px]' : 'text-[16px]')}>{won(item.price)}</span>
      {example && <span className="text-[12px] font-bold text-amber-700">예시가</span>}
    </span>
  );
}

export type Channel = { key: 'store' | 'desk' | 'order' | 'delivery'; label: string; available: boolean; note: string; url?: string | null };

/** 실제로 확인된 주문 채널만 '가능'으로 표시한다 — 링크 미확인은 '확인 중' */
export function orderChannels(s: AppState, item: MenuItem): Channel[] {
  const store = s.stores.find((x) => x.id === item.storeId)!;
  const list: Channel[] = [{ key: 'store', label: '매장에서 구매', available: true, note: store.address.value ? store.address.value.replace(/\s*\(.*\)$/, '') : '매장 위치 확인 중' }];
  if (item.brand === 'dasek' && item.categoryId === 'dn_drink' && item.id !== 'm_machine_drink') list.push({ key: 'desk', label: '데스크 주문', available: true, note: '매장 데스크에서 주문' });
  list.push({ key: 'order', label: '온라인 주문·픽업', available: !!store.orderUrl.value, note: store.orderUrl.value ? '외부 페이지에서 주문' : '채널 확인 후 연결 예정', url: store.orderUrl.value });
  list.push({ key: 'delivery', label: '배달', available: !!store.deliveryUrl.value, note: store.deliveryUrl.value ? '외부 배달 앱에서 주문' : '배달 운영 중 · 채널 링크 확인 중', url: store.deliveryUrl.value });
  return list;
}

export function ChannelChip({ s, item }: { s: AppState; item: MenuItem }) {
  const online = orderChannels(s, item).some((c) => (c.key === 'order' || c.key === 'delivery') && c.available);
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-sage-600">
      <StoreIcon className="h-3.5 w-3.5" />
      {online ? '매장·배달 가능' : '매장 구매'}
    </span>
  );
}

/* ── 메뉴 카드 ─────────────────────────────────────── */
function SaveButton({ item, saved, onToggleSave, className }: { item: MenuItem; saved?: boolean; onToggleSave: () => void; className?: string }) {
  return (
    <button
      onClick={onToggleSave}
      aria-pressed={saved}
      aria-label={saved ? `${item.name} 저장 해제` : `${item.name} 저장`}
      className={cx('grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-[0_2px_8px_rgba(0,0,0,.12)] transition active:scale-90', saved ? 'text-coral-500' : 'text-ink-2 hover:text-coral-500', className)}
    >
      <Heart className="h-[19px] w-[19px]" fill={saved ? 'currentColor' : 'none'} strokeWidth={2.2} />
    </button>
  );
}

export function MenuCard({ item, saved, onToggleSave, layout = 'rail', s, rank }: { item: MenuItem; saved?: boolean; onToggleSave?: () => void; layout?: 'rail' | 'grid'; s?: AppState; rank?: number }) {
  return (
    <div className={cx('group relative', layout === 'rail' ? 'w-[168px] shrink-0 snap-start md:w-[214px]' : 'w-full min-w-0')}>
      <Link href={`/menu/${item.id}`} className="block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
        <div className="zoom-img relative overflow-hidden rounded-[20px] bg-canvas">
          <AssetImage slots={menuSlots(item)} dataUrl={item.photoDataUrl} fallback={item.art} alt={`${item.name} 사진`} className={layout === 'rail' ? 'aspect-[4/5] w-full' : 'aspect-square w-full'} sampleBadge sizes={layout === 'rail' ? '(min-width: 768px) 214px, 168px' : '(min-width: 1024px) 25vw, 50vw'} />
          <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
            {rank != null && <span className="rounded-lg bg-ink px-2 py-1 text-[12px] font-extrabold text-white">{rank}</span>}
            {item.isSignature && <span className="rounded-lg bg-coral-500 px-2 py-1 text-[12px] font-bold text-white">대표</span>}
          </div>
        </div>
        <div className="px-0.5 pt-2.5">
          <p className="clamp-1 text-[16px] font-bold leading-snug text-ink">{item.name}</p>
          <p className="clamp-1 mt-0.5 text-[13.5px] text-ink-3">{item.summary}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <PriceText item={item} />
          </div>
          <div className="mt-1 flex items-center gap-2">
            {s && <ChannelChip s={s} item={item} />}
            {item.isDemo && <span className="text-[12px] font-semibold text-amber-700">예시 메뉴</span>}
          </div>
        </div>
      </Link>
      {onToggleSave && <SaveButton item={item} saved={saved} onToggleSave={onToggleSave} className="absolute right-2 top-2" />}
    </div>
  );
}

/** 가로형 목록 행 (추천·저장·검색 결과) */
export function MenuRow({ item, right, sub }: { item: MenuItem; right?: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-white p-2.5 pr-3 ring-1 ring-line transition hover:ring-brand-200">
      <Link href={`/menu/${item.id}`} className="zoom-img block h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl">
        <AssetImage slots={menuSlots(item)} dataUrl={item.photoDataUrl} fallback={item.art} alt={`${item.name} 사진`} className="h-full w-full" sizes="76px" />
      </Link>
      <Link href={`/menu/${item.id}`} className="min-w-0 flex-1">
        <p className="clamp-1 text-[15.5px] font-bold text-ink">{item.name}</p>
        <p className="clamp-1 text-[13px] text-ink-3">{sub ?? item.summary}</p>
        <PriceText item={item} className="mt-0.5" />
      </Link>
      {right}
    </div>
  );
}

/** 대표 메뉴 강조 카드 */
export function SignatureCard({ item, s, saved, onToggleSave }: { item: MenuItem; s: AppState; saved?: boolean; onToggleSave?: () => void }) {
  const store = s.stores.find((x) => x.id === item.storeId)!;
  return (
    <div className="relative overflow-hidden rounded-[28px] bg-ivory-100 md:grid md:grid-cols-[1.15fr_1fr]">
      <Link href={`/menu/${item.id}`} className="zoom-img relative block">
        <AssetImage slots={menuSlots(item)} dataUrl={item.photoDataUrl} fallback={item.art} alt={`${item.name} 사진`} className="aspect-[16/10] w-full md:aspect-auto md:h-full md:min-h-[300px]" sampleBadge badgePosition="bl" sizes="(min-width: 768px) 55vw, 100vw" />
      </Link>
      {onToggleSave && <SaveButton item={item} saved={saved} onToggleSave={onToggleSave} className="absolute right-3 top-3 md:left-3 md:right-auto" />}
      <div className="flex flex-col justify-center p-5 md:p-8">
        <p className="text-[13px] font-bold text-coral-600">{store.name} 대표 메뉴</p>
        <h3 className="mt-1 text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-ink md:text-[30px]">{item.name}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{item.summary}</p>
        <div className="mt-3 flex items-center gap-2">
          <PriceText item={item} size="lg" />
          {item.priceEvidence === 'USER_PROVIDED' && <span className="text-[12px] text-ink-3">공개 메뉴 정보 기준</span>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/menu/${item.id}`} className="press inline-flex h-12 items-center gap-1.5 rounded-2xl bg-ink px-5 text-[15px] font-bold text-white transition hover:bg-ink-2">
            메뉴 자세히 보기
          </Link>
          <span className="inline-flex h-12 items-center gap-1.5 rounded-2xl bg-white px-4 text-[14px] font-semibold text-ink-2">
            <StoreIcon className="h-4 w-4 text-sage-600" /> 매장에서 바로 구매
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── 고양이 카드 (Netflix식 세로 카드, 밝은 톤) ──────── */
export function CatCoverCard({ cat, photo, size = 'md' }: { cat: CafeCat; photo?: CatPhoto; size?: 'md' | 'lg' }) {
  return (
    <Link
      href={`/dasek/cats/${cat.id}`}
      className={cx('group block shrink-0 snap-start rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400', size === 'lg' ? 'w-[172px] md:w-[228px]' : 'w-[148px] md:w-[188px]')}
      aria-label={`${cat.name} 프로필 보기`}
    >
      <div className="zoom-img relative overflow-hidden rounded-[22px] bg-canvas shadow-[0_6px_18px_-8px_rgba(16,40,52,.35)]">
        <AssetImage slot={photo?.slot} dataUrl={photo?.dataUrl} fallback={photo?.art ?? cat.coverArt} alt={photo?.alt ?? cat.name} className="aspect-[3/4] w-full" sizes={size === 'lg' ? '(min-width: 768px) 228px, 172px' : '(min-width: 768px) 188px, 148px'} position="center 35%" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3.5 pt-14">
          <p className="text-[18px] font-extrabold leading-tight text-white">{cat.name}</p>
          <p className="clamp-1 mt-0.5 text-[13px] font-medium text-white/90">{cat.personality.slice(0, 2).join(' · ') || cat.tagline}</p>
        </div>
        {cat.isPlaceholder && <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-ink-2">예시 프로필</span>}
      </div>
    </Link>
  );
}

export function Rail({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  return (
    <div role="region" aria-label={label} className={cx('-mx-4 flex snap-x-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 no-scrollbar md:-mx-5 md:gap-4 md:scroll-px-5 md:px-5', className)}>
      {children}
    </div>
  );
}

/* ── 멤버십 ─────────────────────────────────────────── */
export function StampCard({ count, required, compact }: { count: number; required: number; compact?: boolean }) {
  const inCycle = count % required;
  const left = required - inCycle;
  return (
    <div className={cx('rounded-[24px] bg-brand-700 text-white', compact ? 'p-4' : 'p-5')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white/80">다색컴패니언 스탬프</p>
          <p className="mt-0.5 text-[24px] font-extrabold tabular leading-tight">
            {inCycle} <span className="text-[16px] font-bold text-white/70">/ {required}</span>
          </p>
          <p className="text-[13px] font-medium text-white/85">보상까지 {left}개 남았어요</p>
        </div>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold">누적 {count}개</span>
      </div>
      <div className={cx('mt-3 grid grid-cols-5 gap-2', required > 10 && 'grid-cols-6')} aria-label={`스탬프 ${inCycle}개 / ${required}개`}>
        {Array.from({ length: required }).map((_, i) => (
          <span key={i} className={cx('grid aspect-square place-items-center rounded-full text-[12px] font-bold transition', i < inCycle ? 'bg-white text-brand-700' : 'border border-dashed border-white/40 text-white/50')}>
            {i < inCycle ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
          </span>
        ))}
      </div>
      {!compact && <p className="mt-3 text-[13px] leading-relaxed text-white/85">직원이 방문·구매를 확인하면 매장별 하루 1개 적립돼요. 링크 클릭·자가신고만으로는 적립되지 않아요.</p>}
    </div>
  );
}

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

export function CouponCard({ c, onOpen }: { c: CouponIssue; onOpen?: () => void }) {
  const st = effectiveCouponStatus(c);
  const usable = st === 'ISSUED';
  const label = { ISSUED: '사용 가능', REDEEMED: '사용 완료', EXPIRED: '기간 만료', CANCELLED: '취소됨' }[st];
  const d = daysLeft(c.expiresAt);
  return (
    <button onClick={onOpen} disabled={!onOpen} className={cx('press flex w-full items-stretch overflow-hidden rounded-2xl text-left ring-1 transition', usable ? 'bg-white ring-line hover:ring-brand-200' : 'bg-canvas ring-line/60')}>
      <div className={cx('grid w-16 shrink-0 place-items-center', usable ? 'bg-promo-100 text-promo-600' : 'bg-line/60 text-ink-4')}>
        <Ticket className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1 border-l border-dashed border-line px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cx('text-[12.5px] font-bold', usable ? 'text-brand-700' : 'text-ink-3')}>{label}</span>
          {usable && d <= 7 && <span className="rounded-md bg-coral-50 px-1.5 py-0.5 text-[12px] font-bold text-coral-600">D-{Math.max(0, d)}</span>}
          {c.isDemo && <StatusBadge status="DEMO" label="예시 혜택" />}
        </div>
        <p className={cx('mt-0.5 text-[16px] font-bold leading-snug', usable ? 'text-ink' : 'text-ink-3')}>{c.benefit}</p>
        <p className="mt-0.5 text-[13px] text-ink-3">
          {c.title} · {usable ? `${fmtDate(c.expiresAt)}까지` : st === 'REDEEMED' ? `${fmtDate(c.redeemedAt)} 사용` : fmtDate(c.expiresAt)}
        </p>
        {usable && <p className="mt-0.5 text-[12px] text-ink-3">매장 계산 시 직원 확인 · 1회 사용</p>}
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
          <p className="text-[14px] text-ink-3">계산할 때 직원에게 이 화면을 보여주세요</p>
          <div className="mx-auto mt-3 rounded-2xl bg-canvas px-4 py-5">
            <p className="text-[13px] font-semibold text-ink-3">쿠폰 코드</p>
            <p className="mt-1 font-mono text-[28px] font-extrabold tracking-[0.12em] text-ink">{c.code}</p>
          </div>
          <dl className="mt-4 space-y-2 text-left text-[14px]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">유효기간</dt>
              <dd className="font-semibold text-ink">{fmtDate(c.expiresAt)}까지 (D-{Math.max(0, daysLeft(c.expiresAt))})</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">사용 조건</dt>
              <dd className="text-right font-semibold text-ink">매장 직원 확인 후 1회 사용</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">다른 혜택과 함께</dt>
              <dd className="text-right font-semibold text-ink">매장 정책 확인 중</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-3">발급 사유</dt>
              <dd className="text-right font-semibold text-ink">{c.source}</dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-left text-[13px] leading-relaxed text-amber-900">혜택 내용은 운영자 확정 전 예시입니다. 사용 처리는 매장 직원이 운영 화면에서 진행합니다.</p>
        </div>
      )}
    </Sheet>
  );
}

export function LoginGate({ title = '로그인이 필요해요', body = '가입하면 웰컴 쿠폰과 스탬프를 받을 수 있어요.', next }: { title?: string; body?: string; next?: string }) {
  const q = next ? `?next=${encodeURIComponent(next)}` : '';
  return (
    <div className="rounded-[28px] bg-brand-50 p-6 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-card">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="mt-3 text-[18px] font-extrabold text-ink">{title}</p>
      <p className="mt-1 text-[14px] text-ink-2">{body}</p>
      <div className="mt-5 flex justify-center gap-2">
        <Link href={`/signup${q}`} className="inline-flex h-12 items-center rounded-2xl bg-brand-600 px-5 text-[15px] font-bold text-white shadow-sm transition hover:bg-brand-700">
          가입하고 혜택 받기
        </Link>
        <Link href={`/login${q}`} className="inline-flex h-12 items-center rounded-2xl bg-white px-5 text-[15px] font-bold text-ink ring-1 ring-line transition hover:bg-canvas">
          로그인
        </Link>
      </div>
    </div>
  );
}

/* ── 매장 방문 정보 ─────────────────────────────────── */
export function StoreInfoCard({ store, s, compact }: { store: Store; s: AppState; compact?: boolean }) {
  const toast = useToast();
  const me = s.session.customerId;
  const rows: { icon: React.ReactNode; label: string; value: string | null; ev: Store['address']['evidence'] }[] = [
    { icon: <MapPin className="h-[18px] w-[18px]" />, label: '위치', value: store.address.value, ev: store.address.evidence },
    { icon: <StoreIcon className="h-[18px] w-[18px]" />, label: '찾아오는 길', value: store.directions.value, ev: store.directions.evidence },
    { icon: <Clock className="h-[18px] w-[18px]" />, label: '운영시간', value: store.hours.value, ev: store.hours.evidence },
    { icon: <Phone className="h-[18px] w-[18px]" />, label: '전화', value: store.phone.value, ev: store.phone.evidence },
    { icon: <Truck className="h-[18px] w-[18px]" />, label: '배달·온라인 주문', value: store.deliveryUrl.value ?? store.orderUrl.value ?? null, ev: store.deliveryUrl.value ? store.deliveryUrl.evidence : store.orderUrl.evidence },
  ];
  return (
    <div className="rounded-[24px] bg-white p-5 ring-1 ring-line">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[18px] font-extrabold text-ink">{store.name} 방문 안내</p>
        <StatusBadge status="DEMO" label="정보 확인 중" />
      </div>
      <dl className="mt-3 divide-y divide-line/70">
        {rows.slice(0, compact ? 3 : rows.length).map((r) => (
          <div key={r.label} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 text-brand-600">{r.icon}</span>
            <div className="min-w-0 flex-1">
              <dt className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-3">
                {r.label} <EvidenceBadge ev={r.ev} />
              </dt>
              <dd className="mt-0.5 text-[15px] font-semibold leading-snug text-ink">{r.value ?? (r.label === '배달·온라인 주문' ? '배달 운영 중 · 채널 링크 확인 중' : '운영자 확인 후 안내 예정')}</dd>
            </div>
            {r.label === '위치' && r.value && (
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(r.value!.replace(/\s*\(.*\)$/, '')).then(
                    () => toast('주소를 복사했어요.'),
                    () => toast('복사하지 못했어요.', 'error'),
                  )
                }
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-3 transition hover:bg-canvas"
                aria-label="주소 복사"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
            {r.label === '전화' && r.value && (
              <a href={`tel:${r.value.replace(/[^0-9]/g, '')}`} className="shrink-0 rounded-full bg-canvas px-3.5 py-2 text-[13px] font-bold text-ink-2 transition hover:bg-line">
                전화
              </a>
            )}
          </div>
        ))}
      </dl>
      {!compact && store.amenities.value && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {store.amenities.value.map((a) => (
            <span key={a} className="rounded-full bg-canvas px-3 py-1.5 text-[13px] font-medium text-ink-2">
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
            className="press inline-flex h-12 items-center justify-center gap-1 rounded-2xl bg-brand-600 text-[15px] font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            네이버 예약 <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span className="inline-flex h-12 items-center justify-center rounded-2xl bg-canvas text-[14px] font-semibold text-ink-3">예약 채널 확인 중</span>
        )}
        <Link href={`/checkin?store=${store.id}`} className="press inline-flex h-12 items-center justify-center rounded-2xl bg-brand-50 text-[15px] font-bold text-brand-700 transition hover:bg-brand-100">
          방문 체크인
        </Link>
      </div>
      {store.reservationUrl.value && <p className="mt-2 text-[12px] text-ink-3">예약은 네이버에서 확정돼요. 이 앱은 예약을 확정하지 않습니다.</p>}
    </div>
  );
}

export function WhySheet({ rec, onClose }: { rec: Recommendation | null; onClose: () => void }) {
  return (
    <Sheet open={!!rec} onClose={onClose} title="왜 추천했나요?" description="규칙 기반 추천 — AI 모델을 사용하지 않았어요" size="sm">
      {rec && (
        <div className="space-y-4 text-[15px]">
          <div>
            <p className="text-[13px] font-bold text-ink-3">사용한 정보</p>
            <p className="mt-1 text-ink-2">{rec.used.join(' · ')}</p>
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink-3">추천 이유</p>
            <ul className="mt-1.5 space-y-1.5">
              {rec.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-[14px] text-amber-900">
            <p className="font-bold">주의</p>
            <p className="mt-0.5">{rec.caution}</p>
          </div>
          <div>
            <p className="text-[13px] font-bold text-ink-3">다음 행동</p>
            <p className="mt-1 text-ink-2">{rec.next}</p>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ── 구매 확인 요청 (자가신고 → 직원 확인 대기) ───────── */
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
      <p className="text-[13px] font-bold text-ink-3">구매한 매장</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {s.stores.map((st) => (
          <button
            key={st.id}
            onClick={() => {
              setStoreId(st.id);
              setItems([]);
            }}
            aria-pressed={storeId === st.id}
            className={cx('h-12 rounded-xl text-[15px] font-bold ring-1 transition', storeId === st.id ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-2 ring-line hover:bg-canvas')}
          >
            {st.name}
          </button>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-bold text-ink-3">구매한 메뉴 (선택)</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {list.map((m) => {
          const on = items.includes(m.id);
          return (
            <button key={m.id} aria-pressed={on} onClick={() => setItems(on ? items.filter((x) => x !== m.id) : [...items, m.id])} className={cx('min-h-10 rounded-full px-3.5 py-2 text-[14px] font-semibold ring-1 transition', on ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-white text-ink-2 ring-line')}>
              {on && '✓ '}
              {m.name}
            </button>
          );
        })}
      </div>
      <label className="mt-4 block">
        <span className="text-[13px] font-bold text-ink-3">메모 (선택)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} placeholder="예: 포장 구매, 오후 3시쯤" className="mt-2 h-12 w-full rounded-xl border border-line px-3.5 text-[15px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
      </label>
      <p className="mt-3 flex gap-1.5 text-[13px] text-ink-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        매장에서 회원코드를 보여주면 직원이 바로 확인할 수도 있어요.
      </p>
    </Sheet>
  );
}

export function ChannelList({ s, item, me }: { s: AppState; item: MenuItem; me: string | null }) {
  const ch = orderChannels(s, item);
  return (
    <ul className="space-y-2" data-testid="order-channels">
      {ch.map((c) => (
        <li key={c.key} className={cx('flex items-center gap-3 rounded-2xl p-3.5', c.available ? 'bg-sage-50' : 'bg-canvas')}>
          <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', c.available ? 'bg-white text-sage-600' : 'bg-white text-ink-4')}>
            {c.key === 'delivery' ? <Truck className="h-5 w-5" /> : c.key === 'order' ? <ShoppingBag className="h-5 w-5" /> : <StoreIcon className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cx('text-[15px] font-bold', c.available ? 'text-ink' : 'text-ink-3')}>{c.label}</p>
            <p className="clamp-1 text-[13px] text-ink-3">{c.note}</p>
          </div>
          {c.url ? (
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => act((d, ctx) => D.recordLinkClick(d, ctx, me, 'order', item.storeId, `${c.label} 링크 열기`))}
              className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold text-ink ring-1 ring-line"
            >
              열기
            </a>
          ) : (
            <span className={cx('shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold', c.available ? 'bg-white text-sage-600' : 'bg-white text-ink-3')}>{c.available ? '가능' : '확인 중'}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
