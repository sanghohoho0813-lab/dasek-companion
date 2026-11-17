'use client';
import { KeyRound, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Panel, Tag, useOperator } from '@/components/ax/Shell';
import { DailyChart, EvidenceBars, MissionList, MoneyKpiCards, QueueRow } from '@/components/ax/widgets';
import { PageSkeleton } from '@/components/ui';
import { coachMissions, computeKpis, dailyVerified, evidenceLevels, funnel } from '@/lib/rules';
import { dailyCheckinCode, fmtDate } from '@/lib/util';

export default function AxDashboard() {
  const { s, can } = useOperator();
  if (!s) return <PageSkeleton />;
  const k = computeKpis(s);
  const missions = coachMissions(s);
  const open = s.tasks.filter((t) => t.status === 'OPEN' && (t.type === 'VERIFY_CHECKIN' || t.type === 'VERIFY_PURCHASE'));
  const f = funnel(s);
  const proofs = s.proofEvents.slice(0, 5);
  const now = new Date();
  return (
    <div className="space-y-4 reveal">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-slate-500">
          {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' })} · 데이터 기준 {fmtDate(now.toISOString(), { time: true })}
        </p>
        <span className="text-[12px] text-slate-400">모든 숫자는 DEMO 시드 기반 — 실제 실적이 아닙니다</span>
      </div>
      <MoneyKpiCards k={k} />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="오늘 할 일 · AX Coach" sub="지금 처리하면 재방문·보상·실증에 가장 도움이 되는 일" action={<Link href="/ax/coach" className="text-[12.5px] font-semibold text-ax-primary hover:underline">전체 보기</Link>}>
          <MissionList missions={missions} canManage={can('campaign.approve')} />
        </Panel>
        <Panel title="오늘의 체크인 코드" sub="카운터에 게시 · 매일 자동 변경" testId="today-codes">
          <div className="grid grid-cols-2 gap-2">
            {s.stores.map((st) => (
              <div key={st.id} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-[12px] font-semibold text-slate-500">{st.name}</p>
                <p className="mt-1 font-mono text-[28px] font-extrabold tracking-[0.2em] text-slate-900" data-testid={`code-${st.id}`}>
                  {dailyCheckinCode(st.id)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[12px] text-slate-500">
            <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" /> 코드가 맞아도 직원이 확인하기 전에는 적립되지 않아요(사진 공유·원격 체크인 방지).
          </p>
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title={`방문·구매 확인 대기 ${open.length}건`} sub="확인해야 스탬프·추천 보상·Proof가 생성됩니다" action={<Link href="/ax/queue" className="text-[12.5px] font-semibold text-ax-primary hover:underline">큐로 이동</Link>}>
          {open.length ? (
            <ul className="space-y-2">
              {open.slice(0, 4).map((t) => (
                <QueueRow key={t.id} s={s} t={t} canVerify={can('queue.verify')} compact />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-[13px] text-slate-500">대기 중인 확인 요청이 없어요.</p>
          )}
        </Panel>
        <Panel title="근거 수준별 이벤트 (30일)" sub="클릭·자가신고는 실적에 섞지 않습니다">
          <EvidenceBars levels={evidenceLevels(s)} />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="최근 14일 확인 이용" sub="직원 확인된 방문·구매">
          <DailyChart data={dailyVerified(s)} />
        </Panel>
        <Panel title="회원 전환 흐름" sub="가입 → 첫 확인 이용 → 재이용">
          <ul className="space-y-2.5">
            {[
              ['가입 회원', f.signedUp],
              ['첫 확인 이용', f.firstUse],
              ['2회 이상 확인 이용', f.repeat],
              ['추천 가입 / 보상 확정', `${f.referred} / ${f.referralRewarded}`],
            ].map(([l, v], i) => (
              <li key={String(l)} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[12.5px] font-semibold text-slate-600">{l}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                  {typeof v === 'number' && <div className="h-full origin-left animate-grow rounded-md bg-ax-primary/80" style={{ width: `${(v / Math.max(1, f.signedUp)) * 100}%`, opacity: 1 - i * 0.18 }} />}
                </div>
                <span className="w-14 text-right text-[13px] font-bold text-slate-900 tabular">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="최근 실증 기록 (Proof Event)" sub="Trigger → 결정 → 승인 → 조치 → 결과" action={<Link href="/ax/evidence" className="text-[12.5px] font-semibold text-ax-primary hover:underline">전체 보기</Link>}>
        <ul className="divide-y divide-slate-100">
          {proofs.map((p) => (
            <li key={p.proof_event_id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-3">
              <ShieldCheck className="hidden h-4 w-4 shrink-0 text-[#3C9A75] sm:block" />
              <Tag tone="green">{p.event_type}</Tag>
              <span className="min-w-0 flex-1 truncate text-[13px] text-slate-700">
                {p.trigger} → {p.result}
              </span>
              <span className="shrink-0 text-[11.5px] text-slate-400">
                {p.decision_method} · {fmtDate(p.created_at, { time: true })}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
