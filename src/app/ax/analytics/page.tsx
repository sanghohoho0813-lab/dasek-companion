'use client';
import { PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { DailyChart, EvidenceBars } from '@/components/ax/widgets';
import { PageSkeleton } from '@/components/ui';
import { ROADMAP } from '@/lib/roadmap';
import { customers, dailyVerified, evidenceLevels, funnel, getMenuItem, verifiedUses } from '@/lib/rules';
import { DAY } from '@/lib/util';

export default function AnalyticsPage() {
  const { s } = useOperator();
  if (!s) return <PageSkeleton />;
  const since = Date.now() - 30 * DAY;
  const f = funnel(s);
  const uses = verifiedUses(s).filter((u) => new Date(u.at).getTime() > since);
  const byStore = s.stores.map((st) => ({ st, visits: uses.filter((u) => u.storeId === st.id && u.kind === 'VISIT').length, buys: uses.filter((u) => u.storeId === st.id && u.kind === 'PURCHASE').length, amount: uses.filter((u) => u.storeId === st.id).reduce((n, u) => n + (u.amount ?? 0), 0) }));
  const cross = customers(s).filter((c) => {
    const u = verifiedUses(s, c.id);
    return u.some((x) => x.storeId === 'store_dasek') && u.some((x) => x.storeId === 'store_realsicdan');
  }).length;
  const menuCount = new Map<string, { buys: number; favs: number; views: number }>();
  for (const m of s.menuItems) menuCount.set(m.id, { buys: 0, favs: s.favorites.filter((f) => f.menuItemId === m.id).length, views: s.events.filter((e) => e.type === 'view_menu' && e.ref === m.id).length });
  for (const u of uses) for (const id of u.menuItemIds) menuCount.get(id) && (menuCount.get(id)!.buys += 1);
  const menuRows = [...menuCount.entries()].map(([id, v]) => ({ m: getMenuItem(s, id)!, ...v })).sort((a, b) => b.buys + b.favs - (a.buys + a.favs));
  const catViews = s.cats.map((c) => ({ c, n: s.events.filter((e) => e.type === 'view_cat' && e.ref === c.id).length })).sort((a, b) => b.n - a.n);
  const maxCat = Math.max(1, ...catViews.map((x) => x.n));
  const roadmap = ROADMAP.map((r) => ({ r, n: s.roadmapInterest.filter((x) => x.itemKey === r.key).length, notify: s.roadmapInterest.filter((x) => x.itemKey === r.key && x.notifyConsent).length })).sort((a, b) => b.n - a.n);
  const steps = [
    ['가입', f.signedUp],
    ['첫 확인 이용', f.firstUse],
    ['재이용(2회+)', f.repeat],
  ] as const;
  return (
    <div className="space-y-4">
      <PageIntro title="고객 행동·전환" body="모든 수치는 집계(ANALYTICS)이며 AI 예측이 아닙니다. 근거 수준(클릭 < 자가신고 < 직원확인 < POS)을 섞지 않고, 매출 금액은 직원이 입력한 경우만 합산해요." right={<Tag tone="amber">DEMO 시드 데이터</Tag>} />
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="가입 → 확인 이용 전환" className="xl:col-span-2">
          <div className="grid grid-cols-3 gap-2">
            {steps.map(([l, v], i) => (
              <div key={l} className="rounded-xl bg-slate-50 p-4">
                <p className="text-[0.8125rem] font-semibold text-slate-500">{l}</p>
                <p className="mt-1 text-[1.625rem] font-extrabold text-slate-900 tabular">{v}</p>
                {i > 0 && <p className="text-[0.8125rem] text-slate-500">이전 단계 대비 {Math.round((v / Math.max(1, steps[i - 1][1])) * 100)}%</p>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.8125rem] text-slate-500">
            추천 가입 {f.referred}명 중 보상 확정 {f.referralRewarded}명 · 두 브랜드 모두 확인 이용한 고객 {cross}명 (교차 이용)
          </p>
        </Panel>
        <Panel title="근거 수준 (30일)">
          <EvidenceBars levels={evidenceLevels(s)} />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="매장별 확인 이용 (30일)" sub="매출 귀속은 사업자 확인 전 — 매장 단위로만 분리">
          <table className="ax-table w-full text-left text-[0.875rem]">
            <thead className="text-[0.8125rem] text-slate-500">
              <tr>
                <th className="pb-2 font-semibold">매장</th>
                <th className="pb-2 text-right font-semibold">방문</th>
                <th className="pb-2 text-right font-semibold">구매</th>
                <th className="pb-2 text-right font-semibold">입력 금액 합</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byStore.map((r) => (
                <tr key={r.st.id}>
                  <td className="py-2 font-semibold">{r.st.name}</td>
                  <td className="py-2 text-right tabular">{r.visits}</td>
                  <td className="py-2 text-right tabular">{r.buys}</td>
                  <td className="py-2 text-right tabular">{r.amount ? `${r.amount.toLocaleString()}원` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="최근 14일 확인 이용">
          <DailyChart data={dailyVerified(s)} />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="메뉴별 관심·구매" sub="저장 = 관심 신호, 구매 = 직원확인 구매(30일)">
          <table className="ax-table w-full text-left text-[0.875rem]">
            <thead className="text-[0.8125rem] text-slate-500">
              <tr>
                <th className="pb-2 font-semibold">메뉴</th>
                <th className="pb-2 text-right font-semibold">조회</th>
                <th className="pb-2 text-right font-semibold">저장</th>
                <th className="pb-2 text-right font-semibold">확인 구매</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menuRows.slice(0, 8).map((r) => (
                <tr key={r.m.id}>
                  <td className="py-2">
                    <span className="font-semibold">{r.m.name}</span> {r.m.isDemo && <Tag tone="amber">예시</Tag>}
                  </td>
                  <td className="py-2 text-right tabular text-slate-500">{r.views}</td>
                  <td className="py-2 text-right tabular">{r.favs}</td>
                  <td className="py-2 text-right font-bold tabular">{r.buys}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="space-y-4">
          <Panel title="고양이 프로필 조회" sub="방문 의향 신호 · 회원+비회원">
            <ul className="space-y-2">
              {catViews.map((x) => (
                <li key={x.c.id} className="flex items-center gap-3 text-[0.875rem]">
                  <span className="w-14 shrink-0 font-semibold">{x.c.name}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full origin-left animate-grow rounded-full bg-[#D79A43]" style={{ width: `${(x.n / maxCat) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-bold tabular">{x.n}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="향후 서비스 관심도" sub="수요 검증용 · 출시 알림 동의 포함">
            <ul className="space-y-1.5 text-[0.875rem]">
              {roadmap.map((x) => (
                <li key={x.r.key} className="flex items-center justify-between">
                  <span>
                    {x.r.emoji} {x.r.title}
                  </span>
                  <span className="text-slate-500">
                    <b className="text-slate-900">{x.n}</b>명 · 알림 {x.notify}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
