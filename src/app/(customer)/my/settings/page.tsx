'use client';
import { useState } from 'react';
import { LoginGate } from '@/components/customer/parts';
import { BackHeader, useCustomer } from '@/components/customer/Shell';
import { Button, PageSkeleton, Segmented, Sheet, Toggle, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { hasConsent } from '@/lib/rules';
import { act, dispatch } from '@/lib/store';
import type { ConsentPurpose, FontScale } from '@/lib/types';
import { fmtDate } from '@/lib/util';

const OPT: { k: ConsentPurpose; l: string; d: string; ready: boolean }[] = [
  { k: 'marketing_inapp', l: '앱 안 혜택 알림', d: '저장한 메뉴·재방문 혜택 안내를 알림함으로 받아요.', ready: true },
  { k: 'marketing_push', l: '푸시 알림 (준비 중)', d: '동의해도 발송 인프라 준비 전까지 보내지 않아요.', ready: false },
  { k: 'marketing_kakao', l: '카카오 알림 (준비 중)', d: '동의해도 채널·정책 확인 전까지 보내지 않아요.', ready: false },
];

export default function SettingsPage() {
  const { s, me } = useCustomer();
  const run = useRun();
  const [del, setDel] = useState(false);
  if (!s) return <PageSkeleton />;
  if (!me) return <div className="mx-auto max-w-md p-5"><LoginGate next="/my/settings" /></div>;
  const history = s.consents.filter((c) => c.userId === me.id).sort((a, b) => (a.at < b.at ? 1 : -1));
  return (
    <div>
      <BackHeader title="동의·개인정보 설정" fallback="/my" />
      <div className="mx-auto max-w-2xl px-4 pb-10 pt-4 md:px-5 md:pt-10">
        <h1 className="hidden text-[24px] font-extrabold text-ink md:block">동의·개인정보 설정</h1>
        <section className="mt-0 rounded-3xl bg-white ring-1 ring-line md:mt-4">
          <p className="px-5 pt-5 text-[15px] font-extrabold text-ink">마케팅 수신 동의</p>
          <ul className="divide-y divide-line">
            {OPT.map((o) => (
              <li key={o.k} className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="text-[14.5px] font-semibold text-ink">{o.l}</p>
                  <p className="text-[12.5px] text-ink-3">{o.d}</p>
                </div>
                <Toggle checked={hasConsent(s, me.id, o.k)} onChange={(v) => run(() => act((d, c) => D.setConsent(d, c, me.id, o.k, v)), v ? '수신에 동의했어요.' : '수신 동의를 철회했어요.')} label={o.l} testId={`toggle-${o.k}`} />
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-line">
          <p className="text-[15px] font-extrabold text-ink">글자 크기</p>
          <div className="mt-3">
            <Segmented<FontScale>
              label="글자 크기"
              value={s.settings.fontScale}
              onChange={(v) => dispatch((d) => void (d.settings.fontScale = v))}
              options={[
                { value: 'sm', label: '작게' },
                { value: 'md', label: '보통' },
                { value: 'lg', label: '크게' },
              ]}
            />
          </div>
        </section>
        <section className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-line">
          <p className="text-[15px] font-extrabold text-ink">동의 이력</p>
          <ul className="mt-3 space-y-1.5 text-[12.5px]">
            {history.slice(0, 12).map((c) => (
              <li key={c.id} className="flex justify-between gap-3 text-ink-2">
                <span>
                  {c.purpose} · {c.granted ? '동의' : '미동의'} {c.withdrawnAt && <span className="text-ink-4">(변경됨 {fmtDate(c.withdrawnAt)})</span>}
                </span>
                <span className="shrink-0 text-ink-4">
                  {fmtDate(c.at, { time: true })} · v{c.version}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-line">
          <p className="text-[15px] font-extrabold text-ink">탈퇴·정보 삭제</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">요청하면 운영자가 확인 후 개인정보를 삭제(익명화)해요. 사용하지 않은 쿠폰은 소멸돼요. 거래 확인 기록은 법정 보관 기준 확인 후 처리돼요.</p>
          {me.status === 'deletion_requested' ? (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[13px] font-semibold text-amber-900">삭제 요청이 접수되어 처리 대기 중이에요.</p>
          ) : (
            <Button variant="outline" className="mt-3" onClick={() => setDel(true)}>
              탈퇴·삭제 요청
            </Button>
          )}
        </section>
      </div>
      <Sheet
        open={del}
        onClose={() => setDel(false)}
        title="정말 탈퇴를 요청할까요?"
        description="요청 후에는 쿠폰·스탬프를 사용할 수 없어요."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDel(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={() => { run(() => act((d, c) => D.requestDeletion(d, c, me.id)), '삭제 요청을 접수했어요.'); setDel(false); }}>
              요청하기
            </Button>
          </div>
        }
      >
        <span />
      </Sheet>
    </div>
  );
}
