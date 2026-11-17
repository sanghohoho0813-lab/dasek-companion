'use client';
import manifest from '@/lib/assets.manifest.json';
import type { ArtSpec } from '@/lib/types';
import { cx } from '@/lib/util';
import { Art } from './Art';

const files = manifest as Record<string, string>;

export function hasAsset(slot: string | null | undefined) {
  return !!(slot && files[slot]);
}

/**
 * 실제 사진(슬롯)이 있으면 사진을, 없으면 자체 일러스트를 보여준다.
 * 일러스트일 때는 `sampleBadge`로 샘플임을 표시한다(실제 사진처럼 속이지 않음).
 */
export function AssetImage({
  slot,
  dataUrl,
  fallback,
  alt,
  className,
  sampleBadge = false,
  badgePosition = 'bl',
  priority = false,
}: {
  slot?: string | null;
  dataUrl?: string | null;
  fallback: ArtSpec;
  alt: string;
  className?: string;
  sampleBadge?: boolean;
  badgePosition?: 'bl' | 'tr' | 'br';
  priority?: boolean;
}) {
  const src = dataUrl || (slot ? files[slot] : undefined);
  return (
    <div className={cx('relative overflow-hidden bg-canvas', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className="h-full w-full object-cover" />
      ) : (
        <Art spec={fallback} title={alt} className="h-full w-full" />
      )}
      {!src && sampleBadge && (
        <span
          className={cx(
            'pointer-events-none absolute rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold tracking-tight text-ink-3 backdrop-blur',
            badgePosition === 'bl' && 'bottom-2 left-2',
            badgePosition === 'tr' && 'right-2 top-2',
            badgePosition === 'br' && 'bottom-2 right-2',
          )}
        >
          샘플 일러스트
        </span>
      )}
    </div>
  );
}
