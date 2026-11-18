/**
 * 도메인 액션 — 모든 상태 변경은 여기서만 일어난다.
 * 각 함수는 (state, ctx, input)을 받아 state를 직접 변경한다(store가 사본을 넘긴다).
 * 중복지급 방지: idempotencyKey 유니크 / referee 유니크 / (user, store, day) 체크인 유니크.
 */
import { assertCan } from './permissions';
import { ROADMAP } from './roadmap';
import { campaignLinkFor, computeReorderCandidates, getMenuItem, getProfile, hasConsent, segmentMembers, SEGMENTS, stampCount, stampRule, verifiedUses } from './rules';
import type {
  AdminTask,
  AppState,
  BrandId,
  Campaign,
  CatPhoto,
  ConsentPurpose,
  CouponIssue,
  CustomerEventType,
  LoyaltyRule,
  MenuItem,
  ProofEvent,
  Role,
  SegmentKey,
  TaskType,
} from './types';
import { addDays, dailyCheckinCode, dayKey, demoHash, normalizePhone, randomCode, uid } from './util';

export interface Ctx {
  now: string;
  actorId: string | null;
  actorRole: Role | 'system';
  isDemo: boolean;
}

export class DomainError extends Error {}

export const CONSENT_VERSION = '2026-11-v0.1-draft';

/* ── 공통 기록 ─────────────────────────────────────── */
export function audit(s: AppState, ctx: Ctx, action: string, target: string, detail = '') {
  s.auditLogs.unshift({ id: uid('aud'), actorId: ctx.actorId, actorRole: ctx.actorRole, action, target, detail, at: ctx.now });
  if (s.auditLogs.length > 800) s.auditLogs.length = 800;
}

export function track(s: AppState, ctx: Ctx, userId: string | null, type: CustomerEventType, ref: string | null, label: string) {
  s.events.unshift({ id: uid('evt'), userId, type, ref, label, createdAt: ctx.now, isDemo: ctx.isDemo });
  if (s.events.length > 2000) s.events.length = 2000;
}

function task(s: AppState, ctx: Ctx, type: TaskType, refId: string, title: string, userId: string | null, storeId: string | null) {
  const t: AdminTask = { id: uid('tsk'), type, refId, userId, storeId, title, status: 'OPEN', createdAt: ctx.now, doneAt: null, doneBy: null };
  s.tasks.unshift(t);
  return t;
}

function closeTask(s: AppState, ctx: Ctx, refId: string, status: 'DONE' | 'DISMISSED' = 'DONE') {
  for (const t of s.tasks) if (t.refId === refId && t.status === 'OPEN') Object.assign(t, { status, doneAt: ctx.now, doneBy: ctx.actorId });
}

function proof(s: AppState, ctx: Ctx, p: Omit<ProofEvent, 'proof_event_id' | 'created_at' | 'status'>) {
  s.proofEvents.unshift({ ...p, proof_event_id: uid('prf'), created_at: ctx.now, status: s.mode });
}

function notify(s: AppState, ctx: Ctx, userId: string, kind: 'SERVICE' | 'MARKETING', title: string, body: string, link: string | null, campaignId: string | null = null) {
  const n = { id: uid('ntf'), userId, kind, title, body, link, campaignId, createdAt: ctx.now, readAt: null };
  s.notifications.unshift(n);
  return n;
}

/* ── 쿠폰 발급 (멱등) ──────────────────────────────── */
export function issueCoupon(s: AppState, ctx: Ctx, userId: string, rule: LoyaltyRule, source: string, idempotencyKey: string): CouponIssue | null {
  if (!rule.active) return null;
  if (s.coupons.some((c) => c.idempotencyKey === idempotencyKey)) return null; // 중복 발급 방지
  const c: CouponIssue = {
    id: uid('cpn'),
    userId,
    ruleId: rule.id,
    title: rule.title,
    benefit: rule.benefit,
    code: `DC-${randomCode(6)}`,
    status: 'ISSUED',
    issuedAt: ctx.now,
    expiresAt: addDays(ctx.now, rule.validDays),
    redeemedAt: null,
    redeemedBy: null,
    cancelledAt: null,
    cancelReason: null,
    source,
    idempotencyKey,
    isDemo: ctx.isDemo,
  };
  s.coupons.unshift(c);
  s.ledger.unshift({ id: uid('led'), userId, kind: 'COUPON', delta: 1, label: `쿠폰 발급: ${rule.title}`, status: 'CONFIRMED', sourceRef: c.id, idempotencyKey: `ledger:${idempotencyKey}`, createdAt: ctx.now, isDemo: ctx.isDemo });
  notify(s, ctx, userId, 'SERVICE', '쿠폰이 도착했어요', `${rule.title} — ${rule.benefit}`, '/my/coupons');
  return c;
}

/* ── 회원가입 ──────────────────────────────────────── */
export interface SignupInput {
  name: string;
  phone: string;
  consents: { terms: boolean; privacy: boolean; age14: boolean; marketing_inapp: boolean; marketing_push: boolean; marketing_kakao: boolean };
  referralCode?: string;
  preferredBrands: BrandId[];
}

export function signup(s: AppState, ctx: Ctx, input: SignupInput) {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 20) throw new DomainError('이름(닉네임)을 1~20자로 입력해 주세요.');
  if (!input.consents.terms || !input.consents.privacy) throw new DomainError('필수 약관과 개인정보 수집·이용에 동의해 주세요.');
  if (!input.consents.age14) throw new DomainError('만 14세 이상만 가입할 수 있습니다.');
  const phone = normalizePhone(input.phone);
  if (phone && !/^01[016789][0-9]{7,8}$/.test(phone)) throw new DomainError('휴대폰 번호 형식을 확인해 주세요.');
  const phoneHash = phone ? demoHash(`phone:${phone}`) : null;
  if (phoneHash && s.profiles.some((p) => p.phoneHash === phoneHash && p.status !== 'anonymized')) throw new DomainError('이미 가입된 번호입니다. 로그인해 주세요.');

  const id = uid('usr');
  const memberCode = `DC-${(1000 + Math.floor(Math.random() * 9000)).toString()}`;
  s.profiles.push({
    id,
    name,
    role: 'customer',
    memberCode,
    phoneHash,
    phoneLast4: phone ? phone.slice(-4) : null,
    storeIds: [],
    referralCode: `${randomCode(5)}`,
    createdAt: ctx.now,
    isDemo: ctx.isDemo,
    status: 'active',
    preferredBrands: input.preferredBrands,
  });
  for (const purpose of Object.keys(input.consents) as ConsentPurpose[]) {
    s.consents.push({ id: uid('cns'), userId: id, purpose, version: CONSENT_VERSION, granted: input.consents[purpose], at: ctx.now, withdrawnAt: null });
  }
  track(s, ctx, id, 'signup', null, '회원가입');
  audit(s, { ...ctx, actorId: id, actorRole: 'customer' }, 'signup', id, `brands=${input.preferredBrands.join(',')}`);

  // 가입 혜택
  const signupRule = s.loyaltyRules.find((r) => r.kind === 'SIGNUP');
  if (signupRule) issueCoupon(s, ctx, id, signupRule, '첫 가입 혜택', `signup:${id}`);

  // 추천 귀속 (자기추천·중복 차단)
  let referral: { status: string; reason?: string } | null = null;
  const code = input.referralCode?.trim().toUpperCase();
  if (code) {
    const referrer = s.profiles.find((p) => p.referralCode === code && p.role === 'customer' && p.status === 'active');
    if (!referrer) referral = { status: 'INVALID', reason: '존재하지 않는 추천 코드' };
    else if (referrer.id === id || (referrer.phoneHash && referrer.phoneHash === phoneHash)) referral = { status: 'REJECTED', reason: '자기 추천은 보상 대상이 아닙니다' };
    else if (s.referrals.some((r) => r.refereeId === id)) referral = { status: 'REJECTED', reason: '이미 추천 귀속됨' };
    else {
      const attr = { id: uid('ref'), referrerId: referrer.id, refereeId: id, code, status: 'PENDING' as const, reason: null, createdAt: ctx.now, qualifiedAt: null, qualifyingRef: null, isDemo: ctx.isDemo };
      s.referrals.unshift(attr);
      s.ledger.unshift({ id: uid('led'), userId: referrer.id, kind: 'REFERRAL_REWARD', delta: 1, label: `${name}님 추천 가입 — 첫 이용 확인 시 보상`, status: 'EXPECTED', sourceRef: attr.id, idempotencyKey: `refexp:${attr.id}`, createdAt: ctx.now, isDemo: ctx.isDemo });
      notify(s, ctx, referrer.id, 'SERVICE', '추천한 친구가 가입했어요', `${name}님의 첫 이용이 매장에서 확인되면 보상이 확정됩니다.`, '/my/referral');
      const refereeRule = s.loyaltyRules.find((r) => r.kind === 'REFERRAL_REFEREE');
      if (refereeRule) issueCoupon(s, ctx, id, refereeRule, '추천 가입 웰컴 혜택', `referee:${id}`);
      referral = { status: 'PENDING' };
    }
  }
  s.session.customerId = id;
  return { userId: id, referral };
}

export function login(s: AppState, ctx: Ctx, userId: string) {
  const p = getProfile(s, userId);
  if (!p || p.role !== 'customer' || p.status === 'anonymized') throw new DomainError('로그인할 수 없는 계정입니다.');
  s.session.customerId = userId;
  track(s, ctx, userId, 'login', null, '로그인');
}

export function logout(s: AppState) {
  s.session.customerId = null;
}

export function setConsent(s: AppState, ctx: Ctx, userId: string, purpose: ConsentPurpose, granted: boolean) {
  if (purpose === 'terms' || purpose === 'privacy' || purpose === 'age14') throw new DomainError('필수 동의는 탈퇴로만 철회할 수 있습니다.');
  const prev = s.consents.filter((c) => c.userId === userId && c.purpose === purpose && !c.withdrawnAt);
  for (const c of prev) c.withdrawnAt = ctx.now;
  s.consents.push({ id: uid('cns'), userId, purpose, version: CONSENT_VERSION, granted, at: ctx.now, withdrawnAt: null });
  audit(s, ctx, granted ? 'consent.grant' : 'consent.withdraw', userId, purpose);
}

/* ── 탐색·관심 이벤트 ──────────────────────────────── */
export function toggleFavorite(s: AppState, ctx: Ctx, userId: string, menuItemId: string) {
  const i = s.favorites.findIndex((f) => f.userId === userId && f.menuItemId === menuItemId);
  const item = getMenuItem(s, menuItemId);
  if (i >= 0) {
    s.favorites.splice(i, 1);
    track(s, ctx, userId, 'favorite_remove', menuItemId, `저장 해제: ${item?.name}`);
    return false;
  }
  s.favorites.unshift({ id: uid('fav'), userId, menuItemId, createdAt: ctx.now });
  track(s, ctx, userId, 'favorite_add', menuItemId, `메뉴 저장: ${item?.name}`);
  return true;
}

export function recordMenuView(s: AppState, ctx: Ctx, userId: string | null, menuItemId: string) {
  const item = getMenuItem(s, menuItemId);
  track(s, ctx, userId, 'view_menu', menuItemId, `메뉴 조회: ${item?.name}`);
  if (userId) {
    s.recentViews = [{ userId, menuItemId, at: ctx.now }, ...s.recentViews.filter((v) => !(v.userId === userId && v.menuItemId === menuItemId))].slice(0, 200);
  }
}

export function recordCatView(s: AppState, ctx: Ctx, userId: string | null, catId: string) {
  const cat = s.cats.find((c) => c.id === catId);
  track(s, ctx, userId, 'view_cat', catId, `고양이 프로필: ${cat?.name}`);
}

export function recordLinkClick(s: AppState, ctx: Ctx, userId: string | null, kind: 'order' | 'reservation', storeId: string, label: string) {
  track(s, ctx, userId, kind === 'order' ? 'order_link_click' : 'reservation_link_click', storeId, label);
}

export function recordVisitIntent(s: AppState, ctx: Ctx, userId: string | null, storeId: string) {
  track(s, ctx, userId, 'visit_intent', storeId, '방문 예정 표시');
}

/* ── 방문 체크인 (Flow C) ──────────────────────────── */
export function submitCheckin(s: AppState, ctx: Ctx, userId: string, storeId: string, code: string) {
  const store = s.stores.find((x) => x.id === storeId);
  if (!store) throw new DomainError('매장을 찾을 수 없습니다.');
  const day = dayKey(ctx.now);
  if (code.trim() !== dailyCheckinCode(storeId, day)) throw new DomainError('오늘의 체크인 코드가 맞지 않습니다. 매장 카운터의 코드를 확인해 주세요.');
  const dup = s.checkins.find((c) => c.userId === userId && c.storeId === storeId && c.dayKey === day && c.status !== 'REJECTED');
  if (dup) throw new DomainError('오늘은 이미 체크인했어요. 하루 한 번만 적립됩니다.');
  const c = { id: uid('chk'), userId, storeId, method: 'DAILY_CODE' as const, dayKey: day, status: 'PENDING' as const, createdAt: ctx.now, decidedAt: null, decidedBy: null, rejectReason: null, isDemo: ctx.isDemo };
  s.checkins.unshift(c);
  track(s, ctx, userId, 'checkin_submit', c.id, `${store.name} 체크인 요청`);
  task(s, ctx, 'VERIFY_CHECKIN', c.id, `${getProfile(s, userId)?.name}님 ${store.name} 방문 확인`, userId, storeId);
  return c;
}

export function decideCheckin(s: AppState, ctx: Ctx, checkinId: string, approve: boolean, reason = '') {
  assertCan(ctx.actorRole, 'queue.verify');
  const c = s.checkins.find((x) => x.id === checkinId);
  if (!c) throw new DomainError('체크인을 찾을 수 없습니다.');
  if (c.status !== 'PENDING') throw new DomainError('이미 처리된 요청입니다.');
  const before = verifiedUses(s, c.userId).length;
  Object.assign(c, { status: approve ? 'CONFIRMED' : 'REJECTED', decidedAt: ctx.now, decidedBy: ctx.actorId, rejectReason: approve ? null : reason || '매장 확인 불가' });
  closeTask(s, ctx, c.id);
  audit(s, ctx, approve ? 'checkin.confirm' : 'checkin.reject', c.id, reason);
  const store = s.stores.find((x) => x.id === c.storeId)!;
  if (!approve) {
    notify(s, ctx, c.userId, 'SERVICE', '방문 확인이 반려되었어요', `${store.name}: ${c.rejectReason}`, '/my/activity');
    return;
  }
  proof(s, ctx, {
    event_type: 'VERIFIED_VISIT',
    trigger: '고객 앱 체크인(오늘의 코드)',
    decision: '직원이 매장 내 방문을 확인',
    decision_method: 'RULE+HUMAN',
    why: '코드 일치(RULE) + 직원 육안 확인(HUMAN) — 자가신고만으로는 실적에 포함하지 않음',
    human_approval: ctx.actorId,
    action: '방문 확정, 스탬프 적립 판정',
    result: '고객 방문 이력·혜택 갱신',
    kpi_before: `해당 고객 확인 이용 ${before}회`,
    kpi_after: `해당 고객 확인 이용 ${before + 1}회`,
    data_source: `visit_checkins/${c.id}`,
    user_id: c.userId,
    result_confirmed_at: ctx.now,
    evidence_link: `/ax/members/${c.userId}`,
  });
  afterVerifiedUse(s, ctx, c.userId, c.storeId, c.id, '방문');
  notify(s, ctx, c.userId, 'SERVICE', '방문이 확인되었어요', `${store.name} 방문이 확인되어 혜택에 반영되었습니다.`, '/my');
}

/* ── 구매 확인 (Flow A/B) ──────────────────────────── */
export function selfReportPurchase(s: AppState, ctx: Ctx, userId: string, storeId: string, menuItemIds: string[], note: string) {
  const store = s.stores.find((x) => x.id === storeId);
  if (!store) throw new DomainError('매장을 찾을 수 없습니다.');
  const today = dayKey(ctx.now);
  const pendingToday = s.verifications.filter((v) => v.userId === userId && v.status === 'PENDING' && dayKey(v.createdAt) === today).length;
  if (pendingToday >= 3) throw new DomainError('오늘 확인 대기 중인 요청이 많습니다. 직원 확인 후 다시 요청해 주세요.');
  const v = {
    id: uid('ver'),
    userId,
    storeId,
    menuItemIds,
    amount: null,
    method: 'SELF_REPORT' as const,
    status: 'PENDING' as const,
    note: note.slice(0, 200),
    provenance: '고객 자가신고 — 직원 확인 전에는 실적 아님',
    createdAt: ctx.now,
    decidedAt: null,
    decidedBy: null,
    rejectReason: null,
    isDemo: ctx.isDemo,
  };
  s.verifications.unshift(v);
  const names = menuItemIds.map((id) => getMenuItem(s, id)?.name).filter(Boolean).join(', ');
  track(s, ctx, userId, 'purchase_self_report', v.id, `구매 확인 요청${names ? `: ${names}` : ''}`);
  task(s, ctx, 'VERIFY_PURCHASE', v.id, `${getProfile(s, userId)?.name}님 ${store.name} 구매 확인`, userId, storeId);
  return v;
}

export function decidePurchase(s: AppState, ctx: Ctx, verificationId: string, approve: boolean, opts: { amount?: number | null; reason?: string } = {}) {
  assertCan(ctx.actorRole, 'queue.verify');
  const v = s.verifications.find((x) => x.id === verificationId);
  if (!v) throw new DomainError('요청을 찾을 수 없습니다.');
  if (v.status !== 'PENDING') throw new DomainError('이미 처리된 요청입니다.');
  const before = verifiedUses(s, v.userId).length;
  Object.assign(v, {
    status: approve ? 'CONFIRMED' : 'REJECTED',
    decidedAt: ctx.now,
    decidedBy: ctx.actorId,
    amount: approve ? opts.amount ?? null : null,
    rejectReason: approve ? null : opts.reason || '매장 구매 기록 확인 불가',
    provenance: approve ? '고객 요청 + 직원 확인(영수증/카운터)' : v.provenance,
  });
  closeTask(s, ctx, v.id);
  audit(s, ctx, approve ? 'purchase.confirm' : 'purchase.reject', v.id, approve ? `amount=${opts.amount ?? 'n/a'}` : opts.reason ?? '');
  const store = s.stores.find((x) => x.id === v.storeId)!;
  if (!approve) {
    notify(s, ctx, v.userId, 'SERVICE', '구매 확인이 반려되었어요', `${store.name}: ${v.rejectReason}`, '/my/activity');
    return;
  }
  confirmedPurchaseEffects(s, ctx, v.id, before);
  notify(s, ctx, v.userId, 'SERVICE', '구매가 확인되었어요', `${store.name} 구매가 확인되어 혜택에 반영되었습니다.`, '/my');
}

/** 직원이 카운터에서 회원코드로 바로 구매 확인 등록 */
export function staffRecordPurchase(s: AppState, ctx: Ctx, userId: string, storeId: string, menuItemIds: string[], amount: number | null) {
  assertCan(ctx.actorRole, 'purchase.create');
  const p = getProfile(s, userId);
  if (!p || p.role !== 'customer') throw new DomainError('회원을 찾을 수 없습니다.');
  const before = verifiedUses(s, userId).length;
  const v = {
    id: uid('ver'),
    userId,
    storeId,
    menuItemIds,
    amount,
    method: 'STAFF' as const,
    status: 'CONFIRMED' as const,
    note: '',
    provenance: '직원 카운터 확인(회원코드)',
    createdAt: ctx.now,
    decidedAt: ctx.now,
    decidedBy: ctx.actorId,
    rejectReason: null,
    isDemo: ctx.isDemo,
  };
  s.verifications.unshift(v);
  audit(s, ctx, 'purchase.staff_create', v.id, `user=${userId} amount=${amount ?? 'n/a'}`);
  confirmedPurchaseEffects(s, ctx, v.id, before);
  notify(s, ctx, userId, 'SERVICE', '구매가 확인되었어요', `${s.stores.find((x) => x.id === storeId)?.name} 구매가 확인되어 혜택에 반영되었습니다.`, '/my');
  return v;
}

function confirmedPurchaseEffects(s: AppState, ctx: Ctx, verificationId: string, before: number) {
  const v = s.verifications.find((x) => x.id === verificationId)!;
  proof(s, ctx, {
    event_type: 'VERIFIED_PURCHASE',
    trigger: v.method === 'SELF_REPORT' ? '고객 구매 확인 요청(자가신고)' : '카운터 회원코드 제시',
    decision: '직원이 구매 사실 확인',
    decision_method: 'HUMAN',
    why: '외부 POS 연동권 미확인 → 직원 확인을 검증 기준으로 사용',
    human_approval: ctx.actorId,
    action: '구매 확정, 스탬프·추천·재구매 판정',
    result: v.amount ? `확인 금액 ${v.amount.toLocaleString()}원` : '금액 미입력(구매 사실만 확인)',
    kpi_before: `해당 고객 확인 이용 ${before}회`,
    kpi_after: `해당 고객 확인 이용 ${before + 1}회`,
    data_source: `order_verifications/${v.id}`,
    user_id: v.userId,
    result_confirmed_at: ctx.now,
    evidence_link: `/ax/members/${v.userId}`,
  });
  afterVerifiedUse(s, ctx, v.userId, v.storeId, v.id, '구매');
  // Flow B: 승인된 재구매 안내 → 실제 구매 확인 시 전환 기록
  for (const c of s.reorderCandidates) {
    if (c.userId === v.userId && c.status === 'APPROVED' && v.menuItemIds.includes(c.menuItemId)) {
      c.status = 'CONVERTED';
      c.convertedRef = v.id;
      const item = getMenuItem(s, c.menuItemId);
      proof(s, ctx, {
        event_type: 'REORDER_CONVERTED',
        trigger: `저장 메뉴 '${item?.name}' 구매 확인 없음 (RULE)`,
        decision: '운영자가 재구매 안내 승인',
        decision_method: 'RULE+HUMAN',
        why: c.reasons.join(' / '),
        human_approval: c.decidedBy,
        action: '인앱 재구매 안내',
        result: `'${item?.name}' 직원확인 구매로 전환`,
        kpi_before: '해당 메뉴 14일 구매 0건',
        kpi_after: '해당 메뉴 구매 1건 확인',
        data_source: `reorder_candidates/${c.id} → order_verifications/${v.id}`,
        user_id: v.userId,
        result_confirmed_at: ctx.now,
        evidence_link: '/ax/reorder',
      });
    }
  }
}

/** 확인된 이용 후 공통 처리: 스탬프(매장·일 1회) → 스탬프 보상 → 추천 자격 */
function afterVerifiedUse(s: AppState, ctx: Ctx, userId: string, storeId: string, ref: string, label: string) {
  const day = dayKey(ctx.now);
  const key = `stamp:${userId}:${storeId}:${day}`;
  const rule = stampRule(s);
  if (rule.active && !s.ledger.some((l) => l.idempotencyKey === key)) {
    const before = stampCount(s, userId);
    s.ledger.unshift({ id: uid('led'), userId, kind: 'STAMP', delta: 1, label: `스탬프 +1 (${label} 확인)`, status: 'CONFIRMED', sourceRef: ref, idempotencyKey: key, createdAt: ctx.now, isDemo: ctx.isDemo });
    const req = rule.stampsRequired ?? 10;
    const after = before + 1;
    if (after > 0 && after % req === 0) {
      const cycle = after / req;
      const c = issueCoupon(s, ctx, userId, rule, `스탬프 ${req}개 달성`, `stampreward:${userId}:${cycle}`);
      if (c)
        proof(s, ctx, {
          event_type: 'STAMP_REWARD',
          trigger: `확인 이용 스탬프 ${req}개 도달`,
          decision: '스탬프 규칙 충족',
          decision_method: 'RULE',
          why: `규칙: 스탬프 ${req}개 = ${rule.benefit}`,
          human_approval: null,
          action: '보상 쿠폰 자동 발급',
          result: `${c.title} 발급`,
          kpi_before: `스탬프 ${before}`,
          kpi_after: `스탬프 ${after}`,
          data_source: `reward_ledger/${key}`,
          user_id: userId,
          result_confirmed_at: ctx.now,
          evidence_link: `/ax/members/${userId}`,
        });
    }
  }
  // 추천 자격: 피추천인의 첫 확인 이용
  const attr = s.referrals.find((r) => r.refereeId === userId && r.status === 'PENDING');
  const refRule = s.loyaltyRules.find((r) => r.kind === 'REFERRAL_REFERRER');
  if (attr && refRule && refRule.active) {
    const isPurchase = s.verifications.some((v) => v.id === ref);
    if (refRule.qualifyingEvent === 'CONFIRMED_PURCHASE' && !isPurchase) return;
    attr.status = 'QUALIFIED';
    attr.qualifiedAt = ctx.now;
    attr.qualifyingRef = ref;
    const coupon = issueCoupon(s, ctx, attr.referrerId, refRule, '친구 추천 보상', `referral:${attr.id}`);
    for (const l of s.ledger) if (l.idempotencyKey === `refexp:${attr.id}`) l.status = 'CONFIRMED';
    if (coupon) {
      attr.status = 'REWARDED';
      const referee = getProfile(s, userId);
      notify(s, ctx, attr.referrerId, 'SERVICE', '추천 보상이 확정되었어요', `${referee?.name}님의 첫 이용이 확인되어 ${refRule.benefit} 쿠폰이 발급되었습니다.`, '/my/referral');
      proof(s, ctx, {
        event_type: 'REFERRAL_CONVERTED',
        trigger: `추천 코드 ${attr.code}로 가입`,
        decision: '피추천인 첫 이용 직원 확인',
        decision_method: 'RULE+HUMAN',
        why: '추천 보상은 가입이 아니라 확인된 첫 이용 후에만 지급(중복·허위 방지)',
        human_approval: ctx.actorId,
        action: '추천인 보상 쿠폰 발급',
        result: `${refRule.benefit} 발급`,
        kpi_before: '추천 전환 대기',
        kpi_after: '추천 전환 1건',
        data_source: `referral_attributions/${attr.id}`,
        user_id: attr.referrerId,
        result_confirmed_at: ctx.now,
        evidence_link: '/ax/rewards?tab=referrals',
      });
    }
  }
}

/** 환불·취소에 따른 확인 취소 — 스탬프·추천 보상 되돌림 */
export function reverseUse(s: AppState, ctx: Ctx, kind: 'VISIT' | 'PURCHASE', id: string, reason: string) {
  assertCan(ctx.actorRole, 'verification.reverse');
  const rec = kind === 'VISIT' ? s.checkins.find((x) => x.id === id) : s.verifications.find((x) => x.id === id);
  if (!rec || rec.status !== 'CONFIRMED') throw new DomainError('확인된 이용만 취소할 수 있습니다.');
  rec.status = 'REVERSED';
  audit(s, ctx, 'use.reverse', id, reason);
  for (const l of s.ledger) if (l.sourceRef === id && l.kind === 'STAMP' && l.status === 'CONFIRMED') l.status = 'REVERSED';
  const attr = s.referrals.find((r) => r.qualifyingRef === id);
  if (attr) {
    const c = s.coupons.find((x) => x.idempotencyKey === `referral:${attr.id}`);
    if (c && c.status === 'ISSUED') {
      c.status = 'CANCELLED';
      c.cancelledAt = ctx.now;
      c.cancelReason = `피추천인 이용 취소: ${reason}`;
      attr.status = 'PENDING';
      attr.qualifyingRef = null;
      attr.reason = '이용 취소로 재대기';
      for (const l of s.ledger) if (l.idempotencyKey === `refexp:${attr.id}`) l.status = 'EXPECTED';
    } else if (c && c.status === 'REDEEMED') {
      attr.status = 'REVERSED';
      attr.reason = '보상 쿠폰이 이미 사용됨 — 운영 검토 필요';
      task(s, ctx, 'REFERRAL_REVIEW', attr.id, '추천 보상 사용 후 피추천인 이용 취소 — 검토 필요', attr.referrerId, null);
    }
  }
}

/* ── 쿠폰 사용·취소 ────────────────────────────────── */
export function redeemCoupon(s: AppState, ctx: Ctx, couponId: string) {
  assertCan(ctx.actorRole, 'coupon.redeem');
  const c = s.coupons.find((x) => x.id === couponId);
  if (!c) throw new DomainError('쿠폰을 찾을 수 없습니다.');
  if (c.status !== 'ISSUED') throw new DomainError('사용할 수 없는 쿠폰입니다.');
  if (new Date(c.expiresAt) < new Date(ctx.now)) throw new DomainError('유효기간이 지난 쿠폰입니다.');
  Object.assign(c, { status: 'REDEEMED', redeemedAt: ctx.now, redeemedBy: ctx.actorId });
  audit(s, ctx, 'coupon.redeem', c.id, c.title);
  notify(s, ctx, c.userId, 'SERVICE', '쿠폰을 사용했어요', `${c.title}이(가) 매장에서 사용 처리되었습니다.`, '/my/coupons');
}

export function cancelCoupon(s: AppState, ctx: Ctx, couponId: string, reason: string) {
  assertCan(ctx.actorRole, 'coupon.cancel');
  if (!reason.trim()) throw new DomainError('취소 사유를 입력해 주세요(감사 기록).');
  const c = s.coupons.find((x) => x.id === couponId);
  if (!c || c.status !== 'ISSUED') throw new DomainError('발급 상태의 쿠폰만 취소할 수 있습니다.');
  Object.assign(c, { status: 'CANCELLED', cancelledAt: ctx.now, cancelReason: reason });
  audit(s, ctx, 'coupon.cancel', c.id, reason);
}

export function reissueCoupon(s: AppState, ctx: Ctx, couponId: string, reason: string) {
  assertCan(ctx.actorRole, 'coupon.cancel');
  const c = s.coupons.find((x) => x.id === couponId);
  if (!c) throw new DomainError('쿠폰을 찾을 수 없습니다.');
  const rule = s.loyaltyRules.find((r) => r.id === c.ruleId);
  if (!rule) throw new DomainError('규칙을 찾을 수 없습니다.');
  const n = issueCoupon(s, ctx, c.userId, rule, `재발급: ${reason}`, `reissue:${c.id}`);
  if (!n) throw new DomainError('이미 재발급된 쿠폰이거나 비활성 규칙입니다.');
  audit(s, ctx, 'coupon.reissue', c.id, reason);
}

export function updateLoyaltyRule(s: AppState, ctx: Ctx, ruleId: string, patch: Partial<Pick<LoyaltyRule, 'title' | 'benefit' | 'stampsRequired' | 'validDays' | 'active' | 'qualifyingEvent'>>) {
  assertCan(ctx.actorRole, 'rules.edit');
  const r = s.loyaltyRules.find((x) => x.id === ruleId);
  if (!r) throw new DomainError('규칙을 찾을 수 없습니다.');
  if (patch.stampsRequired != null && (patch.stampsRequired < 2 || patch.stampsRequired > 30)) throw new DomainError('스탬프 개수는 2~30 사이로 설정해 주세요.');
  if (patch.validDays != null && (patch.validDays < 1 || patch.validDays > 365)) throw new DomainError('유효기간은 1~365일로 설정해 주세요.');
  Object.assign(r, patch, { updatedAt: ctx.now, updatedBy: ctx.actorId, evidence: 'USER_PROVIDED' });
  audit(s, ctx, 'rule.update', r.id, JSON.stringify(patch));
}

/* ── 재구매 후보 (Flow B) ──────────────────────────── */
export function refreshReorderCandidates(s: AppState, ctx: Ctx) {
  const list = computeReorderCandidates(s, new Date(ctx.now));
  for (const c of list) {
    s.reorderCandidates.unshift({ id: uid('rco'), ...c, status: 'SUGGESTED', createdAt: ctx.now, decidedAt: null, decidedBy: null, notificationId: null, convertedRef: null, isDemo: ctx.isDemo });
  }
  return list.length;
}

export function decideReorder(s: AppState, ctx: Ctx, id: string, approve: boolean) {
  assertCan(ctx.actorRole, 'reorder.approve');
  const c = s.reorderCandidates.find((x) => x.id === id);
  if (!c || c.status !== 'SUGGESTED') throw new DomainError('검토 대기 후보가 아닙니다.');
  c.status = approve ? 'APPROVED' : 'DISMISSED';
  c.decidedAt = ctx.now;
  c.decidedBy = ctx.actorId;
  audit(s, ctx, approve ? 'reorder.approve' : 'reorder.dismiss', c.id);
  if (approve && hasConsent(s, c.userId, 'marketing_inapp')) {
    const item = getMenuItem(s, c.menuItemId);
    const n = notify(s, ctx, c.userId, 'MARKETING', `저장하신 '${item?.name}' 어떠세요?`, '저장해 두신 메뉴예요. 매장에서 주문 후 회원번호를 보여주시면 스탬프가 적립됩니다.', `/menu/${c.menuItemId}`);
    c.notificationId = n.id;
  }
}

/* ── 캠페인 ───────────────────────────────────────── */
export function campaignTemplate(segment: SegmentKey): { title: string; body: string } {
  switch (segment) {
    case 'NEW_NO_VISIT':
      return { title: '첫 방문을 기다리고 있어요', body: '가입 혜택 쿠폰이 내 정보 > 쿠폰함에 있어요. 매장에서 회원번호를 보여주시면 첫 스탬프가 적립됩니다.' };
    case 'LAPSED_30':
      return { title: '오랜만이에요, 다시 만나요', body: '향동천 산책길에 들러 쉬어가세요. 방문 확인 시 스탬프가 적립됩니다.' };
    case 'FAVORITE_NO_PURCHASE':
      return { title: '저장한 메뉴, 오늘 어떠세요?', body: '저장해 두신 메뉴를 매장에서 만나보세요. 구매 확인 시 스탬프가 적립됩니다.' };
    case 'RECENT_INTEREST':
      return { title: '관심 있는 메뉴, 매장에서 만나보세요', body: '최근 저장하거나 관심을 남긴 메뉴·서비스 소식이에요. 매장에서 회원번호를 보여주시면 확인 후 스탬프가 적립돼요.' };
    case 'STAMP_NEAR':
      return { title: '보상까지 거의 다 왔어요', body: '스탬프 몇 개만 더 모으면 보상 쿠폰이 발급됩니다.' };
    case 'ALL_CONSENTED':
      return { title: '다색컴패니언 소식', body: '이번 주 매장 소식을 확인해 보세요.' };
  }
}

export function createCampaign(s: AppState, ctx: Ctx, input: { name: string; segment: SegmentKey; channel: Campaign['channel']; title: string; body: string }) {
  assertCan(ctx.actorRole, 'campaign.create');
  if (!input.title.trim() || !input.body.trim()) throw new DomainError('제목과 본문을 입력해 주세요.');
  const c: Campaign = {
    id: uid('cmp'),
    name: input.name.trim() || SEGMENTS[input.segment].label,
    segment: input.segment,
    channel: input.channel,
    title: input.title.trim(),
    body: input.body.trim(),
    draftMethod: 'TEMPLATE_RULE',
    status: 'DRAFT',
    why: SEGMENTS[input.segment].why,
    createdBy: ctx.actorId ?? 'system',
    approvedBy: null,
    createdAt: ctx.now,
    sentAt: null,
    recipients: segmentMembers(s, input.segment, new Date(ctx.now)).length,
    isDemo: ctx.isDemo,
  };
  s.campaigns.unshift(c);
  audit(s, ctx, 'campaign.create', c.id, c.name);
  return c;
}

export function approveAndSendCampaign(s: AppState, ctx: Ctx, id: string) {
  assertCan(ctx.actorRole, 'campaign.approve');
  const c = s.campaigns.find((x) => x.id === id);
  if (!c) throw new DomainError('캠페인을 찾을 수 없습니다.');
  if (c.status === 'SENT') throw new DomainError('이미 발송된 캠페인입니다.');
  if (c.channel !== 'IN_APP') throw new DomainError('카카오·푸시 발송은 수신동의·발송 인프라·요금 확인 전까지 연결되지 않았습니다(READY).');
  const now = new Date(ctx.now);
  // 중복 발송 방지: 최근 7일 같은 대상(세그먼트) 알림을 이미 받은 회원은 제외
  const sameSeg = new Set(s.campaigns.filter((x) => x.id !== c.id && x.segment === c.segment && x.status === 'SENT' && x.sentAt && (now.getTime() - new Date(x.sentAt).getTime()) / 86_400_000 < 7).map((x) => x.id));
  const already = new Set(s.notifications.filter((n) => n.campaignId && sameSeg.has(n.campaignId)).map((n) => n.userId));
  const all = segmentMembers(s, c.segment, now);
  const members = all.filter((m) => !already.has(m.id));
  for (const m of members) notify(s, ctx, m.id, 'MARKETING', c.title, c.body, campaignLinkFor(s, c.segment, m.id, now), c.id);
  Object.assign(c, { status: 'SENT', approvedBy: ctx.actorId, sentAt: ctx.now, recipients: members.length, excludedDuplicates: all.length - members.length });
  audit(s, ctx, 'campaign.send', c.id, `recipients=${members.length} excluded_dup=${all.length - members.length}`);
  proof(s, ctx, {
    event_type: 'CAMPAIGN_SENT',
    trigger: `세그먼트: ${SEGMENTS[c.segment].label}`,
    decision: '운영 책임자 승인',
    decision_method: 'RULE+HUMAN',
    why: c.why.join(' / '),
    human_approval: ctx.actorId,
    action: `인앱 알림 ${members.length}명 (수신동의자만${all.length - members.length ? ` · 최근 7일 중복 ${all.length - members.length}명 제외` : ''})`,
    result: '발송 완료 — 성과는 이후 확인 이용으로만 측정',
    kpi_before: null,
    kpi_after: null,
    data_source: `campaigns/${c.id}`,
    user_id: null,
    result_confirmed_at: null,
    evidence_link: '/ax/campaigns',
  });
}

export function pauseCampaign(s: AppState, ctx: Ctx, id: string) {
  assertCan(ctx.actorRole, 'campaign.approve');
  const c = s.campaigns.find((x) => x.id === id);
  if (!c || c.status === 'SENT') throw new DomainError('발송 전 캠페인만 중지할 수 있습니다.');
  c.status = c.status === 'PAUSED' ? 'DRAFT' : 'PAUSED';
  audit(s, ctx, 'campaign.pause_toggle', c.id, c.status);
}

/* ── 알림·로드맵·요청 ──────────────────────────────── */
export function markNotificationRead(s: AppState, ctx: Ctx, id: string) {
  const n = s.notifications.find((x) => x.id === id);
  if (n && !n.readAt) {
    n.readAt = ctx.now;
    track(s, ctx, n.userId, 'notification_open', n.id, `알림 확인: ${n.title}`);
  }
}

export function markAllRead(s: AppState, ctx: Ctx, userId: string) {
  for (const n of s.notifications) if (n.userId === userId && !n.readAt) n.readAt = ctx.now;
}

export function toggleRoadmapInterest(s: AppState, ctx: Ctx, userId: string | null, itemKey: string, notifyConsent: boolean) {
  const existing = s.roadmapInterest.find((r) => r.itemKey === itemKey && r.userId === userId && userId);
  if (existing) {
    s.roadmapInterest = s.roadmapInterest.filter((r) => r !== existing);
    return false;
  }
  s.roadmapInterest.unshift({ id: uid('rmi'), userId, itemKey, notifyConsent: !!userId && notifyConsent, createdAt: ctx.now });
  track(s, ctx, userId, 'roadmap_interest', itemKey, `향후 서비스 관심: ${ROADMAP.find((r) => r.key === itemKey)?.title ?? '준비 중인 서비스'}`);
  return true;
}

export function requestDeletion(s: AppState, ctx: Ctx, userId: string) {
  const p = getProfile(s, userId);
  if (!p) throw new DomainError('계정을 찾을 수 없습니다.');
  if (p.status === 'deletion_requested') throw new DomainError('이미 요청되었습니다.');
  p.status = 'deletion_requested';
  task(s, ctx, 'CUSTOMER_REQUEST', userId, `${p.name}님 탈퇴·정보 삭제 요청`, userId, null);
  audit(s, ctx, 'member.deletion_request', userId);
}

export function processDeletion(s: AppState, ctx: Ctx, userId: string) {
  assertCan(ctx.actorRole, 'member.process_deletion');
  const p = getProfile(s, userId);
  if (!p) throw new DomainError('계정을 찾을 수 없습니다.');
  Object.assign(p, { name: '탈퇴 회원', phoneHash: null, phoneLast4: null, status: 'anonymized', referralCode: null });
  s.favorites = s.favorites.filter((f) => f.userId !== userId);
  s.recentViews = s.recentViews.filter((v) => v.userId !== userId);
  s.notifications = s.notifications.filter((n) => n.userId !== userId);
  for (const c of s.coupons) if (c.userId === userId && c.status === 'ISSUED') Object.assign(c, { status: 'CANCELLED', cancelledAt: ctx.now, cancelReason: '회원 탈퇴' });
  for (const c of s.consents) if (c.userId === userId && !c.withdrawnAt) c.withdrawnAt = ctx.now;
  if (s.session.customerId === userId) s.session.customerId = null;
  closeTask(s, ctx, userId);
  audit(s, ctx, 'member.anonymize', userId, '거래·확인 기록은 법정 보관 검토 전까지 익명 상태로 유지');
}

/* ── 콘텐츠 관리 ───────────────────────────────────── */
export function updateMenuItem(s: AppState, ctx: Ctx, id: string, patch: Partial<Pick<MenuItem, 'name' | 'summary' | 'description' | 'price' | 'priceEvidence' | 'published' | 'isSignature' | 'nutritionStatus'>>) {
  assertCan(ctx.actorRole, 'content.edit');
  const m = s.menuItems.find((x) => x.id === id);
  if (!m) throw new DomainError('메뉴를 찾을 수 없습니다.');
  if (patch.price != null && (patch.price < 0 || patch.price > 1_000_000)) throw new DomainError('가격을 확인해 주세요.');
  Object.assign(m, patch);
  audit(s, ctx, 'menu.update', id, JSON.stringify(patch));
}

export function updateCat(s: AppState, ctx: Ctx, id: string, patch: Partial<Pick<import('./types').CafeCat, 'name' | 'tagline' | 'personality' | 'likes' | 'interactionTips' | 'published' | 'internalNote' | 'isPlaceholder' | 'breed' | 'sex'>>) {
  assertCan(ctx.actorRole, 'content.edit');
  const c = s.cats.find((x) => x.id === id);
  if (!c) throw new DomainError('고양이를 찾을 수 없습니다.');
  Object.assign(c, patch);
  audit(s, ctx, 'cat.update', id, Object.keys(patch).join(','));
}

export function addCat(s: AppState, ctx: Ctx, name: string) {
  assertCan(ctx.actorRole, 'content.edit');
  if (!name.trim()) throw new DomainError('이름을 입력해 주세요.');
  const coats = ['orange', 'gray', 'black', 'white', 'cream', 'brown'] as const;
  const id = uid('cat');
  s.cats.push({
    id,
    name: name.trim(),
    isPlaceholder: false,
    tagline: '소개를 입력해 주세요',
    personality: [],
    likes: [],
    interactionTips: ['처음에는 손 냄새를 맡게 해 주세요'],
    coverArt: { kind: 'cat', coat: coats[s.cats.length % coats.length], pattern: 'solid', eyes: 'amber', pose: 'sit', bg: s.cats.length % 5 },
    published: false,
    sortOrder: s.cats.length,
    internalNote: '',
  });
  audit(s, ctx, 'cat.create', id, name);
  return id;
}

export function moveCat(s: AppState, ctx: Ctx, id: string, dir: -1 | 1) {
  assertCan(ctx.actorRole, 'content.edit');
  const sorted = [...s.cats].sort((a, b) => a.sortOrder - b.sortOrder);
  const i = sorted.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= sorted.length) return;
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  sorted.forEach((c, idx) => (s.cats.find((x) => x.id === c.id)!.sortOrder = idx));
  audit(s, ctx, 'cat.reorder', id, String(dir));
}

export function addCatPhoto(s: AppState, ctx: Ctx, catId: string, input: { dataUrl: string; caption: string }) {
  if (ctx.actorRole === 'customer') throw new DomainError('권한이 없습니다.');
  const cat = s.cats.find((c) => c.id === catId);
  if (!cat) throw new DomainError('고양이를 찾을 수 없습니다.');
  const p: CatPhoto = {
    id: uid('pho'),
    catId,
    art: null,
    dataUrl: input.dataUrl,
    slot: null,
    caption: input.caption.trim() || `${cat.name}`,
    alt: `${cat.name} 사진${input.caption ? ` — ${input.caption}` : ''}`,
    status: 'PENDING_REVIEW',
    sortOrder: s.catPhotos.filter((x) => x.catId === catId).length,
    uploadedBy: ctx.actorId,
    createdAt: ctx.now,
  };
  s.catPhotos.push(p);
  task(s, ctx, 'PHOTO_REVIEW', p.id, `${cat.name} 사진 공개 승인`, null, null);
  audit(s, ctx, 'photo.upload', p.id, catId);
  return p;
}

export function reviewPhoto(s: AppState, ctx: Ctx, photoId: string, status: 'PUBLISHED' | 'HIDDEN') {
  assertCan(ctx.actorRole, 'photo.approve');
  const p = s.catPhotos.find((x) => x.id === photoId);
  if (!p) throw new DomainError('사진을 찾을 수 없습니다.');
  p.status = status;
  closeTask(s, ctx, photoId, status === 'PUBLISHED' ? 'DONE' : 'DISMISSED');
  audit(s, ctx, `photo.${status.toLowerCase()}`, photoId);
}

/** 메뉴 사진 교체/초기화 — 고객 화면에 즉시 반영 (DEMO: 브라우저 저장) */
export function updateMenuPhoto(s: AppState, ctx: Ctx, id: string, dataUrl: string | null) {
  assertCan(ctx.actorRole, 'content.edit');
  const m = s.menuItems.find((x) => x.id === id);
  if (!m) throw new DomainError('메뉴를 찾을 수 없습니다.');
  m.photoDataUrl = dataUrl;
  audit(s, ctx, dataUrl ? 'menu.photo_replace' : 'menu.photo_reset', id);
}

function catPhotosSorted(s: AppState, catId: string) {
  return s.catPhotos.filter((p) => p.catId === catId).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** 대표 사진 지정 — 맨 앞으로 이동 (고객 카드·레일의 대표 이미지) */
export function setCatCover(s: AppState, ctx: Ctx, photoId: string) {
  assertCan(ctx.actorRole, 'content.edit');
  const p = s.catPhotos.find((x) => x.id === photoId);
  if (!p) throw new DomainError('사진을 찾을 수 없습니다.');
  if (p.status !== 'PUBLISHED') throw new DomainError('공개된 사진만 대표 사진으로 지정할 수 있어요.');
  const list = catPhotosSorted(s, p.catId).filter((x) => x.id !== p.id);
  [p, ...list].forEach((x, i) => (x.sortOrder = i));
  audit(s, ctx, 'photo.set_cover', photoId, p.catId);
}

export function moveCatPhoto(s: AppState, ctx: Ctx, photoId: string, dir: -1 | 1) {
  assertCan(ctx.actorRole, 'content.edit');
  const p = s.catPhotos.find((x) => x.id === photoId);
  if (!p) throw new DomainError('사진을 찾을 수 없습니다.');
  const list = catPhotosSorted(s, p.catId);
  const i = list.findIndex((x) => x.id === photoId);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((x, k) => (x.sortOrder = k));
  audit(s, ctx, 'photo.reorder', photoId, String(dir));
}

/** 고객 화면용: 공개 사진만, 순서대로 */
export function publishedCatPhotos(s: AppState, catId: string) {
  return catPhotosSorted(s, catId).filter((p) => p.status === 'PUBLISHED');
}

export function updateStoreFact(s: AppState, ctx: Ctx, storeId: string, field: 'hours' | 'phone' | 'reservationUrl' | 'orderUrl' | 'deliveryUrl' | 'feeInfo', value: string) {
  assertCan(ctx.actorRole, 'settings.store');
  const st = s.stores.find((x) => x.id === storeId);
  if (!st) throw new DomainError('매장을 찾을 수 없습니다.');
  const v = value.trim();
  if ((field === 'reservationUrl' || field === 'orderUrl' || field === 'deliveryUrl') && v && !/^https:\/\//.test(v)) throw new DomainError('링크는 https:// 로 시작해야 합니다.');
  st[field] = { value: v || null, evidence: v ? 'VERIFIED' : 'UNKNOWN', source: v ? '운영 책임자 직접 입력' : '미입력', checkedAt: ctx.now };
  audit(s, ctx, 'store.update', storeId, field);
}
