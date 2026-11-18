'use client';
import { ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { Chip, PageSkeleton } from '@/components/ui';
import { memberNo } from '@/lib/labels';
import { couponsFor, customers, hasConsent, lastVerifiedAt, stampCount, verifiedUses } from '@/lib/rules';
import { fmtDate, relTime } from '@/lib/util';

type F = 'all' | 'active' | 'new' | 'lapsed' | 'consent' | 'request';

export default function MembersPage() {
  const { s, can } = useOperator();
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('all');
  const searchRef = useRef<HTMLInputElement>(null);
  // 홈의 '회원 검색'에서 오면 바로 입력할 수 있게
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('focus') === 'search') searchRef.current?.focus();
  }, [s === null]);
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
      <PageIntro title="회원 관리" body="이름·회원번호로 찾고, 눌러서 이용 내역·쿠폰·동의 상태를 확인해요." more="전화번호 원본은 저장하지 않아요. 책임자만 뒤 4자리로 찾을 수 있어요." />
      <Panel>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-axline bg-white px-3 focus-within:border-ax-primary focus-within:ring-2 focus-within:ring-ax-primary/20 xl:min-w-[18rem] lg:h-10">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={can('member.viewContact') ? '이름, 회원번호, 전화 뒤 4자리' : '이름, 회원번호'} className="h-11 w-full bg-transparent text-[0.9375rem] outline-none placeholder:text-slate-500" aria-label="회원 검색" data-testid="member-search" ref={searchRef} enterKeyHint="search" />
          </label>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 no-scrollbar">
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
              <Chip key={v} active={f === v} onClick={() => setF(v)} className="text-[0.875rem]">
                {l}
              </Chip>
            ))}
          </div>
        </div>
        {/* 휴대폰·태블릿: 카드 목록 (중요 항목만, 나머지는 상세) */}
        <ul className="mt-4 space-y-2 lg:hidden" data-testid="member-cards">
          {rows.map((r) => (
            <li key={r.p.id}>
              <Link href={`/ax/members/${r.p.id}`} className="flex items-center gap-3 rounded-xl border border-axline bg-white p-3.5 transition hover:border-slate-400 active:bg-slate-50">
                <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ax-soft text-[1rem] font-extrabold text-ax-primary">{r.p.name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[1.0625rem] font-bold text-slate-900">{r.p.name}</span>
                    <span className="text-[0.875rem] font-semibold text-slate-500">회원번호 {memberNo(r.p.memberCode)}</span>
                  </span>
                  <span className="mt-0.5 block text-[0.9375rem] text-slate-700">
                    {r.last ? `최근 이용 ${relTime(r.last)}` : '아직 이용 없음'} · 총 {r.uses}회
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1">
                    {r.coupons > 0 && <Tag tone="amber">쿠폰 {r.coupons}장</Tag>}
                    <Tag>스탬프 {r.stamps}</Tag>
                    {r.p.status === 'deletion_requested' && <Tag tone="red">삭제 요청</Tag>}
                    {r.referred && <Tag tone="violet">추천 가입</Tag>}
                    {!r.mkt && <Tag>알림 미동의</Tag>}
                  </span>
                </span>
                <span className="flex shrink-0 items-center text-[0.875rem] font-semibold text-slate-500">
                  상세 <ChevronRight className="h-5 w-5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 hidden overflow-x-auto lg:block">
          <table className="ax-table w-full min-w-[880px] text-left text-[0.875rem]" data-testid="member-table">
            <thead className="border-b border-slate-100 text-[0.8125rem] text-slate-500">
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
                  <td className="whitespace-nowrap py-2.5">
                    <Link href={`/ax/members/${r.p.id}`} className="font-bold text-slate-900 group-hover:underline">
                      {r.p.name}
                    </Link>
                    <span className="ml-2 text-[0.8125rem] text-slate-500">
                      회원번호 {memberNo(r.p.memberCode)}
                      {can('member.viewContact') && r.p.phoneLast4 ? ` · ****${r.p.phoneLast4}` : ''}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-slate-500">{fmtDate(r.p.createdAt)}</td>
                  <td className="py-2.5 text-right font-semibold tabular">{r.uses}</td>
                  <td className="py-2.5 text-right tabular">{r.stamps}</td>
                  <td className="py-2.5 text-right tabular">{r.coupons}</td>
                  <td className="whitespace-nowrap py-2.5 text-slate-500">{r.last ? relTime(r.last) : '-'}</td>
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
        </div>
        {!rows.length && <p className="py-10 text-center text-[0.9375rem] text-slate-500">조건에 맞는 회원이 없어요.</p>}
      </Panel>
    </div>
  );
}
