'use client';
import { Bell, Megaphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoginGate } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, Empty, PageSkeleton } from '@/components/ui';
import * as D from '@/lib/domain';
import { act } from '@/lib/store';
import { cx, relTime } from '@/lib/util';

export default function InboxPage() {
  const { s, me } = useCustomer();
  const router = useRouter();
  if (!s) return <PageSkeleton />;
  if (!me) return <div className="mx-auto max-w-md p-5"><LoginGate next="/my/inbox" /></div>;
  const list = s.notifications.filter((n) => n.userId === me.id);
  const unread = list.filter((n) => !n.readAt).length;
  return (
    <div>
      <BackHeader title="알림함" fallback="/my" right={unread ? <button onClick={() => act((d, c) => D.markAllRead(d, c, me.id))} className="px-2 text-[13px] font-semibold text-brand-700">모두 읽음</button> : undefined} />
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-4 md:px-5 md:pt-10">
        <div className="hidden items-center justify-between md:flex">
          <h1 className="text-[24px] font-extrabold text-ink">알림함</h1>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={() => act((d, c) => D.markAllRead(d, c, me.id))}>
              모두 읽음
            </Button>
          )}
        </div>
        <p className="mt-0 text-[12px] text-ink-3 md:mt-2">앱 안 알림만 제공해요. 푸시·카카오 알림은 아직 발송하지 않아요.</p>
        <ul className="mt-3 space-y-2" data-testid="inbox-list">
          {list.length ? (
            list.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    act((d, c) => D.markNotificationRead(d, c, n.id));
                    if (n.link) router.push(n.link);
                  }}
                  className={cx('flex w-full items-start gap-3 rounded-2xl p-4 text-left ring-1 transition', n.readAt ? 'bg-white ring-line' : 'bg-brand-50/60 ring-brand-100')}
                >
                  <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', n.kind === 'MARKETING' ? 'bg-promo-100 text-promo-600' : 'bg-white text-brand-600')}>{n.kind === 'MARKETING' ? <Megaphone className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {n.kind === 'MARKETING' && <span className="text-[12px] font-bold text-promo-600">(광고)</span>}
                      <span className="text-[14.5px] font-bold text-ink">{n.title}</span>
                      {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-coral-500" />}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-2">{n.body}</span>
                    <span className="mt-1 block text-[12px] text-ink-4">{relTime(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <Empty icon={<Bell className="h-8 w-8" />} title="새 알림이 없어요" />
          )}
        </ul>
      </div>
    </div>
  );
}
