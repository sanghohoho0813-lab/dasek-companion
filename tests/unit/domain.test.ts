import { describe, expect, it } from 'vitest';
import * as D from '@/lib/domain';
import { computeKpis, couponsFor, segmentMembers, stampCount, verifiedUses } from '@/lib/rules';
import { createSeed } from '@/lib/seed';
import type { AppState } from '@/lib/types';
import { dailyCheckinCode, dayKey } from '@/lib/util';

const now = () => new Date().toISOString();
const cust = (): D.Ctx => ({ now: now(), actorId: null, actorRole: 'customer', isDemo: true });
const staff = (): D.Ctx => ({ now: now(), actorId: 'op_staff', actorRole: 'staff', isDemo: true });
const mgr = (): D.Ctx => ({ now: now(), actorId: 'op_manager', actorRole: 'manager', isDemo: true });
const consents = { terms: true, privacy: true, age14: true, marketing_inapp: true, marketing_push: false, marketing_kakao: false };

function fresh(): AppState {
  return createSeed(new Date());
}

describe('seed', () => {
  it('builds a consistent demo history', () => {
    const s = fresh();
    expect(s.profiles.filter((p) => p.role === 'customer').length).toBe(14);
    expect(s.tasks.filter((t) => t.status === 'OPEN').length).toBeGreaterThanOrEqual(3);
    expect(s.proofEvents.length).toBeGreaterThan(5);
    // 모든 쿠폰 멱등키 유니크
    const keys = s.coupons.map((c) => c.idempotencyKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(s.session.customerId).toBeNull();
  });
});

describe('signup & referral (Flow A)', () => {
  it('issues signup coupon once and blocks duplicate phone', () => {
    const s = fresh();
    const r = D.signup(s, cust(), { name: '테스트', phone: '010-9999-0001', consents, preferredBrands: ['dasek'] });
    expect(couponsFor(s, r.userId).length).toBe(1);
    expect(() => D.signup(s, cust(), { name: '중복', phone: '01099990001', consents, preferredBrands: [] })).toThrow(/이미 가입/);
  });

  it('requires mandatory consents', () => {
    const s = fresh();
    expect(() => D.signup(s, cust(), { name: 'x', phone: '', consents: { ...consents, privacy: false }, preferredBrands: [] })).toThrow();
  });

  it('rewards referrer only after referee verified use, exactly once', () => {
    const s = fresh();
    const referrer = D.signup(s, cust(), { name: '추천인', phone: '01088880001', consents, preferredBrands: [] });
    const code = s.profiles.find((p) => p.id === referrer.userId)!.referralCode!;
    const referee = D.signup(s, cust(), { name: '친구', phone: '01088880002', consents, preferredBrands: [], referralCode: code });
    expect(referee.referral?.status).toBe('PENDING');
    const before = couponsFor(s, referrer.userId).length;
    // 가입만으로는 보상 없음
    expect(couponsFor(s, referrer.userId).length).toBe(before);
    const v = D.selfReportPurchase(s, cust(), referee.userId, 'store_dasek', ['m_pie120'], '');
    // 자가신고만으로도 보상 없음
    expect(couponsFor(s, referrer.userId).length).toBe(before);
    D.decidePurchase(s, staff(), v.id, true, { amount: 4500 });
    expect(couponsFor(s, referrer.userId).length).toBe(before + 1);
    const attr = s.referrals.find((r) => r.refereeId === referee.userId)!;
    expect(attr.status).toBe('REWARDED');
    // 두 번째 확인 이용에도 추가 보상 없음
    const v2 = D.selfReportPurchase(s, cust(), referee.userId, 'store_realsicdan', ['m_chicken_salad'], '');
    D.decidePurchase(s, staff(), v2.id, true, {});
    expect(couponsFor(s, referrer.userId).length).toBe(before + 1);
  });

  it('rejects invalid referral code but still signs up', () => {
    const s = fresh();
    const r = D.signup(s, cust(), { name: 'a', phone: '', consents, preferredBrands: [], referralCode: 'NOPE1' });
    expect(r.referral?.status).toBe('INVALID');
    expect(s.referrals.some((x) => x.refereeId === r.userId)).toBe(false);
  });

  it('reverses unused referral reward when qualifying use is refunded', () => {
    const s = fresh();
    const a = D.signup(s, cust(), { name: 'A', phone: '01077770001', consents, preferredBrands: [] });
    const code = s.profiles.find((p) => p.id === a.userId)!.referralCode!;
    const b = D.signup(s, cust(), { name: 'B', phone: '01077770002', consents, preferredBrands: [], referralCode: code });
    const v = D.staffRecordPurchase(s, staff(), b.userId, 'store_dasek', ['m_pie120'], 4500);
    expect(() => D.reverseUse(s, staff(), 'PURCHASE', v.id, '환불')).toThrow(/권한/);
    D.reverseUse(s, mgr(), 'PURCHASE', v.id, '환불');
    const reward = s.coupons.find((c) => c.idempotencyKey.startsWith('referral:'))!;
    expect(reward.status).toBe('CANCELLED');
    expect(s.referrals.find((r) => r.refereeId === b.userId)!.status).toBe('PENDING');
  });
});

describe('checkin (Flow C)', () => {
  it('validates daily code, prevents same-day duplicate, stamps once per store/day', () => {
    const s = fresh();
    const u = D.signup(s, cust(), { name: 'c', phone: '', consents, preferredBrands: [] });
    expect(() => D.submitCheckin(s, cust(), u.userId, 'store_dasek', '0000x')).toThrow(/코드/);
    const code = dailyCheckinCode('store_dasek', dayKey());
    const c = D.submitCheckin(s, cust(), u.userId, 'store_dasek', code);
    expect(() => D.submitCheckin(s, cust(), u.userId, 'store_dasek', code)).toThrow(/이미/);
    expect(stampCount(s, u.userId)).toBe(0);
    D.decideCheckin(s, staff(), c.id, true);
    expect(stampCount(s, u.userId)).toBe(1);
    // 같은 날 같은 매장 구매 확인 → 스탬프 추가 없음
    D.staffRecordPurchase(s, staff(), u.userId, 'store_dasek', [], null);
    expect(stampCount(s, u.userId)).toBe(1);
    // 다른 매장은 별도
    D.staffRecordPurchase(s, staff(), u.userId, 'store_realsicdan', [], null);
    expect(stampCount(s, u.userId)).toBe(2);
    expect(verifiedUses(s, u.userId).length).toBe(3);
  });

  it('customers cannot verify', () => {
    const s = fresh();
    const pending = s.checkins.find((c) => c.status === 'PENDING')!;
    expect(() => D.decideCheckin(s, cust(), pending.id, true)).toThrow();
  });
});

describe('stamp reward', () => {
  it('issues reward coupon exactly at threshold', () => {
    const s = fresh();
    D.updateLoyaltyRule(s, mgr(), 'rule_stamp', { stampsRequired: 2 });
    const u = D.signup(s, cust(), { name: 'd', phone: '', consents, preferredBrands: [] });
    const n0 = couponsFor(s, u.userId).length;
    D.staffRecordPurchase(s, staff(), u.userId, 'store_dasek', [], null);
    expect(couponsFor(s, u.userId).length).toBe(n0);
    D.staffRecordPurchase(s, staff(), u.userId, 'store_realsicdan', [], null);
    expect(couponsFor(s, u.userId).length).toBe(n0 + 1);
  });

  it('staff cannot edit rules', () => {
    const s = fresh();
    expect(() => D.updateLoyaltyRule(s, staff(), 'rule_stamp', { stampsRequired: 3 })).toThrow(/권한/);
  });
});

describe('coupons', () => {
  it('redeem once; cancel requires reason and manager', () => {
    const s = fresh();
    const u = D.signup(s, cust(), { name: 'e', phone: '', consents, preferredBrands: [] });
    const c = couponsFor(s, u.userId)[0];
    D.redeemCoupon(s, staff(), c.id);
    expect(() => D.redeemCoupon(s, staff(), c.id)).toThrow();
    const u2 = D.signup(s, cust(), { name: 'f', phone: '', consents, preferredBrands: [] });
    const c2 = couponsFor(s, u2.userId)[0];
    expect(() => D.cancelCoupon(s, staff(), c2.id, '오발급')).toThrow(/권한/);
    expect(() => D.cancelCoupon(s, mgr(), c2.id, ' ')).toThrow(/사유/);
    D.cancelCoupon(s, mgr(), c2.id, '오발급');
    expect(s.coupons.find((x) => x.id === c2.id)!.status).toBe('CANCELLED');
  });
});

describe('reorder (Flow B) & campaigns', () => {
  it('converts approved reorder candidate on verified purchase', () => {
    const s = fresh();
    const u = D.signup(s, cust(), { name: 'g', phone: '', consents, preferredBrands: [] });
    const old: D.Ctx = { ...cust(), now: new Date(Date.now() - 3 * 86400000).toISOString() };
    D.toggleFavorite(s, old, u.userId, 'm_salmon_poke');
    D.refreshReorderCandidates(s, mgr());
    const cand = s.reorderCandidates.find((c) => c.userId === u.userId)!;
    expect(cand.status).toBe('SUGGESTED');
    expect(() => D.decideReorder(s, staff(), cand.id, true)).toThrow(/권한/);
    D.decideReorder(s, mgr(), cand.id, true);
    expect(s.notifications.some((n) => n.id === cand.notificationId && n.kind === 'MARKETING')).toBe(true);
    D.staffRecordPurchase(s, staff(), u.userId, 'store_realsicdan', ['m_salmon_poke'], 10900);
    expect(s.reorderCandidates.find((c) => c.id === cand.id)!.status).toBe('CONVERTED');
    expect(s.proofEvents.some((p) => p.event_type === 'REORDER_CONVERTED')).toBe(true);
  });

  it('sends in-app campaign only to consented members; blocks kakao', () => {
    const s = fresh();
    const members = segmentMembers(s, 'ALL_CONSENTED');
    const c = D.createCampaign(s, staff(), { name: 't', segment: 'ALL_CONSENTED', channel: 'IN_APP', title: 'hi', body: 'b' });
    expect(() => D.approveAndSendCampaign(s, staff(), c.id)).toThrow(/권한/);
    D.approveAndSendCampaign(s, mgr(), c.id);
    expect(s.notifications.filter((n) => n.campaignId === c.id).length).toBe(members.length);
    const k = D.createCampaign(s, mgr(), { name: 'k', segment: 'ALL_CONSENTED', channel: 'KAKAO', title: 'hi', body: 'b' });
    expect(() => D.approveAndSendCampaign(s, mgr(), k.id)).toThrow(/READY/);
  });

  it('withdrawn marketing consent excludes member from segments', () => {
    const s = fresh();
    const u = D.signup(s, cust(), { name: 'h', phone: '', consents, preferredBrands: [] });
    expect(segmentMembers(s, 'ALL_CONSENTED').some((p) => p.id === u.userId)).toBe(true);
    D.setConsent(s, cust(), u.userId, 'marketing_inapp', false);
    expect(segmentMembers(s, 'ALL_CONSENTED').some((p) => p.id === u.userId)).toBe(false);
  });
});

describe('kpis', () => {
  it('separates verified from clicks/self-reports', () => {
    const s = fresh();
    const k = computeKpis(s);
    expect(k.operatorCount).toBe(2);
    expect(k.revenueRepeatDen).toBeGreaterThan(0);
    const before = k.activeCustomers;
    D.recordLinkClick(s, cust(), null, 'reservation', 'store_dasek', 'x');
    expect(computeKpis(s).activeCustomers).toBe(before);
  });
});

describe('deletion', () => {
  it('anonymizes profile and cancels open coupons', () => {
    const s = fresh();
    const u = D.signup(s, cust(), { name: '삭제', phone: '01066660001', consents, preferredBrands: [] });
    D.requestDeletion(s, cust(), u.userId);
    D.processDeletion(s, mgr(), u.userId);
    const p = s.profiles.find((x) => x.id === u.userId)!;
    expect(p.status).toBe('anonymized');
    expect(p.phoneHash).toBeNull();
    expect(couponsFor(s, u.userId).every((c) => c.status !== 'ISSUED')).toBe(true);
  });
});
