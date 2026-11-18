'use client';
import { ArrowLeft, PlusCircle, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { CounterPurchase } from '@/components/ax/CounterTools';
import { Locked, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { Button, Empty, PageSkeleton, Sheet, axInputCls, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { CONSENT_LABEL, memberNo, REFERRAL_STATUS } from '@/lib/labels';
import { couponsFor, getMenuItem, getProfile, hasConsent, recentInterests, stampCount, verifiedUses } from '@/lib/rules';
import { opAct } from '@/lib/store';
import type { CouponIssue } from '@/lib/types';
import { cx, fmtDate } from '@/lib/util';
import { StatusPill, statusOf } from '@/components/ui/Status';
import { ROADMAP } from '@/lib/roadmap';

const LEVEL: Record<string, { l: string; tone: 'slate' | 'blue' | 'green' | 'amber' }> = {
  order_link_click: { l: '링크 클릭', tone: 'slate' },
  reservation_link_click: { l: '예약 링크 클릭', tone: 'slate' },
  purchase_self_report: { l: '자가신고', tone: 'amber' },
  checkin_submit: { l: '체크인 요청', tone: 'amber' },
  favorite_add: { l: '관심', tone: 'blue' },
  favorite_remove: { l: '관심 해제', tone: 'slate' },
  view_menu: { l: '조회', tone: 'slate' },
  view_cat: { l: '조회', tone: 'slate' },
  signup: { l: '가입', tone: 'blue' },
  login: { l: '로그인', tone: 'slate' },
  visit_intent: { l: '방문 예정', tone: 'slate' },
  referral_share: { l: '추천 공유', tone: 'blue' },
  roadmap_interest: { l: '향후 서비스 관심', tone: 'blue' },
  notification_open: { l: '알림 열람', tone: 'slate' },
};

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { s, can } = useOperator();
  const run = useRun();
  const [counter, setCounter] = useState(false);
  const [cancel, setCancel] = useState<CouponIssue | null>(null);
  const [reverse, setReverse] = useState<{ kind: 'VISIT' | 'PURCHASE'; id: string } | null>(null);
  const [reason, setReason] = useState('');
  if (!s) return <PageSkeleton />;
  const p = getProfile(s, id);
  if (!p || p.role !== 'customer') return <Empty title="회원을 찾을 수 없어요" action={<Link href="/ax/members" className="font-semibold text-ax-primary">회원 목록</Link>} />;
  const uses = verifiedUses(s, p.id);
  const coupons = couponsFor(s, p.id);
  const events = s.events.filter((e) => e.userId === p.id).slice(0, 30);
  const refAsReferrer = s.referrals.filter((r) => r.referrerId === p.id);
  const refAsReferee = s.referrals.find((r) => r.refereeId === p.id);
  const consents = s.consents.filter((c) => c.userId === p.id).sort((a, b) => (a.at < b.at ? 1 : -1));
  const storeName = (sid: string) => s.stores.find((x) => x.id === sid)?.name;
  const deletionTask = s.tasks.find((t) => t.type === 'CUSTOMER_REQUEST' && t.refId === p.id && t.status === 'OPEN');

  return (
    <div className="space-y-4">
      <Link href="/ax/members" className="inline-flex items-center gap-1 text-[0.875rem] font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> 회원 목록
      </Link>
      <Panel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ax-soft text-[1.125rem] font-extrabold text-ax-primary">{p.name.slice(0, 1)}</span>
            <div>
              <p className="flex flex-wrap items-center gap-2 text-[1.1875rem] font-extrabold text-slate-900">
                {p.name} {p.isDemo && <Tag tone="amber">DEMO</Tag>} {p.status !== 'active' && <Tag tone="red">{p.status === 'deletion_requested' ? '삭제 요청' : '익명화됨'}</Tag>}
              </p>
              <p className="text-[0.8438rem] text-slate-500">
                회원번호 {memberNo(p.memberCode)} · {fmtDate(p.createdAt)} 가입 · 관심: {p.preferredBrands.map((b) => (b === 'dasek' ? '다색냥' : '리얼식단')).join(', ') || '-'}
                {can('member.viewContact') && p.phoneLast4 ? ` · 전화 ****${p.phoneLast4}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button tone="ax" onClick={() => setCounter(true)} disabled={!can('purchase.create') || p.status !== 'active'}>
              <PlusCircle className="h-4 w-4" /> 구매 확인 등록
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ['확인 이용', `${uses.length}회`],
            ['스탬프', `${stampCount(s, p.id)}개`],
            ['사용 가능 쿠폰', `${coupons.filter((c) => c.status === 'ISSUED').length}장`],
            ['앱 알림 동의', hasConsent(s, p.id, 'marketing_inapp') ? '동의' : '미동의'],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-slate-50 p-3">
              <p className="text-[0.8125rem] text-slate-500">{l}</p>
              <p className="text-[1.125rem] font-extrabold text-slate-900">{v}</p>
            </div>
          ))}
        </div>
        {deletionTask && (
          <div className="mt-4 flex flex-col gap-2 rounded-xl bg-red-50 p-3 md:flex-row md:items-center md:justify-between">
            <p className="text-[0.875rem] font-semibold text-red-800">고객이 탈퇴·정보 삭제를 요청했어요.</p>
            {can('member.process_deletion') ? (
              <Button tone="ax" variant="danger" size="sm" onClick={() => run(() => opAct((d, c) => D.processDeletion(d, c, p.id)), '개인정보를 익명화했어요.')}>
                삭제(익명화) 처리
              </Button>
            ) : (
              <Locked reason="책임자 권한 필요" />
            )}
          </div>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="확인된 이용" sub="직원확인 기준 · 환불 시 확인 취소 가능(책임자)">
          {uses.length ? (
            <ul className="divide-y divide-slate-100">
              {uses.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2.5 text-[0.875rem]">
                  <Tag tone={u.kind === 'VISIT' ? 'blue' : 'green'}>{u.kind === 'VISIT' ? '방문' : '구매'}</Tag>
                  <span className="min-w-0 flex-1 truncate text-slate-700">
                    {storeName(u.storeId)} {u.menuItemIds.length ? `· ${u.menuItemIds.map((m) => getMenuItem(s, m)?.name).join(', ')}` : ''} {u.amount ? `· ${u.amount.toLocaleString()}원` : ''}
                  </span>
                  <span className="text-[0.8125rem] text-slate-500">{fmtDate(u.at, { time: true })}</span>
                  {can('verification.reverse') && (
                    <button onClick={() => setReverse({ kind: u.kind, id: u.id })} className="grid h-11 w-11 lg:h-7 lg:w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label="확인 취소">
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.875rem] text-slate-500">아직 확인된 이용이 없어요.</p>
          )}
        </Panel>
        <Panel title="쿠폰" sub="사용 처리는 직원, 취소·재발급은 책임자(사유 기록)">
          <ul className="divide-y divide-slate-100">
            {coupons.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 py-2.5 text-[0.875rem]">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-slate-800">{c.benefit}</span>
                  <span className="block text-[0.8125rem] text-slate-500">
                    {c.title} · 쿠폰번호 {c.code.replace(/^DC-/, '')} · {fmtDate(c.expiresAt)}까지
                  </span>
                </span>
                <StatusPill kind={statusOf.coupon(c.status)} size="sm" />
                {c.status === 'ISSUED' && (
                  <>
                    <Button tone="ax" size="sm" variant="outline" disabled={!can('coupon.redeem')} onClick={() => run(() => opAct((d, ctx) => D.redeemCoupon(d, ctx, c.id)), '사용 처리했어요.')}>
                      사용
                    </Button>
                    {can('coupon.cancel') && (
                      <Button tone="ax" size="sm" variant="ghost" onClick={() => setCancel(c)}>
                        취소
                      </Button>
                    )}
                  </>
                )}
                {(c.status === 'EXPIRED' || c.status === 'CANCELLED') && can('coupon.cancel') && (
                  <Button tone="ax" size="sm" variant="ghost" onClick={() => run(() => opAct((d, ctx) => D.reissueCoupon(d, ctx, c.id, '운영자 재발급')), '재발급했어요.')}>
                    재발급
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="행동 기록 (근거 수준 표시)" sub="클릭·자가신고·조회는 실적이 아닌 신호로만 사용">
          <ul className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-[0.8438rem]">
                <Tag tone={LEVEL[e.type]?.tone ?? 'slate'}>{LEVEL[e.type]?.l ?? '기타 행동'}</Tag>
                <span className="min-w-0 flex-1 truncate text-slate-600">{e.type === 'roadmap_interest' ? `향후 서비스 관심: ${ROADMAP.find((r) => r.key === e.ref)?.title ?? '준비 중인 서비스'}` : e.label}</span>
                <span className="shrink-0 text-[0.8125rem] text-slate-500">{fmtDate(e.createdAt, { time: true })}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-4">
          <Panel title="최근 관심 (고객이 직접 남긴 신호)" sub="7일 이내 저장한 메뉴·관심 서비스 · 실적이 아닌 후속 안내 근거" testId="member-interest">
            {(() => {
              const r = recentInterests(s, p.id);
              const notes = s.notifications.filter((n) => n.userId === p.id && n.kind === 'MARKETING').slice(0, 3);
              return (
                <div className="space-y-2 text-[0.9375rem]">
                  <p>
                    <span className="font-semibold text-slate-600">저장한 메뉴 </span>
                    {r.menus.length ? r.menus.map((m) => m.name).join(', ') : <span className="text-slate-500">없음</span>}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">관심 서비스 </span>
                    {r.services.length ? r.services.map((k) => ROADMAP.find((x) => x.key === k)?.title ?? k).join(', ') : <span className="text-slate-500">없음</span>}
                  </p>
                  {r.menus.length + r.services.length > 0 && (
                    <p className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[0.875rem] text-violet-900">
                      제안: 최근 관심을 보인 회원이에요. &lsquo;관심 메뉴 안내&rsquo; 알림을 검토해 보세요. (규칙 기반 · {hasConsent(s, p.id, 'marketing_inapp') ? '알림 수신 동의' : '수신 비동의 — 발송 대상 아님'})
                    </p>
                  )}
                  {notes.length > 0 && (
                    <ul className="space-y-1 text-[0.875rem] text-slate-600">
                      {notes.map((n) => (
                        <li key={n.id}>
                          받은 알림: {n.title} · {n.readAt ? '확인함' : '아직 안 봄'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </Panel>
          <Panel title="추천 관계">
            <ul className="space-y-1.5 text-[0.875rem] text-slate-600">
              {refAsReferee && (
                <li>
                  <Tag tone="violet">추천받음</Tag> {getProfile(s, refAsReferee.referrerId)?.name}님 추천 코드 · {REFERRAL_STATUS[refAsReferee.status] ?? '기타'}
                </li>
              )}
              {refAsReferrer.map((r) => (
                <li key={r.id}>
                  <Tag tone="blue">추천함</Tag> {getProfile(s, r.refereeId)?.name} · {REFERRAL_STATUS[r.status] ?? '기타'}
                </li>
              ))}
              {!refAsReferee && !refAsReferrer.length && <li className="text-slate-500">추천 관계 없음</li>}
            </ul>
          </Panel>
          <Panel title="동의 이력" sub="항목·약관 버전·시각 기록 · 현재 약관은 초안(정식 약관 확정 전)">
            <ul className="max-h-44 space-y-1 overflow-y-auto text-[0.8438rem]">
              {consents.map((c) => (
                <li key={c.id} className={cx('flex justify-between gap-2', c.withdrawnAt ? 'text-slate-500 line-through' : 'text-slate-600')}>
                  <span>
                    {CONSENT_LABEL[c.purpose] ?? '기타 동의'} · {c.granted ? '동의' : '미동의'}{c.withdrawnAt ? ' (철회)' : ''}
                  </span>
                  <span>{fmtDate(c.at, { time: true })}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <CounterPurchase s={s} open={counter} onClose={() => setCounter(false)} presetUserId={p.id} />
      <Sheet
        open={!!cancel}
        onClose={() => setCancel(null)}
        tone="ax"
        title="쿠폰 취소"
        description="취소 사유는 감사 기록에 남아요."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setCancel(null)}>
              닫기
            </Button>
            <Button tone="ax" variant="danger" onClick={() => { const ok = run(() => opAct((d, c) => D.cancelCoupon(d, c, cancel!.id, reason)), '쿠폰을 취소했어요.'); if (ok !== undefined) { setCancel(null); setReason(''); } }}>
              취소 처리
            </Button>
          </div>
        }
      >
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 오발급, 고객 요청" className={axInputCls} />
      </Sheet>
      <Sheet
        open={!!reverse}
        onClose={() => setReverse(null)}
        tone="ax"
        title="확인 취소 (환불·오처리)"
        description="해당 이용으로 적립된 스탬프가 취소되고, 사용 전 추천 보상은 회수됩니다."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setReverse(null)}>
              닫기
            </Button>
            <Button tone="ax" variant="danger" onClick={() => { const ok = run(() => opAct((d, c) => D.reverseUse(d, c, reverse!.kind, reverse!.id, reason || '환불')), '확인을 취소했어요.'); if (ok !== undefined) { setReverse(null); setReason(''); } }}>
              확인 취소
            </Button>
          </div>
        }
      >
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="사유 (예: 환불)" className={axInputCls} />
      </Sheet>
    </div>
  );
}
