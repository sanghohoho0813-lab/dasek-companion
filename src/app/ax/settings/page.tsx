'use client';
import { Check, Pencil } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Locked, PageIntro, Panel, Tag, useOpenTutorial, useOperator } from '@/components/ax/Shell';
import { Button, EvidenceBadge, PageSkeleton, Segmented, Sheet, axInputCls, useRun, useToast } from '@/components/ui';
import * as D from '@/lib/domain';
import { ALL_PERMISSIONS, can as canRole, PERMISSION_LABEL } from '@/lib/permissions';
import { evidenceSummary, getProfile } from '@/lib/rules';
import { dispatch, opAct, resetDemo } from '@/lib/store';
import { AX_THEMES } from '@/lib/themes';
import type { FontScale, Store } from '@/lib/types';
import { cx, fmtDate } from '@/lib/util';

const INTEGRATIONS: { name: string; status: 'LIVE' | 'DEMO' | 'READY' | 'NEXT'; note: string }[] = [
  { name: '데이터 저장소', status: 'DEMO', note: '브라우저 localStorage — 같은 브라우저에서만 보이고, 사용자가 조작할 수 있어 운영 사용 불가. 사진 포함 약 5MB 한도' },
  { name: 'Supabase 운영 전환', status: 'NEXT', note: '스키마·RLS는 초안, 서버 RPC 대부분 미구현(TODO). 키만 입력해서는 동작하지 않음 — docs/LIVE_TRANSITION_CHECKLIST.md' },
  { name: '회원 인증', status: 'DEMO', note: '번호 일치 로그인. 운영 시 Supabase Auth 휴대폰 OTP' },
  { name: '규칙 엔진 (추천·세그먼트·재구매·스탬프)', status: 'LIVE', note: '앱 내에서 실제 계산 — AI 모델 아님' },
  { name: 'LLM 문안 초안·쉬운 설명', status: 'READY', note: 'API 키 미연결. 서버 Route에서만 호출 예정' },
  { name: '네이버 예약 링크', status: 'LIVE', note: '외부 링크 이동만. 예약 확정·데이터 수집 없음' },
  { name: '외부 주문·배달 링크', status: 'READY', note: '채널 미확인 — 운영자가 매장 정보에서 입력' },
  { name: 'POS·키오스크·배달 플랫폼 데이터', status: 'NEXT', note: '합법적 연동권 확인 전 자동수집·스크래핑 금지' },
  { name: '카카오·푸시 발송', status: 'NEXT', note: '수신동의·발송 인프라·요금 확인 전 미발송' },
  { name: '결제·구독', status: 'NEXT', note: '정기픽업 수요 검증 후' },
  { name: '메뉴 CSV 가져오기', status: 'READY', note: '메뉴 권리·가맹 정책 확인 후' },
];

function StoreFacts({ store, canEdit }: { store: Store; canEdit: boolean }) {
  const run = useRun();
  const [edit, setEdit] = useState<null | { field: 'hours' | 'phone' | 'reservationUrl' | 'orderUrl' | 'deliveryUrl' | 'feeInfo'; label: string; value: string }>(null);
  const rows: [string, keyof Store, boolean][] = [
    ['주소', 'address', false],
    ['찾아오는 길', 'directions', false],
    ['영업시간', 'hours', true],
    ['전화', 'phone', true],
    ['예약 링크', 'reservationUrl', true],
    ['온라인 주문 링크', 'orderUrl', true],
    ['배달 링크', 'deliveryUrl', true],
    ['이용요금', 'feeInfo', true],
  ];
  return (
    <Panel title={store.name} sub="값 · 근거 상태 · 출처">
      <ul className="divide-y divide-slate-100">
        {rows.map(([label, key, editable]) => {
          const f = store[key] as Store['address'];
          return (
            <li key={label} className="flex flex-col gap-1 py-2.5 md:flex-row md:items-center md:gap-3">
              <span className="w-28 shrink-0 text-[0.8438rem] font-semibold text-slate-500">{label}</span>
              <span className="min-w-0 flex-1 text-[0.875rem] text-slate-900">
                {f.value ?? <span className="text-slate-500">미입력</span>}
                <span className="block text-[0.8125rem] text-slate-500">{f.source}</span>
              </span>
              <EvidenceBadge ev={f.evidence} />
              {editable && canEdit && (
                <button onClick={() => setEdit({ field: key as 'hours', label, value: f.value ?? '' })} className="grid h-11 w-11 lg:h-7 lg:w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700" aria-label={`${label} 수정`}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <Sheet
        open={!!edit}
        onClose={() => setEdit(null)}
        tone="ax"
        title={`${store.name} · ${edit?.label}`}
        description="운영자가 직접 확인한 값만 입력하세요. 저장하면 '운영자 확인'으로 표시돼요."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setEdit(null)}>
              취소
            </Button>
            <Button tone="ax" onClick={() => { const ok = run(() => opAct((d, c) => D.updateStoreFact(d, c, store.id, edit!.field, edit!.value)), '저장했어요.'); if (ok !== undefined) setEdit(null); }}>
              저장
            </Button>
          </div>
        }
      >
        {edit && <input value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} className={axInputCls} placeholder={edit.field.endsWith('Url') ? 'https://' : ''} />}
      </Sheet>
    </Panel>
  );
}

function Inner() {
  const { s, op, can } = useOperator();
  const sp = useSearchParams();
  const toast = useToast();
  const openTutorial = useOpenTutorial();
  const [tab, setTab] = useState<'general' | 'roles' | 'store' | 'data' | 'audit'>((sp.get('tab') as 'data') ?? 'general');
  const [reset, setReset] = useState(false);
  if (!s) return <PageSkeleton />;
  return (
    <div className="space-y-4">
      <PageIntro title="설정·역할·데이터" body="테마와 글자 크기, 역할별 권한, 매장 정보의 근거 상태, 연동·데이터 상태와 감사 기록을 관리합니다." />
      <Segmented
        tone="ax"
        label="설정 구분"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'general', label: '화면' },
          { value: 'roles', label: '역할·권한' },
          { value: 'store', label: '매장 정보' },
          { value: 'data', label: '데이터·권리' },
          { value: 'audit', label: '감사 기록' },
        ]}
      />
      {tab === 'general' && (
        <div className="space-y-4">
          <Panel title="운영 AX 테마 (7종)" sub="고객 화면은 다색컴패니언 브랜드 테마로 고정 · PC와 모바일 미리보기에 함께 적용" testId="theme-picker">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {AX_THEMES.map((t) => {
                const on = s.settings.axTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      dispatch((d) => void (d.settings.axTheme = t.id));
                      toast(`${t.name} 테마로 바꿨어요.`, 'info');
                    }}
                    aria-pressed={on}
                    data-testid={`theme-${t.id}`}
                    className={cx('lift rounded-xl p-3 text-left ring-2 transition', on ? 'ring-ax-primary' : 'ring-axline hover:ring-slate-300')}
                  >
                    <div className="flex h-14 overflow-hidden rounded-lg ring-1 ring-black/5">
                      <div className="w-1/3" style={{ background: t.colors[0] }} />
                      <div className="flex flex-1 flex-col">
                        <div className="flex-1" style={{ background: t.colors[5] }} />
                        <div className="flex h-5">
                          {t.colors.slice(1, 5).map((c) => (
                            <div key={c} className="flex-1" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 flex items-center justify-between text-[0.875rem] font-bold text-slate-900">
                      {t.name}
                      {on && <Check className="h-4 w-4 text-ax-primary" />}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="글자 크기">
              <Segmented<FontScale>
                tone="ax"
                label="글자 크기"
                value={s.settings.fontScale}
                onChange={(v) => dispatch((d) => void (d.settings.fontScale = v))}
                options={[
                  { value: 'sm', label: '작게' },
                  { value: 'md', label: '보통' },
                  { value: 'lg', label: '크게' },
                ]}
              />
              <p className="mt-2 text-[0.8125rem] text-slate-500">움직임 줄이기는 기기의 '동작 줄이기' 설정을 그대로 따릅니다.</p>
            </Panel>
            <Panel title="둘러보기 · 데모">
              <div className="flex flex-wrap gap-2">
                <Button tone="ax" variant="outline" onClick={openTutorial}>
                  둘러보기 다시 보기
                </Button>
                <Button tone="ax" variant="outline" onClick={() => setReset(true)}>
                  데모 데이터 초기화
                </Button>
              </div>
              <p className="mt-2 text-[0.8125rem] text-slate-500">초기화해도 테마·글자 크기는 유지돼요.</p>
            </Panel>
          </div>
        </div>
      )}
      {tab === 'roles' && (
        <Panel title="역할별 권한" sub={`현재 미리보기: ${op?.name} — 상단 '책임자/직원' 전환으로 화면 잠금을 바로 확인할 수 있어요. 운영 시 Supabase RLS로 같은 규칙을 강제합니다.`}>
          <div className="overflow-x-auto">
            <table className="ax-table w-full min-w-[520px] text-left text-[0.875rem]" data-testid="permission-matrix">
              <thead className="border-b border-slate-100 text-[0.8125rem] text-slate-500">
                <tr>
                  <th className="pb-2 font-semibold">권한</th>
                  <th className="pb-2 text-center font-semibold">매장 직원</th>
                  <th className="pb-2 text-center font-semibold">운영 책임자</th>
                  <th className="pb-2 text-center font-semibold">고객</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ALL_PERMISSIONS.map((p) => (
                  <tr key={p}>
                    <td className="py-2">{PERMISSION_LABEL[p]}</td>
                    {(['staff', 'manager', 'customer'] as const).map((r) => (
                      <td key={r} className="py-2 text-center">
                        {canRole(r, p) ? <Check className="mx-auto h-4 w-4 text-emerald-600" /> : <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[0.8125rem] text-slate-500">고객은 본인 기록·쿠폰만 볼 수 있어요. 직원은 담당 매장 업무만, 책임자는 사업·매장 관리 전체를 다룹니다. 두 사업자의 데이터 분리가 확정되면 business_entity 단위로 접근을 나눕니다.</p>
        </Panel>
      )}
      {tab === 'store' && (
        <div className="space-y-4">
          {!can('settings.store') && <Locked reason="매장 정보 수정은 책임자 권한" />}
          {s.stores.map((st) => (
            <StoreFacts key={st.id} store={st} canEdit={can('settings.store')} />
          ))}
        </div>
      )}
      {tab === 'data' && (
        <div className="space-y-4">
          <Panel title="연동·기능 상태" sub="LIVE 실제 동작 · DEMO 시연 데이터 · READY 연결 구조 준비 · NEXT 향후">
            <ul className="divide-y divide-slate-100">
              {INTEGRATIONS.map((i) => (
                <li key={i.name} className="flex flex-col gap-1 py-2.5 md:flex-row md:items-center md:gap-3">
                  <span className="w-72 shrink-0 text-[0.9375rem] font-semibold text-slate-900">{i.name}</span>
                  <Tag tone={i.status === 'LIVE' ? 'green' : i.status === 'DEMO' ? 'amber' : i.status === 'READY' ? 'slate' : 'violet'}>{i.status}</Tag>
                  <span className="text-[0.8438rem] text-slate-500">{i.note}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="사실 정보 근거 현황" sub="VERIFIED / USER_PROVIDED / ASSUMPTION / UNKNOWN">
            <div className="overflow-x-auto">
              <table className="ax-table w-full min-w-[640px] text-left text-[0.875rem]">
                <thead className="border-b border-slate-100 text-[0.8125rem] text-slate-500">
                  <tr>
                    <th className="pb-2 font-semibold">대상</th>
                    <th className="pb-2 font-semibold">항목</th>
                    <th className="pb-2 font-semibold">근거</th>
                    <th className="pb-2 font-semibold">출처·메모</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evidenceSummary(s).map((r, i) => (
                    <tr key={i}>
                      <td className="py-2 font-semibold">{r.area}</td>
                      <td className="py-2">{r.item}</td>
                      <td className="py-2">
                        <EvidenceBadge ev={r.evidence as 'UNKNOWN'} />
                      </td>
                      <td className="py-2 text-[0.8125rem] text-slate-500">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="데이터 처리 원칙">
            <ul className="list-disc space-y-1 pl-5 text-[0.875rem] text-slate-600">
              <li>원본 전화번호 미저장(해시 + 뒤 4자리). 건강·알레르기·정서·반려묘 건강 정보는 1차에서 수집하지 않음.</li>
              <li>마케팅 동의는 목적별·버전별·철회 시각 기록. 동의 없는 고객에게 마케팅 알림 미발송.</li>
              <li>DEMO 시드는 isDemo 플래그로 구분 — 운영 KPI 집계에서 제외 예정.</li>
              <li>인스타그램·네이버 리뷰 사진·로고는 권리 확인 전 미사용. 공개정보 중 사실 항목만 출처와 함께 사용.</li>
            </ul>
          </Panel>
        </div>
      )}
      {tab === 'audit' && (
        <Panel title="감사 기록" sub="누가 · 언제 · 무엇을 바꿨는지 (최근 80건)">
          <ul className="divide-y divide-slate-100">
            {s.auditLogs.slice(0, 80).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 py-2 text-[0.8438rem]">
                <Tag>{a.action}</Tag>
                <span className="font-semibold text-slate-800">{getProfile(s, a.actorId)?.name ?? a.actorRole}</span>
                <span className="min-w-0 flex-1 truncate text-slate-500">
                  {a.target} {a.detail && `· ${a.detail}`}
                </span>
                <span className="text-slate-500">{fmtDate(a.at, { time: true })}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <Sheet
        open={reset}
        onClose={() => setReset(false)}
        tone="ax"
        title="데모 데이터를 초기화할까요?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setReset(false)}>
              취소
            </Button>
            <Button tone="ax" onClick={() => { resetDemo(); setReset(false); toast('초기화했어요.'); }}>
              초기화
            </Button>
          </div>
        }
      >
        <p className="text-[0.875rem] text-slate-600">시연 기록이 처음 상태로 돌아가요.</p>
      </Sheet>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
