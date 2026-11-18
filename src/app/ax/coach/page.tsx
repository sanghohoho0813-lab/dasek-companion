'use client';
import { AlertTriangle, CalendarRange, Target, UserCheck } from 'lucide-react';
import { PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { MissionList } from '@/components/ax/widgets';
import { PageSkeleton } from '@/components/ui';
import { coachMissions, computeKpis, verifiedUses } from '@/lib/rules';
import { DAY } from '@/lib/util';

export default function CoachPage() {
  const { s, can } = useOperator();
  if (!s) return <PageSkeleton />;
  const missions = coachMissions(s);
  const k = computeKpis(s);
  const weekStart = Date.now() - 7 * DAY;
  const weekProofs = s.proofEvents.filter((p) => new Date(p.created_at).getTime() > weekStart);
  const byType = (t: string) => weekProofs.filter((p) => p.event_type === t).length;
  const targets = [
    { l: '직원확인 방문·구매', v: verifiedUses(s).filter((u) => new Date(u.at).getTime() > weekStart).length, goal: '기준값 측정 후 설정' },
    { l: '추천 전환', v: byType('REFERRAL_CONVERTED'), goal: '기준값 측정 후 설정' },
    { l: '재구매 전환', v: byType('REORDER_CONVERTED'), goal: '기준값 측정 후 설정' },
    { l: '확인 처리 시간(중앙값)', v: k.costMedianMinutes == null ? '—' : `${k.costMedianMinutes}분`, goal: '대기 30분 이내 유지(가정)' },
  ];
  return (
    <div className="space-y-4">
      <PageIntro title="오늘 추천 업무" body="지금 하면 도움이 되는 일을 1~3개만 골라 드려요. 누르면 처리 화면으로 이동해요." more="오늘 추천 업무는 AI 예측이 아니라 대기 시간·후보 수·알림 대상 규모에 따른 우선순위 규칙입니다. 처리하면 성과 기록이 남아요." />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="오늘 할 일" sub="할 일 → 조치 → 결과 → 성과 기록">
          <MissionList missions={missions} canManage={can('campaign.approve')} />
        </Panel>
        <div className="space-y-4">
          <Panel title="이번 주 실증 지표" sub="최근 7일 · DEMO">
            <ul className="space-y-2">
              {targets.map((t) => (
                <li key={t.l} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                  <span>
                    <span className="block text-[0.875rem] font-semibold text-slate-700">{t.l}</span>
                    <span className="block text-[0.8125rem] text-slate-500">목표: {t.goal}</span>
                  </span>
                  <span className="text-[1.125rem] font-extrabold text-slate-900 tabular">{t.v}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="운영 책임자" sub="핵심 지표·데이터 품질·교육·이슈 담당">
            <p className="flex items-center gap-2 text-[0.9375rem] text-slate-700">
              <UserCheck className="h-4 w-4 text-slate-500" /> 미지정 <Tag tone="amber">미확인</Tag>
            </p>
            <p className="mt-1 text-[0.8125rem] text-slate-500">실제 운영자 확정 후 설정에서 지정합니다. 개인 이름은 계약·프로필 데이터 확인 전 입력하지 않아요.</p>
          </Panel>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title={<span className="flex items-center gap-1.5"><Target className="h-4 w-4 text-[#3C9A75]" /> 직원에게 좋은 점</span>}>
          <ul className="list-disc space-y-1 pl-5 text-[0.875rem] text-slate-600">
            <li>스탬프 종이·도장 관리 대신 확인 버튼 한 번</li>
            <li>쿠폰 진위 확인을 코드로 즉시</li>
            <li>오늘 할 일이 3개 이내로 정리됨</li>
          </ul>
        </Panel>
        <Panel title={<span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-amber-500" /> 도입 위험</span>}>
          <ul className="list-disc space-y-1 pl-5 text-[0.875rem] text-slate-600">
            <li>바쁜 시간대에 확인이 밀리면 고객 불만 → 대기 시간을 핵심 지표로 관리</li>
            <li>직원이 확인을 생략하면 실적이 비어 보임 → 확인 대기 배지·알림</li>
            <li>혜택 원가 미확정 → 운영자 확정 전 예시로만 표시</li>
          </ul>
        </Panel>
        <Panel title={<span className="flex items-center gap-1.5"><CalendarRange className="h-4 w-4 text-[#5B8DEF]" /> 할 일 → 화면 연결</span>}>
          <ul className="space-y-1 text-[0.875rem] text-slate-600">
            <li>확인 대기 → 방문·구매 확인</li>
            <li>재구매 후보 → 추천·재구매</li>
            <li>미방문 고객 → 고객 알림</li>
            <li>사진 승인 → 콘텐츠</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
