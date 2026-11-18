import { describe, expect, it } from 'vitest';
import { createSeed, SCHEMA_VERSION } from '@/lib/seed';
import { migrate } from '@/lib/store';
import type { AppState } from '@/lib/types';

describe('저장 데이터 이전 v4 → v5 (시연 기록을 지우지 않는다)', () => {
  it('기본 운영자 이름만 새 기본값으로, 나머지 기록은 그대로', () => {
    const s = createSeed();
    const v4 = JSON.parse(JSON.stringify(s)) as AppState;
    v4.schemaVersion = 4;
    v4.profiles = v4.profiles.map((p) => (p.id === 'op_manager' ? { ...p, name: '운영 책임자 (데모)', title: undefined } : p.id === 'op_staff' ? { ...p, name: '매장 직원 (데모)', title: undefined } : p));
    const out = migrate(v4)!;
    expect(out.schemaVersion).toBe(SCHEMA_VERSION);
    expect(out.profiles.find((p) => p.id === 'op_manager')).toMatchObject({ name: '김서윤', title: '대표' });
    expect(out.profiles.find((p) => p.id === 'op_staff')).toMatchObject({ name: '매장 직원', title: null });
    expect(out.verifications).toEqual(v4.verifications);
    expect(out.coupons).toEqual(v4.coupons);
    expect(out.profiles.filter((p) => p.role === 'customer')).toEqual(v4.profiles.filter((p) => p.role === 'customer'));
  });

  it('운영자가 이름을 바꿨다면 덮어쓰지 않는다 · 모르는 버전은 null', () => {
    const v4 = JSON.parse(JSON.stringify(createSeed())) as AppState;
    v4.schemaVersion = 4;
    v4.profiles = v4.profiles.map((p) => (p.id === 'op_manager' ? { ...p, name: '박사장' } : p));
    expect(migrate(v4)!.profiles.find((p) => p.id === 'op_manager')!.name).toBe('박사장');
    expect(migrate({ ...v4, schemaVersion: 2 } as AppState)).toBeNull();
  });
});

describe('저장 데이터 이전 v5 → v7 (고양이: 실제 14 + 준비 중 11)', () => {
  it('v5 에서 올리면 실제 고양이 14마리가 공개되고, 예시는 이름을 지키며 비공개가 된다', () => {
    const v5 = JSON.parse(JSON.stringify(createSeed())) as AppState;
    v5.schemaVersion = 5;
    v5.cats = v5.cats.filter((c) => /^cat_[1-6]$/.test(c.id)).map((c) => ({ ...c, published: true, name: c.id === 'cat_1' ? '실제이름' : c.name }));
    v5.catPhotos = v5.catPhotos.filter((p) => /^cat_[1-6]$/.test(p.catId));
    const out = migrate(v5)!;
    expect(out.schemaVersion).toBe(SCHEMA_VERSION);
    expect(out.cats).toHaveLength(25);
    expect(out.cats.filter((c) => c.published && !c.isPlaceholder)).toHaveLength(14);
    expect(out.cats.find((c) => c.id === 'cat_1')).toMatchObject({ name: '실제이름', published: false });
    expect(new Set(out.cats.map((c) => c.id)).size).toBe(25);
  });
});

describe('저장 데이터 이전 v6 → v7', () => {
  const v6 = () => {
    const s = JSON.parse(JSON.stringify(createSeed())) as AppState;
    s.schemaVersion = 6;
    const ph = s.cats.filter((c) => c.isPlaceholder).map((c) => ({ ...c, published: true, name: c.id === 'cat_6' ? '라떼' : c.name }));
    const extra = ['망고', '귤이', '루이', '호박', '두부', '설기', '찹쌀', '산책이', '카푸', '마루', '연유', '꾸벅이', '호두', '도토리'].map((name, k) => ({ ...ph[0], id: `cat_${12 + k}`, name, sortOrder: 11 + k }));
    s.cats = [...ph, ...extra];
    s.catPhotos = s.catPhotos.filter((p) => /^cat_\d+$/.test(p.catId)).concat(extra.map((c) => ({ ...s.catPhotos[0], id: `pho_${c.id}_0`, catId: c.id, slot: 'x' })));
    return s;
  };
  it('손대지 않은 예시 12~25번은 정리, 실제 14마리 추가, 같은 이름(라떼) 예시는 코코로', () => {
    const out = migrate(v6())!;
    expect(out.cats.filter((c) => /^cat_(1[2-9]|2\d)$/.test(c.id))).toHaveLength(0);
    expect(out.catPhotos.filter((p) => p.catId === 'cat_20')).toHaveLength(0);
    expect(out.cats.filter((c) => !c.isPlaceholder && c.published).map((c) => c.name)).toContain('망고');
    expect(out.cats.find((c) => c.id === 'cat_6')).toMatchObject({ name: '코코', published: false });
    expect(out.cats.filter((c) => c.published).every((c) => !c.isPlaceholder)).toBe(true);
  });
  it('운영자가 이름을 바꿨거나 사진을 올린 예시 고양이는 지우지 않는다', () => {
    const s = v6();
    s.cats = s.cats.map((c) => (c.id === 'cat_13' ? { ...c, name: '실제냥' } : c));
    s.catPhotos.push({ ...s.catPhotos[0], id: 'pho_up', catId: 'cat_14', dataUrl: 'data:image/jpeg;base64,AA', slot: null });
    const out = migrate(s)!;
    expect(out.cats.find((c) => c.id === 'cat_13')).toMatchObject({ name: '실제냥', published: false });
    expect(out.cats.find((c) => c.id === 'cat_14')).toBeTruthy();
    expect(out.catPhotos.find((p) => p.id === 'pho_up')).toBeTruthy();
  });
});

describe('저장 데이터 이전 v7 → v8 (회원 이름에 성)', () => {
  it('손대지 않은 DEMO 회원 이름에만 성을 붙이고, 고친 이름은 그대로 둔다', () => {
    const s = JSON.parse(JSON.stringify(createSeed())) as AppState;
    s.schemaVersion = 7;
    const cust = s.profiles.filter((p) => p.role === 'customer');
    const old = ['하늘 (데모 고객)', '서윤', '도현', '지우', '민준', '하린', '예준', '수아', '시우', '유나', '건우', '채원', '은호', '다인'];
    cust.forEach((p, i) => (p.name = old[i]));
    cust[2].name = '직접고친이름';
    const out = migrate(s)!;
    expect(out.schemaVersion).toBe(SCHEMA_VERSION);
    const names = out.profiles.filter((p) => p.role === 'customer').map((p) => p.name);
    expect(names).toContain('정하늘 (데모 고객)');
    expect(names).toContain('이서윤');
    expect(names).toContain('직접고친이름');
    expect(out.profiles.find((p) => p.id === 'op_manager')!.name).toBe('김서윤');
  });
});
