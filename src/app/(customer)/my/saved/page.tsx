'use client';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { LoginGate, MenuCard } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Empty, PageSkeleton, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { act } from '@/lib/store';

export default function SavedPage() {
  const { s, me } = useCustomer();
  const run = useRun();
  if (!s) return <PageSkeleton />;
  if (!me) return <div className="mx-auto max-w-md p-5"><LoginGate next="/my/saved" /></div>;
  const items = s.favorites.filter((f) => f.userId === me.id).map((f) => s.menuItems.find((m) => m.id === f.menuItemId)).filter((m) => m && m.published);
  return (
    <div>
      <BackHeader title="저장한 메뉴" fallback="/my" />
      <div className="mx-auto max-w-4xl px-4 pb-10 pt-4 md:px-5 md:pt-10">
        <h1 className="hidden text-[1.5rem] font-extrabold text-ink md:block">저장한 메뉴</h1>
        <div className="mt-0 md:mt-4">
          {items.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {items.map((m) => m && <MenuCard key={m.id} item={m} layout="grid" saved onToggleSave={() => run(() => act((d, c) => D.toggleFavorite(d, c, me.id, m.id)), '저장을 해제했어요.')} />)}
            </div>
          ) : (
            <Empty icon={<Heart className="h-8 w-8" />} title="저장한 메뉴가 없어요" body="메뉴의 하트를 눌러 저장해 두면 여기서 모아 볼 수 있어요." action={<Link href="/realsicdan" className="font-semibold text-brand-700">메뉴 둘러보기</Link>} />
          )}
        </div>
      </div>
    </div>
  );
}
