'use client';
import { ChevronLeft, ChevronRight, HandHeart, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { CatGallery } from '@/components/customer/CatGallery';
import { CatCoverCard, Rail, SectionHeader } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Empty, PageSkeleton } from '@/components/ui';
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
  const photos = s.catPhotos.filter((p) => p.catId === cat.id && p.status === 'PUBLISHED').sort((a, b) => a.sortOrder - b.sortOrder);
  const prev = cats[i - 1];
  const next = cats[i + 1];
  const others = cats.filter((c) => c.id !== cat.id);

  return (
    <div>
      <BackHeader title={cat.name} fallback="/dasek" />
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[1.15fr_1fr] md:gap-10 md:px-5 md:pt-8">
        <div>
          <CatGallery photos={photos} name={cat.name} />
        </div>
        <div className="px-4 pt-5 md:px-0 md:pt-2">
          <div className="flex items-center gap-2">
            <Link href="/dasek#cats" className="text-[12.5px] font-semibold text-brand-700 hover:underline">
              다색냥 친구들
            </Link>
            {cat.isPlaceholder && <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-bold text-ink-3">예시 프로필</span>}
          </div>
          <h1 className="mt-1 text-[30px] font-extrabold tracking-tight text-ink md:text-[38px]">{cat.name}</h1>
          <p className="mt-1 text-[15.5px] text-ink-2">{cat.tagline}</p>

          <div className="mt-5 space-y-4">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-3">
                <Sparkles className="h-4 w-4" /> 성격
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cat.personality.length ? cat.personality.map((p) => <span key={p} className="rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-semibold text-brand-700">{p}</span>) : <span className="text-[13px] text-ink-3">소개 준비 중</span>}
              </div>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink-3">
                <Heart className="h-4 w-4" /> 좋아하는 것
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cat.likes.length ? cat.likes.map((p) => <span key={p} className="rounded-full bg-promo-50 px-3 py-1.5 text-[13px] font-semibold text-promo-600">{p}</span>) : <span className="text-[13px] text-ink-3">소개 준비 중</span>}
              </div>
            </div>
            <div className="rounded-2xl bg-sage-50 p-4">
              <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-sage-600">
                <HandHeart className="h-4 w-4" /> {cat.name}와(과) 친해지는 법
              </p>
              <ul className="mt-2 space-y-1.5">
                {cat.interactionTips.map((t) => (
                  <li key={t} className="flex gap-2 text-[13.5px] text-ink-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {prev ? (
              <Link href={`/dasek/cats/${prev.id}`} className="flex items-center gap-1 rounded-2xl bg-canvas px-3 py-3 text-[13.5px] font-semibold text-ink-2 transition hover:bg-line">
                <ChevronLeft className="h-4 w-4" /> {prev.name}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/dasek/cats/${next.id}`} data-testid="next-cat" className="flex items-center justify-end gap-1 rounded-2xl bg-canvas px-3 py-3 text-[13.5px] font-semibold text-ink-2 transition hover:bg-line">
                {next.name} <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <Link href="/checkin?store=store_dasek" className="mt-3 flex h-12 items-center justify-center rounded-2xl bg-brand-600 text-[15px] font-bold text-white shadow-sm transition hover:bg-brand-700">
            {cat.name} 만나러 가기 · 방문 체크인
          </Link>
        </div>
      </div>
      <section className="mx-auto mt-10 max-w-6xl px-4 md:px-5">
        <SectionHeader title="다른 친구들" />
        <Rail label="다른 고양이">
          {others.map((c) => (
            <CatCoverCard key={c.id} cat={c} photo={s.catPhotos.find((p) => p.catId === c.id && p.status === 'PUBLISHED' && p.sortOrder === 0)} />
          ))}
        </Rail>
      </section>
    </div>
  );
}
