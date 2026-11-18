/**
 * RULE 엔진 + 조회(Selector) + KPI 집계
 * - 여기 있는 모든 "추천/후보/세그먼트"는 RULE 또는 ANALYTICS(집계)다. AI 모델이 아니다.
 * - 각 결과는 `사용한 정보 → 이유 → 주의사항 → 다음 행동` 근거를 함께 반환한다.
 */
import type { AppState, BrandId, ConsentPurpose, CouponIssue, MenuItem, Profile, SegmentKey } from './types';
import { DAY, dayKey, daysBetween } from './util';

/* ── 기본 조회 ─────────────────────────────────────── */
export const getProfile = (s: AppState, id: string | null | undefined) => (id ? s.profiles.find((p) => p.id === id) ?? null : null);

/** 운영자 표시 정보 — 이름·직함은 프로필 데이터에서 온다 (실제 인증 연결 시 로그인 사용자 프로필로 대체) */
export function operatorIdentity(p: Profile) {
  const roleLabel = p.role === 'manager' ? '운영 책임자' : p.role === 'staff' ? '매장 직원' : '고객';
  return { displayName: p.title ? `${p.name} ${p.title}` : p.name, roleLabel, initial: p.name.slice(0, 1), isDemo: p.isDemo };
}
export const getMenuItem = (s: AppState, id: string) => s.menuItems.find((m) => m.id === id) ?? null;
export const getStore = (s: AppState, id: string) => s.stores.find((x) => x.id === id) ?? null;
export const storeOfBrand = (s: AppState, brand: BrandId) => s.stores.find((x) => x.brand === brand)!;
export const customers = (s: AppState) => s.profiles.filter((p) => p.role === 'customer' && p.status !== 'anonymized');
export const operators = (s: AppState) => s.profiles.filter((p) => p.role !== 'customer');

export function hasConsent(s: AppState, userId: string, purpose: ConsentPurpose): boolean {
  const rows = s.consents.filter((c) => c.userId === userId && c.purpose === purpose);
  if (!rows.length) return false;
  const latest = rows.reduce((a, b) => (a.at > b.at ? a : b));
  return latest.granted && !latest.withdrawnAt;
}

export function effectiveCouponStatus(c: CouponIssue, now: Date = new Date()): CouponIssue['status'] {
  if (c.status === 'ISSUED' && new Date(c.expiresAt) < now) return 'EXPIRED';
  return c.status;
}

export function couponsFor(s: AppState, userId: string, now = new Date()) {
  return s.coupons
    .filter((c) => c.userId === userId)
    .map((c) => ({ ...c, status: effectiveCouponStatus(c, now) }))
    .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
}

export interface VerifiedUse {
  kind: 'VISIT' | 'PURCHASE';
  id: string;
  storeId: string;
  at: string;
  amount: number | null;
  menuItemIds: string[];
}

/** 직원확인/POS 검증된 이용만 포함 — 클릭·자가신고는 제외 */
export function verifiedUses(s: AppState, userId?: string): VerifiedUse[] {
  const visits: VerifiedUse[] = s.checkins
    .filter((c) => c.status === 'CONFIRMED' && (!userId || c.userId === userId))
    .map((c) => ({ kind: 'VISIT', id: c.id, storeId: c.storeId, at: c.decidedAt ?? c.createdAt, amount: null, menuItemIds: [] }));
  const buys: VerifiedUse[] = s.verifications
    .filter((v) => v.status === 'CONFIRMED' && (!userId || v.userId === userId))
    .map((v) => ({ kind: 'PURCHASE', id: v.id, storeId: v.storeId, at: v.decidedAt ?? v.createdAt, amount: v.amount, menuItemIds: v.menuItemIds }));
  return [...visits, ...buys].sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function stampCount(s: AppState, userId: string): number {
  return s.ledger.filter((l) => l.userId === userId && l.kind === 'STAMP' && l.status === 'CONFIRMED').reduce((n, l) => n + l.delta, 0);
}

export function stampRule(s: AppState) {
  return s.loyaltyRules.find((r) => r.kind === 'STAMP')!;
}

export function lastVerifiedAt(s: AppState, userId: string): string | null {
  const u = verifiedUses(s, userId);
  return u.length ? u[0].at : null;
}

/* ── 세그먼트 (RULE) ───────────────────────────────── */
export const SEGMENTS: Record<SegmentKey, { label: string; rule: string; why: string[] }> = {
  NEW_NO_VISIT: {
    label: '가입 후 확인된 첫 이용 없음 (3일+)',
    rule: '가입 3일 경과 AND 직원확인 방문·구매 0건 AND 인앱 마케팅 동의',
    why: ['가입만 하고 매장 경험이 없으면 이탈 가능성이 큼', '첫 이용 전환은 추천 보상·스탬프의 출발점'],
  },
  LAPSED_30: {
    label: '30일 이상 미방문 재방문 대상',
    rule: '최근 확인 이용이 30일 이전 AND 확인 이용 1회 이상 AND 인앱 마케팅 동의',
    why: ['한 번 이상 이용한 고객은 재방문 비용이 신규보다 낮음', '30일은 운영자가 바꿀 수 있는 기준값(가정)'],
  },
  FAVORITE_NO_PURCHASE: {
    label: '저장한 메뉴를 14일간 구매 확인 없음',
    rule: '저장 메뉴 존재 AND 해당 메뉴 확인 구매 14일 없음 AND 인앱 마케팅 동의',
    why: ['저장 = 명시적 관심 신호', '구매 확인이 되면 재구매 성과로 측정 가능'],
  },
  RECENT_INTEREST: {
    label: '최근 7일 메뉴 저장·서비스 관심 회원',
    rule: '최근 7일 메뉴 저장 또는 준비 중 서비스 관심 등록 AND 인앱 마케팅 동의',
    why: ['고객이 직접 남긴 관심 신호(저장·관심 등록)', '관심 메뉴·서비스 안내로 다음 방문을 유도', '성과는 이후 직원이 확인한 방문·구매로만 측정'],
  },
  STAMP_NEAR: {
    label: '스탬프 보상까지 2개 이하 남음',
    rule: '현재 주기 스탬프 ≥ (필요 개수 − 2) AND 인앱 마케팅 동의',
    why: ['보상 직전 고객은 방문 동기가 가장 큼'],
  },
  ALL_CONSENTED: {
    label: '인앱 혜택 알림 동의 회원 전체',
    rule: '인앱 마케팅 동의 = 예',
    why: ['전체 공지형 혜택 안내'],
  },
};

export function segmentMembers(s: AppState, key: SegmentKey, now = new Date()): Profile[] {
  const nowIso = now.toISOString();
  const rule = stampRule(s);
  return customers(s).filter((p) => {
    if (p.status !== 'active' || !hasConsent(s, p.id, 'marketing_inapp')) return false;
    const uses = verifiedUses(s, p.id);
    switch (key) {
      case 'NEW_NO_VISIT':
        return uses.length === 0 && daysBetween(p.createdAt, nowIso) >= 3;
      case 'LAPSED_30':
        return uses.length > 0 && daysBetween(uses[0].at, nowIso) >= 30;
      case 'FAVORITE_NO_PURCHASE':
        return favoriteWithoutPurchase(s, p.id, now).length > 0;
      case 'RECENT_INTEREST': {
        const r = recentInterests(s, p.id, now);
        return r.menus.length + r.services.length > 0;
      }
      case 'STAMP_NEAR': {
        const req = rule.stampsRequired ?? 10;
        const inCycle = stampCount(s, p.id) % req;
        return inCycle >= req - 2;
      }
      case 'ALL_CONSENTED':
        return true;
    }
  });
}

/** 최근 7일 고객이 직접 남긴 관심 — 저장한 메뉴(최신순)·관심 등록한 준비 중 서비스 */
export function recentInterests(s: AppState, userId: string, now = new Date()) {
  const within = (iso: string) => (now.getTime() - new Date(iso).getTime()) / DAY <= 7;
  const menus = s.favorites
    .filter((f) => f.userId === userId && within(f.createdAt))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((f) => getMenuItem(s, f.menuItemId))
    .filter((m): m is MenuItem => !!m && m.published);
  const services = s.roadmapInterest.filter((r) => r.userId === userId && within(r.createdAt)).map((r) => r.itemKey);
  return { menus, services };
}

/** 회원별 알림 이동 경로 — 관심을 남긴 메뉴로 바로 (규칙 기반 개인화, AI 아님) */
export function campaignLinkFor(s: AppState, segment: SegmentKey, userId: string, now = new Date()): string {
  if (segment === 'RECENT_INTEREST') {
    const r = recentInterests(s, userId, now);
    if (r.menus[0]) return `/menu/${r.menus[0].id}`;
    if (r.services.length) return '/roadmap';
  }
  if (segment === 'FAVORITE_NO_PURCHASE') {
    const m = favoriteWithoutPurchase(s, userId, now)[0];
    if (m) return `/menu/${m.id}`;
  }
  if (segment === 'NEW_NO_VISIT' || segment === 'STAMP_NEAR') return '/my';
  return '/';
}

/**
 * 캠페인 결과 — 발송·확인·후속 행동(신호)과 직원 확인 방문·구매(실적)를 섞지 않는다.
 *  · 후속 행동: 알림을 연 뒤 같은 회원이 남긴 메뉴 조회·저장·관심 등록
 *  · 확인 이용: 발송 이후 그 회원의 직원 확인 방문·구매 (알림 때문이라고 단정하지 않음)
 */
export function campaignResults(s: AppState, campaignId: string) {
  const c = s.campaigns.find((x) => x.id === campaignId);
  const notes = s.notifications.filter((n) => n.campaignId === campaignId);
  const opened = notes.filter((n) => n.readAt);
  const followUps = opened.filter((n) =>
    s.events.some((e) => e.userId === n.userId && e.createdAt >= n.readAt! && (e.type === 'view_menu' || e.type === 'favorite_add' || e.type === 'roadmap_interest')),
  ).length;
  const confirmedUses = c?.sentAt ? notes.filter((n) => verifiedUses(s, n.userId).some((u) => u.at >= c.sentAt!)).length : 0;
  return { sent: notes.length, opened: opened.length, followUps, confirmedUses, excluded: c?.excludedDuplicates ?? 0 };
}

export function favoriteWithoutPurchase(s: AppState, userId: string, now = new Date()): MenuItem[] {
  const favs = s.favorites.filter((f) => f.userId === userId);
  const buys = verifiedUses(s, userId).filter((u) => u.kind === 'PURCHASE');
  return favs
    .filter((f) => {
      const ageDays = (now.getTime() - new Date(f.createdAt).getTime()) / DAY;
      if (ageDays < 1) return false; // 저장 직후는 제외
      const recent = buys.find((b) => b.menuItemIds.includes(f.menuItemId) && (now.getTime() - new Date(b.at).getTime()) / DAY < 14);
      return !recent;
    })
    .map((f) => getMenuItem(s, f.menuItemId))
    .filter((m): m is MenuItem => !!m && m.published);
}

/* ── 재구매 후보 (RULE + HUMAN 승인) ─────────────────── */
export function computeReorderCandidates(s: AppState, now = new Date()) {
  const out: { userId: string; menuItemId: string; reasons: string[] }[] = [];
  for (const p of customers(s)) {
    if (p.status !== 'active') continue;
    for (const m of favoriteWithoutPurchase(s, p.id, now)) {
      const exists = s.reorderCandidates.some((c) => c.userId === p.id && c.menuItemId === m.id && (c.status === 'SUGGESTED' || c.status === 'APPROVED'));
      if (exists) continue;
      const fav = s.favorites.find((f) => f.userId === p.id && f.menuItemId === m.id)!;
      const reasons = [
        `'${m.name}'을(를) ${Math.max(1, daysBetween(fav.createdAt, now.toISOString()))}일 전에 저장함`,
        '저장 이후 14일간 이 메뉴의 직원확인 구매 없음',
        hasConsent(s, p.id, 'marketing_inapp') ? '인앱 혜택 알림 수신 동의 있음 → 승인 시 인앱 안내 가능' : '마케팅 동의 없음 → 승인해도 발송하지 않고 매장 응대 메모로만 사용',
      ];
      out.push({ userId: p.id, menuItemId: m.id, reasons });
    }
  }
  return out;
}

/* ── 고객 메뉴 추천 (RULE, 설명 가능) ────────────────── */
export interface Recommendation {
  item: MenuItem;
  used: string[];
  reasons: string[];
  caution: string;
  next: string;
}

export function recommendMenus(s: AppState, userId: string | null, limit = 4): Recommendation[] {
  const items = s.menuItems.filter((m) => m.published);
  const favIds = new Set(userId ? s.favorites.filter((f) => f.userId === userId).map((f) => f.menuItemId) : []);
  const viewed = userId ? s.recentViews.filter((v) => v.userId === userId).map((v) => v.menuItemId) : [];
  const favCats = new Set(items.filter((m) => favIds.has(m.id)).map((m) => m.categoryId));
  const favTags = new Set(items.filter((m) => favIds.has(m.id)).flatMap((m) => m.tags));
  const popularity = new Map<string, number>();
  for (const v of s.verifications.filter((x) => x.status === 'CONFIRMED')) for (const id of v.menuItemIds) popularity.set(id, (popularity.get(id) ?? 0) + 1);

  const scored = items
    .filter((m) => !favIds.has(m.id))
    .map((m) => {
      let score = 0;
      const reasons: string[] = [];
      if (favCats.has(m.categoryId)) {
        score += 3;
        reasons.push('저장하신 메뉴와 같은 카테고리');
      }
      const tagHit = m.tags.filter((t) => favTags.has(t));
      if (tagHit.length) {
        score += 2;
        reasons.push(`관심 태그 일치: ${tagHit.slice(0, 2).join(', ')}`);
      }
      if (viewed.includes(m.id)) {
        score += 1;
        reasons.push('최근에 살펴본 메뉴');
      }
      const pop = popularity.get(m.id) ?? 0;
      if (pop > 0) {
        score += Math.min(2, pop / 3);
        reasons.push(`매장 확인 구매 ${pop}건`);
      }
      if (m.isSignature) {
        score += 1.5;
        reasons.push('매장 대표 메뉴');
      }
      return { m, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ m, reasons }) => ({
    item: m,
    used: userId ? ['내가 저장한 메뉴', '최근 본 메뉴', '매장 확인 구매 집계'] : ['매장 확인 구매 집계', '대표 메뉴 표시'],
    reasons: reasons.length ? reasons.slice(0, 4) : ['새로 둘러보기 좋은 메뉴'],
    caution: m.allergenStatus === 'VERIFIED' ? '알레르기 정보는 매장에 한 번 더 확인하세요.' : '영양·알레르기 정보가 아직 확인되지 않았습니다. 주문 전 매장에 문의하세요.',
    next: '메뉴 상세에서 저장하거나 매장에서 주문해 보세요.',
  }));
}

/* ── KPI (ANALYTICS) ───────────────────────────────── */
export interface Kpis {
  costMedianMinutes: number | null;
  costSample: number;
  revenueRepeatRate: number | null;
  revenueRepeatNum: number;
  revenueRepeatDen: number;
  scaleActivePerOperator: number | null;
  activeCustomers: number;
  operatorCount: number;
  pendingQueue: number;
  verifiedThisWeek: number;
  clicksThisWeek: number;
  selfReportsThisWeek: number;
}

export function computeKpis(s: AppState, now = new Date()): Kpis {
  const since30 = now.getTime() - 30 * DAY;
  const since7 = now.getTime() - 7 * DAY;
  // COST: 확인 요청 → 직원 처리까지 걸린 시간 중앙값
  const durations = [...s.checkins, ...s.verifications.filter((v) => v.method === 'SELF_REPORT')]
    .filter((x) => x.decidedAt && (x.status === 'CONFIRMED' || x.status === 'REJECTED') && new Date(x.decidedAt).getTime() > since30)
    .map((x) => (new Date(x.decidedAt!).getTime() - new Date(x.createdAt).getTime()) / 60000)
    .sort((a, b) => a - b);
  const median = durations.length ? durations[Math.floor(durations.length / 2)] : null;

  // REVENUE: 30일 내 확인 이용 고객 중 2회 이상 확인 이용(재방문·재구매) 비율
  const byUser = new Map<string, number>();
  for (const u of customers(s)) {
    const n = verifiedUses(s, u.id).filter((x) => new Date(x.at).getTime() > since30).length;
    if (n > 0) byUser.set(u.id, n);
  }
  const den = byUser.size;
  const num = [...byUser.values()].filter((n) => n >= 2).length;

  const ops = operators(s).length;
  const pending = s.tasks.filter((t) => t.status === 'OPEN').length;
  const verifiedThisWeek = verifiedUses(s).filter((u) => new Date(u.at).getTime() > since7).length;
  const clicksThisWeek = s.events.filter((e) => (e.type === 'order_link_click' || e.type === 'reservation_link_click') && new Date(e.createdAt).getTime() > since7).length;
  const selfReportsThisWeek = s.verifications.filter((v) => v.method === 'SELF_REPORT' && new Date(v.createdAt).getTime() > since7).length;

  return {
    costMedianMinutes: median == null ? null : Math.round(median),
    costSample: durations.length,
    revenueRepeatRate: den ? num / den : null,
    revenueRepeatNum: num,
    revenueRepeatDen: den,
    scaleActivePerOperator: ops ? Math.round((den / ops) * 10) / 10 : null,
    activeCustomers: den,
    operatorCount: ops,
    pendingQueue: pending,
    verifiedThisWeek,
    clicksThisWeek,
    selfReportsThisWeek,
  };
}

/** 가입 → 첫 확인 이용 → 재이용 퍼널 */
export function funnel(s: AppState) {
  const cs = customers(s);
  const signedUp = cs.length;
  const firstUse = cs.filter((c) => verifiedUses(s, c.id).length >= 1).length;
  const repeat = cs.filter((c) => verifiedUses(s, c.id).length >= 2).length;
  const referred = s.referrals.length;
  const referralRewarded = s.referrals.filter((r) => r.status === 'REWARDED').length;
  return { signedUp, firstUse, repeat, referred, referralRewarded };
}

/** 증거 수준별 이벤트 수 — 클릭·자가신고·직원확인·POS를 섞지 않는다 */
export function evidenceLevels(s: AppState, days = 30, now = new Date()) {
  const since = now.getTime() - days * DAY;
  const inRange = (iso: string) => new Date(iso).getTime() > since;
  return {
    LINK_CLICK: s.events.filter((e) => (e.type === 'order_link_click' || e.type === 'reservation_link_click') && inRange(e.createdAt)).length,
    SELF_REPORT: s.verifications.filter((v) => v.method === 'SELF_REPORT' && inRange(v.createdAt)).length + s.checkins.filter((c) => inRange(c.createdAt)).length,
    STAFF_CONFIRMED: verifiedUses(s).filter((u) => inRange(u.at)).length,
    POS_VERIFIED: s.verifications.filter((v) => v.method === 'POS' && v.status === 'CONFIRMED' && inRange(v.createdAt)).length,
  };
}

/** 최근 N일 일별 확인 이용 수 */
export function dailyVerified(s: AppState, days = 14, now = new Date()) {
  const uses = verifiedUses(s);
  const out: { day: string; visits: number; purchases: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dayKey(new Date(now.getTime() - i * DAY));
    out.push({
      day: d,
      visits: uses.filter((u) => u.kind === 'VISIT' && dayKey(u.at) === d).length,
      purchases: uses.filter((u) => u.kind === 'PURCHASE' && dayKey(u.at) === d).length,
    });
  }
  return out;
}

/* ── AX Coach: 오늘의 미션 1~3개 ────────────────────── */
export interface Mission {
  key: string;
  title: string;
  detail: string;
  route: string;
  proof: string;
  priority: number;
  managerOnly: boolean;
}

export function coachMissions(s: AppState, now = new Date()): Mission[] {
  const out: Mission[] = [];
  const open = s.tasks.filter((t) => t.status === 'OPEN');
  const verify = open.filter((t) => t.type === 'VERIFY_CHECKIN' || t.type === 'VERIFY_PURCHASE');
  if (verify.length) {
    const oldest = verify.reduce((a, b) => (a.createdAt < b.createdAt ? a : b));
    const waitMin = Math.round((now.getTime() - new Date(oldest.createdAt).getTime()) / 60000);
    out.push({
      key: 'verify',
      title: `방문·구매 확인 ${verify.length}건 처리`,
      detail: `가장 오래된 요청이 ${waitMin < 60 ? `${waitMin}분` : `${Math.round(waitMin / 60)}시간`}째 대기 중입니다. 확인해야 스탬프·추천 보상이 지급됩니다.`,
      route: '/ax/queue',
      proof: 'VERIFIED_VISIT / VERIFIED_PURCHASE',
      priority: 100 + verify.length,
      managerOnly: false,
    });
  }
  const reorder = s.reorderCandidates.filter((c) => c.status === 'SUGGESTED').length + computeReorderCandidates(s, now).length;
  if (reorder) {
    out.push({
      key: 'reorder',
      title: `재구매 안내 후보 ${reorder}건 검토`,
      detail: '저장했지만 구매 확인이 없는 고객입니다. 승인한 건만 인앱 알림으로 안내됩니다.',
      route: '/ax/reorder',
      proof: 'REORDER_CONVERTED (구매 확인 시)',
      priority: 60 + reorder,
      managerOnly: true,
    });
  }
  const lapsed = segmentMembers(s, 'LAPSED_30', now).length;
  const newNo = segmentMembers(s, 'NEW_NO_VISIT', now).length;
  if (lapsed + newNo > 0) {
    const key: SegmentKey = lapsed >= newNo ? 'LAPSED_30' : 'NEW_NO_VISIT';
    out.push({
      key: 'campaign',
      title: key === 'LAPSED_30' ? `30일 미방문 ${lapsed}명 재방문 캠페인` : `첫 이용 전 가입자 ${newNo}명 안내`,
      detail: '규칙 기반 문안 초안을 만들고, 운영 책임자가 승인한 뒤 인앱 알림으로만 보냅니다.',
      route: `/ax/campaigns?segment=${key}`,
      proof: 'CAMPAIGN_SENT → 이후 확인 이용으로 성과 측정',
      priority: 40 + lapsed + newNo,
      managerOnly: true,
    });
  }
  const photos = open.filter((t) => t.type === 'PHOTO_REVIEW').length;
  if (photos) {
    out.push({ key: 'photo', title: `고양이 사진 공개 승인 ${photos}건`, detail: '승인 전 사진은 고객 화면에 보이지 않습니다.', route: '/ax/content?tab=cats', proof: '-', priority: 30, managerOnly: true });
  }
  const requests = open.filter((t) => t.type === 'CUSTOMER_REQUEST' || t.type === 'REFERRAL_REVIEW').length;
  if (requests) {
    out.push({ key: 'request', title: `고객 요청·검토 ${requests}건`, detail: '탈퇴·삭제 요청 또는 보상 검토가 필요합니다.', route: '/ax/queue?tab=other', proof: '-', priority: 80, managerOnly: true });
  }
  return out.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

/* ── 데이터 품질/근거 상태 요약 ─────────────────────── */
export function evidenceSummary(s: AppState) {
  const facts: { area: string; item: string; evidence: string; source: string }[] = [];
  for (const st of s.stores) {
    const f = [
      ['주소', st.address],
      ['영업시간', st.hours],
      ['전화', st.phone],
      ['예약 링크', st.reservationUrl],
      ['주문 링크', st.orderUrl],
      ['배달 링크', st.deliveryUrl],
      ['이용요금', st.feeInfo],
    ] as const;
    for (const [k, v] of f) facts.push({ area: st.name, item: k, evidence: v.evidence, source: v.source });
  }
  for (const b of s.businessEntities) facts.push({ area: b.name, item: '사업자번호·데이터 처리 주체', evidence: b.evidence, source: b.note });
  return facts;
}

/* ── 오늘 매장 현황 (AX 홈 2순위) ─────────────────── */
export function todayStats(s: AppState, now = new Date()) {
  const today = dayKey(now);
  const since7 = now.getTime() - 7 * DAY;
  const uses = verifiedUses(s);
  const todayUses = uses.filter((u) => dayKey(u.at) === today);
  const todayUsers = new Set(todayUses.map((u) => s.checkins.find((c) => c.id === u.id)?.userId ?? s.verifications.find((v) => v.id === u.id)?.userId));
  const returning = [...todayUsers].filter((uid) => uid && verifiedUses(s, uid).length >= 2).length;
  const amountToday = todayUses.reduce((n, u) => n + (u.amount ?? 0), 0);
  const amount7 = uses.filter((u) => new Date(u.at).getTime() > since7).reduce((n, u) => n + (u.amount ?? 0), 0);
  const purchases7 = uses.filter((u) => u.kind === 'PURCHASE' && new Date(u.at).getTime() > since7).length;
  const purchasesWithAmount7 = uses.filter((u) => u.kind === 'PURCHASE' && u.amount != null && new Date(u.at).getTime() > since7).length;
  return {
    purchasesToday: todayUses.filter((u) => u.kind === 'PURCHASE').length,
    visitsToday: todayUses.filter((u) => u.kind === 'VISIT').length,
    newMembersToday: customers(s).filter((p) => dayKey(p.createdAt) === today).length,
    returningToday: returning,
    amountToday,
    amount7,
    purchases7,
    purchasesWithAmount7,
    couponsRedeemedToday: s.coupons.filter((c) => c.redeemedAt && dayKey(c.redeemedAt) === today).length,
  };
}

/** 지연 기준(분) — 운영 정책 확정 전 가정값 */
export const DELAY_MINUTES = 30;

export function urgentWork(s: AppState, now = new Date()) {
  const open = s.tasks.filter((t) => t.status === 'OPEN');
  const verify = open.filter((t) => t.type === 'VERIFY_CHECKIN' || t.type === 'VERIFY_PURCHASE');
  const delayed = verify.filter((t) => (now.getTime() - new Date(t.createdAt).getTime()) / 60000 > DELAY_MINUTES);
  return {
    verify,
    delayed,
    requests: open.filter((t) => t.type === 'CUSTOMER_REQUEST'),
    rewardReview: open.filter((t) => t.type === 'REFERRAL_REVIEW'),
    photos: open.filter((t) => t.type === 'PHOTO_REVIEW'),
    expiringCoupons: s.coupons.filter((c) => c.status === 'ISSUED' && new Date(c.expiresAt).getTime() > now.getTime() && new Date(c.expiresAt).getTime() - now.getTime() < 3 * DAY).length,
  };
}

/** 고객 화면 품질을 위해 운영자가 채워야 할 콘텐츠 */
export function contentFixes(s: AppState) {
  const out: { key: string; label: string; count: number; route: string }[] = [];
  const priceUnknown = s.menuItems.filter((m) => m.published && m.price == null).length;
  const demoMenus = s.menuItems.filter((m) => m.published && m.isDemo).length;
  const placeholderCats = s.cats.filter((c) => c.isPlaceholder).length;
  const unknownFacts = s.stores.reduce((n, st) => n + [st.hours, st.feeInfo, st.orderUrl, st.deliveryUrl].filter((f) => f.evidence === 'UNKNOWN').length, 0);
  const assumedRules = s.loyaltyRules.filter((r) => r.evidence === 'ASSUMPTION').length;
  if (priceUnknown) out.push({ key: 'price', label: `가격 미확인 메뉴 ${priceUnknown}개`, count: priceUnknown, route: '/ax/content' });
  if (demoMenus) out.push({ key: 'demo', label: `예시 메뉴 ${demoMenus}개 → 실제 메뉴로 교체`, count: demoMenus, route: '/ax/content' });
  if (placeholderCats) out.push({ key: 'cats', label: `예시 고양이 프로필 ${placeholderCats}개 → 실제 정보·사진`, count: placeholderCats, route: '/ax/content?tab=cats' });
  if (unknownFacts) out.push({ key: 'facts', label: `미확인 매장 정보 ${unknownFacts}건 (영업시간·요금·주문 링크)`, count: unknownFacts, route: '/ax/settings?tab=store' });
  if (assumedRules) out.push({ key: 'rules', label: `예시 혜택 규칙 ${assumedRules}개 → 원가 확인 후 확정`, count: assumedRules, route: '/ax/rewards' });
  return out;
}
