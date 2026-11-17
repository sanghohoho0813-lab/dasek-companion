'use client';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { Chip, PageSkeleton } from '@/components/ui';
import { couponsFor, customers, hasConsent, lastVerifiedAt, stampCount, verifiedUses } from '@/lib/rules';
import { fmtDate, relTime } from '@/lib/util';

type F = 'all' | 'active' | 'new' | 'lapsed' | 'consent' | 'request';

export default function MembersPage() {
  const { s, can } = useOperator();
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('all');
  const rows = useMemo(() => {
    if (!s) return [];
    const now = Date.now();
    return customers(s)
      .map((p) => {
        const uses = verifiedUses(s, p.id);
        const last = lastVerifiedAt(s, p.id);
        return { p, uses: uses.length, last, stamps: stampCount(s, p.id), coupons: couponsFor(s, p.id).filter((c) => c.status === 'ISSUED').length, mkt: hasConsent(s, p.id, 'marketing_inapp'), referred: s.referrals.some((r) => r.refereeId === p.id), daysSince: last ? (now - new Date(last).getTime()) / 86400000 : null };
      })
      .filter((r) => {
        const t = q.trim();
        if (t && !(r.p.name.includes(t) || r.p.memberCode.toLowerCase().includes(t.toLowerCase()) || (can('member.viewContact') && r.p.phoneLast4 === t))) return false;
        if (f === 'active') return r.daysSince != null && r.daysSince <= 30;
        if (f === 'new') return r.uses === 0;
        if (f === 'lapsed') return r.daysSince != null && r.daysSince > 30;
        if (f === 'consent') return r.mkt;
        if (f === 'request') return r.p.status === 'deletion_requested';
        return true;
      })
      .sort((a, b) => (a.p.createdAt < b.p.createdAt ? 1 : -1));
  }, [s, q, f, can]);
  if (!s) return <PageSkeleton />;
  return (
    <div>
      <PageIntro title="회원·동의" body="회원별 확인 이용, 스탬프, 쿠폰, 마케팅 동의 상태를 봅니다. 원본 전화번호는 저장하지 않으며, 책임자만 뒤 4자리를 볼 수 있어요." />
      <Panel>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-ax-primary">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={can('member.viewContact') ? '이름, 회원코드, 전화 뒤 4자리' : '이름, 회원코드'} className="w-full text-sm outline-none" aria-label="회원 검색" data-testid="member-search" />
          </label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                ['all', '전체'],
                ['active', '30일 활성'],
                ['new', '첫 이용 전'],
                ['lapsed', '30일+ 미방문'],
                ['consent', '알림 동의'],
                ['request', '삭제 요청'],
              ] as [F, string][]
            ).map(([v, l]) => (
              <Chip key={v} active={f === v} onClick={() => setF(v)} className="h-8 text-[12.5px]">
                {l}
              </Chip>
            ))}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]" data-testid="member-table">
            <thead className="border-b border-slate-100 text-[12px] text-slate-400">
              <tr>
                <th className="pb-2 font-semibold">회원</th>
                <th className="pb-2 font-semibold">가입</th>
                <th className="pb-2 text-right font-semibold">확인 이용</th>
                <th className="pb-2 text-right font-semibold">스탬프</th>
                <th className="pb-2 text-right font-semibold">사용 가능 쿠폰</th>
                <th className="pb-2 font-semibold">최근 확인 이용</th>
                <th className="pb-2 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.p.id} className="group cursor-pointer transition hover:bg-slate-50">
                  <td className="py-2.5">
                    <Link href={`/ax/members/${r.p.id}`} className="font-bold text-slate-900 group-hover:underline">
                      {r.p.name}
                    </Link>
                    <span className="ml-2 text-[12px] text-slate-400">
                      {r.p.memberCode}
                      {can('member.viewContact') && r.p.phoneLast4 ? ` · ****${r.p.phoneLast4}` : ''}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500">{fmtDate(r.p.createdAt)}</td>
                  <td className="py-2.5 text-right font-semibold tabular">{r.uses}</td>
                  <td className="py-2.5 text-right tabular">{r.stamps}</td>
                  <td className="py-2.5 text-right tabular">{r.coupons}</td>
                  <td className="py-2.5 text-slate-500">{r.last ? relTime(r.last) : '-'}</td>
                  <td className="py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {r.mkt ? <Tag tone="green">알림 동의</Tag> : <Tag>알림 미동의</Tag>}
                      {r.referred && <Tag tone="violet">추천 가입</Tag>}
                      {r.p.status === 'deletion_requested' && <Tag tone="red">삭제 요청</Tag>}
                      {r.p.isDemo && <Tag tone="amber">DEMO</Tag>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="py-10 text-center text-[13px] text-slate-400">조건에 맞는 회원이 없어요.</p>}
        </div>
      </Panel>
    </div>
  );
}
