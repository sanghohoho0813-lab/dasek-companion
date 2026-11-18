'use client';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { Button, PageSkeleton, Sheet } from '@/components/ui';
import { methodLabel, proofLabel } from '@/lib/labels';
import { computeKpis, getProfile } from '@/lib/rules';
import type { ProofEvent } from '@/lib/types';
import { fmtDate } from '@/lib/util';

const WEEKS = [
  { w: '0주차', t: '기준값 고정', d: '현재 확인 처리 시간·30일 재방문율·운영자당 고객 수를 실제 운영 데이터로 1회 측정', status: '대기 — 실제 운영 데이터 없음' },
  { w: '1~4주차', t: '도입·사용 / 첫 성과', d: '직원 확인 습관화, 체크인·회원번호 제시율, 첫 추천 전환 기록', status: '시연 데이터로 흐름 검증 완료' },
  { w: '5~8주차', t: '매출 효과', d: '재방문·재구매 알림 승인→전환 기록, 쿠폰 원가 대비 공헌이익 확인', status: '준비' },
  { w: '9~12주차', t: '기업 가치 / 심사 제출 자료', d: '성과 기록 묶음, 표준 운영 절차, 데이터 축적 현황, 정기픽업 수요 신호 정리', status: '준비' },
];

/** 자동 생성 문장 안의 영문 표기를 화면용 한글로 */
const ko = (t: string) => t.replace(/\(RULE\)/g, '(규칙)').replace(/\(HUMAN\)/g, '(직원 확인)').replace(/POS/g, '계산대(POS)').replace(/^세그먼트:/, '알림 대상:');

/** 데이터 출처: 내부 테이블·ID 대신 기록 종류만 */
const SOURCE_LABEL: Record<string, string> = {
  visit_checkins: '방문 기록',
  order_verifications: '구매 확인 기록',
  reward_ledger: '혜택 장부',
  referral_attributions: '친구 추천 기록',
  reorder_candidates: '재구매 후보',
  campaigns: '고객 알림',
};
const sourceLabel = (src: string) =>
  src
    .split('→')
    .map((x) => SOURCE_LABEL[x.trim().split('/')[0]] ?? '기타 기록')
    .join(' → ');

const DATA_STATUS: Record<string, string> = { DEMO: '시연 데이터', PILOT: '시범 운영', LIVE: '실제 운영' };

export default function EvidencePage() {
  const { s } = useOperator();
  const [open, setOpen] = useState<ProofEvent | null>(null);
  const [type, setType] = useState<string>('all');
  if (!s) return <PageSkeleton />;
  const k = computeKpis(s);
  const types = [...new Set(s.proofEvents.map((p) => p.event_type))];
  const list = s.proofEvents.filter((p) => type === 'all' || p.event_type === type);
  const download = () => {
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), mode: s.mode, note: 'DEMO 데이터 — 실제 실적 아님', kpis: k, proof_events: s.proofEvents }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dasek-evidence-pack-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-4">
      <PageIntro
        title="성과 기록"
        body="확인·승인·알림 같은 실제 처리 결과가 남은 기록만 모아요. 지금은 DEMO 기록이에요."
        more="로그인 수나 화면 캡처가 아니라 '요청(계기) → 결정 → 사람 승인 → 조치 → 결과 → 핵심 지표 변화 → 데이터 출처'가 남는 사건만 성과 기록(Proof Event)으로 남깁니다. 실제 운영 기준값을 측정하기 전에는 개선율을 만들지 않아요(12주 실증 계획)."
        right={
          <Button tone="ax" variant="outline" onClick={download} data-testid="evidence-export">
            <Download className="h-4 w-4" /> 실증 자료 묶음 내보내기(JSON 파일)
          </Button>
        }
      />
      <Panel title="돈이 되는 핵심 지표 3개 · 기준값 상태">
        <div className="overflow-x-auto">
          <table className="ax-table w-full min-w-[640px] text-left text-[0.875rem]">
            <thead className="text-[0.8125rem] text-slate-500">
              <tr>
                <th className="pb-2 font-semibold">구분</th>
                <th className="pb-2 font-semibold">지표</th>
                <th className="pb-2 font-semibold">측정 지점</th>
                <th className="pb-2 font-semibold">현재(DEMO)</th>
                <th className="pb-2 font-semibold">기준값</th>
                <th className="pb-2 font-semibold">목표</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['비용 절감', '확인 요청 처리 시간', '방문·구매 확인 요청 기록 시각 → 직원 결정 시각', k.costMedianMinutes == null ? '—' : `${k.costMedianMinutes}분`],
                ['매출(재방문)', '30일 재방문·재구매율', '직원확인 이용 2회+ 고객 ÷ 1회+ 고객', k.revenueRepeatRate == null ? '—' : `${Math.round(k.revenueRepeatRate * 100)}%`],
                ['확장', '운영자 1인당 활성 고객', '30일 확인 이용 고객 ÷ 운영 인원', `${k.scaleActivePerOperator ?? '—'}명`],
              ].map(([a, b, c, d]) => (
                <tr key={a}>
                  <td className="py-2.5 font-bold">{a}</td>
                  <td className="py-2.5">{b}</td>
                  <td className="py-2.5 text-[0.8125rem] text-slate-500">{c}</td>
                  <td className="py-2.5 font-semibold tabular">{d}</td>
                  <td className="py-2.5">
                    <Tag tone="amber">필수 · 측정 전</Tag>
                  </td>
                  <td className="py-2.5 text-slate-500">없는 수치를 만들지 않음</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="12주 실증 계획">
        <ol className="grid gap-3 md:grid-cols-4">
          {WEEKS.map((w, i) => (
            <li key={w.w} className="rounded-xl bg-slate-50 p-4">
              <p className="text-[0.8125rem] font-bold text-slate-500">{w.w}</p>
              <p className="text-[0.9688rem] font-extrabold text-slate-900">{w.t}</p>
              <p className="mt-1 text-[0.8438rem] leading-relaxed text-slate-600">{w.d}</p>
              <p className="mt-2">
                <Tag tone={i === 1 ? 'blue' : i === 0 ? 'amber' : 'slate'}>{w.status}</Tag>
              </p>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel
        title={`성과 기록 ${s.proofEvents.length}건`}
        action={
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-11 rounded-lg border border-axline bg-white px-2.5 text-[0.9375rem] lg:h-9" aria-label="유형 필터">
            <option value="all">전체 유형</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {proofLabel(t)}
              </option>
            ))}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="ax-table w-full min-w-[780px] text-left text-[0.8438rem]" data-testid="proof-table">
            <thead className="border-b border-slate-100 text-[0.8125rem] text-slate-500">
              <tr>
                <th className="pb-2 font-semibold">유형</th>
                <th className="pb-2 font-semibold">요청(계기)</th>
                <th className="pb-2 font-semibold">결정 방식</th>
                <th className="pb-2 font-semibold">결과</th>
                <th className="pb-2 font-semibold">지표 변화</th>
                <th className="pb-2 font-semibold">시각</th>
                <th className="pb-2 font-semibold">데이터 구분</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.slice(0, 60).map((p) => (
                <tr key={p.proof_event_id} onClick={() => setOpen(p)} className="cursor-pointer hover:bg-slate-50">
                  <td className="py-2">
                    <Tag tone="green">{proofLabel(p.event_type)}</Tag>
                  </td>
                  <td className="max-w-[220px] truncate py-2">{ko(p.trigger)}</td>
                  <td className="py-2">{methodLabel(p.decision_method)}</td>
                  <td className="max-w-[220px] truncate py-2">{ko(p.result)}</td>
                  <td className="py-2 text-slate-500">{p.kpi_before ? `${p.kpi_before} → ${p.kpi_after}` : '-'}</td>
                  <td className="py-2 text-slate-500">{fmtDate(p.created_at, { time: true })}</td>
                  <td className="py-2">
                    <Tag tone="amber">{DATA_STATUS[p.status] ?? p.status}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Sheet open={!!open} onClose={() => setOpen(null)} tone="ax" side="right" title={open ? proofLabel(open.event_type) : ''} description="성과 기록 전체 항목">
        {open && (
          <dl className="space-y-2 text-[0.8438rem]">
            {(
              [
                ['유형', proofLabel(open.event_type)],
                ['요청(계기)', ko(open.trigger)],
                ['결정', ko(open.decision)],
                ['결정 방식', methodLabel(open.decision_method)],
                ['판단 근거', ko(open.why)],
                ['사람 승인', open.human_approval ? getProfile(s, open.human_approval)?.name ?? '운영자' : '없음(자동 규칙)'],
                ['조치', ko(open.action)],
                ['결과', ko(open.result)],
                ['지표 변화', open.kpi_before ? `${open.kpi_before} → ${open.kpi_after ?? '—'}` : null],
                ['데이터 출처', sourceLabel(open.data_source)],
                ['기록 시각', fmtDate(open.created_at, { time: true })],
                ['결과 확인 시각', open.result_confirmed_at ? fmtDate(open.result_confirmed_at, { time: true }) : null],
                ['데이터 구분', DATA_STATUS[open.status] ?? open.status],
              ] as [string, string | null][]
            ).map(([k2, v]) => (
              <div key={k2} className="grid grid-cols-[140px_1fr] gap-2 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">{k2}</dt>
                <dd className="break-words text-slate-800">{v == null ? '—' : v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Sheet>
    </div>
  );
}
