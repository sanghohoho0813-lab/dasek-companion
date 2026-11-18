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
