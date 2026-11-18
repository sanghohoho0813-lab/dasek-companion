/**
 * 다색컴패니언 도메인 타입
 * - DEMO 저장소(브라우저)와 Supabase 스키마(supabase/migrations)가 같은 구조를 공유한다.
 * - 모든 사실 데이터는 근거상태(Evidence)를 가진다: VERIFIED / USER_PROVIDED / ASSUMPTION / UNKNOWN
 */

export type DataStatus = 'DEMO' | 'PILOT' | 'LIVE';
export type Evidence = 'VERIFIED' | 'USER_PROVIDED' | 'ASSUMPTION' | 'UNKNOWN';
export type CapabilityStatus = 'LIVE' | 'PILOT' | 'DEMO' | 'READY' | 'NEXT';
export type BrandId = 'realsicdan' | 'dasek';
export type Role = 'customer' | 'staff' | 'manager';

/* ── Art (자체 일러스트) ───────────────────────────── */
export type CatCoat = 'orange' | 'gray' | 'black' | 'white' | 'cream' | 'brown';
export type CatPattern = 'solid' | 'tabby' | 'tuxedo' | 'calico' | 'point';
export type CatPose = 'sit' | 'loaf' | 'peek' | 'sleep';
export type ArtSpec =
  | { kind: 'salad'; variant: number }
  | { kind: 'lunchbox'; variant: number }
  | { kind: 'drink'; variant: number }
  | { kind: 'pie'; variant: number }
  | { kind: 'snack'; variant: number }
  | { kind: 'space'; variant: number }
  | { kind: 'cat'; coat: CatCoat; pattern: CatPattern; eyes: 'amber' | 'green' | 'blue' | 'copper'; pose: CatPose; bg: number };

/* ── 사업·매장 ─────────────────────────────────────── */
export interface BusinessEntity {
  id: string;
  brand: BrandId;
  name: string;
  description: string;
  bizNumber: string | null;
  evidence: Evidence;
  note: string;
}

export interface FactField<T = string> {
  value: T | null;
  evidence: Evidence;
  source: string;
  checkedAt: string | null;
}

export interface Store {
  id: string;
  brand: BrandId;
  businessEntityId: string;
  name: string;
  tagline: string;
  address: FactField;
  directions: FactField;
  hours: FactField;
  phone: FactField;
  placeUrl: FactField;
  reservationUrl: FactField;
  orderUrl: FactField;
  deliveryUrl: FactField;
  instagramUrl: FactField;
  feeInfo: FactField;
  amenities: FactField<string[]>;
  status: DataStatus;
}

/* ── 회원·동의 ─────────────────────────────────────── */
export interface Profile {
  id: string;
  name: string;
  role: Role;
  memberCode: string; // 매장 확인용 회원 코드 (예: DC-4821)
  phoneHash: string | null; // 원문 전화번호는 저장하지 않는다
  phoneLast4: string | null;
  storeIds: string[]; // 직원/운영자 담당 매장
  referralCode: string | null;
  createdAt: string;
  isDemo: boolean;
  status: 'active' | 'deletion_requested' | 'anonymized';
  preferredBrands: BrandId[];
  /** 직함 (예: '대표'). 운영자 프로필 표시에 쓴다. 고객은 비워 둔다 */
  title?: string | null;
}

export type ConsentPurpose = 'terms' | 'privacy' | 'age14' | 'marketing_inapp' | 'marketing_push' | 'marketing_kakao';
export interface Consent {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  version: string;
  granted: boolean;
  at: string;
  withdrawnAt: string | null;
}

/* ── 메뉴·콘텐츠 ───────────────────────────────────── */
export interface MenuCategory {
  id: string;
  brand: BrandId;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  brand: BrandId;
  storeId: string;
  categoryId: string;
  name: string;
  summary: string;
  description: string;
  price: number | null;
  priceEvidence: Evidence;
  tags: string[];
  art: ArtSpec;
  photoSlot: string | null;
  photoDataUrl: string | null; // 운영자가 AX에서 교체한 사진 (DEMO: 브라우저 저장)
  nutritionStatus: 'UNVERIFIED' | 'VERIFIED';
  nutrition: { kcal: number; protein: number; source: string } | null;
  allergenStatus: 'UNKNOWN' | 'VERIFIED';
  allergens: string[];
  published: boolean;
  isSignature: boolean;
  evidence: Evidence; // 메뉴 존재 자체의 근거
  source: string;
  isDemo: boolean;
  sortOrder: number;
}

export interface CafeCat {
  id: string;
  name: string;
  isPlaceholder: boolean; // 실제 고양이 정보 확인 전 예시 프로필
  tagline: string;
  personality: string[];
  likes: string[];
  interactionTips: string[];
  coverArt: ArtSpec;
  published: boolean;
  sortOrder: number;
  internalNote: string; // 직원 전용 — 고객에게 노출 금지
  /** 품종 (매장 소개 카드 기준) */
  breed?: string | null;
  sex?: 'F' | 'M' | null;
  /** 정보 출처 — 고객 화면 하단에 작게 표시 */
  source?: string | null;
}

export interface CatPhoto {
  id: string;
  catId: string;
  art: ArtSpec | null;
  dataUrl: string | null; // 관리자 업로드(DEMO는 브라우저 저장)
  slot: string | null;
  caption: string;
  alt: string;
  status: 'PUBLISHED' | 'PENDING_REVIEW' | 'HIDDEN';
  sortOrder: number;
  uploadedBy: string | null;
  createdAt: string;
}

/* ── 고객 이벤트·방문·구매 ─────────────────────────── */
export type CustomerEventType =
  | 'signup'
  | 'login'
  | 'view_menu'
  | 'view_cat'
  | 'favorite_add'
  | 'favorite_remove'
  | 'order_link_click'
  | 'reservation_link_click'
  | 'purchase_self_report'
  | 'visit_intent'
  | 'checkin_submit'
  | 'referral_share'
  | 'roadmap_interest'
  | 'notification_open';

export interface CustomerEvent {
  id: string;
  userId: string | null;
  type: CustomerEventType;
  ref: string | null;
  label: string;
  createdAt: string;
  isDemo: boolean;
}

export interface Favorite {
  id: string;
  userId: string;
  menuItemId: string;
  createdAt: string;
}

export interface VisitCheckin {
  id: string;
  userId: string;
  storeId: string;
  method: 'DAILY_CODE' | 'STAFF';
  dayKey: string; // YYYY-MM-DD (중복 방지: user+store+day 유니크)
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REVERSED';
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectReason: string | null;
  isDemo: boolean;
}

export type VerificationLevel = 'LINK_CLICK' | 'SELF_REPORT' | 'STAFF_CONFIRMED' | 'POS_VERIFIED';

export interface OrderVerification {
  id: string;
  userId: string;
  storeId: string;
  menuItemIds: string[];
  amount: number | null;
  method: 'SELF_REPORT' | 'STAFF' | 'POS' | 'RECEIPT';
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REVERSED';
  note: string;
  provenance: string;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  rejectReason: string | null;
  isDemo: boolean;
}

/* ── 혜택·쿠폰·추천 ────────────────────────────────── */
export type LoyaltyKind = 'SIGNUP' | 'STAMP' | 'REFERRAL_REFERRER' | 'REFERRAL_REFEREE';
export interface LoyaltyRule {
  id: string;
  kind: LoyaltyKind;
  title: string;
  benefit: string;
  stampsRequired: number | null;
  validDays: number;
  active: boolean;
  qualifyingEvent: 'CONFIRMED_PURCHASE_OR_VISIT' | 'CONFIRMED_PURCHASE';
  updatedAt: string;
  updatedBy: string | null;
  evidence: Evidence; // 혜택 내용 자체가 운영자 확정인지
}

export interface CouponIssue {
  id: string;
  userId: string;
  ruleId: string;
  title: string;
  benefit: string;
  code: string;
  status: 'ISSUED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
  issuedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  redeemedBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  source: string;
  idempotencyKey: string; // 중복 발급 방지
  isDemo: boolean;
}

export interface ReferralAttribution {
  id: string;
  referrerId: string;
  refereeId: string; // 유니크: 한 회원은 한 번만 추천 귀속
  code: string;
  status: 'PENDING' | 'QUALIFIED' | 'REWARDED' | 'REJECTED' | 'REVERSED';
  reason: string | null;
  createdAt: string;
  qualifiedAt: string | null;
  qualifyingRef: string | null;
  isDemo: boolean;
}

export interface RewardLedgerEntry {
  id: string;
  userId: string;
  kind: 'STAMP' | 'COUPON' | 'REFERRAL_REWARD';
  delta: number;
  label: string;
  status: 'EXPECTED' | 'CONFIRMED' | 'REVERSED';
  sourceRef: string;
  idempotencyKey: string;
  createdAt: string;
  isDemo: boolean;
}

/* ── 캠페인·알림·재구매 ────────────────────────────── */
export type SegmentKey = 'NEW_NO_VISIT' | 'LAPSED_30' | 'FAVORITE_NO_PURCHASE' | 'RECENT_INTEREST' | 'STAMP_NEAR' | 'ALL_CONSENTED';
export interface Campaign {
  id: string;
  name: string;
  segment: SegmentKey;
  channel: 'IN_APP' | 'KAKAO' | 'PUSH';
  title: string;
  body: string;
  draftMethod: 'TEMPLATE_RULE' | 'LLM';
  status: 'DRAFT' | 'APPROVED' | 'SENT' | 'PAUSED';
  why: string[];
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
  sentAt: string | null;
  recipients: number;
  /** 최근 7일 같은 대상 알림을 이미 받아 이번 발송에서 뺀 인원 (중복 발송 방지) */
  excludedDuplicates?: number;
  isDemo: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  kind: 'SERVICE' | 'MARKETING';
  title: string;
  body: string;
  link: string | null;
  campaignId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface ReorderCandidate {
  id: string;
  userId: string;
  menuItemId: string;
  reasons: string[];
  status: 'SUGGESTED' | 'APPROVED' | 'DISMISSED' | 'CONVERTED';
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  notificationId: string | null;
  convertedRef: string | null;
  isDemo: boolean;
}

/* ── 업무 큐·실증·감사 ─────────────────────────────── */
export type TaskType = 'VERIFY_CHECKIN' | 'VERIFY_PURCHASE' | 'REORDER_REVIEW' | 'PHOTO_REVIEW' | 'CUSTOMER_REQUEST' | 'REFERRAL_REVIEW';
export interface AdminTask {
  id: string;
  type: TaskType;
  refId: string;
  userId: string | null;
  storeId: string | null;
  title: string;
  status: 'OPEN' | 'DONE' | 'DISMISSED';
  createdAt: string;
  doneAt: string | null;
  doneBy: string | null;
}

export interface ProofEvent {
  proof_event_id: string;
  event_type: 'VERIFIED_VISIT' | 'VERIFIED_PURCHASE' | 'REFERRAL_CONVERTED' | 'REORDER_CONVERTED' | 'CAMPAIGN_SENT' | 'STAMP_REWARD';
  trigger: string;
  decision: string;
  decision_method: 'RULE' | 'HUMAN' | 'RULE+HUMAN';
  why: string;
  human_approval: string | null;
  action: string;
  result: string;
  kpi_before: string | null;
  kpi_after: string | null;
  data_source: string;
  user_id: string | null;
  created_at: string;
  result_confirmed_at: string | null;
  evidence_link: string | null;
  status: DataStatus;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorRole: Role | 'system';
  action: string;
  target: string;
  detail: string;
  at: string;
}

export interface RoadmapInterest {
  id: string;
  userId: string | null;
  itemKey: string;
  notifyConsent: boolean;
  createdAt: string;
}

/* ── 앱 상태 ──────────────────────────────────────── */
export type AxThemeId = 'deep-navy' | 'navy-gold' | 'emerald-gold' | 'forest-sage' | 'deep-teal' | 'onyx-gold' | 'pure-white';
export type FontScale = 'sm' | 'md' | 'lg';

export interface AppSettings {
  axTheme: AxThemeId;
  fontScale: FontScale;
  customerOnboarded: boolean;
  axTutorialDone: boolean;
}

export interface Session {
  customerId: string | null;
  operatorId: string; // AX 사용자 (staff/manager 미리보기)
}

export interface AppState {
  schemaVersion: number;
  mode: DataStatus;
  seededAt: string;
  session: Session;
  settings: AppSettings;
  businessEntities: BusinessEntity[];
  stores: Store[];
  profiles: Profile[];
  consents: Consent[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  cats: CafeCat[];
  catPhotos: CatPhoto[];
  favorites: Favorite[];
  recentViews: { userId: string; menuItemId: string; at: string }[];
  events: CustomerEvent[];
  checkins: VisitCheckin[];
  verifications: OrderVerification[];
  loyaltyRules: LoyaltyRule[];
  coupons: CouponIssue[];
  referrals: ReferralAttribution[];
  ledger: RewardLedgerEntry[];
  campaigns: Campaign[];
  notifications: AppNotification[];
  reorderCandidates: ReorderCandidate[];
  tasks: AdminTask[];
  proofEvents: ProofEvent[];
  auditLogs: AuditLog[];
  roadmapInterest: RoadmapInterest[];
}
