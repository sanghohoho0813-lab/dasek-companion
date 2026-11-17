'use client';
import { Megaphone, Pause, Play, Send, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Locked, PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { Button, PageSkeleton, Sheet, StatusBadge, axInputCls, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { getProfile, segmentMembers, SEGMENTS } from '@/lib/rules';
import { opAct } from '@/lib/store';
import type { Campaign, SegmentKey } from '@/lib/types';
import { cx, fmtDate } from '@/lib/util';
import { StatusPill, statusOf } from '@/components/ui/Status';

function Inner() {
  const { s, can } = useOperator();
  const sp = useSearchParams();
  const run = useRun();
  const [draft, setDraft] = useState<{ segment: SegmentKey; name: string; title: string; body: string; channel: Campaign['channel'] } | null>(null);
  useEffect(() => {
    const seg = sp.get('segment') as SegmentKey | null;
    if (seg && SEGMENTS[seg]) setDraft({ segment: seg, name: SEGMENTS[seg].label, channel: 'IN_APP', ...D.campaignTemplate(seg) });
  }, [sp]);
  if (!s) return <PageSkeleton />;
  const segs = (Object.keys(SEGMENTS) as SegmentKey[]).map((k) => ({ k, ...SEGMENTS[k], n: segmentMembers(s, k).length }));
  return (
    <div className="space-y-4">
      <PageIntro title="캠페인" body="규칙(세그먼트)이 대상과 문안 초안을 만들고, 운영 책임자가 승인한 것만 마케팅 수신 동의 고객에게 앱 알림으로 보냅니다. 성과는 발송 수가 아니라 이후 '직원확인 이용'으로만 측정해요." />
      <Panel title="대상 세그먼트 (RULE)" sub="앱 알림 수신 동의자만 포함">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {segs.map((g) => (
            <div key={g.k} className="flex flex-col rounded-xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[0.9375rem] font-bold text-slate-900">{g.label}</p>
                <span className="text-[1.25rem] font-extrabold text-slate-900 tabular">{g.n}명</span>
              </div>
              <p className="mt-1 text-[0.8125rem] text-slate-500">규칙: {g.rule}</p>
              <ul className="mt-2 flex-1 space-y-0.5 text-[0.8125rem] text-slate-600">
                {g.why.map((w) => (
                  <li key={w}>· {w}</li>
                ))}
              </ul>
              <Button tone="ax" variant="outline" size="sm" className="mt-3 self-start" disabled={!can('campaign.create') || g.n === 0} onClick={() => setDraft({ segment: g.k, name: g.label, channel: 'IN_APP', ...D.campaignTemplate(g.k) })} data-testid={`seg-${g.k}`}>
                <Megaphone className="h-3.5 w-3.5" /> 초안 만들기
              </Button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="캠페인 목록">
        <ul className="divide-y divide-slate-100">
          {s.campaigns.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 text-[0.9375rem] font-bold text-slate-900">
                  {c.name}
                  <StatusPill kind={statusOf.campaign(c.status)} label={{ DRAFT: '초안', APPROVED: '승인', SENT: '발송 완료', PAUSED: '중지' }[c.status]} size="sm" />
                  <Tag>{{ IN_APP: '앱 알림', KAKAO: '카카오', PUSH: '푸시' }[c.channel]}</Tag>
                  {c.isDemo && <Tag tone="amber">DEMO</Tag>}
                </p>
                <p className="mt-0.5 text-[0.8438rem] text-slate-500">
                  “{c.title}” — {c.body}
                </p>
                <p className="mt-0.5 text-[0.8125rem] text-slate-500">
                  작성 {getProfile(s, c.createdBy)?.name ?? c.createdBy} · {fmtDate(c.createdAt)} {c.sentAt && `· 승인 ${getProfile(s, c.approvedBy)?.name} · ${fmtDate(c.sentAt, { time: true })} 발송 ${c.recipients}명`} {!c.sentAt && `· 예상 대상 ${segmentMembers(s, c.segment).length}명`}
                </p>
              </div>
              {c.status !== 'SENT' &&
                (can('campaign.approve') ? (
                  <div className="flex gap-2">
                    <Button tone="ax" variant="ghost" size="sm" onClick={() => run(() => opAct((d, ctx) => D.pauseCampaign(d, ctx, c.id)))}>
                      {c.status === 'PAUSED' ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />} {c.status === 'PAUSED' ? '재개' : '중지'}
                    </Button>
                    <Button tone="ax" size="sm" disabled={c.status === 'PAUSED'} onClick={() => run(() => opAct((d, ctx) => D.approveAndSendCampaign(d, ctx, c.id)), '승인하고 앱 알림으로 발송했어요.')} data-testid="campaign-send">
                      <Send className="h-3.5 w-3.5" /> 승인·발송
                    </Button>
                  </div>
                ) : (
                  <Locked reason="승인은 책임자" />
                ))}
            </li>
          ))}
        </ul>
      </Panel>
      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        tone="ax"
        title="캠페인 초안"
        description={draft ? `${SEGMENTS[draft.segment].label} · 대상 ${segmentMembers(s, draft.segment).length}명` : ''}
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setDraft(null)}>
              취소
            </Button>
            <Button
              tone="ax"
              data-testid="campaign-create"
              onClick={() => {
                const ok = run(() => opAct((d, c) => D.createCampaign(d, c, draft!)), '초안을 저장했어요. 책임자 승인 후 발송돼요.');
                if (ok) setDraft(null);
              }}
            >
              초안 저장
            </Button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-3 text-[0.875rem]">
            <div>
              <p className="font-semibold text-slate-600">채널</p>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    ['IN_APP', '앱 알림', true],
                    ['KAKAO', '카카오', false],
                    ['PUSH', '푸시', false],
                  ] as [Campaign['channel'], string, boolean][]
                ).map(([v, l, ok]) => (
                  <button key={v} disabled={!ok} onClick={() => setDraft({ ...draft, channel: v })} className={cx('flex h-10 items-center justify-center gap-1 rounded-lg text-[0.875rem] font-bold ring-1 disabled:opacity-50', draft.channel === v ? 'bg-ax-primary text-white ring-ax-primary' : 'bg-white text-slate-600 ring-slate-200')}>
                    {l} {!ok && <StatusBadge status="READY" />}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[0.8125rem] text-slate-500">카카오·푸시는 수신동의·발송 인프라·요금 확인 전까지 연결하지 않아요.</p>
            </div>
            <label className="block font-semibold text-slate-600">
              캠페인 이름
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={cx(axInputCls, 'mt-1')} />
            </label>
            <label className="block font-semibold text-slate-600">
              제목 ((광고) 표시는 자동)
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={cx(axInputCls, 'mt-1')} />
            </label>
            <label className="block font-semibold text-slate-600">
              본문
              <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={3} className={cx(axInputCls, 'mt-1 h-auto py-2')} />
            </label>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[0.8438rem] text-slate-600">
                <Sparkles className="h-4 w-4 text-slate-500" /> AI 문안 다듬기 (LLM)
              </span>
              <StatusBadge status="READY" label="API 키 연결 전" />
            </div>
            <p className="text-[0.8125rem] text-slate-500">현재 초안은 세그먼트별 규칙 템플릿(TEMPLATE_RULE)입니다. 실제 메뉴·공개 콘텐츠에 없는 혜택·효능을 쓰지 마세요.</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
