'use client';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Locked, PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { Button, EvidenceBadge, PageSkeleton, Segmented, Sheet, Toggle, axInputCls, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { effectiveCouponStatus, getProfile } from '@/lib/rules';
import { opAct } from '@/lib/store';
import type { LoyaltyRule } from '@/lib/types';
import { cx, fmtDate } from '@/lib/util';
import { StatusPill, statusOf } from '@/components/ui/Status';

const KIND: Record<LoyaltyRule['kind'], string> = { SIGNUP: '가입 혜택', STAMP: '스탬프 보상', REFERRAL_REFERRER: '추천인 보상', REFERRAL_REFEREE: '피추천인 웰컴' };

function RuleEditor({ rule, onClose }: { rule: LoyaltyRule; onClose: () => void }) {
  const run = useRun();
  const [f, setF] = useState({ title: rule.title, benefit: rule.benefit, stampsRequired: rule.stampsRequired?.toString() ?? '', validDays: rule.validDays.toString(), active: rule.active, qualifyingEvent: rule.qualifyingEvent });
  return (
    <Sheet
      open
      onClose={onClose}
      tone="ax"
      title={`${KIND[rule.kind]} 규칙 수정`}
      description="변경은 이후 발급분부터 적용되고 감사 기록에 남아요. 이미 발급된 쿠폰은 바뀌지 않아요."
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ax" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            tone="ax"
            data-testid="rule-save"
            onClick={() => {
              const ok = run(
                () =>
                  opAct((d, c) =>
                    D.updateLoyaltyRule(d, c, rule.id, {
                      title: f.title,
                      benefit: f.benefit,
                      validDays: Number(f.validDays),
                      active: f.active,
                      ...(rule.kind === 'STAMP' ? { stampsRequired: Number(f.stampsRequired) } : {}),
                      ...(rule.kind === 'REFERRAL_REFERRER' ? { qualifyingEvent: f.qualifyingEvent } : {}),
                    }),
                  ),
                '규칙을 저장했어요.',
              );
              if (ok !== undefined) onClose();
            }}
          >
            저장
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-[0.875rem]">
        <label className="block font-semibold text-slate-600">
          이름
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={cx(axInputCls, 'mt-1')} />
        </label>
        <label className="block font-semibold text-slate-600">
          혜택 내용
          <input value={f.benefit} onChange={(e) => setF({ ...f, benefit: e.target.value })} className={cx(axInputCls, 'mt-1')} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          {rule.kind === 'STAMP' && (
            <label className="block font-semibold text-slate-600">
              필요 스탬프
              <input value={f.stampsRequired} onChange={(e) => setF({ ...f, stampsRequired: e.target.value })} inputMode="numeric" className={cx(axInputCls, 'mt-1')} data-testid="rule-stamps" />
            </label>
          )}
          <label className="block font-semibold text-slate-600">
            유효기간(일)
            <input value={f.validDays} onChange={(e) => setF({ ...f, validDays: e.target.value })} inputMode="numeric" className={cx(axInputCls, 'mt-1')} />
          </label>
        </div>
        {rule.kind === 'REFERRAL_REFERRER' && (
          <label className="block font-semibold text-slate-600">
            보상 조건
            <select value={f.qualifyingEvent} onChange={(e) => setF({ ...f, qualifyingEvent: e.target.value as LoyaltyRule['qualifyingEvent'] })} className={cx(axInputCls, 'mt-1')}>
              <option value="CONFIRMED_PURCHASE_OR_VISIT">피추천인 첫 확인 방문 또는 구매</option>
              <option value="CONFIRMED_PURCHASE">피추천인 첫 확인 구매만</option>
            </select>
          </label>
        )}
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="font-semibold text-slate-700">규칙 활성</span>
          <Toggle tone="ax" checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="규칙 활성" />
        </div>
        <p className="rounded-lg bg-amber-50 p-3 text-[0.8125rem] text-amber-900">혜택 원가·공헌이익을 확인한 뒤 확정하세요. 저장하면 근거 상태가 '제공 정보'로 바뀝니다.</p>
      </div>
    </Sheet>
  );
}

function Inner() {
  const { s, can } = useOperator();
  const sp = useSearchParams();
  const [tab, setTab] = useState<'rules' | 'coupons' | 'referrals' | 'ledger'>((sp.get('tab') as 'referrals') ?? 'rules');
  const [edit, setEdit] = useState<LoyaltyRule | null>(null);
  const [cf, setCf] = useState<'all' | 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED'>('all');
  if (!s) return <PageSkeleton />;
  const name = (id: string) => getProfile(s, id)?.name ?? '-';
  const coupons = s.coupons.map((c) => ({ ...c, status: effectiveCouponStatus(c) })).filter((c) => cf === 'all' || c.status === cf);
  const sum = (st: string) => s.coupons.filter((c) => effectiveCouponStatus(c) === st).length;
  return (
    <div>
      <PageIntro title="쿠폰·추천·보상" body="혜택 규칙과 발급·사용·추천 귀속·보상 원장을 관리합니다. 보상은 모두 멱등 키로 중복 지급을 막고, 추천 보상은 피추천인의 직원확인 이용 후에만 확정돼요." />
      <Segmented
        tone="ax"
        label="보기"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'rules', label: '혜택 규칙', count: s.loyaltyRules.length },
          { value: 'coupons', label: '쿠폰 발급·사용', count: s.coupons.length },
          { value: 'referrals', label: '추천 관계', count: s.referrals.length },
          { value: 'ledger', label: '보상 원장' },
        ]}
      />
      <div className="mt-4">
        {tab === 'rules' && (
          <div className="grid gap-3 md:grid-cols-2">
            {s.loyaltyRules.map((r) => (
              <Panel key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.8125rem] font-bold text-slate-500">{KIND[r.kind]}</p>
                    <p className="text-[1.0625rem] font-extrabold text-slate-900">{r.benefit}</p>
                    <p className="mt-0.5 text-[0.8438rem] text-slate-500">
                      {r.title}
                      {r.stampsRequired ? ` · 스탬프 ${r.stampsRequired}개` : ''} · 유효 {r.validDays}일
                      {r.kind === 'REFERRAL_REFERRER' ? ` · ${r.qualifyingEvent === 'CONFIRMED_PURCHASE' ? '첫 확인 구매 시' : '첫 확인 방문·구매 시'}` : ''}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      {r.active ? <Tag tone="green">활성</Tag> : <Tag>중지</Tag>}
                      <EvidenceBadge ev={r.evidence} />
                    </div>
                  </div>
                  {can('rules.edit') ? (
                    <Button tone="ax" variant="outline" size="sm" onClick={() => setEdit(r)} data-testid={`edit-${r.kind}`}>
                      <Pencil className="h-3.5 w-3.5" /> 수정
                    </Button>
                  ) : (
                    <Locked reason="책임자" />
                  )}
                </div>
              </Panel>
            ))}
          </div>
        )}
        {tab === 'coupons' && (
          <Panel>
            <div className="mb-3 flex flex-wrap gap-2 text-[0.8438rem]">
              {(
                [
                  ['all', `전체 ${s.coupons.length}`],
                  ['ISSUED', `사용 가능 ${sum('ISSUED')}`],
                  ['REDEEMED', `사용됨 ${sum('REDEEMED')}`],
                  ['EXPIRED', `만료 ${sum('EXPIRED')}`],
                  ['CANCELLED', `취소 ${sum('CANCELLED')}`],
                ] as [typeof cf, string][]
              ).map(([v, l]) => (
                <button key={v} onClick={() => setCf(v)} className={cx('rounded-full px-3 py-1 font-semibold ring-1', cf === v ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200')}>
                  {l}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="ax-table w-full min-w-[720px] text-left text-[0.875rem]">
                <thead className="border-b border-slate-100 text-[0.8125rem] text-slate-500">
                  <tr>
                    <th className="pb-2 font-semibold">회원</th>
                    <th className="pb-2 font-semibold">쿠폰</th>
                    <th className="pb-2 font-semibold">발급 사유</th>
                    <th className="pb-2 font-semibold">코드</th>
                    <th className="pb-2 font-semibold">발급 / 만료</th>
                    <th className="pb-2 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.slice(0, 80).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2">
                        <Link href={`/ax/members/${c.userId}`} className="font-semibold hover:underline">
                          {name(c.userId)}
                        </Link>
                      </td>
                      <td className="py-2">{c.benefit}</td>
                      <td className="py-2 text-slate-500">{c.source}</td>
                      <td className="py-2 font-mono text-[0.8125rem]">{c.code}</td>
                      <td className="py-2 text-slate-500">
                        {fmtDate(c.issuedAt)} / {fmtDate(c.expiresAt)}
                      </td>
                      <td className="py-2">
                        <StatusPill kind={statusOf.coupon(c.status)} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        {tab === 'referrals' && (
          <Panel sub="한 회원은 한 번만 추천 귀속(유니크) · 자기추천·중복번호 차단 · 환불 시 회수">
            <div className="overflow-x-auto">
              <table className="ax-table w-full min-w-[640px] text-left text-[0.875rem]">
                <thead className="border-b border-slate-100 text-[0.8125rem] text-slate-500">
                  <tr>
                    <th className="pb-2 font-semibold">추천인</th>
                    <th className="pb-2 font-semibold">피추천인</th>
                    <th className="pb-2 font-semibold">코드</th>
                    <th className="pb-2 font-semibold">가입</th>
                    <th className="pb-2 font-semibold">자격 확인</th>
                    <th className="pb-2 font-semibold">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {s.referrals.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 font-semibold">{name(r.referrerId)}</td>
                      <td className="py-2">{name(r.refereeId)}</td>
                      <td className="py-2 font-mono text-[0.8125rem]">{r.code}</td>
                      <td className="py-2 text-slate-500">{fmtDate(r.createdAt)}</td>
                      <td className="py-2 text-slate-500">{r.qualifiedAt ? fmtDate(r.qualifiedAt, { time: true }) : '대기'}</td>
                      <td className="py-2">
                        <StatusPill kind={({ PENDING: 'pending', QUALIFIED: 'expected', REWARDED: 'done', REJECTED: 'rejected', REVERSED: 'reversed' } as const)[r.status]} label={{ PENDING: '첫 이용 대기', QUALIFIED: '보상 검토', REWARDED: '보상 확정', REJECTED: '반려', REVERSED: '보상 회수' }[r.status]} size="sm" /> {r.reason && <span className="text-[0.8125rem] text-slate-500">{r.reason}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        {tab === 'ledger' && (
          <Panel sub="EXPECTED(예정) → CONFIRMED(확정) / REVERSED(취소) · 멱등 키로 중복 방지">
            <ul className="divide-y divide-slate-100">
              {s.ledger.slice(0, 80).map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-2 py-2 text-[0.875rem]">
                  <Tag tone={l.kind === 'STAMP' ? 'blue' : l.kind === 'COUPON' ? 'green' : 'violet'}>{l.kind}</Tag>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{name(l.userId)}</span> · {l.label}
                  </span>
                  <StatusPill kind={statusOf.ledger(l.status)} label={{ EXPECTED: '확정 예정', CONFIRMED: '확정', REVERSED: '회수됨' }[l.status]} size="sm" />
                  <span className="w-36 truncate text-right font-mono text-[0.8125rem] text-slate-500" title={l.idempotencyKey}>
                    {l.idempotencyKey}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
      {edit && <RuleEditor rule={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

export default function RewardsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
