'use client';
/**
 * 이미지 해석 순서 (위가 우선)
 *  1) dataUrl          운영자가 AX에서 올린 사진 (DEMO: 브라우저 저장)
 *  2) 실제 사진 슬롯     public/assets/<slot>.jpg  — 권리 확인된 매장 사진 (`npm run assets:scan`)
 *  3) 샘플 사진          public/assets/samples/<slot>.jpg — CC0/공개 도메인 스톡 사진, '샘플 사진' 표시
 *  4) 자체 SVG 일러스트   최후 대체 — '샘플 일러스트' 표시
 * 실제 매장·고양이 사진으로 오인되지 않도록 2) 외에는 항상 표시를 붙일 수 있다.
 */
import Image from 'next/image';
import { useState } from 'react';
import manifest from '@/lib/assets.manifest.json';
import samples from '@/lib/samples.manifest.json';
import type { ArtSpec } from '@/lib/types';
import { cx } from '@/lib/util';
import { Art } from './Art';

const real = manifest as Record<string, string>;
const sample = samples as unknown as Record<string, { file: string; w: number; h: number; source: string; license: string; landing: string; creator: string | null; title: string | null }>;

export type ImageKind = 'upload' | 'real' | 'sample' | 'illustration';

export function resolveImage(slots: (string | null | undefined)[], dataUrl?: string | null): { src: string | null; kind: ImageKind } {
  if (dataUrl) return { src: dataUrl, kind: 'upload' };
  for (const s of slots) if (s && real[s]) return { src: real[s], kind: 'real' };
  for (const s of slots) if (s && sample[s]) return { src: sample[s].file, kind: 'sample' };
  return { src: null, kind: 'illustration' };
}

export function hasAsset(slot: string | null | undefined) {
  return !!(slot && real[slot]);
}

export const SAMPLE_CREDITS = sample;

export function AssetImage({
  slot,
  slots,
  dataUrl,
  fallback,
  alt,
  className,
  sampleBadge = false,
  badgePosition = 'bl',
  priority = false,
  sizes = '(min-width: 1024px) 33vw, 50vw',
  position = 'center',
  imgClassName,
}: {
  slot?: string | null;
  slots?: (string | null | undefined)[];
  dataUrl?: string | null;
  fallback: ArtSpec;
  alt: string;
  className?: string;
  sampleBadge?: boolean;
  badgePosition?: 'bl' | 'tr' | 'br' | 'tl';
  priority?: boolean;
  sizes?: string;
  position?: string;
  imgClassName?: string;
}) {
  const { src, kind } = resolveImage(slots ?? [slot], dataUrl);
  const [failed, setFailed] = useState(false);
  const showArt = !src || failed;
  const label = showArt ? '샘플 일러스트' : kind === 'sample' ? '샘플 사진' : null;
  return (
    <div className={cx('relative overflow-hidden bg-[#EEF2F4]', className)}>
      {showArt ? (
        <Art spec={fallback} title={alt} className="h-full w-full" />
      ) : kind === 'upload' ? (
        // 업로드 dataURL은 최적화 대상이 아님
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src!} alt={alt} loading={priority ? 'eager' : 'lazy'} className={cx('absolute inset-0 h-full w-full object-cover', imgClassName)} style={{ objectPosition: position }} />
      ) : (
        <Image
          src={src!}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cx('object-cover', imgClassName)}
          style={{ objectPosition: position }}
        />
      )}
      {sampleBadge && label && (
        <span
          data-on-media
          data-badge
          className={cx(
            'pointer-events-none absolute z-[1] rounded-full bg-[#1F2B32]/75 px-2 py-0.5 text-[0.75rem] font-semibold text-white',
            badgePosition === 'bl' && 'bottom-2 left-2',
            badgePosition === 'tr' && 'right-2 top-2',
            badgePosition === 'br' && 'bottom-2 right-2',
            badgePosition === 'tl' && 'left-2 top-2',
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/** 메뉴 사진 슬롯: 실제 사진 슬롯(있으면) → 메뉴 ID 기반 샘플 슬롯 */
export const menuSlots = (m: { id: string; photoSlot: string | null }) => [m.photoSlot, `menu_${m.id}`];
