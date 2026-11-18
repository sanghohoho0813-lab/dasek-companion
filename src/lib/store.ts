'use client';
/**
 * DEMO 데이터 어댑터 — 브라우저 localStorage에 저장한다.
 * - 같은 Origin의 PC 화면과 Mobile Frame(iframe)이 같은 저장소를 공유한다(storage 이벤트로 동기화).
 * - LIVE 전환 시 이 모듈의 dispatch 경계를 Supabase RPC/트랜잭션으로 교체한다 (docs: DECISIONS.md D-02).
 */
import { useSyncExternalStore } from 'react';
import type { Ctx } from './domain';
import { getProfile } from './rules';
import { createSeed, SCHEMA_VERSION } from './seed';
import type { AppState } from './types';
import { nowIso } from './util';

const KEY = 'dasek-companion:state';
let state: AppState | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.schemaVersion === SCHEMA_VERSION) return parsed;
      const migrated = migrate(parsed);
      if (migrated) {
        persist(migrated);
        return migrated;
      }
    }
  } catch {
    /* 손상·접근 불가 시 새 시드 */
  }
  const seeded = createSeed();
  persist(seeded);
  return seeded;
}

/** 이전 버전 저장 데이터를 지우지 않고 올린다 (시연 기록 보존). 모르는 버전이면 null → 새 시드 */
export function migrate(prev: AppState): AppState | null {
  let s: AppState = prev;
  if (s.schemaVersion === 4) {
    // v5: 운영자 기본 프로필(DEMO) — 이름을 바꾼 적이 없을 때만 새 기본값으로
    s = {
      ...s,
      schemaVersion: 5,
      profiles: s.profiles.map((p) => {
        if (p.id === 'op_manager' && p.name === '운영 책임자 (데모)') return { ...p, name: '김서윤', title: '대표' };
        if (p.id === 'op_staff' && p.name === '매장 직원 (데모)') return { ...p, name: '매장 직원', title: null };
        return p;
      }),
    } as AppState;
  }
  if (s.schemaVersion === 5) {
    // v6: 다색냥 고양이 25마리 — 없는 고양이·사진만 추가 (운영자가 고친 기존 고양이는 그대로)
    const seed = createSeed();
    const have = new Set(s.cats.map((c) => c.id));
    const addCats = seed.cats.filter((c) => !have.has(c.id)).map((c) => ({ ...c, sortOrder: c.sortOrder + Math.max(0, s.cats.length - 6) }));
    const addIds = new Set(addCats.map((c) => c.id));
    s = { ...s, schemaVersion: 6, cats: [...s.cats, ...addCats], catPhotos: [...s.catPhotos, ...seed.catPhotos.filter((p) => addIds.has(p.catId))] } as AppState;
  }
  return s.schemaVersion === SCHEMA_VERSION ? s : null;
}

function persist(s: AppState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

function emit() {
  for (const l of listeners) l();
}

function bindStorage() {
  if (storageBound || typeof window === 'undefined') return;
  storageBound = true;
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    if (!e.newValue) {
      state = load();
    } else {
      try {
        state = JSON.parse(e.newValue) as AppState;
      } catch {
        return;
      }
    }
    emit();
  });
}

export function getState(): AppState {
  if (!state) {
    state = load();
    bindStorage();
  }
  return state;
}

function subscribe(l: () => void) {
  getState();
  listeners.add(l);
  return () => listeners.delete(l);
}

/** 서버 렌더 중에는 null → 화면은 스켈레톤(로딩 상태)을 보여준다 */
export function useAppState(): AppState | null {
  return useSyncExternalStore(subscribe, getState, () => null);
}

export class StorageFullError extends Error {}

/** 모든 변경의 단일 입구. 실패하면(예외) 상태는 바뀌지 않는다. */
export function dispatch<R>(fn: (draft: AppState) => R): R {
  const draft = structuredClone(getState());
  const result = fn(draft);
  if (!persist(draft)) throw new StorageFullError('브라우저 저장 공간이 부족합니다. 사진 크기를 줄이거나 데모를 초기화해 주세요.');
  state = draft;
  emit();
  return result;
}

export function resetDemo() {
  const keepSettings = getState().settings;
  const fresh = createSeed();
  fresh.settings = { ...fresh.settings, axTheme: keepSettings.axTheme, fontScale: keepSettings.fontScale };
  persist(fresh);
  state = fresh;
  emit();
}

export function customerCtx(s: AppState): Ctx {
  return { now: nowIso(), actorId: s.session.customerId, actorRole: 'customer', isDemo: s.mode === 'DEMO' };
}

export function operatorCtx(s: AppState): Ctx {
  const op = getProfile(s, s.session.operatorId);
  return { now: nowIso(), actorId: op?.id ?? null, actorRole: op?.role ?? 'staff', isDemo: s.mode === 'DEMO' };
}

/** 고객 액션 실행 헬퍼 */
export function act<R>(fn: (draft: AppState, ctx: Ctx) => R): R {
  return dispatch((d) => fn(d, customerCtx(d)));
}

/** 운영자 액션 실행 헬퍼 */
export function opAct<R>(fn: (draft: AppState, ctx: Ctx) => R): R {
  return dispatch((d) => fn(d, operatorCtx(d)));
}
