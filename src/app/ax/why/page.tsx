'use client';
import { ArrowDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AssetImage } from '@/components/art/AssetImage';
import { Panel, Tag, useOperator } from '@/components/ax/Shell';
import { PageSkeleton, StatusBadge } from '@/components/ui';
import { ROADMAP } from '@/lib/roadmap';
import { computeKpis, funnel } from '@/lib/rules';
import { cx } from '@/lib/util';

const TOC = [
  ['s1', '한 줄 요약'],
  ['s2', '지금 매장의 모습'],
  ['s3', '가장 큰 병목(가설)'],
  ['s4', '왜 지금인가'],
  ['s5', '업무 재설계'],
  ['s6', '핵심 가치·Money KPI'],
  ['s7', '고객 ↔ AX 순환'],
  ['s8', '쌓이는 데이터'],
  ['s9', 'AI는 어디에만'],
  ['s10', '이번에 만들지 않은 것'],
  ['s11', '12주 실증'],
  ['s12', '직원·도입 위험'],
  ['s13', '성장 로드맵'],
  ['s14', '정부·투자 스토리'],
  ['s15', '스스로 던지는 질문'],
  ['s16', '확인이 필요한 것'],
];

function Sec({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <Panel>
        <p className="text-[11.5px] font-bold tracking-[0.14em] text-ax-accent">{String(n).padStart(2, '0')}</p>
        <h3 className="mt-0.5 text-[18px] font-extrabold tracking-tight text-slate-900">{title}</h3>
        <div className="mt-3 text-[13.5px] leading-relaxed text-slate-700">{children}</div>
      </Panel>
    </section>
  );
}

export default function WhyPage() {
  const { s } = useOperator();
  if (!s) return <PageSkeleton />;
  const k = computeKpis(s);
  const f = funnel(s);
  return (
    <div className="grid gap-5 xl:grid-cols-[220px_1fr]">
      <nav aria-label="Why AX 목차" className="hidden xl:block">
        <div className="sticky top-24 space-y-0.5">
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">목차</p>
          {TOC.map(([id, l], i) => (
            <a key={id} href={`#${id}`} className="block rounded-lg px-2 py-1 text-[12.5px] font-medium text-slate-600 transition hover:bg-white hover:text-slate-900">
              {i + 1}. {l}
            </a>
          ))}
        </div>
      </nav>
      <div className="min-w-0 space-y-4">
        <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200/70">
          <AssetImage slot="ax_cover_main" fallback={{ kind: 'space', variant: 1 }} alt="다색컴패니언 Why AX 표지" className="aspect-[16/7] w-full md:aspect-[16/5]" sampleBadge badgePosition="tr" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-5 text-white md:p-8">
            <StatusBadge status="DEMO" className="self-start" />
            <h2 className="mt-2 text-[22px] font-extrabold leading-tight md:text-[30px]">
              한 번 오고 끝나는 매장에서,
              <br />
              다시 오게 만드는 매장으로
            </h2>
            <p className="mt-1 text-[13px] text-white/85">다색컴패니언 Why AX · 기획 의도 (가설과 확인된 사실을 구분해 적었습니다)</p>
          </div>
        </div>

        <Sec id="s1" n={1} title="한 줄 요약">
          리얼식단(식단·샐러드)과 다색냥(고양이카페·디저트)이 <b>이미 만들고 있는 매장 매출</b>을, 회원·혜택·방문 확인으로 연결해 <b>재방문·재구매가 기록되고 관리되는 구조</b>로 바꾸는 것이 1차 목표입니다. 구독·커머스·AI 웰니스는 그 다음입니다.
        </Sec>

        <Sec id="s2" n={2} title="지금 매장의 모습">
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            <ul className="list-disc space-y-1 pl-5">
              <li>향동천 산책길의 한 매장에서 식단 메뉴(닭가슴살 샐러드·다이어트 도시락 등)와 고양이카페·120겹파이(4,500원)가 함께 판매되는 것으로 확인됩니다 <Tag tone="blue">제공 정보</Tag></li>
              <li>기본 음료는 머신, 추가 메뉴는 데스크 주문. 배달도 운영 중이라는 설명이 있으나 채널은 미확인 <Tag>미확인</Tag></li>
              <li>구매·방문은 대부분 오프라인에서 끝나고, 누가 다시 왔는지·무엇을 좋아했는지 남지 않습니다 <Tag tone="amber">가설</Tag></li>
            </ul>
            <AssetImage slot="why_ax_01_current" fallback={{ kind: 'space', variant: 0 }} alt="현재 매장 운영 장면" className="aspect-[4/3] rounded-xl" sampleBadge />
          </div>
        </Sec>

        <Sec id="s3" n={3} title="가장 큰 병목 (Primary Constraint · 가설)">
          <blockquote className="rounded-xl bg-ax-soft p-4 text-[14.5px] font-semibold text-slate-900">
            매장에서 구매·방문한 고객이 [누구인지·언제 다시 올지] 알 수 없어, 한 번의 이용이 재방문·재구매로 연결되지 못하는 매출 누수(REVENUE LEAK)가 있다. 이번 프로젝트의 핵심은 확인된 이용을 회원에 연결하고, 다시 올 이유(혜택·고양이·저장 메뉴)를 운영자가 관리하게 만드는 것이다.
          </blockquote>
          <p className="mt-2 text-[12.5px] text-slate-500">근거 데이터가 아직 없으므로 가설입니다. Week 0 Baseline에서 실제 재방문율을 측정해 검증합니다.</p>
        </Sec>

        <Sec id="s4" n={4} title="왜 지금인가">
          <ul className="list-disc space-y-1 pl-5">
            <li>두 브랜드가 한 공간에서 동시에 운영되어, 한쪽 고객을 다른 쪽으로 연결할 기회가 이미 존재합니다(교차 이용 측정 가능).</li>
            <li>산책길 입지는 반복 동선 고객이 생기기 쉬운 구조라 재방문 관리의 효과를 빠르게 확인할 수 있습니다(가설).</li>
            <li>정기픽업·구독을 결정하기 전에 실제 반복 수요 데이터가 필요합니다. 지금 기록을 시작해야 12주 뒤 판단할 수 있습니다.</li>
          </ul>
        </Sec>

        <Sec id="s5" n={5} title="업무 재설계 — 나쁜 프로세스를 자동화하지 않기">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[12.5px]">
              <thead className="text-slate-400">
                <tr>
                  {['현재 단계', '문제', '바꾸는 방식', 'AI 필요'].map((h) => (
                    <th key={h} className="pb-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['종이 스탬프·구두 혜택', '분실·중복·기록 없음', '제거 → 회원코드 + 직원 확인 버튼(표준화·디지털화)', '아니오'],
                  ['단골 기억은 직원 머릿속', '사람마다 다름', '확인 이용 이력이 회원에 자동 축적', '아니오'],
                  ['재방문 안내 없음', '이탈 고객 방치', '규칙 세그먼트 → 사람 승인 → 앱 알림', '아니오(RULE)'],
                  ['추천은 입소문뿐', '성과 측정 불가', '추천 코드 → 첫 확인 이용 후 보상(멱등)', '아니오'],
                  ['문안 작성', '시간 소요', '규칙 템플릿 → (선택) LLM 초안 + 승인', 'LLM 선택'],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) => (
                      <td key={i} className={cx('py-2', i === 0 && 'font-semibold')}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>

        <Sec id="s6" n={6} title="핵심 가치 3 · Money KPI 3">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['COST', '확인·응대 시간 감소', '확인 요청 처리 시간', k.costMedianMinutes == null ? '—' : `${k.costMedianMinutes}분 (DEMO)`],
              ['REVENUE', '재방문·재구매', '30일 확인 재이용률', k.revenueRepeatRate == null ? '—' : `${Math.round(k.revenueRepeatRate * 100)}% (DEMO)`],
              ['SCALE', '같은 인력으로 더 많은 단골', '운영자 1인당 활성 고객', `${k.scaleActivePerOperator ?? '—'}명 (DEMO)`],
            ].map(([a, b, c, d]) => (
              <div key={a} className="rounded-xl bg-slate-50 p-4">
                <p className="text-[11px] font-bold tracking-[0.14em] text-slate-400">{a}</p>
                <p className="text-[15px] font-extrabold text-slate-900">{b}</p>
                <p className="mt-1 text-[12.5px] text-slate-600">{c}</p>
                <p className="mt-1 text-[12.5px] font-semibold">{d}</p>
                <Tag tone="amber">Baseline UNKNOWN</Tag>
              </div>
            ))}
          </div>
        </Sec>

        <Sec id="s7" n={7} title="고객 ↔ AX 순환 (Closed Loop)">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['A. 친구 추천', ['추천 코드 가입', '첫 이용 요청', '직원 확인', '추천인 보상 확정', '고객 마이에 반영']],
              ['B. 저장 → 재구매', ['메뉴 저장', 'RULE 후보 생성', '책임자 승인·앱 알림', '확인 구매', '전환 Proof']],
              ['C. 고양이 → 방문', ['고양이 프로필 탐색', '오늘 코드 체크인', '직원 확인', '스탬프 +1', '재방문 세그먼트']],
            ].map(([t, steps]) => (
              <div key={t as string} className="rounded-xl bg-slate-50 p-4">
                <p className="text-[14px] font-extrabold text-slate-900">{t as string}</p>
                <ol className="mt-2 space-y-1">
                  {(steps as string[]).map((x, i) => (
                    <li key={x} className="flex flex-col items-start">
                      <span className="rounded-md bg-white px-2 py-1 text-[12.5px] font-semibold text-slate-700 ring-1 ring-slate-200">{x}</span>
                      {i < (steps as string[]).length - 1 && <ArrowDown className="ml-3 h-3.5 w-3.5 text-slate-300" />}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-slate-500">
            현재 DEMO 기준: 가입 {f.signedUp} → 첫 확인 이용 {f.firstUse} → 재이용 {f.repeat}. 모든 단계는 실제 화면에서 동작합니다.{' '}
            <Link href="/ax/queue" className="font-semibold text-ax-primary hover:underline">
              확인 큐 열기 <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </Sec>

        <Sec id="s8" n={8} title="쌓이는 데이터 (단일 기준 · Data Moat 정직 평가)">
          <p>회원·동의·메뉴·고양이·확인 방문·확인 구매·쿠폰·추천·보상 원장·캠페인·Proof를 한 곳(SSOT)에 저장합니다.</p>
          <p className="mt-2 font-semibold text-slate-900">12개월 뒤 가능해지는 것: 메뉴별 재구매 주기, 브랜드 교차 이용, 정기픽업 수요 규모, 혜택별 실제 공헌이익.</p>
          <p className="mt-2">
            Data Moat 자체 평가: <b>5 / 12 (중간)</b> — 반복성·Outcome 연결은 높지만, 아직 데이터 양이 없고 독점성은 매장 규모에 묶여 있습니다. 기술스택(Next.js·Supabase)은 해자가 아닙니다.
          </p>
        </Sec>

        <Sec id="s9" n={9} title="AI는 필요한 곳에만">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[12.5px]">
              <thead className="text-slate-400">
                <tr>
                  {['기능', '방식', '오류 비용', '승인', '상태'].map((h) => (
                    <th key={h} className="pb-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['메뉴 추천(왜? 포함)', 'RULE', 'LOW', '불필요', 'LIVE'],
                  ['재구매 후보·세그먼트', 'RULE', 'MID', '책임자 승인(L3)', 'LIVE'],
                  ['스탬프·추천 보상', 'RULE', 'MID', '직원 확인 후 자동', 'LIVE'],
                  ['KPI·전환 집계', 'ANALYTICS', 'LOW', '-', 'LIVE'],
                  ['캠페인 문안 초안', 'LLM(선택)', 'MID', '책임자 승인', 'READY'],
                  ['영양·알레르기·건강', 'HUMAN', 'HIGH', '검증 자료 전 표시 안 함', 'NEXT'],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) => (
                      <td key={i} className="py-2">
                        {i === 4 ? <Tag tone={c === 'LIVE' ? 'green' : c === 'READY' ? 'slate' : 'violet'}>{c}</Tag> : c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>

        <Sec id="s10" n={10} title="이번에 일부러 만들지 않은 것">
          <ul className="grid gap-1.5 md:grid-cols-2">
            {['실결제·구독 결제', 'POS·배달 플랫폼 자동 수집', '카카오·푸시 실발송', '자체 ML 학습', '영양·칼로리 자동 계산', '네이티브 앱', '다점포 SaaS·정산', '반려묘 건강 기록'].map((x) => (
              <li key={x} className="rounded-lg bg-slate-50 px-3 py-2 text-[13px]">
                ✕ {x}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[12.5px] text-slate-500">이유와 재검토 조건은 DECISIONS.md에 기록했습니다.</p>
        </Sec>

        <Sec id="s11" n={11} title="12주 실증 계획">
          Week 0 실제 Baseline 측정 → Week 1~4 직원 확인 습관화·첫 Proof → Week 5~8 재방문·재구매 캠페인 성과 → Week 9~12 Evidence Pack 정리.{' '}
          <Link href="/ax/evidence" className="font-semibold text-ax-primary hover:underline">
            실증 화면 보기
          </Link>
        </Sec>

        <Sec id="s12" n={12} title="직원에게 좋은 점 · 도입 위험">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_200px]">
            <div>
              <p className="font-bold text-slate-900">좋은 점</p>
              <ul className="mt-1 list-disc pl-5">
                <li>도장·종이 쿠폰 관리 제거</li>
                <li>단골 정보가 화면에 정리</li>
                <li>오늘 할 일 3개 이내</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-900">위험</p>
              <ul className="mt-1 list-disc pl-5">
                <li>바쁜 시간 확인 지연</li>
                <li>직원 확인 누락 → 실적 공백</li>
                <li>혜택 원가 미확정</li>
              </ul>
            </div>
            <AssetImage slot="ax_staff_action" fallback={{ kind: 'pie', variant: 0 }} alt="직원 업무 장면" className="aspect-[4/3] rounded-xl" sampleBadge />
          </div>
        </Sec>

        <Sec id="s13" n={13} title="성장 로드맵 (현재 70% · 향후 30%)">
          <div className="grid gap-2 md:grid-cols-3">
            {ROADMAP.map((r) => (
              <div key={r.key} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[13.5px] font-bold text-slate-900">
                  {r.emoji} {r.title} <Tag tone="violet">NEXT</Tag>
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500">{r.oneLine}</p>
                <p className="mt-1 text-[11.5px] text-slate-400">관심 {s.roadmapInterest.filter((x) => x.itemKey === r.key).length}명</p>
              </div>
            ))}
          </div>
        </Sec>

        <Sec id="s14" n={14} title="정부 스토리와 투자 스토리는 따로">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-bold text-slate-900">정부·정책 관점</p>
              <p className="mt-1">현장 문제(재방문 관리 부재) → 직원 확인 기반 실증 → 생산성(처리 시간)·매출(재이용) 지표 → 지역 소상공인 확산 가능성.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-bold text-slate-900">투자·성장 관점</p>
              <p className="mt-1">반복 수요 데이터 → 정기픽업 반복매출 → Unit Economics 확인 → 다른 매장 확장. 아직 숫자가 없으므로 주장하지 않습니다.</p>
            </div>
          </div>
          <p className="mt-2 text-[12.5px] text-slate-500">투자·LIPS·정책금융은 장기 경로이며, 선정·승인을 보장하지 않습니다.</p>
        </Sec>

        <Sec id="s15" n={15} title="스스로 던지는 질문 (Devil Questions)">
          <ul className="space-y-1.5">
            <li>
              <b>정책자금이 없어도 만들 이유가 있나?</b> 예 — 종이 스탬프 대체와 재방문 관리만으로도 매장 운영 가치가 있습니다(단, 실제 효과는 미검증).
            </li>
            <li>
              <b>누가 반복적으로 쓰나?</b> 직원(확인 버튼)과 회원(체크인·쿠폰). 실제 사용률은 Week 1~4에 측정합니다.
            </li>
            <li>
              <b>변화가 AX 때문이라는 근거는?</b> 승인된 캠페인 → 해당 고객의 확인 이용을 Proof로 연결해 추적합니다.
            </li>
            <li>
              <b>12개월 뒤 남는 것은?</b> 회원별 확인 이용 이력과 메뉴별 재구매 주기 데이터, 표준 운영 절차.
            </li>
            <li>
              <b>자본을 더 넣으면 무엇이 빨라지나?</b> 아직 답이 약합니다. 정기픽업 수요가 확인되기 전에는 강점으로 포장하지 않습니다.
            </li>
          </ul>
        </Sec>

        <Sec id="s16" n={16} title="확인이 필요한 것">
          <ul className="grid gap-1.5 md:grid-cols-2">
            {['두 사업의 사업자번호·매출 귀속·데이터 처리 주체', '리얼식단 가맹 여부·상표·메뉴 이미지 사용 범위', '전체 영업시간·휴무일·이용요금', '실제 고양이 수·이름·사진(권리 확인)', '메뉴 가격·원재료·알레르기 정보', '혜택 원가와 확정 혜택 내용', '배달·온라인 주문 채널', 'AX Owner 지정'].map((x) => (
              <li key={x} className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                ? {x}
              </li>
            ))}
          </ul>
        </Sec>
      </div>
    </div>
  );
}
