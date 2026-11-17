'use client';
import { Check, RefreshCw, X } from 'lucide-react';
import Link from 'next/link';
import { Locked, PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { Button, PageSkeleton, Segmented, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { computeReorderCandidates, getMenuItem, getProfile, hasConsent } from '@/lib/rules';
import { opAct } from '@/lib/store';
import { fmtDate } from '@/lib/util';
import { useState } from 'react';

export default function ReorderPage() {
  const { s, can } = useOperator();
  const run = useRun();
  const [tab, setTab] = useState<'SUGGESTED' | 'APPROVED' | 'CONVERTED' | 'DISMISSED'>('SUGGESTED');
  if (!s) return <PageSkeleton />;
  const fresh = computeReorderCandidates(s).length;
  const list = s.reorderCandidates.filter((c) => c.status === tab);
  const count = (st: string) => s.reorderCandidates.filter((c) => c.status === st).length;
  const approved = count('APPROVED') + count('CONVERTED');
  return (
    <div className="space-y-4">
      <PageIntro
        title="추천·재구매"
        body="고객이 저장한 메뉴 중 14일간 확인 구매가 없는 경우를 규칙으로 찾아 후보를 만듭니다. 운영 책임자가 승인한 후보만 (동의 고객에게) 앱 알림으로 안내되고, 이후 해당 메뉴의 직원확인 구매가 생기면 '전환'으로 기록돼요."
        right={
          <Button tone="ax" onClick={() => run(() => opAct((d, c) => D.refreshReorderCandidates(d, c)), (n) => (n ? `새 후보 ${n}건을 만들었어요.` : '새 후보가 없어요.'))} data-testid="reorder-refresh">
            <RefreshCw className="h-4 w-4" /> 후보 갱신 {fresh > 0 && `(${fresh})`}
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Panel>
          <p className="text-[0.8125rem] font-semibold text-slate-500">검토 대기</p>
          <p className="text-[1.625rem] font-extrabold tabular">{count('SUGGESTED') + fresh}</p>
        </Panel>
        <Panel>
          <p className="text-[0.8125rem] font-semibold text-slate-500">승인 → 전환</p>
          <p className="text-[1.625rem] font-extrabold tabular">
            {count('CONVERTED')} <span className="text-[1rem] font-bold text-slate-500">/ {approved}</span>
          </p>
        </Panel>
        <Panel>
          <p className="text-[0.8125rem] font-semibold text-slate-500">방식</p>
          <p className="mt-1 text-[0.9375rem] font-bold">RULE + 사람 승인 (L3)</p>
          <p className="text-[0.8125rem] text-slate-500">자동 발송(L4)은 하지 않아요</p>
        </Panel>
      </div>
      <Segmented tone="ax" label="상태" value={tab} onChange={setTab} options={[{ value: 'SUGGESTED', label: '검토 대기', count: count('SUGGESTED') }, { value: 'APPROVED', label: '안내함', count: count('APPROVED') }, { value: 'CONVERTED', label: '구매 전환', count: count('CONVERTED') }, { value: 'DISMISSED', label: '보류', count: count('DISMISSED') }]} />
      <Panel>
        {list.length ? (
          <ul className="divide-y divide-slate-100" data-testid="reorder-list">
            {list.map((c) => {
              const u = getProfile(s, c.userId);
              const m = getMenuItem(s, c.menuItemId);
              return (
                <li key={c.id} className="flex flex-col gap-3 py-3 md:flex-row md:items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-bold text-slate-900">
                      <Link href={`/ax/members/${c.userId}`} className="hover:underline">
                        {u?.name}
                      </Link>{' '}
                      · {m?.name} {hasConsent(s, c.userId, 'marketing_inapp') ? <Tag tone="green">알림 동의</Tag> : <Tag>알림 미동의</Tag>}
                    </p>
                    <p className="mt-1 text-[0.8125rem] font-bold text-slate-500">왜? (사용한 정보: 저장 기록 · 확인 구매 기록 · 동의 상태)</p>
                    <ul className="mt-0.5 space-y-0.5 text-[0.8438rem] text-slate-600">
                      {c.reasons.map((r) => (
                        <li key={r}>· {r}</li>
                      ))}
                    </ul>
                    <p className="mt-1 text-[0.8125rem] text-slate-500">
                      생성 {fmtDate(c.createdAt, { time: true })} {c.decidedAt && `· 결정 ${fmtDate(c.decidedAt, { time: true })}`}
                    </p>
                  </div>
                  {c.status === 'SUGGESTED' &&
                    (can('reorder.approve') ? (
                      <div className="flex shrink-0 gap-2">
                        <Button tone="ax" variant="ghost" size="sm" onClick={() => run(() => opAct((d, ctx) => D.decideReorder(d, ctx, c.id, false)), '보류했어요.')}>
                          <X className="h-3.5 w-3.5" /> 보류
                        </Button>
                        <Button tone="ax" size="sm" onClick={() => run(() => opAct((d, ctx) => D.decideReorder(d, ctx, c.id, true)), hasConsent(s, c.userId, 'marketing_inapp') ? '승인했어요. 앱 알림으로 안내했어요.' : '승인했어요. 동의가 없어 발송하지 않고 응대 메모로만 남겨요.')} data-testid="reorder-approve">
                          <Check className="h-3.5 w-3.5" /> 승인·안내
                        </Button>
                      </div>
                    ) : (
                      <Locked reason="승인은 책임자" />
                    ))}
                  {c.status === 'CONVERTED' && <Tag tone="green">전환 확인 · Proof 기록됨</Tag>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-[0.875rem] text-slate-500">{tab === 'SUGGESTED' && fresh ? "'후보 갱신'을 눌러 새 후보를 만드세요." : '해당 상태의 후보가 없어요.'}</p>
        )}
      </Panel>
    </div>
  );
}
