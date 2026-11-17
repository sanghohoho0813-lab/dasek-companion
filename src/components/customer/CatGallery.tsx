'use client';
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AssetImage } from '@/components/art/AssetImage';
import type { CatPhoto } from '@/lib/types';
import { cx } from '@/lib/util';

/**
 * 고양이별 사진 슬라이드 — 스와이프(스크롤 스냅)·화살표·키보드(←/→)·점 인디케이터·전체화면 보기.
 * 사진 미등록 시 빈 상태를 보여준다.
 */
export function CatGallery({ photos, name }: { photos: CatPhoto[]; name: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [full, setFull] = useState(false);

  const go = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(photos.length - 1, i));
      const el = track.current;
      if (el) el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
      setIdx(n);
    },
    [photos.length],
  );

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);

  if (!photos.length)
    return (
      <div className="grid aspect-[4/5] w-full place-items-center bg-canvas md:aspect-[4/3] md:rounded-[28px]">
        <div className="text-center text-ink-3">
          <ImageOff className="mx-auto h-8 w-8" />
          <p className="mt-2 text-[14px] font-semibold">아직 공개된 사진이 없어요</p>
          <p className="text-[12.5px]">매장에서 사진을 준비하고 있어요</p>
        </div>
      </div>
    );

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${name} 사진`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(idx + 1);
        if (e.key === 'ArrowLeft') go(idx - 1);
      }}
    >
      <div ref={track} className="flex snap-x-mandatory overflow-x-auto no-scrollbar md:rounded-[28px]" data-testid="cat-gallery">
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => setFull(true)} className="w-full shrink-0 snap-start" aria-label={`${i + 1}번째 사진 크게 보기: ${p.caption}`}>
            <AssetImage slot={p.slot} dataUrl={p.dataUrl} fallback={p.art ?? { kind: 'cat', coat: 'gray', pattern: 'solid', eyes: 'green', pose: 'sit', bg: 0 }} alt={p.alt} className="aspect-[4/5] w-full md:aspect-[4/3]" sampleBadge={!p.dataUrl} badgePosition="tr" priority={i === 0} />
          </button>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/45 to-transparent p-4 pt-12 md:rounded-b-[28px]">
        <p className="clamp-1 text-[13.5px] font-semibold text-white drop-shadow">{photos[idx]?.caption}</p>
        <span className="rounded-full bg-black/40 px-2.5 py-1 text-[12px] font-bold text-white tabular">
          {idx + 1} / {photos.length}
        </span>
      </div>
      {photos.length > 1 && (
        <>
          <button onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="이전 사진" className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card transition hover:bg-white disabled:opacity-0 md:grid">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => go(idx + 1)} disabled={idx === photos.length - 1} aria-label="다음 사진" data-testid="gallery-next" className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-card transition hover:bg-white disabled:opacity-0 md:grid">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
      <button onClick={() => setFull(true)} aria-label="전체화면" className="absolute right-3 top-3 hidden h-9 w-9 place-items-center rounded-full bg-white/85 text-ink-2 shadow-sm md:grid">
        <Maximize2 className="h-4 w-4" />
      </button>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
        {photos.map((p, i) => (
          <span key={p.id} className={cx('h-1.5 rounded-full transition-all duration-200', i === idx ? 'w-5 bg-brand-600' : 'w-1.5 bg-line')} />
        ))}
      </div>
      <div className="mt-3 hidden gap-2 px-4 md:flex md:px-0">
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => go(i)} aria-label={`${i + 1}번째 사진`} aria-current={i === idx} className={cx('h-16 w-16 overflow-hidden rounded-xl ring-2 transition', i === idx ? 'ring-brand-500' : 'ring-transparent opacity-70 hover:opacity-100')}>
            <AssetImage slot={p.slot} dataUrl={p.dataUrl} fallback={p.art ?? { kind: 'cat', coat: 'gray', pattern: 'solid', eyes: 'green', pose: 'sit', bg: 0 }} alt="" className="h-full w-full" />
          </button>
        ))}
      </div>
      {full && <Lightbox photos={photos} start={idx} onClose={(i) => { setFull(false); go(i); }} name={name} />}
    </div>
  );
}

function Lightbox({ photos, start, onClose, name }: { photos: CatPhoto[]; start: number; onClose: (i: number) => void; name: string }) {
  const [i, setI] = useState(start);
  const ref = useRef<HTMLDivElement>(null);
  const iRef = useRef(i);
  iRef.current = i;
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(iRef.current);
      if (e.key === 'ArrowRight') setI((x) => Math.min(photos.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.history.pushState({ ...(window.history.state ?? {}), __sheet: 'lightbox' }, '', window.location.href);
    let popped = false;
    const pop = () => {
      popped = true;
      onClose(iRef.current);
    };
    window.addEventListener('popstate', pop);
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', key);
      window.removeEventListener('popstate', pop);
      if (!popped && window.history.state?.__sheet === 'lightbox') window.history.back();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const p = photos[i];
  const touch = useRef<number | null>(null);
  return createPortal(
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${name} 사진 크게 보기`} className="fixed inset-0 z-[85] flex animate-fade-in flex-col bg-white outline-none" data-testid="cat-lightbox">
      <div className="flex h-14 items-center justify-between px-3">
        <span className="pl-2 text-[14px] font-bold text-ink tabular">
          {name} · {i + 1}/{photos.length}
        </span>
        <button onClick={() => onClose(i)} aria-label="닫기" className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-canvas">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 md:px-16"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (dx < -40) setI((x) => Math.min(photos.length - 1, x + 1));
          if (dx > 40) setI((x) => Math.max(0, x - 1));
          touch.current = null;
        }}
      >
        <AssetImage key={p.id} slot={p.slot} dataUrl={p.dataUrl} fallback={p.art ?? { kind: 'cat', coat: 'gray', pattern: 'solid', eyes: 'green', pose: 'sit', bg: 0 }} alt={p.alt} className="aspect-[4/3] max-h-full w-full max-w-4xl animate-scale-in rounded-3xl" sampleBadge={!p.dataUrl} />
        <button onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="이전 사진" className="absolute left-2 grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-card disabled:opacity-0 md:left-4">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => setI(Math.min(photos.length - 1, i + 1))} disabled={i === photos.length - 1} aria-label="다음 사진" className="absolute right-2 grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-card disabled:opacity-0 md:right-4">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <p className="px-5 pb-8 pt-4 text-center text-[14px] text-ink-2">{p.caption}</p>
    </div>,
    document.body,
  );
}
