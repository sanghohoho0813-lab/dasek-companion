'use client';
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import { AssetImage } from '@/components/art/AssetImage';
import { Locked, PageIntro, Panel, Tag, useOperator } from '@/components/ax/Shell';
import { Button, EvidenceBadge, PageSkeleton, Segmented, Sheet, Toggle, axInputCls, useRun } from '@/components/ui';
import * as D from '@/lib/domain';
import { opAct } from '@/lib/store';
import type { AppState, CafeCat, Evidence, MenuItem } from '@/lib/types';
import { cx, won } from '@/lib/util';

/** 업로드 이미지를 최대 960px JPEG로 줄여 저장(DEMO: 브라우저 저장 공간 보호) */
async function resizeToDataUrl(file: File, max = 960): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('이미지를 읽을 수 없어요.'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function MenuEditor({ s, item, onClose }: { s: AppState; item: MenuItem; onClose: () => void }) {
  const run = useRun();
  const [f, setF] = useState({ name: item.name, summary: item.summary, description: item.description, price: item.price?.toString() ?? '', priceEvidence: item.priceEvidence, published: item.published, isSignature: item.isSignature });
  return (
    <Sheet
      open
      onClose={onClose}
      tone="ax"
      side="right"
      size="md"
      title={`메뉴 수정 · ${item.name}`}
      description={`근거: ${item.source}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ax" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            tone="ax"
            onClick={() => {
              const ok = run(
                () =>
                  opAct((d, c) =>
                    D.updateMenuItem(d, c, item.id, {
                      name: f.name.trim(),
                      summary: f.summary.trim(),
                      description: f.description.trim(),
                      price: f.price.trim() ? Number(f.price.replace(/[^0-9]/g, '')) : null,
                      priceEvidence: f.price.trim() ? f.priceEvidence : 'UNKNOWN',
                      published: f.published,
                      isSignature: f.isSignature,
                    }),
                  ),
                '메뉴를 저장했어요. 고객 화면에 바로 반영돼요.',
              );
              if (ok !== undefined) onClose();
            }}
          >
            저장
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-[13px]">
        <label className="block font-semibold text-slate-600">
          메뉴명
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={cx(axInputCls, 'mt-1')} />
        </label>
        <label className="block font-semibold text-slate-600">
          한 줄 소개
          <input value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} className={cx(axInputCls, 'mt-1')} />
        </label>
        <label className="block font-semibold text-slate-600">
          설명
          <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} className={cx(axInputCls, 'mt-1 h-auto py-2')} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block font-semibold text-slate-600">
            가격(원)
            <input value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} inputMode="numeric" placeholder="비우면 '가격 매장 확인'" className={cx(axInputCls, 'mt-1')} />
          </label>
          <label className="block font-semibold text-slate-600">
            가격 근거
            <select value={f.priceEvidence} onChange={(e) => setF({ ...f, priceEvidence: e.target.value as Evidence })} className={cx(axInputCls, 'mt-1')}>
              <option value="VERIFIED">운영자 확인</option>
              <option value="USER_PROVIDED">제공 정보</option>
              <option value="ASSUMPTION">예시가(가정)</option>
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="font-semibold text-slate-700">고객 화면 공개</span>
          <Toggle tone="ax" checked={f.published} onChange={(v) => setF({ ...f, published: v })} label="공개" />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
          <span className="font-semibold text-slate-700">대표 메뉴</span>
          <Toggle tone="ax" checked={f.isSignature} onChange={(v) => setF({ ...f, isSignature: v })} label="대표 메뉴" />
        </div>
        <p className="rounded-lg bg-amber-50 p-3 text-[12px] text-amber-900">영양성분·알레르기는 원재료·중량 검증 자료가 연결될 때만 표시돼요(현재 미확인). 1차에서는 입력 기능을 열지 않습니다.</p>
      </div>
    </Sheet>
  );
}

function CatEditor({ s, cat, onClose }: { s: AppState; cat: CafeCat; onClose: () => void }) {
  const run = useRun();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ name: cat.name, tagline: cat.tagline, personality: cat.personality.join(', '), likes: cat.likes.join(', '), tips: cat.interactionTips.join('\n'), internalNote: cat.internalNote, isPlaceholder: cat.isPlaceholder });
  const photos = s.catPhotos.filter((p) => p.catId === cat.id).sort((a, b) => a.sortOrder - b.sortOrder);
  const split = (v: string, sep: RegExp) => v.split(sep).map((x) => x.trim()).filter(Boolean);
  return (
    <Sheet
      open
      onClose={onClose}
      tone="ax"
      side="right"
      size="lg"
      title={`고양이 프로필 · ${cat.name}`}
      description="고객 화면에는 공개 항목만 보여요. 내부 메모는 직원 전용입니다."
      footer={
        <div className="flex justify-end gap-2">
          <Button tone="ax" variant="ghost" onClick={onClose}>
            닫기
          </Button>
          <Button
            tone="ax"
            onClick={() => {
              const ok = run(() => opAct((d, c) => D.updateCat(d, c, cat.id, { name: f.name.trim(), tagline: f.tagline.trim(), personality: split(f.personality, /,/), likes: split(f.likes, /,/), interactionTips: split(f.tips, /\n/), internalNote: f.internalNote, isPlaceholder: f.isPlaceholder })), '프로필을 저장했어요.');
              if (ok !== undefined) onClose();
            }}
          >
            저장
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 text-[13px] md:grid-cols-2">
        <label className="block font-semibold text-slate-600">
          이름
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={cx(axInputCls, 'mt-1')} />
        </label>
        <label className="block font-semibold text-slate-600">
          한 줄 소개
          <input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} className={cx(axInputCls, 'mt-1')} />
        </label>
        <label className="block font-semibold text-slate-600">
          성격 (쉼표로 구분)
          <input value={f.personality} onChange={(e) => setF({ ...f, personality: e.target.value })} className={cx(axInputCls, 'mt-1')} />
        </label>
        <label className="block font-semibold text-slate-600">
          좋아하는 것 (쉼표로 구분)
          <input value={f.likes} onChange={(e) => setF({ ...f, likes: e.target.value })} className={cx(axInputCls, 'mt-1')} />
        </label>
        <label className="block font-semibold text-slate-600 md:col-span-2">
          교감 수칙 (줄마다 하나)
          <textarea value={f.tips} onChange={(e) => setF({ ...f, tips: e.target.value })} rows={3} className={cx(axInputCls, 'mt-1 h-auto py-2')} />
        </label>
        <label className="block font-semibold text-slate-600 md:col-span-2">
          내부 메모 (직원 전용 · 고객 비공개)
          <textarea value={f.internalNote} onChange={(e) => setF({ ...f, internalNote: e.target.value })} rows={2} className={cx(axInputCls, 'mt-1 h-auto py-2')} />
        </label>
        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 md:col-span-2">
          <span className="font-semibold text-slate-700">예시 프로필 표시 (실제 정보 확인 전)</span>
          <Toggle tone="ax" checked={f.isPlaceholder} onChange={(v) => setF({ ...f, isPlaceholder: v })} label="예시 프로필" />
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <p className="text-[14px] font-bold text-slate-900">사진 {photos.length}장</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            if (file.size > 12 * 1024 * 1024) return run(() => { throw new Error('12MB 이하 사진만 올릴 수 있어요.'); });
            try {
              const dataUrl = await resizeToDataUrl(file);
              run(() => opAct((d, c) => D.addCatPhoto(d, c, cat.id, { dataUrl, caption: file.name.replace(/\.[^.]+$/, '') })), '사진을 올렸어요. 공개 승인 후 고객에게 보여요.');
            } catch (err) {
              run(() => { throw err; });
            }
          }}
        />
        <Button tone="ax" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <ImagePlus className="h-4 w-4" /> 사진 올리기
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
            <AssetImage slot={p.slot} dataUrl={p.dataUrl} fallback={p.art ?? cat.coverArt} alt={p.alt} className="aspect-square w-full" />
            <span className="absolute left-1 top-1">
              <Tag tone={p.status === 'PUBLISHED' ? 'green' : p.status === 'PENDING_REVIEW' ? 'amber' : 'slate'}>{{ PUBLISHED: '공개', PENDING_REVIEW: '승인 대기', HIDDEN: '숨김' }[p.status]}</Tag>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-slate-400">DEMO: 사진은 이 브라우저에만 저장돼요(960px로 축소). 운영 시 Supabase Storage + 공개 승인 정책으로 전환합니다. 권리가 확인된 사진만 올려 주세요.</p>
    </Sheet>
  );
}

function Inner() {
  const { s, can } = useOperator();
  const sp = useSearchParams();
  const run = useRun();
  const [tab, setTab] = useState<'menu' | 'cats' | 'photos'>((sp.get('tab') as 'cats') ?? 'menu');
  const [editMenu, setEditMenu] = useState<MenuItem | null>(null);
  const [editCat, setEditCat] = useState<CafeCat | null>(null);
  const [newCat, setNewCat] = useState(false);
  const [newName, setNewName] = useState('');
  if (!s) return <PageSkeleton />;
  const canEdit = can('content.edit');
  const cats = [...s.cats].sort((a, b) => a.sortOrder - b.sortOrder);
  const pending = s.catPhotos.filter((p) => p.status === 'PENDING_REVIEW');
  return (
    <div>
      <PageIntro
        title="메뉴·고양이 콘텐츠"
        body="고객 화면에 보이는 메뉴와 고양이 프로필·사진을 관리합니다. 모든 항목에 근거 상태가 붙고, 사진은 공개 승인 후에만 노출돼요."
        right={!canEdit ? <Locked reason="수정은 책임자 권한" /> : undefined}
      />
      <Segmented
        tone="ax"
        label="콘텐츠 종류"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'menu', label: '메뉴', count: s.menuItems.length },
          { value: 'cats', label: '고양이', count: s.cats.length },
          { value: 'photos', label: '사진 승인', count: pending.length },
        ]}
      />
      <div className="mt-4">
        {tab === 'menu' && (
          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead className="border-b border-slate-100 text-[12px] text-slate-400">
                  <tr>
                    <th className="pb-2 font-semibold">메뉴</th>
                    <th className="pb-2 font-semibold">브랜드</th>
                    <th className="pb-2 font-semibold">가격</th>
                    <th className="pb-2 font-semibold">존재 근거</th>
                    <th className="pb-2 font-semibold">영양·알레르기</th>
                    <th className="pb-2 font-semibold">공개</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {s.menuItems.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-2">
                        <div className="flex items-center gap-2.5">
                          <AssetImage slot={m.photoSlot} fallback={m.art} alt="" className="h-10 w-10 shrink-0 rounded-lg" />
                          <span>
                            <span className="font-bold text-slate-900">{m.name}</span>
                            {m.isSignature && <span className="ml-1.5 text-[11px] font-bold text-orange-600">대표</span>}
                            {m.isDemo && <span className="ml-1.5"><Tag tone="amber">예시</Tag></span>}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-slate-500">{m.brand === 'dasek' ? '다색냥' : '리얼식단'}</td>
                      <td className="py-2">
                        {m.price != null ? won(m.price) : '-'} <EvidenceBadge ev={m.price != null ? m.priceEvidence : 'UNKNOWN'} />
                      </td>
                      <td className="py-2">
                        <EvidenceBadge ev={m.evidence} />
                      </td>
                      <td className="py-2 text-[12px] text-slate-500">{m.nutritionStatus === 'VERIFIED' ? '확인' : '미확인'} / {m.allergenStatus === 'VERIFIED' ? '확인' : '미확인'}</td>
                      <td className="py-2">{m.published ? <Tag tone="green">공개</Tag> : <Tag>비공개</Tag>}</td>
                      <td className="py-2 text-right">
                        <Button tone="ax" variant="ghost" size="sm" disabled={!canEdit} onClick={() => setEditMenu(m)} aria-label={`${m.name} 수정`}>
                          <Pencil className="h-3.5 w-3.5" /> 수정
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12px] text-slate-400">메뉴 일괄 등록(CSV 가져오기)은 READY — 메뉴 권리·가맹 정책 확인 후 열어요.</p>
          </Panel>
        )}
        {tab === 'cats' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button tone="ax" disabled={!canEdit} onClick={() => setNewCat(true)}>
                <Plus className="h-4 w-4" /> 고양이 등록
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {cats.map((c, i) => {
                const n = s.catPhotos.filter((p) => p.catId === c.id && p.status === 'PUBLISHED').length;
                return (
                  <div key={c.id} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200/70">
                    <AssetImage fallback={c.coverArt} alt={c.name} className="h-24 w-20 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[15px] font-bold text-slate-900">
                        {c.name} {c.isPlaceholder && <Tag tone="amber">예시</Tag>}
                      </p>
                      <p className="clamp-1 text-[12.5px] text-slate-500">{c.tagline}</p>
                      <p className="mt-1 text-[12px] text-slate-400">공개 사진 {n}장 · {c.published ? '공개' : '비공개'}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Button tone="ax" variant="outline" size="sm" disabled={!canEdit} onClick={() => setEditCat(c)}>
                          <Pencil className="h-3.5 w-3.5" /> 편집
                        </Button>
                        <Button tone="ax" variant="ghost" size="sm" disabled={!canEdit} onClick={() => run(() => opAct((d, ctx) => D.updateCat(d, ctx, c.id, { published: !c.published })), c.published ? '비공개로 바꿨어요.' : '공개했어요.')} aria-label={c.published ? '비공개' : '공개'}>
                          {c.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button tone="ax" variant="ghost" size="sm" disabled={!canEdit || i === 0} onClick={() => run(() => opAct((d, ctx) => D.moveCat(d, ctx, c.id, -1)))} aria-label="앞으로">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button tone="ax" variant="ghost" size="sm" disabled={!canEdit || i === cats.length - 1} onClick={() => run(() => opAct((d, ctx) => D.moveCat(d, ctx, c.id, 1)))} aria-label="뒤로">
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] text-slate-400">실제 고양이 수·이름·사진 확인 전이므로 예시 프로필입니다. 매장 고양이의 건강 기록은 이 화면에도 저장하지 않아요(별도 관리 정책 확정 전).</p>
          </div>
        )}
        {tab === 'photos' && (
          <Panel title="공개 승인 대기" sub="승인한 사진만 고객 화면에 보여요">
            {pending.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {pending.map((p) => {
                  const cat = s.cats.find((c) => c.id === p.catId)!;
                  return (
                    <div key={p.id} className="overflow-hidden rounded-xl ring-1 ring-slate-200">
                      <AssetImage dataUrl={p.dataUrl} fallback={p.art ?? cat.coverArt} alt={p.alt} className="aspect-[4/3] w-full" />
                      <div className="p-3">
                        <p className="text-[13.5px] font-bold text-slate-900">{cat.name}</p>
                        <p className="text-[12px] text-slate-500">{p.caption}</p>
                        <div className="mt-2 flex gap-1.5">
                          {can('photo.approve') ? (
                            <>
                              <Button tone="ax" size="sm" onClick={() => run(() => opAct((d, c) => D.reviewPhoto(d, c, p.id, 'PUBLISHED')), '공개했어요.')} data-testid="photo-approve">
                                공개 승인
                              </Button>
                              <Button tone="ax" size="sm" variant="ghost" onClick={() => run(() => opAct((d, c) => D.reviewPhoto(d, c, p.id, 'HIDDEN')), '숨겼어요.')}>
                                숨김
                              </Button>
                            </>
                          ) : (
                            <Locked reason="승인은 책임자" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-slate-400">승인 대기 사진이 없어요.</p>
            )}
          </Panel>
        )}
      </div>
      {editMenu && <MenuEditor s={s} item={editMenu} onClose={() => setEditMenu(null)} />}
      {editCat && <CatEditor s={s} cat={s.cats.find((c) => c.id === editCat.id)!} onClose={() => setEditCat(null)} />}
      <Sheet
        open={newCat}
        onClose={() => setNewCat(false)}
        tone="ax"
        title="고양이 등록"
        description="등록 후 비공개 상태로 시작해요. 프로필·사진을 채운 뒤 공개하세요."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="ax" variant="ghost" onClick={() => setNewCat(false)}>
              취소
            </Button>
            <Button tone="ax" onClick={() => { const ok = run(() => opAct((d, c) => D.addCat(d, c, newName)), '등록했어요.'); if (ok) { setNewCat(false); setNewName(''); } }}>
              등록
            </Button>
          </div>
        }
      >
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="이름" className={axInputCls} />
      </Sheet>
    </div>
  );
}

export default function ContentPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inner />
    </Suspense>
  );
}
