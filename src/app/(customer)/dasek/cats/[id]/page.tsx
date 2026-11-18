'use client';
import { ArrowRight, ChevronLeft, HandHeart, Heart, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { CatGallery } from '@/components/customer/CatGallery';
import { CatCoverCard, Rail, SectionHeader } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Empty, PageSkeleton } from '@/components/ui';
import { cx } from '@/lib/util';
import * as D from '@/lib/domain';
import { act } from '@/lib/store';

export default function CatProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { s } = useCustomer();
  const tracked = useRef(false);
  useEffect(() => {
    if (!s || tracked.current || !s.cats.some((c) => c.id === id && c.published)) return;
    tracked.current = true;
    act((d, c) => D.recordCatView(d, c, d.session.customerId, id));
  }, [s, id]);
  if (!s) return <PageSkeleton />;
  const cats = s.cats.filter((c) => c.published).sort((a, b) => a.sortOrder - b.sortOrder);
  const i = cats.findIndex((c) => c.id === id);
  const cat = cats[i];
  if (!cat)
    return (
      <div className="mx-auto max-w-lg p-6">
        <Empty title="프로필을 찾을 수 없어요" body="비공개로 바뀌었거나 없는 고양이예요." action={<Link href="/dasek" className="font-semibold text-brand-700">다색냥으로</Link>} />
      </div>
    );
  const photos = D.publishedCatPhotos(s, cat.id);
  const prev = cats[i - 1];
  const next = cats[i + 1] ?? cats[0];
  const nextPhoto = next && next.id !== cat.id ? D.publishedCatPhotos(s, next.id)[0] : undefined;
  const others = cats.filter((c) => c.id !== cat.id);

  return (
    <div>
      <BackHeader title={cat.name} fallback="/dasek" />
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[1.15fr_1fr] md:gap-12 md:px-5 md:pt-8">
        <div className="min-w-0">
          <CatGallery photos={photos} name={cat.name} />
        </div>
        <div className="min-w-0 px-4 pt-5 md:px-0 md:pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dasek#cats" className="-ml-1 inline-flex min-h-11 items-center px-1 text-[0.9375rem] font-bold text-brand-700 hover:underline">
              다색냥 친구들
            </Link>
            {cat.isPlaceholder && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.8125rem] font-bold text-amber-800">예시 프로필 · 샘플 사진</span>}
          </div>
          <h1 className="mt-1.5 text-[2rem] font-extrabold leading-tight tracking-[-0.025em] text-ink md:text-[2.625rem]">{cat.name}</h1>
          {(cat.breed || cat.sex) && (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[1rem] font-semibold text-ink-2" data-testid="cat-facts">
              {cat.breed && <span>{cat.breed}</span>}
              {cat.sex && (
                <span className={cx('rounded-full px-2.5 py-0.5 text-[0.875rem] font-bold ring-1 ring-inset', cat.sex === 'F' ? 'bg-rose-50 text-rose-800 ring-rose-200' : 'bg-sky-50 text-sky-800 ring-sky-200')}>
                  {cat.sex === 'F' ? '♀ 여아' : '♂ 남아'}
                </span>
              )}
            </p>
          )}
          {!cat.breed && <p className="mt-1 text-[1.0625rem] font-medium leading-snug text-ink-2">{cat.tagline}</p>}

          <div className="mt-6 grid gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[0.875rem] font-bold text-ink-3">
                <Sparkles className="h-4 w-4" /> 성격
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {cat.personality.length ? cat.personality.map((p) => <span key={p} className={cx('rounded-full px-3.5 py-2 text-[0.875rem] font-semibold', /입질/.test(p) ? 'bg-red-50 text-red-800 ring-1 ring-inset ring-red-200' : 'bg-brand-50 text-brand-800')}>{cat.breed ? `#${p}` : p}</span>) : <span className="text-[0.875rem] text-ink-3">소개 준비 중</span>}
              </div>
            </div>
            {cat.likes.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[0.875rem] font-bold text-ink-3">
                  <Heart className="h-4 w-4" /> 좋아하는 것
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cat.likes.map((p) => (
                    <span key={p} className="rounded-full bg-promo-50 px-3.5 py-2 text-[0.875rem] font-semibold text-promo-600">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-[20px] bg-sage-50 p-5">
              <p className="flex items-center gap-1.5 text-[0.9375rem] font-bold text-sage-600">
                <HandHeart className="h-5 w-5" /> {cat.name}와(과) 친해지는 법
              </p>
              <ul className="mt-2.5 space-y-2">
                {cat.interactionTips.map((t) => (
                  <li key={t} className="flex gap-2.5 text-[0.9375rem] leading-snug text-ink-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            {cat.source && !cat.isPlaceholder && <p className="text-[0.875rem] text-ink-3">정보 출처: {cat.source} · 건강 상태나 치유 효과에 대한 정보는 제공하지 않아요.</p>}
            {cat.isPlaceholder && (
              <p className="flex gap-2 rounded-2xl bg-canvas px-4 py-3 text-[0.8125rem] leading-relaxed text-ink-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />이 프로필과 사진은 실제 다색냥 고양이가 아니라 시연용 예시예요. 건강 상태나 치유 효과에 대한 정보는 제공하지 않아요.
              </p>
            )}
          </div>

          <Link href="/checkin?store=store_dasek" className="press mt-6 flex h-[52px] items-center justify-center rounded-2xl bg-brand-600 text-[1rem] font-bold text-white shadow-sm transition hover:bg-brand-700">
            {cat.name} 만나러 가기 · 방문 체크인
          </Link>

          {next && next.id !== cat.id && (
            <Link href={`/dasek/cats/${next.id}`} data-testid="next-cat" className="group mt-3 flex items-center gap-3 rounded-[20px] bg-white p-2.5 pr-4 ring-1 ring-line transition hover:ring-brand-200">
              <AssetImage slot={nextPhoto?.slot} dataUrl={nextPhoto?.dataUrl} fallback={nextPhoto?.art ?? next.coverArt} alt="" className="h-16 w-16 shrink-0 rounded-2xl" sizes="64px" position="center 35%" />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8438rem] font-semibold text-ink-3">다음 친구</span>
                <span className="block text-[1.0625rem] font-extrabold text-ink">{next.name}</span>
                <span className="clamp-1 block text-[0.8125rem] text-ink-3">{next.tagline}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-ink-3 transition group-hover:translate-x-0.5" />
            </Link>
          )}
          {prev && (
            <Link href={`/dasek/cats/${prev.id}`} className="mt-2 inline-flex min-h-11 items-center gap-1 px-1 text-[0.9375rem] font-semibold text-ink-2 hover:text-ink">
              <ChevronLeft className="h-4 w-4" /> 이전 친구 {prev.name}
            </Link>
          )}
        </div>
      </div>
      <section className="mx-auto mt-10 max-w-6xl px-4 md:px-5">
        <SectionHeader title="다른 친구들" href="/dasek#cats" />
        <Rail label="다른 고양이">
          {others.map((c) => (
            <CatCoverCard key={c.id} cat={c} photo={D.publishedCatPhotos(s, c.id)[0]} />
          ))}
        </Rail>
      </section>
    </div>
  );
}
