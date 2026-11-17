# DATA_DICTIONARY — 다색컴패니언

DEMO 저장소(`src/lib/types.ts`, localStorage 키 `dasek-companion:state`)와 LIVE 스키마(`supabase/migrations/0001_schema.sql`)는 같은 엔터티를 사용합니다. 모든 시드 행은 `isDemo=true`로 구분합니다.

| 엔터티 (DEMO 키 / 테이블) | 설명 | System of Record | 입력 주체 | 민감도 | 비고 |
|---|---|---|---|---|---|
| businessEntities / business_entities | 리얼식단·다색냥 사업 주체 | 운영자 | 책임자 | 낮음 | 사업자번호 UNKNOWN |
| stores / stores | 매장 + 사실 필드(FactField: value·evidence·source·checkedAt) | 운영자 | 책임자 | 낮음 | 리얼식단 주소 ASSUMPTION |
| profiles / profiles | 고객·직원·책임자 | 앱 | 본인/시스템 | **중** | 원본 전화 미저장(phoneHash·last4) |
| consents / consents | 목적·버전·동의 여부·철회 시각 | 앱 | 본인 | **중** | 철회 시 새 행 + 이전 행 withdrawnAt |
| menuCategories, menuItems / menu_* | 메뉴 (가격 근거·영양/알레르기 상태) | 운영자 | 책임자 | 낮음 | 영양 VERIFIED 전 수치 미표시 |
| (LIVE) menu_ingredient_verifications | 원재료·성분 검증 자료 | 운영자 | 책임자 | 낮음 | 1차 미사용 |
| cats / cafe_cats | 매장 고양이 공개 프로필 + 직원 메모 | 운영자 | 책임자 | 낮음 | internalNote 고객 비공개 |
| catPhotos / cat_photos | 사진(공개 승인 상태) | 운영자 | 직원 업로드·책임자 승인 | 낮음 | 권리 확인 필드(LIVE) |
| favorites / favorites | 메뉴 저장(관심) | 앱 | 본인 | 낮음 | (user, menu) 유니크 |
| recentViews | 최근 본 메뉴 | 앱 | 시스템 | 낮음 | DEMO 전용(LIVE는 events로 대체) |
| events / customer_events | 행동 기록(조회·클릭·저장·요청…) | 앱 | 시스템 | 낮음 | **실적 아님** — 신호 |
| checkins / visit_checkins | 방문 체크인 | 앱 | 고객 요청·직원 확인 | 낮음 | (user, store, day) 유니크 |
| verifications / order_verifications | 구매 확인(자가신고·직원·POS) | 앱 | 고객/직원 | 낮음 | method·provenance 필수 |
| (LIVE) order_intents | 외부 링크 클릭 등 의향 | 앱 | 시스템 | 낮음 | DEMO는 events로 기록 |
| loyaltyRules / loyalty_rules | 혜택 규칙 | 운영자 | 책임자 | 낮음 | 변경 감사 |
| coupons / coupon_issues | 쿠폰 발급·사용·만료·취소 | 앱 | 시스템/직원 | 낮음 | idempotency_key 유니크, code 유니크 |
| (LIVE) coupon_redemptions | 사용 기록(1회) | 앱 | 직원 | 낮음 | coupon_id 유니크 |
| referrals / referral_attributions | 추천 귀속 | 앱 | 시스템 | 낮음 | referee 유니크, referrer≠referee |
| ledger / reward_ledger | 스탬프·쿠폰·추천 보상 원장 | 앱 | 시스템 | 낮음 | EXPECTED→CONFIRMED/REVERSED, 멱등 |
| campaigns / campaigns | 캠페인(세그먼트·채널·승인) | 운영자 | 직원 초안·책임자 승인 | 낮음 | IN_APP만 발송 |
| notifications / notification_logs | 앱 알림함 | 앱 | 시스템 | 낮음 | SERVICE / MARKETING((광고)) |
| reorderCandidates / reorder_candidates | 재구매 안내 후보 | 앱 | RULE + 책임자 | 낮음 | 열린 후보 (user, menu) 유니크 |
| tasks / admin_tasks | 운영 업무 큐 | 앱 | 시스템 | 낮음 | 확인·사진·요청·검토 |
| proofEvents / proof_events | 실증 기록 | 앱 | 시스템 | 낮음 | `PROOF_EVENT_SCHEMA.md` |
| auditLogs / audit_logs | 변경 감사 | 앱 | 시스템 | 낮음 | 책임자 열람 |
| roadmapInterest / roadmap_interest | 향후 서비스 관심 | 앱 | 본인/비회원 | 낮음 | 알림 동의 포함 |

## 수집하지 않는 정보 (1차)
건강 목표·알레르기 보유·정서 상태·반려묘 건강·위치정보·결제정보·원본 전화번호.

## 상태값
- 체크인/구매 확인: `PENDING → CONFIRMED | REJECTED`, 확인 후 `REVERSED`(책임자, 환불)
- 쿠폰: `ISSUED → REDEEMED | EXPIRED(읽을 때 계산) | CANCELLED`
- 추천: `PENDING → QUALIFIED → REWARDED`, `REJECTED`, `REVERSED`
- 재구매 후보: `SUGGESTED → APPROVED → CONVERTED`, `DISMISSED`
- 캠페인: `DRAFT ↔ PAUSED`, `DRAFT → SENT`

## 멱등 키 규칙
| 키 | 의미 |
|---|---|
| `signup:{userId}` | 가입 쿠폰 1회 |
| `referee:{userId}` | 피추천인 웰컴 1회 |
| `stamp:{userId}:{storeId}:{YYYY-MM-DD}` | 매장·일 스탬프 1개 |
| `stampreward:{userId}:{cycle}` | 스탬프 주기별 보상 1회 |
| `referral:{attributionId}` | 추천인 보상 1회 |
| `refexp:{attributionId}` | 추천 보상 예정 원장 |
| `reissue:{couponId}` | 재발급 1회 |
